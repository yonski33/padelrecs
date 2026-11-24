// PadelRecs shop offers per racket (db/shop/padel-offers.json, keyed by racket slug) for the "Where to buy" box on
// racket pages (app/thread/racket-v7b.tsx). A static data file, not a DB table: the pack came from Grok (2026-11-23),
// checked link by link before import, and scripts/ninepadel-feed.mts refreshes NINEPADEL's rows from its public feed.
// Shop names, short names and the affiliate switch live in lib/padel-shops.ts.
import data from "../db/shop/padel-offers.json";
import { ORDER_RATE_TO_EUR, money, shopHref, shopNamed, type ShopCurrency } from "./padel-shops";

export type StoredOffer = { shop: string; url: string; price: number; currency: ShopCurrency; inStock: boolean; checked: string };
export type OffersFile = { note?: string; offers: Record<string, StoredOffer[]> };

/** One row of the box, ready to render. */
export type ShopOffer = { shop: string; short: string; href: string; rel: string; price: string; inStock: boolean; checked: string; affiliate: boolean };

/** In stock first, then cheapest (rough EUR value, ordering only), then the shop's name. */
export function shopOffers(stored: StoredOffer[]): ShopOffer[] {
  return stored
    .filter(o => o.price > 0 && /^https:\/\//.test(o.url))
    .slice()
    .sort((a, b) => Number(b.inStock) - Number(a.inStock)
      || a.price * ORDER_RATE_TO_EUR[a.currency] - b.price * ORDER_RATE_TO_EUR[b.currency] || a.shop.localeCompare(b.shop))
    .map(o => {
      const s = shopNamed(o.shop), affiliate = !!s?.affiliate;
      return { shop: o.shop, short: s?.short ?? o.shop, href: shopHref(s, o.url), rel: affiliate ? "sponsored nofollow noopener" : "nofollow noopener",
        price: money(o.price, o.currency), inStock: o.inStock, checked: o.checked, affiliate };
    });
}

/** The racket's shop offers, or [] (no row in the file, or a site other than PadelRecs). */
export function padelOffers(slug: string, file: OffersFile = data as unknown as OffersFile): ShopOffer[] {
  return shopOffers(file.offers[slug] ?? []);
}

/** "Nov 23, 2026": the newest check among the rows. */
export function newestCheck(offers: ShopOffer[]): string | null {
  const d = offers.map(o => o.checked).sort().pop();
  return d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
}
