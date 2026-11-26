// PadelRecs shop offers per racket for "Where to buy" (racket pages, the creator page's price box and the home cards).
// Since 2026-11-26 (owner OK) the rows live in padelrecs.creator_prices with source "padel-shop:..." (scripts/
// padel-shop-import.mts loaded the checked #679 file; scripts/padel-shop-prices.mts re-reads every page daily). A row
// checked more than MAX_AGE_DAYS ago is not shown (owner 2026-11-26: 3 days). Current prices only, no history.
// Shop names, short names and the affiliate switch live in lib/padel-shops.ts.
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { niche } from "./niche";
import { ORDER_RATE_TO_EUR, PADEL_SHOP_SOURCE, money, shopHref, shopNamed, type ShopCurrency } from "./padel-shops";

export type StoredOffer = { shop: string; url: string; price: number; currency: ShopCurrency; inStock: boolean;
  /** When the price was read: ISO date or time. */ checked: string };

/** One row of the box, ready to render. */
export type ShopOffer = { shop: string; short: string; href: string; rel: string; price: string; inStock: boolean; checked: string; affiliate: boolean };

/** Owner 2026-11-26: a price older than this is hidden (the daily job keeps rows fresh; a blocked shop goes quiet). */
export const MAX_AGE_DAYS = 3;
const DAY = 24 * 60 * 60 * 1000;
const time = (iso: string) => Date.parse(/T/.test(iso) ? iso : `${iso}T00:00:00Z`);
export const isFresh = (o: Pick<StoredOffer, "checked">, now = Date.now()) => now - time(o.checked) <= MAX_AGE_DAYS * DAY;

/** Fresh rows only; in stock first, then cheapest (rough EUR value, ordering only), then the shop's name. */
export function shopOffers(stored: StoredOffer[], now = Date.now()): ShopOffer[] {
  return stored
    .filter(o => o.price > 0 && /^https:\/\//.test(o.url) && isFresh(o, now))
    .slice()
    .sort((a, b) => Number(b.inStock) - Number(a.inStock)
      || a.price * ORDER_RATE_TO_EUR[a.currency] - b.price * ORDER_RATE_TO_EUR[b.currency] || a.shop.localeCompare(b.shop))
    .map(o => {
      const s = shopNamed(o.shop), affiliate = !!s?.affiliate;
      return { shop: o.shop, short: s?.short ?? o.shop, href: shopHref(s, o.url), rel: affiliate ? "sponsored nofollow noopener" : "nofollow noopener",
        price: money(o.price, o.currency), inStock: o.inStock, checked: o.checked, affiliate };
    });
}

/** creator_prices rows (padel shop source) by racket slug. Pure, so the tests check it without a database. */
export function offersBySlug(rows: Record<string, unknown>[]): Record<string, StoredOffer[]> {
  const out: Record<string, StoredOffer[]> = {};
  for (const r of rows) {
    const shop = String(r.shop), s = shopNamed(shop);
    const o: StoredOffer = { shop, url: String(r.url), price: Number(r.price), currency: (s?.currency ?? String(r.currency)) as ShopCurrency,
      inStock: r.in_stock === true || r.in_stock === "t", checked: String(r.checked_at) };
    (out[String(r.slug)] ??= []).push(o);
  }
  return out;
}

// One query for every live padel shop row, kept an hour in Next's data cache (shared by every page and the home); the
// freshness rule runs at render time on top of it. No database (CI builds) = no rows.
const allRows = unstable_cache(async (): Promise<Record<string, StoredOffer[]>> => {
  if (niche.id !== "padel" || !process.env.DATABASE_URL) return {};
  const [{ sql }, { database }] = await Promise.all([import("drizzle-orm"), import("../db/data")]);
  const db = await database(), s = sql.raw(`"${niche.schema}"`);
  const res = await db.execute(sql`select p.slug, c.shop, c.url, c.price, c.currency, c.in_stock, c.checked_at from ${s}.creator_prices c
    join ${s}.rackets p on p.id = c.racket_id where c.status = 'live' and c.source like ${`${PADEL_SHOP_SOURCE}%`}`);
  return offersBySlug((Array.isArray(res) ? res : (res as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[]);
}, ["padel-shop-offers-v1"], { revalidate: 3600, tags: ["padel-shop-offers"] });

const safeRows = cache(async () => {
  try { return await allRows(); }
  catch (e) { console.error("[padel-offers] price read failed; Where to buy is empty", e); return {} as Record<string, StoredOffer[]>; }
});

/** Every racket's shown offers, by slug (the home cards). */
export async function padelOfferMap(): Promise<Record<string, ShopOffer[]>> {
  const rows = await safeRows(), now = Date.now();
  return Object.fromEntries(Object.entries(rows).map(([slug, xs]) => [slug, shopOffers(xs, now)]));
}
/** The racket's shown offers, or [] (no rows, all stale, or a site other than PadelRecs). */
export async function padelOffers(slug: string): Promise<ShopOffer[]> {
  return shopOffers((await safeRows())[slug] ?? []);
}

/** "Nov 23, 2026": the newest check among the rows. */
export function newestCheck(offers: ShopOffer[]): string | null {
  const d = offers.map(o => o.checked).sort().pop();
  return d ? new Date(time(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
}
