import { unstable_cache } from "next/cache";
import { niche } from "./niche";
import { amazonCredentials, findAmazonOffer, type AmazonOffer } from "./amazon";

// Each product's answer (an offer, or "not on Amazon") is kept for 12 hours in Next's data cache, shared by every visitor
// and instance, so Amazon sees at most two calls per product twice a day. Amazon asks that shown prices be under 24 hours old.
// A failed call is not cached: the page shows no link and the next visit asks again.
const cachedOffer = unstable_cache(
  async (name: string, brand: string) => {
    const settings = niche.amazon, credentials = amazonCredentials();
    if (!settings || !credentials) return null;
    return findAmazonOffer({ name, brand }, settings, credentials);
  },
  ["amazon-offer", niche.id],
  { revalidate: 12 * 60 * 60, tags: ["amazon-offers"] },
);

/** The Amazon offer for a product page, or null: niche without Amazon links, no credentials, no match, or Amazon unreachable. */
export async function amazonOffer(product: { name: string; brand: string | undefined }): Promise<AmazonOffer | null> {
  if (!niche.amazon || !product.brand || !amazonCredentials()) return null;
  try {
    return await cachedOffer(product.name, product.brand);
  } catch (error) {
    console.error(`[amazon] No offer for ${product.name}: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}
