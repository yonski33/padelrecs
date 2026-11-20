// Player sign-in, step 2 on another device: the 6-digit code from the email (when the link opens in a different browser).
import { z } from "zod";
import { createClient } from "../../../../lib/supabase/server";
import { createLimiter, clientIp } from "../../../../lib/rate-limit";
import { afterSignIn } from "../../../../lib/thread/account-signin";
import { accountSite } from "../../../../lib/thread/sites";
import { niche } from "../../../../lib/niche";
import { json, foreign } from "../../thread-device";

const tries = createLimiter({ limit: 10, windowMs: 15 * 60_000 });
const body = z.object({ email: z.string().trim().email().max(254), code: z.string().trim().regex(/^\d{6,10}$/) });

export async function POST(request: Request) {
  if (!accountSite(niche.id)) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Sign in from the site, please." }, 403);
  let parsed; try { parsed = body.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!parsed.success) return json({ error: "Type the code from the email." }, 400);
  if (!tries.hit(clientIp(request))) return json({ error: "Too many tries. Wait a few minutes." }, 429);
  const client = await createClient();
  if (!client) return json({ error: "Sign-in isn't set up here." }, 503);
  const { data, error } = await client.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: "email" });
  if (error || !data.user) return json({ error: "That code didn't work. It may have expired: ask for a new email." }, 400);
  await afterSignIn(data.user.id);
  return json({ ok: true });
}
