import { z } from "zod";
import { spamScore } from "./review-spam";

// The contact form (app/contact) on every Recs site. Messages go to one shared inbox through Resend, sent from the
// verified redrecs.com domain (the same sender redrecs.com uses); the subject names the site and Reply-To is the visitor,
// so answering from the inbox goes straight back to them. Every message is also saved (contact_messages) first.
export const CONTACT_FROM_ADDRESS = "contact@redrecs.com";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Header-bound text (name, subject) is kept to one line.
const oneLine = (max: number) => z.string().transform(v => v.replace(/[\r\n\t]+/g, " ").trim()).pipe(z.string().max(max));
export const contactInput = z.object({
 name: oneLine(100).pipe(z.string().min(1)),
 email: z.string().trim().email().max(254),
 subject: oneLine(150).pipe(z.string().min(1)),
 message: z.string().trim().min(10).max(5000),
});
export type ContactInput = z.infer<typeof contactInput>;

/** The same content heuristics as the review form (lib/review-spam.ts), with the message as the text and the name as the alias. */
export function contactSpam(value: ContactInput) {
 return spamScore({ reviewText: `${value.subject}\n${value.message}`, alias: value.name, email: value.email });
}

/** The Resend payload for one message. `to` is the CONTACT_TO address (comma-separated for several). */
export function contactEmail(site: { name: string; domain: string }, to: string, value: ContactInput) {
 return {
  from: `${site.name} Contact <${CONTACT_FROM_ADDRESS}>`,
  to: to.split(",").map(a => a.trim()).filter(Boolean),
  reply_to: value.email,
  subject: `[${site.name}] Contact: ${value.subject}`,
  text: [`From: ${value.name} <${value.email}>`, `Site: ${site.domain}`, `Subject: ${value.subject}`, "", value.message].join("\n"),
 };
}
export type ContactEmail = ReturnType<typeof contactEmail>;

/** Sends through Resend's HTTP API (no SDK needed). Throws with Resend's message when it refuses. */
export async function sendWithResend(email: ContactEmail, apiKey: string, fetcher: typeof fetch = fetch) {
 const response = await fetcher(RESEND_ENDPOINT, {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify(email),
  signal: AbortSignal.timeout(10_000),
 });
 if (!response.ok) {
  const detail = await response.json().catch(() => ({})) as { message?: string };
  throw new Error(`Resend ${response.status}: ${detail.message || response.statusText}`);
 }
 return await response.json() as { id?: string };
}
