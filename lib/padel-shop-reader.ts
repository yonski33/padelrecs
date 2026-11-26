// Reads one padel shop product page for the daily price script (scripts/padel-shop-prices.mts): its title, current price,
// currency and stock. No AI, no price history. Shopify shops through the product's public .js; Padel Nuestro and Decathlon
// through the page's schema.org Product. A shop that blocks scripts (Shop.read "blocked") is never fetched.
import type { Shop } from "./padel-shops";

export type PageRead =
  | { ok: true; title: string; price: number; currency: string | null; inStock: boolean }
  | { ok: false; gone: boolean; why: string };

export const UA = { "user-agent": "PadelRecsPriceCheck/1.0 (+https://www.padelrecs.com)", accept: "text/html,application/json" };
type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

const strip = (u: string) => u.split("#")[0]!.split("?")[0]!.replace(/\/+$/, "");

/** Shopify's product .js: price in cents, `available` when any variant can be bought. */
export function fromShopifyJs(body: string): PageRead {
  try {
    const j = JSON.parse(body) as { title?: string; price?: number; available?: boolean };
    if (!j.title || !(Number(j.price) > 0)) return { ok: false, gone: false, why: "no title or price in .js" };
    return { ok: true, title: j.title, price: Math.round(Number(j.price)) / 100, currency: null, inStock: j.available === true };
  } catch { return { ok: false, gone: false, why: "bad .js" }; }
}

/** The first schema.org Product with an offer in the page's JSON-LD. */
export function fromJsonLd(html: string): PageRead {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let j: unknown; try { j = JSON.parse(m[1]!); } catch { continue; }
    const items = (Array.isArray(j) ? j : (j as { "@graph"?: unknown[] })["@graph"] ?? [j]) as Record<string, unknown>[];
    for (const x of items) {
      const type = x["@type"]; if (!(type === "Product" || (Array.isArray(type) && type.includes("Product")))) continue;
      const offers = ([] as Record<string, unknown>[]).concat((x.offers as Record<string, unknown>) ?? []);
      const o = offers.find(y => Number(y.price ?? y.lowPrice) > 0); if (!o) continue;
      return { ok: true, title: String(x.name ?? "").trim(), price: Number(o.price ?? o.lowPrice), currency: o.priceCurrency ? String(o.priceCurrency) : null,
        inStock: /InStock|LimitedAvailability|OnlineOnly/i.test(String(o.availability ?? "")) };
    }
  }
  return { ok: false, gone: false, why: "no Product offer in JSON-LD" };
}

/** One page, read the shop's way. `gone` = the page answers 404 or 410 (the row is hidden). */
export async function readShopPage(shop: Shop, url: string, fetcher: Fetcher = fetch): Promise<PageRead> {
  if (shop.read === "blocked") return { ok: false, gone: false, why: "shop blocks scripts" };
  const target = shop.read === "shopify" ? `${strip(url)}.js` : url;
  let res: Response;
  try { res = await fetcher(target, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(20000) }); }
  catch (e) { return { ok: false, gone: false, why: `fetch failed: ${e instanceof Error ? e.message : String(e)}`.slice(0, 120) }; }
  if (res.status === 404 || res.status === 410) return { ok: false, gone: true, why: `HTTP ${res.status}` };
  if (!res.ok) return { ok: false, gone: false, why: `HTTP ${res.status}` };
  const body = await res.text();
  return shop.read === "shopify" ? fromShopifyJs(body) : fromJsonLd(body);
}

// The model check (used when new links come in, and daily to catch a page that changed to another model).
const VARIANT = new Set(["light", "lite", "comfort", "cmf", "hybrid", "hyb", "attack", "soft", "hard", "hrd", "team", "elite", "women", "woman",
  "mujer", "w", "junior", "jr", "kids", "edge", "ctrl", "control", "carbon", "power", "motion", "geo", "lt", "ls", "edt", "edition", "balance",
  "tour", "xtrem", "12k", "18k", "24k", "3k", "alum", "plus", "pro", "one", "speed", "ultralight"]);
const ALIAS: Record<string, string[]> = { comfort: ["cmf"], cmf: ["comfort"], women: ["w", "woman", "mujer"], w: ["woman", "women", "mujer"],
  hybrid: ["hyb"], hrd: ["hard"], ctrl: ["control"], lite: ["light"], light: ["lite"], edition: ["edt"], edt: ["edition"] };
const SOFT = new Set(["at10", "juan", "lebron", "ale", "galan", "ari", "sanchez", "agustin", "tapia", "padel", "racket", "pala", "paddle", "by", "the"]);
const words = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\+/g, " plus ").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);

/** Does the shop title name exactly this racket? `name` is the catalogue name (year in it or not), `year` its year.
 *  Fails on another year in the title, a model word missing, or a variant word the racket does not have. A title with no
 *  year passes the year part only when the URL carries it (4 digits, or 2 as in "hack-04-26"). */
export function sameRacket(name: string, year: number | null, title: string, url = ""): { ok: boolean; why: string } {
  const y = year ? String(year) : null;
  const model = words(name).slice(1).filter(w => w !== y);
  const t = words(title), tset = new Set(t), years = t.filter(w => /^20\d\d$/.test(w));
  if (y && years.length && !years.includes(y)) return { ok: false, why: `year ${years.join("/")} on page, want ${y}` };
  const short = y ? y.slice(2) : null;
  const hasYear = !y || years.includes(y) || (short != null && (tset.has(short) || new RegExp(`(^|[^0-9])(${y}|${short})([^0-9]|$)`).test(strip(url).split("/").pop() ?? "")));
  if (!hasYear) return { ok: false, why: "no year on page or in URL" };
  const missing = model.filter(w => !SOFT.has(w) && !/^\d$/.test(w) && !tset.has(w) && !(ALIAS[w] ?? []).some(a => tset.has(a)));
  if (missing.length) return { ok: false, why: `missing ${missing.join(", ")}` };
  const mset = new Set(model.flatMap(w => [w, ...(ALIAS[w] ?? [])]));
  const extra = t.filter(w => VARIANT.has(w) && !mset.has(w));
  if (extra.length) return { ok: false, why: `extra ${[...new Set(extra)].join(", ")}` };
  return { ok: true, why: "" };
}
