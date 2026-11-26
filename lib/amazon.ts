/**
 * Amazon affiliate offers for product pages, through Amazon's Creators API (PA-API 5's replacement), the same client
 * RedRecs uses: a Login with Amazon token, searchItems to find the ASIN, getItems with OffersV2 for the live price.
 * Only niches with `amazon` in their config show Amazon links, and then every product page has one: to the product's
 * Amazon page when a search result really is that product (matchesProduct), otherwise to an Amazon search for its name,
 * as RedRecs does. The price is shown only when Amazon lists one for the matched item.
 *
 * Server-only. Credentials are read from the environment by name and never leave this module:
 * AMAZON_CREATORS_API_CREDENTIAL_ID, AMAZON_CREATORS_API_CREDENTIAL_SECRET and AMAZON_PA_API_PARTNER_TAG (the associate tag).
 * AMAZON_AFFILIATE_TAG, when set, replaces the associate tag in the links visitors click (and only there), so clicks
 * from the Recs sites show up under their own tracking ID; API calls keep the partner tag.
 */
import { looksLikeOtherProduct } from "./amazon-match";

/** match: "name" when every word of the name is in the listing title, "loose" when only the key words are
 *  (matchesProductLoose); a loose match is worth a look before its ASIN is saved. */
export type AmazonOffer = { asin: string; title: string; price: string | null; url: string; image: string | null; match?: "name" | "loose"; /** Why the match needs a look before its ASIN is saved. */ doubt?: string };
export type AmazonCredentials = { id: string; secret: string; partnerTag: string };
export type AmazonSettings = { searchIndex: string; marketplace?: string; match?: "loose" | "variants" };
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

/** The tag the links visitors click carry: AMAZON_AFFILIATE_TAG when set, otherwise the API's AMAZON_PA_API_PARTNER_TAG. */
export function affiliateTag(env: Record<string, string | undefined> = process.env) {
  return env.AMAZON_AFFILIATE_TAG?.trim() || env.AMAZON_PA_API_PARTNER_TAG?.trim() || "";
}

/** The affiliate link RedRecs uses: the product's detail page carrying the associate tag. */
export function amazonLink(asin: string, partnerTag: string, marketplace = DEFAULT_MARKETPLACE) {
  const url = new URL(`https://${marketplace}/dp/${asin}`);
  url.searchParams.set("tag", partnerTag);
  return url.toString();
}

/** RedRecs' fallback when no ASIN is known: an Amazon search for the product name, carrying the associate tag. */
export function amazonSearchLink(name: string, partnerTag: string, marketplace = DEFAULT_MARKETPLACE) {
  const url = new URL(`https://${marketplace}/s`);
  url.searchParams.set("k", name.trim());
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

/** Words that describe rather than name a product: Amazon writes "Face" for "Facial", drops "Broad-Spectrum" and adds
 *  "Korean"; a loose match ignores them on both sides. */
const SOFT = new Set(["face", "facial", "skin", "skincare", "care", "daily", "gentle", "broad", "spectrum", "korean", "k", "beauty",
  "low", "molecular", "advanced", "original", "classic", "new", "formula", "the"]);
/** Formula and finish words that mark a sibling (Hydrating vs Foaming Cleanser, tinted vs untinted, AM vs PM): a loose
 *  match rejects a listing whose name part has one the catalogue name lacks. */
const SIBLING = /^(foaming|foam|cream|lotion|gel|oil|balm|tinted|mineral|matte|night|pm|am|eye|body|lip|baby|kids|sensitive|acne|salicylic|renewing|smoothing|sa|retinol|intensive|intense|rich|light|fluid|stick|spray|mist|sheer|glow|toner|mask|pads?|cushion|aqua|fresh|airy|watery|brightening|tone)$/;
/** Title words plus the split of letter-number runs ("spf50" also gives "spf" and "50"). */
const titleWords = (t: string) => { const w = words(t); return new Set([...w, ...w.flatMap(x => x.split(/(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/))]); };

/**
 * The forgiving check, used only when no result passes matchesProduct (owner 2026-11-26, SkinRecs): the brand must
 * match and every number in the name (SPF 46, 96, 10%) must appear, sizes, pack words and the SOFT words are ignored,
 * and a third of the remaining key words may be missing ("Torriden DIVE IN Hyaluronic Acid Serum" for the "DIVE-IN Low
 * Molecular" one). A sibling formula word in the listing's name part (before the first comma or "|") still rejects it.
 */
export function matchesProductLoose(product: { name: string; brand: string }, result: { title: string; brand?: string | null }) {
  const title = titleWords(result.title), brand = words(product.brand), resultBrand = words(result.brand ?? "").join(" ");
  const brandOk = brand.length > 0 && (resultBrand ? resultBrand.includes(brand.join(" ")) || brand.join(" ").includes(resultBrand) : brand.every(w => title.has(w)));
  if (!brandOk) return false;
  const brandWords = new Set(brand);
  const key = words(product.name).flatMap(w => w.split(/(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/)).filter(w => !brandWords.has(w) && !SOFT.has(w));
  if (key.length < 2) return false;
  if (key.some(w => /\d/.test(w) && !title.has(w) && !title.has(w.replace(/s$/, "")))) return false;
  const has = (w: string) => title.has(w) || title.has(w.replace(/s$/, "")) || title.has(`${w}s`);
  const missing = key.filter(w => !has(w));
  // The first two key words name the line ("UV Restore", "DIVE IN"): never missing, so UV Daily isn't taken for UV Restore.
  if (missing.length > Math.floor(key.length / 3) || missing.some(w => key.indexOf(w) < 2)) return false;
  return !isSiblingListing(product, result.title);
}

/** The listing's name part (before the first comma or "|") has a formula or variant word the catalogue name lacks:
 *  "Relief Sun Aqua-Fresh" for Relief Sun: Rice + Probiotics, "Hydrating Cream-to-Foam" for Hydrating Facial Cleanser. */
export function isSiblingListing(product: { name: string }, title: string) {
  const own = new Set(words(product.name)), head = words(title.split(/[,|]/)[0] ?? "");
  return head.some(w => SIBLING.test(w) && !own.has(w) && !own.has(w.replace(/s$/, "")) && !own.has(`${w}s`)
    && !(w === "tinted" && head.includes("untinted")));
}

/** PickleballRecs variants (owner 2026-11-26): shape, thickness and generation must match both ways. */
const SHAPE = /^(elongated|hybrid|widebody|standard)$/, THICK = /^\d{2}mm$/, GEN = /^(ii|iii|iv|v|vi|vii|[2-9]|gen\d*|\d\.0)$/;
const shapeWords = (ws: string[]) => ws.map(w => w === "wide" ? "widebody" : w).filter(w => SHAPE.test(w));
/** Why a listing is another variant (reject) or a parent listing of several (doubt), for "variants" niches. */
export function variantCheck(product: { name: string; brand: string }, title: string): { reject?: string; doubt?: string } {
  const own = words(product.name), all = words(title), head = words(title.split(/[,|(]/)[0] ?? "");
  for (const [label, test] of [["shape", (w: string) => SHAPE.test(w)], ["thickness", (w: string) => THICK.test(w)], ["generation", (w: string) => GEN.test(w)]] as const) {
    const mine = own.filter(test);
    const extra = (label === "shape" ? shapeWords(head) : head.filter(test)).filter(w => !mine.includes(w));
    if (extra.length) return { reject: `${label} ${extra[0]} in the listing name, not in ours` };
    const lacking = mine.filter(w => !(label === "shape" ? shapeWords(all) : all).includes(w));
    if (lacking.length) return { reject: `${label} ${lacking[0]} not in the listing` };
  }
  const shapes = new Set(shapeWords(all)), thick = new Set(all.filter(w => THICK.test(w)));
  if (shapes.size > 1 || thick.size > 1) return { doubt: `parent listing with variants (${[...shapes, ...thick].join(", ")})` };
  return {};
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
  images?: { primary?: { large?: { url?: string } } };
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
 * The catalogue product on Amazon with its live price (null when Amazon lists none), or null when no search result is
 * that product. Throws AmazonUnavailable when Amazon could not answer.
 */
export async function findAmazonOffer(product: { name: string; brand: string }, settings: AmazonSettings, credentials: AmazonCredentials, fetcher: Fetch = fetch, log: (message: string) => void = console.info): Promise<AmazonOffer | null> {
  const marketplace = settings.marketplace ?? DEFAULT_MARKETPLACE;
  const found = await call("/catalog/v1/searchItems", {
    keywords: product.name.trim(), searchIndex: settings.searchIndex, itemCount: 5, resources: ["itemInfo.title", "itemInfo.byLineInfo"],
  }, credentials, marketplace, fetcher);
  const mode = settings.match;
  const items = (found.searchResult?.items ?? []).filter(item => item.asin && isAsin(item.asin) && item.itemInfo?.title?.displayValue
    // The name alone isn't enough: "CeraVe Healing Ointment Lip Balm" carries every word of "CeraVe Healing Ointment".
    && !looksLikeOtherProduct(product, item.itemInfo.title.displayValue)
    && (mode !== "loose" || !isSiblingListing(product, item.itemInfo.title.displayValue))
    && (mode !== "variants" || !variantCheck(product, item.itemInfo.title.displayValue).reject));
  const pick = (test: typeof matchesProduct) => items.find(item => test(product, { title: item.itemInfo!.title!.displayValue!, brand: item.itemInfo!.byLineInfo?.brand?.displayValue }));
  const exact = pick(matchesProduct), match = exact ?? (mode ? pick(matchesProductLoose) : undefined), how: "name" | "loose" = exact ? "name" : "loose";
  const doubt = match && mode === "variants" ? variantCheck(product, match.itemInfo!.title!.displayValue!).doubt : undefined;
  if (!match?.asin) {
    const titles = (found.searchResult?.items ?? []).map(item => `${item.asin} "${item.itemInfo?.title?.displayValue ?? ""}"`);
    log(`[amazon] No matching result for ${product.name}${titles.length ? `; Amazon returned ${titles.join(", ")}` : found.errors?.[0]?.code ? ` (${found.errors[0].code})` : "; Amazon returned nothing"}`);
    return null;
  }
  const details = await call("/catalog/v1/getItems", {
    itemIds: [match.asin], resources: ["itemInfo.title", "offersV2.listings.price", "offersV2.listings.availability", "images.primary.large"],
  }, credentials, marketplace, fetcher);
  const item = details.itemsResult?.items?.find(i => i.asin === match.asin);
  const price = item ? listingPrice(item) : null;
  if (!price) log(`[amazon] ${product.name} matched ${match.asin} but Amazon lists no price for it`);
  return { asin: match.asin, title: item?.itemInfo?.title?.displayValue ?? match.itemInfo!.title!.displayValue!, price, url: amazonLink(match.asin, credentials.partnerTag, marketplace), image: item?.images?.primary?.large?.url ?? null, match: how, ...(doubt ? { doubt } : {}) };
}

/** One known ASIN's live offer (getItems with OffersV2), for the daily price job (scripts/amazon-prices.mts): no search,
 *  so a saved or hand-checked ASIN is never swapped for a lookalike. Null when Amazon has no such item. */
export async function amazonOfferByAsin(asin: string, settings: AmazonSettings, credentials: AmazonCredentials, fetcher: Fetch = fetch): Promise<AmazonOffer | null> {
  const marketplace = settings.marketplace ?? DEFAULT_MARKETPLACE;
  const details = await call("/catalog/v1/getItems", {
    itemIds: [asin], resources: ["itemInfo.title", "offersV2.listings.price", "offersV2.listings.availability", "images.primary.large"],
  }, credentials, marketplace, fetcher);
  const item = details.itemsResult?.items?.find(i => i.asin === asin);
  if (!item) return null;
  return { asin, title: item.itemInfo?.title?.displayValue ?? "", price: listingPrice(item), url: amazonLink(asin, credentials.partnerTag, marketplace), image: item.images?.primary?.large?.url ?? null };
}
