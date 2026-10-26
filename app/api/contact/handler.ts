import { and, eq, gte } from "drizzle-orm";
import { siteOrigin } from "../../../lib/site-url";
import { niche } from "../../../lib/niche";
import { contactInput, contactSpam, contactEmail, sendWithResend, type ContactEmail } from "../../../lib/contact";
import { checkFormToken } from "../../../lib/form-token";
import { normalizeEmail } from "../../../lib/review-spam";
import { clientIp, createLimiter } from "../../../lib/rate-limit";
import { contactMessages } from "../../../db/schema";
import type { getDb } from "../../../db/index";

type Database = ReturnType<typeof getDb>;
export type ContactDeps = {
 database: () => Promise<Database>;
 send?: (email: ContactEmail, apiKey: string) => Promise<unknown>;
 env?: () => { apiKey?: string; to?: string };
};

const noStore = { "Cache-Control": "no-store" };
// Spam is answered exactly like a delivered message (as the review form does), so a bot learns nothing from the response.
const accepted = () => Response.json({ status: "sent" }, { status: 201, headers: noStore });
function dropped(reason: string) { console.warn(`Contact message dropped (${reason})`); return accepted(); }
const EMAIL_DAILY_LIMIT = 3;

/**
 * POST /api/contact, with the review form's protection (app/api/reviews/route.ts): same-origin check, honeypot, signed
 * form-opened token, per-IP limits, per-inbox daily limit and content heuristics. The message is saved before it is
 * emailed; content flagged as spam is saved as "spam" and not emailed. The visitor sees an error only when the message
 * could neither be saved nor sent.
 */
export function createContactHandler({ database, send = sendWithResend, env = () => ({ apiKey: process.env.RESEND_API_KEY, to: process.env.CONTACT_TO }) }: ContactDeps) {
 // Per server instance (lib/rate-limit.ts): a person writes in a couple of times at most.
 const perIpBurst = createLimiter({ limit: 3, windowMs: 10 * 60_000 }), perIpDay = createLimiter({ limit: 10, windowMs: 24 * 60 * 60_000 });
 return async function POST(request: Request) {
  const origin = request.headers.get("origin"); if (origin && origin !== siteOrigin(request.url)) return Response.json({ error: "Please send this from the contact form." }, { status: 403 });
  let body; try { body = JSON.parse(await request.text()); } catch { return Response.json({ error: "Invalid message." }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid message." }, { status: 400 });
  // Honeypot: the "website" field is hidden from people (contact-form.tsx), so only a bot fills it.
  if (typeof body.website === "string" && body.website.trim()) return dropped("honeypot");
  const token = checkFormToken(body.formToken); if (token !== "ok") return dropped(`form-token-${token}`);
  const ip = clientIp(request);
  if (!perIpBurst.hit(ip) || !perIpDay.hit(ip)) return dropped("ip-rate-limit");
  const parsed = contactInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check your name, email, subject and message (at least 10 characters)." }, { status: 400 });
  const value = parsed.data, spam = contactSpam(value);
  const id = crypto.randomUUID(), createdAt = new Date().toISOString();

  let db: Database | undefined, saved = false;
  try {
   db = await database();
   // Gmail ignores dots and +tags, so compare normalised inboxes rather than the typed address.
   const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString(), inbox = normalizeEmail(value.email);
   const recent = await db.select({ email: contactMessages.email }).from(contactMessages).where(gte(contactMessages.createdAt, since));
   if (recent.filter(r => normalizeEmail(r.email) === inbox).length >= EMAIL_DAILY_LIMIT) return dropped("email-rate-limit");
   await db.insert(contactMessages).values({ id, ...value, status: spam.spam ? "spam" : "pending", error: spam.spam ? spam.reasons.join(", ") : null, createdAt });
   saved = true;
  } catch (error) { console.error("Contact message save failed", error); }
  if (spam.spam) return saved ? dropped(`content: ${spam.reasons.join(", ")}`) : Response.json({ error: "Could not send your message. Please try again." }, { status: 500 });

  const mark = async (status: "sent" | "failed", error: string | null) => {
   if (!saved || !db) return;
   try { await db.update(contactMessages).set({ status, error }).where(and(eq(contactMessages.id, id), eq(contactMessages.status, "pending"))); }
   catch (e) { console.error("Contact message status update failed", e); }
  };
  const { apiKey, to } = env();
  try {
   if (!apiKey || !to) throw new Error(`Email not configured (${[!apiKey && "RESEND_API_KEY", !to && "CONTACT_TO"].filter(Boolean).join(", ")} missing)`);
   await send(contactEmail(niche.site, to, value), apiKey);
   await mark("sent", null);
  } catch (error) {
   const reason = error instanceof Error ? error.message : String(error);
   console.error(`Contact email failed (${saved ? `saved as ${id}` : "not saved"}): ${reason}`);
   await mark("failed", reason.slice(0, 500));
   if (!saved) return Response.json({ error: "Could not send your message. Please try again." }, { status: 500 });
  }
  return accepted();
 };
}
