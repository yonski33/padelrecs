import { CONTACT_FROM_ADDRESS, sendWithResend, type ContactEmail } from "./contact";

// An email to the owner's inbox (CONTACT_TO, the contact form's) for each review a visitor submits through the site form
// (app/api/reviews/route.ts), so ~two dozen sites don't need checking by hand. Research-agent imports and publish runs
// write to the database directly and never come through here. Only reviews that passed the spam checks are reported.
export type NewReview = {
 id: string; rating: number; reviewText: string; alias?: string | null; email?: string | null;
 product: { name: string; slug: string }; newProduct: boolean;
};
type Site = { name: string; domain: string };
const oneLine = (text: string) => text.replace(/[\r\n\t]+/g, " ").trim();

export function reviewEmail(site: Site, to: string, origin: string, catalogPath: string, review: NewReview) {
 const product = oneLine(review.product.name);
 const productUrl = `${origin}${catalogPath}/${encodeURIComponent(review.product.slug)}`;
 const moderateUrl = `${origin}/funtimes?status=pending`;
 const editUrl = `${origin}/funtimes/edit-review?type=player&id=${encodeURIComponent(review.id)}`;
 const reviewer = review.alias ? oneLine(review.alias) : "anonymous";
 return {
  from: `${site.name} Reviews <${CONTACT_FROM_ADDRESS}>`,
  to: to.split(",").map(a => a.trim()).filter(Boolean),
  ...(review.email ? { reply_to: review.email } : {}),
  subject: `[${site.name}] New review: ${product} (${review.rating}/5)`,
  text: [
   `${reviewer}${review.email ? ` <${review.email}>` : ""} reviewed ${product} on ${site.domain}: ${review.rating}/5.`,
   review.newProduct ? `This is a new product added with the review; its page stays hidden until the review is approved.` : "",
   "",
   review.reviewText,
   "",
   `Product page: ${productUrl}`,
   `Approve or reject: ${moderateUrl}`,
   `Edit this review: ${editUrl}`,
  ].filter((line, i, all) => line || all[i - 1] !== "").join("\n"),
 } satisfies ContactEmail;
}

/** Sends the notification; never throws, so a Resend problem can't affect the saved review. Skipped when the env is unset. */
export async function notifyNewReview(site: Site, origin: string, catalogPath: string, review: NewReview, {
 send = sendWithResend, env = () => ({ apiKey: process.env.RESEND_API_KEY, to: process.env.CONTACT_TO }),
}: { send?: (email: ContactEmail, apiKey: string) => Promise<unknown>; env?: () => { apiKey?: string; to?: string } } = {}) {
 const { apiKey, to } = env();
 if (!apiKey || !to) return "skipped";
 try { await send(reviewEmail(site, to, origin, catalogPath, review), apiKey); return "sent"; }
 catch (error) { console.error(`Review notification failed for ${review.id}: ${error instanceof Error ? error.message : error}`); return "failed"; }
}
