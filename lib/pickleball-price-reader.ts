// USD-safe page reading for the daily PickleballRecs shop-price run (scripts/pickleball-shop-prices.mts). 2026-11-27 bug:
// Shopify Markets shops answered in the visitor's local currency (Thai baht from the owner's Mac), and the old reader took
// .json/.js prices without any currency, so baht was stored as dollars. Now every source must state its currency, and only
// a price stated in USD is kept (plus the plausibility guard below). Sources, in order, all read pinned to the US market
// (?country=US&currency=USD):
//   1. the page's schema.org JSON-LD (Product, ProductGroup with hasVariant, @graph);
//   2. price meta tags with their currency (og:price / product:price, itemprop price + priceCurrency);
//   3. Shopify's page globals: Shopify.currency.active (rate 1.0 only) plus the product meta (variant prices in cents);
//   4. Shopify's /products/<handle>.json, only when the variant's own price_currency says USD.
// Stock is taken where the source states it; otherwise null (the run keeps the row's current stock). Pure, so tests feed
// plain inputs.

/** The URL pinned to the US market: Shopify Markets honours ?country= / ?currency=; other shops ignore them. */
export function usdUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.set("country", "US");
  u.searchParams.set("currency", "USD");
  return u.toString();
}

/** Shopify-style product URL: /products/<handle> (also under a locale prefix). */
export function shopifyJsonUrl(url: string): string | null {
  const u = new URL(url), m = u.pathname.match(/^(.*\/products\/[^/]+?)\/?$/);
  if (!m) return null;
  return usdUrl(`${u.origin}${m[1]}.json`);
}

export type Offer = { source: string; title: string; price: number; currency: string | null; inStock: boolean | null };
export type UsdRead = { ok: true; source: string; title: string; price: number; inStock: boolean | null } | { ok: false; why: string };

const variantOf = (url?: string) => { try { return url ? new URL(url).searchParams.get("variant") : null; } catch { return null; } };
const num = (x: unknown) => { const n = Number(String(x ?? "").replace(/,/g, "")); return Number.isFinite(n) && n > 0 ? n : null; };
const stock = (a: unknown): boolean | null => {
  const s = String(a ?? ""); if (!s) return null;
  if (/InStock|LimitedAvailability|OnlineOnly|InStoreOnly|PreOrder|PreSale|BackOrder/i.test(s)) return /InStock|LimitedAvailability|OnlineOnly|InStoreOnly/i.test(s);
  return /OutOfStock|SoldOut|Discontinued/i.test(s) ? false : null;
};
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();

/** Tolerant JSON parse: themes often leave raw newlines or tabs inside JSON-LD strings. */
function parseLoose(s: string): unknown {
  try { return JSON.parse(s); } catch { /* try again */ }
  try { return JSON.parse(s.replace(/[\u0000-\u001f]+/g, " ")); } catch { return null; }
}

type Obj = Record<string, unknown>;
const isType = (x: Obj, t: string) => { const y = x["@type"]; return y === t || (Array.isArray(y) && y.includes(t)); };
function flatten(j: unknown): Obj[] {
  if (!j || typeof j !== "object") return [];
  if (Array.isArray(j)) return j.flatMap(flatten);
  const o = j as Obj, graph = o["@graph"];
  return Array.isArray(graph) ? [o, ...graph.flatMap(flatten)] : [o];
}
function offerOf(x: Obj, variant: string | null): { o: Obj; via?: Obj } | null {
  const offers = flatten(x.offers).flatMap(o => isType(o, "AggregateOffer") && o.offers ? [o, ...flatten(o.offers)] : [o]);
  const priced = offers.filter(o => num(o.price ?? o.lowPrice) !== null);
  if (!priced.length) return null;
  const match = variant ? priced.find(o => [o.url, o["@id"], o.sku].some(v => String(v ?? "").includes(variant))) : undefined;
  return { o: match ?? priced[0]! };
}

/** 1. schema.org JSON-LD: a Product's offer, or a ProductGroup's variant (the ?variant= one when the URL names it). */
export function fromLd(html: string, url?: string): Offer | null {
  const variant = variantOf(url);
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const x of flatten(parseLoose(m[1]!))) {
      const products = isType(x, "ProductGroup") ? flatten(x.hasVariant).filter(v => isType(v, "Product")) : isType(x, "Product") ? [x] : [];
      let hit: { p: Obj; o: Obj } | null = null;
      for (const p of products) {
        const r = offerOf(p, variant); if (!r) continue;
        const named = variant && [p["@id"], p.url, p.sku, r.o.url, r.o["@id"]].some(v => String(v ?? "").includes(variant));
        if (named) { hit = { p, o: r.o }; break; }
        hit ??= { p, o: r.o };
      }
      if (!hit) continue;
      const title = String(x.name ?? hit.p.name ?? "").trim();
      return { source: "json-ld", title, price: num(hit.o.price ?? hit.o.lowPrice)!, currency: hit.o.priceCurrency ? String(hit.o.priceCurrency) : null,
        inStock: stock(hit.o.availability) };
    }
  }
  return null;
}

const metaContent = (html: string, key: string) => {
  const k = key.replace(/[.:]/g, m => `\\${m}`);
  const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, "i");
  return decode((html.match(re1) ?? html.match(re2))?.[1] ?? "") || null;
};
const ogTitle = (html: string) => metaContent(html, "og:title") ?? decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");

/** 2. Price meta tags, only as a pair with their currency. */
export function fromMeta(html: string): Offer | null {
  for (const [p, c] of [["og:price:amount", "og:price:currency"], ["product:price:amount", "product:price:currency"], ["price", "priceCurrency"]] as const) {
    const price = num(metaContent(html, p)), currency = metaContent(html, c);
    if (price !== null && currency) return { source: `meta ${p}`, title: ogTitle(html), price, currency,
      inStock: stock(metaContent(html, "og:availability") ?? metaContent(html, "product:availability") ?? metaContent(html, "availability")) };
  }
  return null;
}

/** 3. Shopify page globals: the page's active currency and the product meta (prices in cents). */
export function fromShopifyGlobals(html: string, url?: string): Offer | null {
  // The meta prices can be in the shop's base currency, so only a page whose active currency is the base (rate 1.0) counts.
  const cur = html.match(/Shopify\.currency\s*=\s*(\{[^}]*\})/)?.[1], c = cur ? parseLoose(cur) as { active?: string; rate?: string } | null : null;
  const active = c?.active && Number(c.rate) === 1 ? c.active : c?.active ? `${c.active} (rate ${c.rate})` : undefined;
  const metaJson = html.match(/var\s+meta\s*=\s*(\{[\s\S]*?\});\s*(?:\n|for|window|var)/)?.[1];
  if (!active || !metaJson) return null;
  const meta = parseLoose(metaJson) as { product?: { variants?: { id: number; price: number; name?: string }[] } } | null;
  const vs = meta?.product?.variants ?? [];
  const want = variantOf(url), v = vs.find(x => String(x.id) === want) ?? vs[0];
  if (!v || !(Number(v.price) > 0)) return null;
  return { source: "shopify globals", title: ogTitle(html), price: Math.round(Number(v.price)) / 100, currency: active, inStock: null };
}

/** 4. Shopify /products/<handle>.json: the variant's own price_currency must be present. */
export function fromShopifyJson(body: string, url?: string): Offer | null {
  const j = parseLoose(body) as { product?: { title?: string; variants?: { id: number; price: string; price_currency?: string }[] } } | null;
  const vs = j?.product?.variants ?? [];
  const want = variantOf(url), v = vs.find(x => String(x.id) === want) ?? vs[0];
  if (!v || num(v.price) === null) return null;
  return { source: "shopify .json", title: String(j?.product?.title ?? ""), price: num(v.price)!, currency: v.price_currency ?? null, inStock: null };
}

/** Stock from Shopify's .js (`available` is currency-free); null when it can't be read. */
export function stockFromShopifyJs(body: string, url?: string): boolean | null {
  const j = parseLoose(body) as { available?: boolean; variants?: { id: number; available: boolean }[] } | null;
  if (!j) return null;
  const want = variantOf(url), v = want ? j.variants?.find(x => String(x.id) === want) : undefined;
  return v ? v.available === true : typeof j.available === "boolean" ? j.available : null;
}

/** Keep an offer only when it states USD. */
export function usd(o: Offer | null, none = "no price found"): UsdRead {
  if (!o) return { ok: false, why: none };
  if (o.currency !== "USD") return { ok: false, why: o.currency ? `currency ${o.currency} (${o.source})` : `no currency stated (${o.source})` };
  return { ok: true, source: o.source, title: o.title, price: o.price, inStock: o.inStock };
}

/** The page's own offer in US dollars, trying sources 1-3 in order. A source stating another currency stops the read
 *  (the page is in that market), so a local-currency page never falls through to a looser source. */
export function usdOffer(html: string, url?: string): UsdRead {
  for (const o of [fromLd(html, url), fromMeta(html), fromShopifyGlobals(html, url)]) if (o) return usd(o);
  return { ok: false, why: "no price on the page (no JSON-LD offer, price meta or Shopify meta)" };
}

export const SANITY = { factor: 2.5, aloneMax: 1000 };
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };

/** A price is plausible when it is at most 2.5x the median of the paddle's other live offers (Amazon included), or, with
 *  no other offer, at most $1,000 (no paddle costs that; a local-currency number does). */
export function plausible(price: number, others: number[], cfg = SANITY): { ok: boolean; why: string } {
  const o = others.filter(x => Number.isFinite(x) && x > 0);
  if (!o.length) return price <= cfg.aloneMax ? { ok: true, why: "" } : { ok: false, why: `${price} with no other offer is above ${cfg.aloneMax}` };
  const m = median(o);
  return price <= cfg.factor * m ? { ok: true, why: "" } : { ok: false, why: `${price} is more than ${cfg.factor}x the other offers (median ${m})` };
}
