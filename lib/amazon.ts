/**
 * Amazon affiliate offers for product pages, through Amazon's Creators API (PA-API 5's replacement), the same client
 * RedRecs uses: a Login with Amazon token, searchItems to find the ASIN, getItems with OffersV2 for the live price.
 * Only niches with `amazon` in their config ask for offers. A product gets a link only when a search result really is
 * that product (matchesProduct) and Amazon lists a price for it; anything else means no link.
 *
 * Server-only. Credentials are read from the environment by name and never leave this module:
 * AMAZON_CREATORS_API_CREDENTIAL_ID, AMAZON_CREATORS_API_CREDENTIAL_SECRET and AMAZON_PA_API_PARTNER_TAG (the associate tag).
 */

export type AmazonOffer = { asin: string; title: string; price: string; url: string };
export type AmazonCredentials = { id: string; secret: string; partnerTag: string };
export type AmazonSettings = { searchIndex: string; marketplace?: string };
type Fetch = typeof fetch;

const API = "https://creatorsapi.amazon";
const TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const DEFAULT_MARKETPLACE = "www.amazon.com";

/** Amazon ASINs are 10 uppercase letters and digits, e.g. B0CHWRXH8B. */
export const isAsin = (value: string) => /^[A-Z0-9]{10}$/.test(value);

export function amazonCredentials(env: Record<string, string | undefined> = process.env): AmazonCredentials | null {
  const id = env.AMAZON_CREATORS_API_CREDENTIAL_ID, secret = env.AMAZON_CREATORS_API_CREDENTIAL_SECRET, partnerTag = env.AMAZON_PA_API_PARTNER_TAG;
  return id && secret && partnerTag ? { id, secret, partnerTag } : null;
}

/** The affiliate link RedRecs uses: the product's detail page carrying the associate tag. */
export function amazonLink(asin: string, partnerTag: string, marketplace = DEFAULT_MARKETPLACE) {
  const url = new URL(`https://${marketplace}/dp/${asin}`);
  url.searchParams.set("tag", partnerTag);
  return url.toString();
}

// Words that say nothing about which product it is; Amazon titles add or drop them freely.
const FILLER = new Set(["the", "a", "an", "and", "with", "for", "of", "by", "in", "to", "&"]);
/** Lowercase words without accents or punctuation: "Sébium Exfoliating Gel" → ["sebium", "exfoliating", "gel"]. "10%" stays "10". */
export function words(text: string) {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").split(/[^a-z0-9.]+/)
    .map(w => w.replace(/^\.+|\.+$/g, "")).filter(w => w && !FILLER.has(w));
}

/**
 * Whether an Amazon result is the catalogue product, not a sibling (CeraVe Hydrating vs Foaming Cleanser) or another
 * brand's lookalike. The brand must match, every number in the name (SPF 50, 10%, 2%) must appear, and so must every
 * other word of the name, except that names of four or more words may miss one (Amazon says "Face" for "Facial").
 */
export function matchesProduct(product: { name: string; brand: string }, result: { title: string; brand?: string | null }) {
  const title = new Set(words(result.title));
  const brand = words(product.brand);
  const resultBrand = words(result.brand ?? "").join(" ");
  const brandOk = brand.length > 0 && (resultBrand ? resultBrand.includes(brand.join(" ")) || brand.join(" ").includes(resultBrand) : brand.every(w => title.has(w)));
  if (!brandOk) return false;
  const brandWords = new Set(brand);
  const model = words(product.name).filter(w => !brandWords.has(w));
  if (!model.length) return false;
  if (model.some(w => /\d/.test(w) && !title.has(w))) return false;
  const missing = model.filter(w => !title.has(w)).length;
  return missing === 0 || (model.length >= 4 && missing === 1);
}

/** Thrown for answers that should be retried later (throttling, outages), so a cache never keeps them as "not on Amazon". */
export class AmazonUnavailable extends Error {}

let token: { value: string; expiresAt: number; id: string } | null = null;
async function accessToken(credentials: AmazonCredentials, fetcher: Fetch) {
  if (token && token.id === credentials.id && Date.now() < token.expiresAt - 30_000) return token.value;
  const response = await fetcher(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: credentials.id, client_secret: credentials.secret, scope: "creatorsapi::default" }).toString(),
  });
  if (!response.ok) throw new AmazonUnavailable(`Amazon token request failed (${response.status})`);
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new AmazonUnavailable("Amazon token response had no access token");
  token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000, id: credentials.id };
  return token.value;
}

/** For tests: forget the cached access token. */
export function resetAmazonToken() { token = null; }

type Item = {
  asin?: string;
  itemInfo?: { title?: { displayValue?: string }; byLineInfo?: { brand?: { displayValue?: string } } };
  offersV2?: { listings?: { price?: { money?: { amount?: number; currency?: string; displayAmount?: string } } }[] };
};
type ApiResponse = { searchResult?: { items?: Item[] }; itemsResult?: { items?: Item[] }; errors?: { code?: string; message?: string }[] };

async function call(path: string, body: Record<string, unknown>, credentials: AmazonCredentials, marketplace: string, fetcher: Fetch): Promise<ApiResponse> {
  const response = await fetcher(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${await accessToken(credentials, fetcher)}`, "x-marketplace": marketplace },
    body: JSON.stringify({ partnerTag: credentials.partnerTag, partnerType: "Associates", marketplace, ...body }),
  });
  const data = await response.json().catch(() => ({})) as ApiResponse;
  const code = data.errors?.[0]?.code;
  // No results is an answer; throttling, auth and server trouble are not.
  if (code === "NoResults" || code === "ItemNotAccessible" || code === "InvalidParameterValue") return data;
  if (!response.ok || code) throw new AmazonUnavailable(`Amazon ${path} failed (${response.status}${code ? ` ${code}` : ""})`);
  return data;
}

/** Display price of the first listing, as Amazon formats it ("$15.99"). */
export function listingPrice(item: Item): string | null {
  const money = item.offersV2?.listings?.[0]?.price?.money;
  if (money?.displayAmount) return money.displayAmount;
  if (typeof money?.amount === "number") return money.currency && money.currency !== "USD" ? `${money.amount.toFixed(2)} ${money.currency}` : `$${money.amount.toFixed(2)}`;
  return null;
}

/**
 * The live Amazon offer for one catalogue product, or null when it is not on Amazon (no matching result, or no price
 * listed, which means it cannot be bought there right now). Throws AmazonUnavailable when Amazon could not answer.
 */
export async function findAmazonOffer(product: { name: string; brand: string }, settings: AmazonSettings, credentials: AmazonCredentials, fetcher: Fetch = fetch): Promise<AmazonOffer | null> {
  const marketplace = settings.marketplace ?? DEFAULT_MARKETPLACE;
  const found = await call("/catalog/v1/searchItems", {
    keywords: product.name.trim(), searchIndex: settings.searchIndex, itemCount: 5, resources: ["itemInfo.title", "itemInfo.byLineInfo"],
  }, credentials, marketplace, fetcher);
  const match = (found.searchResult?.items ?? []).find(item => item.asin && isAsin(item.asin) && item.itemInfo?.title?.displayValue
    && matchesProduct(product, { title: item.itemInfo.title.displayValue, brand: item.itemInfo.byLineInfo?.brand?.displayValue }));
  if (!match?.asin) return null;
  const details = await call("/catalog/v1/getItems", {
    itemIds: [match.asin], resources: ["itemInfo.title", "offersV2.listings.price", "offersV2.listings.availability"],
  }, credentials, marketplace, fetcher);
  const item = details.itemsResult?.items?.find(i => i.asin === match.asin);
  const price = item && listingPrice(item);
  if (!price) return null;
  return { asin: match.asin, title: item.itemInfo?.title?.displayValue ?? match.itemInfo!.title!.displayValue!, price, url: amazonLink(match.asin, credentials.partnerTag, marketplace) };
}
