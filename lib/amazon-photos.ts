import { affiliateTag, amazonLink } from "./amazon";
import { niche } from "./niche";

/** Amazon allows keeping an image link for under 24 hours; after that a page shows the drawing again. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type Stored = { amazonAsin: string | null; amazonImage: string | null; amazonCheckedAt: string | null };

/**
 * A product's Amazon photo for catalogue pages, from the columns the photo job refreshes (lib/amazon-photo-job.ts). Amazon's terms:
 * served from Amazon, not altered beyond resizing, and it links only to the Amazon product page.
 */
export function amazonPhoto(r: Stored, now = Date.now(), env: Record<string, string | undefined> = process.env) {
  const tag = affiliateTag(env);
  if (!niche.amazon?.photos || !tag || !r.amazonAsin || !r.amazonImage || !r.amazonCheckedAt) return null;
  if (now - Date.parse(r.amazonCheckedAt) >= MAX_AGE_MS) return null;
  return { image: r.amazonImage, url: amazonLink(r.amazonAsin, tag, niche.amazon.marketplace) };
}
