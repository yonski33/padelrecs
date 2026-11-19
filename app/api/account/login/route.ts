// Player sign-in, step 1 (PadelRecs Thread accounts): email a magic link (with a 6-digit code for another device). No
// passwords. Creates the Supabase Auth user on first use; the admin sign-in (/auth/login) never creates one.
import { z } from "zod";
import { createClient } from "../../../../lib/supabase/server";
import { siteOrigin } from "../../../../lib/site-url";
import { safeNext } from "../../../../lib/thread/account-session";
import { createLimiter, clientIp } from "../../../../lib/rate-limit";
import { normalizeEmail } from "../../../../lib/review-spam";
import { threadSite } from "../../../../lib/thread/look";
import { niche } from "../../../../lib/niche";
import { json, foreign } from "../../thread-device";

// Each request sends an email (and the mail provider caps a project's sends), so cap per network and per inbox.
const perIp = createLimiter({ limit: 5, windowMs: 60 * 60_000 }), perInbox = createLimiter({ limit: 3, windowMs: 60 * 60_000 });
const body = z.object({ email: z.string().trim().email().max(254), next: z.string().max(300).optional(), website: z.string().optional() });

export async function POST(request: Request) {
  if (!threadSite(niche.id)) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Sign in from the site, please." }, 403);
  let parsed; try { parsed = body.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!parsed.success) return json({ error: "That email doesn't look right." }, 400);
  if (parsed.data.website?.trim()) return json({ status: "sent" }); // honeypot
  if (!perIp.hit(clientIp(request)) || !perInbox.hit(normalizeEmail(parsed.data.email))) return json({ error: "Too many sign-in emails. Wait a bit, then try again." }, 429);
  const client = await createClient();
  if (!client) return json({ error: "Sign-in isn't set up here." }, 503);
  const origin = siteOrigin(request.url), next = safeNext(parsed.data.next);
  const { error } = await client.auth.signInWithOtp({ email: parsed.data.email, options: { shouldCreateUser: true, emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` } });
  if (error) {
    console.error("Player sign-in email failed", error.status, error.message);
    return json({ error: error.status === 429 ? "Too many sign-in emails right now. Try again in a little while." : "Could not send the email. Try again?" }, error.status === 429 ? 429 : 500);
  }
  return json({ status: "sent" });
}
