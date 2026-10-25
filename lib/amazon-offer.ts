import { unstable_cache } from "next/cache";
import { niche } from "./niche";
import { amazonCredentials, amazonSearchLink, findAmazonOffer } from "./amazon";

// Each product's lookup (its Amazon item and price, or "no match") is kept for 12 hours in Next's data cache, shared by
// every visitor and instance, so Amazon sees at most two calls per product twice a day. Amazon asks that shown prices be
// under 24 hours old. A failed call is not cached: the page falls back to a search link and the next visit asks again.
const cachedOffer = unstable_cache(
  async (name: string, brand: string) => {
    const settings = niche.amazon, credentials = amazonCredentials();
    if (!settings || !credentials) return null;
    return findAmazonOffer({ name, brand }, settings, credentials);
  },
  ["amazon-offer", niche.id],
  { revalidate: 12 * 60 * 60, tags: ["amazon-offers"] },
);

export type AmazonButton = { url: string; price: string | null };

/**
 * The Amazon button for a product page, on niches with Amazon links: the matched product's page with its price, or,
 * when there is no match, no price or Amazon cannot be reached, its page or a tagged Amazon search without a price.
 * Null only on niches without Amazon links or when the associate tag is not set.
 */
export async function amazonButton(product: { name: string; brand: string | undefined }): Promise<AmazonButton | null> {
  if (!niche.amazon) return null;
  const partnerTag = process.env.AMAZON_PA_API_PARTNER_TAG;
  if (!partnerTag) {
    console.warn("[amazon] Amazon links are on but AMAZON_PA_API_PARTNER_TAG is not set");
    return null;
  }
  const search = { url: amazonSearchLink(product.name, partnerTag, niche.amazon.marketplace), price: null };
  if (!amazonCredentials()) {
    console.warn("[amazon] AMAZON_CREATORS_API_CREDENTIAL_ID or AMAZON_CREATORS_API_CREDENTIAL_SECRET is not set; using search links without prices");
    return search;
  }
  if (!product.brand) return search;
  try {
    const offer = await cachedOffer(product.name, product.brand);
    return offer ? { url: offer.url, price: offer.price } : search;
  } catch (error) {
    console.error(`[amazon] Lookup failed for ${product.name}: ${error instanceof Error ? error.message : error}`);
    return search;
  }
}
