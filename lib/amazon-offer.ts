import { unstable_cache } from "next/cache";
import { niche } from "./niche";
import { affiliateTag, amazonCredentials, amazonLink, amazonSearchLink, findAmazonOffer } from "./amazon";
import { websiteButton } from "./product-links";

// Each product's lookup (its Amazon item and price, or "no match") is kept for 12 hours in Next's data cache, shared by
// every visitor and instance, so Amazon sees at most two calls per product twice a day. Amazon asks that shown prices be
// under 24 hours old. A failed call is not cached: the page falls back to a search link and the next visit asks again.
const cachedOffer = unstable_cache(
  async (name: string, brand: string) => {
    const settings = niche.amazon, credentials = amazonCredentials();
    if (!settings || !credentials) return null;
    return findAmazonOffer({ name, brand }, settings, credentials);
  },
  // v3: stricter matching (lib/amazon-match.ts), so lookups cached under the old rules are not reused.
  ["amazon-offer-v3", niche.id],
  { revalidate: 12 * 60 * 60, tags: ["amazon-offers"] },
);

/** `image`: Amazon's own image address, on niches with amazon.photos. Amazon's terms: served from Amazon, the address kept
 *  under 24 hours (the 12-hour cache above), not altered beyond resizing, and it links to the Amazon product page. List pages link theirs to our product page instead (owner's decision, 2026-11-07; see lib/amazon-photos.ts). */
export type AmazonButton = { url: string; price: string | null; image?: string | null; asin?: string };

/**
 * Whether this site shows Amazon links: its niche config has `amazon` and the deployment has a tag for links
 * (AMAZON_AFFILIATE_TAG or AMAZON_PA_API_PARTNER_TAG).
 * The affiliate note, footer link and disclosure page follow this too, so a site whose Vercel project has no Amazon
 * variables yet never says it has affiliate links. scripts/set-amazon-env.mjs sets the variables.
 */
export function amazonLinksOn(env: Record<string, string | undefined> = process.env) {
  return Boolean(niche.amazon && affiliateTag(env));
}

/**
 * The Amazon button for a product page, on niches with Amazon links: the matched product's page with its price, or,
 * when there is no match, no price or Amazon cannot be reached, its page or a tagged Amazon search without a price.
 * Null only on niches without Amazon links or when no tag is set. Links carry affiliateTag(); the matched item's link is
 * rebuilt from its ASIN here, so offers cached before the tag changed still get the current one.
 */
/** How long a page waits for the live Amazon lookup. */
const LOOKUP_MS = 1500;
export async function amazonButton(product: { name: string; brand: string | undefined }): Promise<AmazonButton | null> {
  const tag = affiliateTag();
  if (!niche.amazon || !tag) return null;
  const marketplace = niche.amazon.marketplace;
  const search: AmazonButton = { url: amazonSearchLink(product.name, tag, marketplace), price: null };
  if (!amazonCredentials()) {
    console.warn("[amazon] AMAZON_CREATORS_API_CREDENTIAL_ID or AMAZON_CREATORS_API_CREDENTIAL_SECRET is not set; using search links without prices");
    return search;
  }
  if (!product.brand) return search;
  try {
    // A slow or rate-limited Amazon (429s, 2026-11-16) must not hold the page: after LOOKUP_MS the button is the search
    // link, and the lookup still finishes and fills the cache for the next render.
    const lookup = cachedOffer(product.name, product.brand);
    lookup.catch(() => { /* a late failure changes nothing: the page already has its search link */ });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const offer = await Promise.race([lookup, new Promise<"slow">(done => { timer = setTimeout(() => done("slow"), LOOKUP_MS); })]).finally(() => clearTimeout(timer));
    if (offer === "slow") return search;
    return offer ? { url: amazonLink(offer.asin, tag, marketplace), price: offer.price, image: niche.amazon.photos ? offer.image ?? null : null, asin: offer.asin } : search;
  } catch (error) {
    console.error(`[amazon] Lookup failed for ${product.name}: ${error instanceof Error ? error.message : error}`);
    return search;
  }
}

/** The "check price" link on list rows (owner 2026-11-15: home and /rackets rows get one again): the racket page's link
 *  logic without its live lookup, so a list of 20 makes no Amazon calls. The saved Amazon item when there is one, else an
 *  Amazon search for the name (both carry the associate tag); on sites with `website` links, the product's own site. Null
 *  when the site has no shop links. */
export function listShopLink(product: { name: string; amazonAsin?: string | null; websiteUrl: string | null; affiliateUrl: string | null }): { url: string; rel: string } | null {
  const tag = affiliateTag();
  if (niche.amazon && tag) return { url: product.amazonAsin ? amazonLink(product.amazonAsin, tag, niche.amazon.marketplace) : amazonSearchLink(product.name, tag, niche.amazon.marketplace), rel: "sponsored nofollow noopener" };
  const site = websiteButton(product);
  return site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null;
}
