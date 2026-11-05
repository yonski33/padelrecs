import { affiliateTag, amazonLink } from "./amazon";
import { niche } from "./niche";

type Stored = { amazonAsin: string | null; amazonImage: string | null };

/** A product's Amazon photo for catalogue pages, from the columns scripts/fill-amazon-photos.ts fills. It links to Amazon. */
export function amazonPhoto(r: Stored, env: Record<string, string | undefined> = process.env) {
  const tag = affiliateTag(env);
  if (!niche.amazon?.photos || !tag || !r.amazonAsin || !r.amazonImage) return null;
  return { image: r.amazonImage, url: amazonLink(r.amazonAsin, tag, niche.amazon.marketplace) };
}
