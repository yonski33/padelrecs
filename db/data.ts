import { getDb } from "./index";
import { brands, rackets, reviews, externalReviews } from "./schema";
import { eq, ne, desc } from "drizzle-orm";
import { voteCounts } from "./votes";
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

export async function catalog(connection?:ReturnType<typeof getDb>) {
 const db = connection ?? await database();
 const [allBrands, allRackets, publicReviews, external, unapproved, votes] = await Promise.all([
 db.select().from(brands), db.select().from(rackets),
 db.select({id: reviews.id, racketId: reviews.racketId, rating: reviews.rating, reviewText: reviews.reviewText, alias: reviews.alias, playerLevel: reviews.playerLevel, playingSide: reviews.playingSide, playingStyle: reviews.playingStyle, timeWithRacket: reviews.timeWithRacket, createdAt: reviews.createdAt, powerRating: reviews.powerRating, controlRating: reviews.controlRating, maneuverabilityRating: reviews.maneuverabilityRating, comfortRating: reviews.comfortRating, forgivenessRating: reviews.forgivenessRating, tags: reviews.tags}).from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt)),
 db.select().from(externalReviews).orderBy(desc(externalReviews.createdAt)),
 db.select({racketId: reviews.racketId, createdAt: reviews.createdAt}).from(reviews).where(ne(reviews.status, "approved")),
 voteCounts(db)]);
 const visible = publicCatalogItems(allBrands, allRackets, publicReviews.map(r => r.racketId), external.map(e => e.racketId), unapproved);
 return { brands: visible.brands, rackets: visible.rackets,
  reviews: publicReviews.map(r => ({ ...r, helpful: votes.get(`player:${r.id}`) ?? 0 })),
  external: external.map(e => ({ ...e, helpful: votes.get(`web:${e.id}`) ?? 0 })) };
}
export type Catalog = Awaited<ReturnType<typeof catalog>>;
export function score(data: Catalog, id: string) {
 const rs = data.reviews.filter(r => r.racketId === id), web = data.external.filter(e => e.racketId === id);
 const judged = web.filter(e => e.sentiment).length, positive = web.filter(e => e.sentiment === "positive").length;
 return {count: rs.length, average: rs.length ? (rs.reduce((s,r) => s+r.rating,0)/rs.length).toFixed(1) : null, web: web.length, judged, positive};
}
export type Score = ReturnType<typeof score>;
