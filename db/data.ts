import { cache } from "react";
import { getDb } from "./index";
import { brands, rackets, reviews, externalReviews } from "./schema";
import { eq, ne, desc } from "drizzle-orm";
import { voteCounts } from "./votes";
import { isRecent, webDate, MIN_RECENT } from "../lib/recent";
import { tagTone } from "../lib/tags";
export async function database() { return getDb(); }

type RacketRef = { id: string; brandId: string; createdAt: string };
type BrandRef = { id: string };
/**
 * Rackets added by a public submission stay out of public pages until a review for them is approved.
 * A submitted racket is saved with its review's createdAt (db/racket-selection.ts), which is how it is recognised:
 * no approved review, no web excerpt, and a non-approved review created at the same moment as the racket.
 * Brands are hidden only when every racket they have is hidden.
 */
export function publicCatalogItems<R extends RacketRef, B extends BrandRef>(allBrands: B[], allRackets: R[], approvedRacketIds: Iterable<string>, externalRacketIds: Iterable<string>, unapproved: {racketId: string; createdAt: string}[]) {
 const backed = new Set([...approvedRacketIds, ...externalRacketIds]);
 const submittedWith = new Set(unapproved.map(r => `${r.racketId}|${r.createdAt}`));
 const hidden = new Set(allRackets.filter(r => !backed.has(r.id) && submittedWith.has(`${r.id}|${r.createdAt}`)).map(r => r.id));
 const visibleRackets = allRackets.filter(r => !hidden.has(r.id));
 const visibleBrands = allBrands.filter(b => !allRackets.some(r => r.brandId === b.id) || visibleRackets.some(r => r.brandId === b.id));
 return { brands: visibleBrands, rackets: visibleRackets };
}

// Kept in this server instance's memory between requests (owner, 2026-11-12: cache misses took 5–25 s because every
// page, even /contact, reloaded every review for the header's rankings menu). A copy younger than FRESH_MS is used as
// is; an older one is still served at once while a fresh load runs in the background, up to STALE_MS. Pages are cached
// at the edge anyway, so new reviews show within a couple of minutes, as before. Scripts pass their own connection
// and always read fresh.
const FRESH_MS = 2 * 60_000, STALE_MS = 30 * 60_000;
type Loaded = Awaited<ReturnType<typeof loadCatalog>>;
let memo: { at: number; value: Promise<Loaded>; refreshing?: boolean } | null = null;
function remembered(): Promise<Loaded> {
 const now = Date.now();
 if (memo && (now - memo.at < FRESH_MS || (memo.refreshing && now - memo.at < STALE_MS))) return memo.value;
 if (memo && now - memo.at < STALE_MS) {
  // Serve the copy we have, refresh behind it; a failed refresh keeps the old copy for the next try.
  const current = memo; current.refreshing = true;
  loadCatalog().then(fresh => { memo = { at: Date.now(), value: Promise.resolve(fresh) }; }, () => { current.refreshing = false; });
  return current.value;
 }
 const value = loadCatalog();
 memo = { at: now, value };
 value.catch(() => { if (memo?.value === value) memo = null; });
 return value;
}
// Cached per request too: the layout reads it for the header's rankings menu, and so does the page.
export const catalog = cache(async function catalog(connection?:ReturnType<typeof getDb>) {
 return connection ? loadCatalog(connection) : remembered();
});

async function loadCatalog(connection?:ReturnType<typeof getDb>) {
 const db = connection ?? await database();
 const [allBrands, allRackets, publicReviews, external, unapproved, votes] = await Promise.all([
 db.select().from(brands), db.select().from(rackets),
 db.select({id: reviews.id, racketId: reviews.racketId, rating: reviews.rating, reviewText: reviews.reviewText, alias: reviews.alias, playerLevel: reviews.playerLevel, playingSide: reviews.playingSide, playingStyle: reviews.playingStyle, timeWithRacket: reviews.timeWithRacket, createdAt: reviews.createdAt, powerRating: reviews.powerRating, controlRating: reviews.controlRating, maneuverabilityRating: reviews.maneuverabilityRating, comfortRating: reviews.comfortRating, forgivenessRating: reviews.forgivenessRating, variant: reviews.variant, tags: reviews.tags}).from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt)),
 db.select().from(externalReviews).orderBy(desc(externalReviews.createdAt)),
 db.select({racketId: reviews.racketId, createdAt: reviews.createdAt}).from(reviews).where(ne(reviews.status, "approved")),
 voteCounts(db)]);
 const visible = publicCatalogItems(allBrands, allRackets, publicReviews.map(r => r.racketId), external.map(e => e.racketId), unapproved);
 // Listings (catalogue, type and brand pages, sidebar, sitemap) only show products somebody has reviewed. Every visible
 // product still has its page and can be picked when adding a review, so `rackets` stays the full list for lookups.
 const reviewed = new Set([...publicReviews.map(r => r.racketId), ...external.map(e => e.racketId)]);
 const listed = visible.rackets.filter(r => reviewed.has(r.id));
 const listedBrands = visible.brands.filter(b => listed.some(r => r.brandId === b.id));
 return { brands: visible.brands, rackets: visible.rackets, listed, listedBrands,
  reviews: publicReviews.map(r => ({ ...r, helpful: votes.get(`player:${r.id}`) ?? 0 })),
  external: external.map(e => ({ ...e, helpful: votes.get(`web:${e.id}`) ?? 0 })) };
}
export type Catalog = Awaited<ReturnType<typeof catalog>>;
/** The star average shows only from this many user ratings; below it one or two ratings would read as the verdict. */
export const MIN_RATINGS = 3;
/** User ratings and judged web reviews together: a user review counts as positive at 4–5 stars, like the rankings
 *  (lib/top-lists.ts ratingVerdict). The star average stays user-only, and only from MIN_RATINGS ratings. */
export function score(data: Catalog, id: string) {
 const rs = data.reviews.filter(r => r.racketId === id), web = data.external.filter(e => e.racketId === id);
 // One count everywhere (owner, 2026-11-12, UX audit): every published review with a clear verdict, the same reviews the
 // product page's Positive / Mixed / Negative tabs list. It used to count only the recent window, so the bar said 84% of
 // 68 while the tabs listed 141 positive of 189.
 const [jr, jw] = [rs, web];
 const judged = jr.length + jw.filter(e => e.sentiment).length, positive = jr.filter(r => r.rating >= 4).length + jw.filter(e => e.sentiment === "positive").length;
 const mixed = jr.filter(r => r.rating === 3).length + jw.filter(e => e.sentiment === "mixed").length;
 return {count: rs.length, average: rs.length >= MIN_RATINGS ? (rs.reduce((s,r) => s+r.rating,0)/rs.length).toFixed(1) : null, web: web.length, judged, positive, mixed, negative: judged - positive - mixed};
}
export type Score = ReturnType<typeof score>;

/** Each product's most-mentioned praise and complaint, for catalogue rows: the same reviews as its score (the recent
 *  window, or every review when too few are recent), and only tags at least two reviews share. One pass over the catalog. */
export function topTags(data: Catalog) {
 const byProduct = new Map<string, { recent: { tags: string[] }[]; all: { tags: string[] }[]; judged: number }>();
 const add = (id: string, x: { tags: string[] }, recent: boolean, judged: boolean) => {
  const p = byProduct.get(id) ?? { recent: [], all: [], judged: 0 }; byProduct.set(id, p);
  p.all.push(x); if (recent) { p.recent.push(x); if (judged) p.judged++; }
 };
 for (const r of data.reviews) add(r.racketId, r, isRecent(r.createdAt), true);
 for (const e of data.external) add(e.racketId, e, isRecent(webDate(e)), !!e.sentiment);
 const top = new Map<string, { loved?: string; complaint?: string }>();
 for (const [id, p] of byProduct) {
  const counts = new Map<string, number>();
  for (const t of (p.judged >= MIN_RECENT ? p.recent : p.all).flatMap(x => x.tags)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const best = (tone: string) => [...counts].filter(([t, n]) => n >= 2 && tagTone(t) === tone).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  top.set(id, { loved: best("pos"), complaint: best("neg") });
 }
 return top;
}
