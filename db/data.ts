import { getDb } from "./index";
import { brands, rackets, reviews, externalReviews } from "./schema";
import { eq, desc } from "drizzle-orm";
export async function database() { return getDb(); }
export async function catalog(connection?:ReturnType<typeof getDb>) {
 const db = connection ?? await database();
 const [allBrands, allRackets, publicReviews, external] = await Promise.all([
 db.select().from(brands), db.select().from(rackets),
 db.select({id: reviews.id, racketId: reviews.racketId, rating: reviews.rating, reviewText: reviews.reviewText, alias: reviews.alias, playerLevel: reviews.playerLevel, playingSide: reviews.playingSide, playingStyle: reviews.playingStyle, timeWithRacket: reviews.timeWithRacket, createdAt: reviews.createdAt, powerRating: reviews.powerRating, controlRating: reviews.controlRating, maneuverabilityRating: reviews.maneuverabilityRating, comfortRating: reviews.comfortRating, forgivenessRating: reviews.forgivenessRating}).from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt)),
 db.select().from(externalReviews).orderBy(desc(externalReviews.createdAt))]);
 return { brands: allBrands, rackets: allRackets, reviews: publicReviews, external };
}
export type Catalog = Awaited<ReturnType<typeof catalog>>;
export function score(data: Catalog, id: string) { const rs = data.reviews.filter(r => r.racketId === id); return {count: rs.length, average: rs.length ? (rs.reduce((s,r) => s+r.rating,0)/rs.length).toFixed(1) : null}; }
