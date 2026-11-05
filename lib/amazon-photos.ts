import { affiliateTag, amazonLink } from "./amazon";
import { niche } from "./niche";
import { photoHidden } from "./shop-photos";

type Stored = { amazonAsin: string | null; amazonImage: string | null; imageUrl?: string | null };

/** A product's Amazon photo for catalogue pages, from the columns scripts/fill-amazon-photos.ts fills. It links to Amazon. */
export function amazonPhoto(r: Stored, env: Record<string, string | undefined> = process.env) {
  const tag = affiliateTag(env);
  if (!niche.amazon?.photos || !tag || !r.amazonAsin || !r.amazonImage || photoHidden(r)) return null;
  return { image: r.amazonImage, url: amazonLink(r.amazonAsin, tag, niche.amazon.marketplace) };
}
