import { ratingVerdict, verdictWord } from "./verdict";
import { CONTACT_FROM_ADDRESS, sendWithResend, type ContactEmail } from "./contact";
import { niches, productPathIn, type Niche } from "./niche";

// One email a day to the owner's inbox (CONTACT_TO) listing the reviews visitors submitted through the site form on every
// Recs site in the last 24 hours. It replaced the per-review email: ~30 sites sharing one Resend account ran into its daily
// cap. All sites share one database (a schema per niche), so the PadelRecs deployment's cron (app/api/review-digest) reads
// them all. Already-rejected reviews are left out; research-agent imports go to external_reviews and are never listed.
// No reviews, no email.
export type DigestReview = {
 id: string; rating: number; reviewText: string; alias: string | null; email: string | null; status: string; createdAt: string;
 product: { name: string; slug: string; shape: string | null }; newProduct: boolean;
};
export type DigestSite = { niche: Niche; reviews: DigestReview[] } | { niche: Niche; error: string };
/** Reads one niche's reviews created since `since` (an ISO timestamp). */
export type ReadReviews = (schema: string, since: string) => Promise<DigestReview[]>;

const oneLine = (text: string) => text.replace(/[\r\n\t]+/g, " ").trim();
export const siteOriginOf = (n: Niche) => `https://www.${n.site.domain}`;

/** Every niche's new reviews; a niche whose query fails is reported in the email instead of stopping the rest. */
export async function collectDigest(read: ReadReviews, since: string, all: Niche[] = Object.values(niches)): Promise<DigestSite[]> {
 const sites: DigestSite[] = [];
 for (const n of all) {
  try { sites.push({ niche: n, reviews: await read(n.schema, since) }); }
  catch (error) { sites.push({ niche: n, error: error instanceof Error ? error.message : String(error) }); }
 }
 return sites;
}

/** The digest email, or null when no site has a new review and none failed. */
export function digestEmail(to: string, sites: DigestSite[], date: Date): ContactEmail | null {
 const withReviews = sites.flatMap(s => "reviews" in s && s.reviews.length ? [s] : []);
 const failed = sites.flatMap(s => "error" in s ? [s] : []);
 const total = withReviews.reduce((a, s) => a + s.reviews.length, 0);
 if (!total && !failed.length) return null;
 const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
 const lines: string[] = [`${total} new ${total === 1 ? "review" : "reviews"} in the last 24 hours on ${withReviews.length} ${withReviews.length === 1 ? "site" : "sites"}.`];
 for (const { niche: n, reviews } of withReviews) {
  const origin = siteOriginOf(n);
  lines.push("", `== ${n.site.name} (${reviews.length}) — approve or reject: ${origin}/funtimes?status=pending`);
  for (const r of reviews) {
   const reviewer = r.alias ? oneLine(r.alias) : "anonymous";
   lines.push(
    "",
    `${oneLine(r.product.name)}: ${verdictWord[ratingVerdict(r.rating)].toLowerCase()} by ${reviewer}${r.email ? ` <${oneLine(r.email)}>` : ""} [${r.status}]`,
    ...(r.newProduct ? ["New product added with this review; its page stays hidden until the review is approved."] : []),
    r.reviewText,
    `Product page: ${origin}${productPathIn(n, { ...r.product, slug: encodeURIComponent(r.product.slug) })}`,
    `Edit: ${origin}/funtimes/edit-review?type=player&id=${encodeURIComponent(r.id)}`,
   );
  }
 }
 if (failed.length) lines.push("", `Could not read: ${failed.map(f => `${f.niche.site.name} (${oneLine(f.error)})`).join("; ")}`);
 return {
  from: `Recs Reviews <${CONTACT_FROM_ADDRESS}>`,
  to: to.split(",").map(a => a.trim()).filter(Boolean),
  subject: total ? `[Recs] ${total} new ${total === 1 ? "review" : "reviews"} on ${withReviews.length} ${withReviews.length === 1 ? "site" : "sites"} — ${day}` : `[Recs] Review digest could not read ${failed.length} ${failed.length === 1 ? "site" : "sites"} — ${day}`,
  text: lines.join("\n"),
 };
}

/** Builds and sends the digest. Returns what happened, for the cron's response and logs. */
export async function sendDigest(read: ReadReviews, now = new Date(), {
 send = sendWithResend, env = () => ({ apiKey: process.env.RESEND_API_KEY, to: process.env.CONTACT_TO }),
}: { send?: (email: ContactEmail, apiKey: string) => Promise<unknown>; env?: () => { apiKey?: string; to?: string } } = {}) {
 const { apiKey, to } = env();
 if (!apiKey || !to) return { status: "skipped" as const };
 const sites = await collectDigest(read, new Date(now.getTime() - 24 * 60 * 60_000).toISOString());
 const email = digestEmail(to, sites, now);
 if (!email) return { status: "empty" as const };
 await send(email, apiKey);
 return { status: "sent" as const, subject: email.subject };
}
