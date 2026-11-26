// USD-safe page reading for the daily PickleballRecs shop-price run (scripts/pickleball-shop-prices.mts). 2026-11-27 bug:
// Shopify Markets shops answered in the visitor's local currency (Thai baht from the owner's Mac), even from .json/.js, and
// those numbers were stored as dollars. Now every page is read the same way: the product page pinned to the US market
// (?country=US&currency=USD), price and currency from its schema.org Product offer, and nothing is stored unless the page
// itself says USD and the price is plausible next to the paddle's other offers. Pure, so tests feed plain inputs.
import { fromJsonLd } from "./padel-shop-reader";

/** The product page in the US market: Shopify Markets honours ?country= / ?currency=; other shops ignore them. */
export function usdUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.set("country", "US");
  u.searchParams.set("currency", "USD");
  return u.toString();
}

export type UsdRead = { ok: true; title: string; price: number; inStock: boolean } | { ok: false; why: string };

/** The page's own offer, only when it is stated in US dollars. */
export function usdOffer(html: string): UsdRead {
  const p = fromJsonLd(html);
  if (!p.ok) return { ok: false, why: p.why };
  if (p.currency !== "USD") return { ok: false, why: p.currency ? `currency ${p.currency}` : "no currency on the page" };
  return { ok: true, title: p.title, price: p.price, inStock: p.inStock };
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
