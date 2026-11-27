// A list row's right-column links (owner 2026-11-27): "See reviews ›" and "from $X · check price ↗", the same data for the
// creators home's "Top … right now" rows and the ranking lists (/rankings/<slug>). One server read per page render (ISR), sent
// with the rows, so the browser's re-ranking (quick match, filters) never fetches anything per row (instant filters rule).
// Prices: the creator pages' current offers (lib/thread/creator-home.ts rowExtras: lowest in-stock price, Amazon only while
// under 24h old, db/creator-reviews.ts); PadelRecs: its first in-stock padel shop (lib/padel-offers.ts, the Where to buy box).
// No price history, never in JSON-LD.
import { unstable_cache } from "next/cache";
import { niche } from "../../lib/niche";
import { creatorHome } from "../../lib/thread/creator-data";
import { rowExtras, type RowExtra } from "../../lib/thread/creator-home";
import { padelOfferMap } from "../../lib/padel-offers";
import { affiliateTag, amazonLink } from "../../lib/amazon";

type Row = { id: string; slug: string; href: string };
/** Ranking rows only: a product with no current price but a saved Amazon item gets a plain Amazon link with no price. */
export const AMAZON_FALLBACK_LABEL = "check price on Amazon ↗";

/** Saved Amazon items (rackets.amazon_asin) by product id; kept an hour in Next's data cache. No database = none. */
const savedAsins = unstable_cache(async (): Promise<Record<string, string>> => {
  if (!process.env.DATABASE_URL) return {};
  const [{ sql }, { database }] = await Promise.all([import("drizzle-orm"), import("../../db/data")]);
  const db = await database(), s = sql.raw(`"${niche.schema}"`);
  const res = await db.execute(sql`select id, amazon_asin from ${s}.rackets where amazon_asin is not null and amazon_asin <> ''`);
  const rows = (Array.isArray(res) ? res : (res as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[];
  return Object.fromEntries(rows.map(r => [String(r.id), String(r.amazon_asin)]));
}, [`saved-asins-${niche.id}-v1`], { revalidate: 3600 });

/** Pure: the Amazon fallback on rows without a price. */
export function withAmazonFallback(extra: Record<string, RowExtra>, asins: Record<string, string>, tag: string | null, marketplace?: string): Record<string, RowExtra> {
  if (!tag) return extra;
  return Object.fromEntries(Object.entries(extra).map(([id, x]) => {
    const asin = x.price ? null : asins[id];
    return [id, asin ? { ...x, price: { label: AMAZON_FALLBACK_LABEL, url: amazonLink(asin, tag, marketplace), rel: "sponsored nofollow noopener" } } : x];
  }));
}

/** Each row's links. `pills`: the home's praise-pill fallbacks; `amazonFallback`: the ranking lists' plain Amazon link. */
export async function rowLinks<R extends Row>(rows: R[], { pills = {}, hrefOf = (_s: string, h: string) => h, amazonFallback = false }:
  { pills?: Record<string, string>; hrefOf?: (slug: string, href: string) => string; amazonFallback?: boolean } = {}): Promise<Record<string, RowExtra>> {
  const home = await creatorHome(niche.id);
  const base = rowExtras(rows, home?.paddles ?? {}, pills, hrefOf);
  let extra = base;
  if (niche.id === "padel") {
    const shops = await padelOfferMap();
    extra = Object.fromEntries(rows.map(r => { const x = base[r.id]!, o = (shops[r.slug] ?? []).find(y => y.inStock);
      return [r.id, o ? { ...x, price: { label: `from ${o.price} · check price ↗`, url: o.href, rel: o.rel } } : x]; }));
  }
  if (!amazonFallback || !niche.amazon) return extra;
  const tag = affiliateTag() ?? null;
  if (!tag) return extra;
  let asins: Record<string, string> = {};
  try { asins = await savedAsins(); } catch (e) { console.error("[row-links] saved Amazon items read failed; no fallback links", e); }
  return withAmazonFallback(extra, asins, tag, niche.amazon.marketplace);
}
