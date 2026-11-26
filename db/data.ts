import { cache } from "react";
import { getDb } from "./index";
import { brands, rackets, reviews, externalReviews } from "./schema";
import { eq, ne, desc } from "drizzle-orm";
import { voteCounts } from "./votes";
import { isRecent, webDate, MIN_RECENT } from "../lib/recent";
import { tagTone } from "../lib/tags";
import { kept, forgetKept } from "./keep";
import { editStamp, bumpEditStamp } from "./edit-stamp";
import { sql } from "drizzle-orm";
import { niche } from "../lib/niche";
import { creatorPageOn } from "../lib/thread/sites";
import { shopPhoto } from "../lib/shop-photos";
import { amazonPhoto } from "../lib/amazon-photos";
import { padelReadyIds } from "../lib/thread/padel-ready";
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

// Kept in this server instance's memory between requests (db/keep.ts). Scripts pass their own connection and always read fresh.
const kept_ = kept(() => loadCatalog(), Date.now, editStamp);
/** Drops this instance's kept copies (the catalog and everything built from it), so the next page reads fresh (after an
 *  admin publish or edit: app/funtimes/auth.ts), and marks the edit for every other instance (db/edit-stamp.ts). */
export function forgetCatalog() { forgetKept(); bumpEditStamp(); }
// Cached per request too: the layout reads it for the header's rankings menu, and so does the page.
/** Sites where a product needs a photo to be listed (catalogue, sitemap, brand pages, rankings, similar lists). */
const PHOTO_TO_LIST = new Set(["pickleball"]);
export const catalog = cache(async function catalog(connection?:ReturnType<typeof getDb>) {
 return connection ? loadCatalog(connection) : kept_.get();
});

async function loadCatalog(connection?:ReturnType<typeof getDb>) {
 const db = connection ?? await database();
 const [allBrands, allRackets, publicReviews, external, unapproved, votes, creatorIds] = await Promise.all([
 db.select().from(brands), db.select().from(rackets),
 db.select({id: reviews.id, racketId: reviews.racketId, rating: reviews.rating, reviewText: reviews.reviewText, alias: reviews.alias, playerLevel: reviews.playerLevel, playingSide: reviews.playingSide, playingStyle: reviews.playingStyle, timeWithRacket: reviews.timeWithRacket, createdAt: reviews.createdAt, powerRating: reviews.powerRating, controlRating: reviews.controlRating, maneuverabilityRating: reviews.maneuverabilityRating, comfortRating: reviews.comfortRating, forgivenessRating: reviews.forgivenessRating, variant: reviews.variant, tags: reviews.tags, highlights: reviews.highlights}).from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt)),
 db.select().from(externalReviews).orderBy(desc(externalReviews.createdAt)),
 db.select({racketId: reviews.racketId, createdAt: reviews.createdAt}).from(reviews).where(ne(reviews.status, "approved")),
 voteCounts(db), creatorBacked(db)]);
 // PadelRecs: its thin-racket counts (creator reviewers and votes), read only on padel.
 const padelExtra = niche.id === "padel" ? await padelCounts(db) : null;
 const visible = publicCatalogItems(allBrands, allRackets, publicReviews.map(r => r.racketId), external.map(e => e.racketId), unapproved);
 // Listings (catalogue, type and brand pages, sidebar, sitemap) only show products somebody has reviewed. Every visible
 // product still has its page and can be picked when adding a review, so `rackets` stays the full list for lookups.
 // On creator-page sites a live creator page also lists the product: PickleballRecs' 26 popular paddles
 // came in with creator reviews only and were missing from the sitemap, catalogue, brand pages and search (2026-11-24).
 const reviewed = new Set([...publicReviews.map(r => r.racketId), ...external.map(e => e.racketId), ...creatorIds]);
 // PickleballRecs (owner rule, Grok audit 2026-11-24: "publish with a photo, or keep them out of the sitemap, rankings and
 // similar lists"; never noindex): a paddle without a photo is not listed. Its page still works and it lists itself once a
 // photo is saved.
 const photoOk = (r: typeof allRackets[number]) => !PHOTO_TO_LIST.has(niche.id) || !!(shopPhoto(r) ?? amazonPhoto(r)?.image);
 // PadelRecs (owner 2026-11-26, lib/thread/padel-ready.ts): a racket with fewer than 3 reviews and fewer than 3 votes is not
 // listed either, unless it was added in the last 30 days. Its page still works; it lists itself once it passes either bar.
 const padelOk = padelExtra ? padelReadyOf(visible.rackets, publicReviews, external, padelExtra) : null;
 const listed = visible.rackets.filter(r => reviewed.has(r.id) && photoOk(r) && (!padelOk || padelOk.has(r.id)));
 const listedBrands = visible.brands.filter(b => listed.some(r => r.brandId === b.id));
 return { brands: visible.brands, rackets: visible.rackets, listed, listedBrands, creatorIds, padelReady: padelOk,
  reviews: publicReviews.map(r => ({ ...r, helpful: votes.get(`player:${r.id}`) ?? 0 })),
  external: external.map(e => ({ ...e, helpful: votes.get(`web:${e.id}`) ?? 0 })) };
}
export type Catalog = Awaited<ReturnType<typeof catalog>>;
/** PadelRecs' per-racket creator reviewers and votes (quick votes + distinct "How does it play?" voters); empty maps when a
 *  table can't be read, so the catalogue never fails over them. */
async function padelCounts(db: ReturnType<typeof getDb>) {
 const rows = async (q: ReturnType<typeof sql>) => { try { const r = await db.execute(q);
   return ((Array.isArray(r) ? r : (r as { rows?: unknown[] }).rows ?? []) as { id: unknown; n: unknown }[]).map(x => [String(x.id), Number(x.n)] as const); } catch { return []; } };
 const s = sql.raw(`"${niche.schema}"`);
 const [creators, quick, trait] = await Promise.all([
  rows(sql`select racket_id as id, count(distinct creator) as n from ${s}.creator_reviews where status = 'live' group by racket_id`),
  rows(sql`select racket_id as id, count(*) as n from ${s}.product_votes group by racket_id`),
  rows(sql`select racket_id as id, count(distinct voter) as n from ${s}.trait_votes group by racket_id`)]);
 return { creators: new Map(creators), quick: new Map(quick), trait: new Map(trait) };
}
/** The PadelRecs ids ready to list (lib/thread/padel-ready.ts), from the catalogue's reviews and the counts above. */
export function padelReadyOf(items: { id: string; createdAt: string }[], playerReviews: { racketId: string }[], web: { racketId: string }[],
 extra: { creators: Map<string, number>; quick: Map<string, number>; trait: Map<string, number> }, now = Date.now()) {
 const reviews = new Map<string, number>(extra.creators), votes = new Map<string, number>();
 for (const x of [...playerReviews, ...web]) reviews.set(x.racketId, (reviews.get(x.racketId) ?? 0) + 1);
 for (const m of [extra.quick, extra.trait]) for (const [id, n] of m) votes.set(id, (votes.get(id) ?? 0) + n);
 return padelReadyIds(items, { reviews, votes }, now);
}
/** The products with a live creator page (db/creator-reviews.ts tables), on sites with the creator page switch on; none
 *  where the tables don't exist yet or can't be read, so the catalogue never fails over them. */
async function creatorBacked(db: ReturnType<typeof getDb>): Promise<string[]> {
 if (!creatorPageOn(niche.id) || !/^[a-z_][a-z0-9_]*$/.test(niche.schema)) return [];
 try {
  const r = await db.execute(sql`select racket_id from ${sql.raw(`"${niche.schema}"`)}.creator_pages where status = 'live'`);
  return ((Array.isArray(r) ? r : (r as { rows?: unknown[] }).rows ?? []) as { racket_id: unknown }[]).map(x => String(x.racket_id));
 } catch { return []; }
}
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
