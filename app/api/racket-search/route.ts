import { getDb } from "../../../db";
import { brands, rackets, reviews, externalReviews } from "../../../db/schema";
import { publicCatalogItems } from "../../../db/data";
import { amazonPhoto } from "../../../lib/amazon-photos";
import { shopPhoto } from "../../../lib/shop-photos";
import { asc, count, eq, ne } from "drizzle-orm";
import { productSignals } from "../../signals";
import { familyRowIds } from "../../../lib/compare-pairs";
import { MIN_FIT_REPORTS } from "../../../lib/fit-verdict";
import { v3Site } from "../../../lib/thread/sites";
import { niche } from "../../../lib/niche";

// The same for every visitor: cached and refreshed with the pages (owner 2026-11-16, Vercel cost: it ran 5 queries on every
// search box opened). A build without a database (CI) builds an empty index.
export const revalidate = 21600;

export async function GET() {
  if (!process.env.DATABASE_URL) return Response.json([]);
  // Only public catalog fields are sent to the browser; note counts include approved player reviews only.
  const db = getDb();
  const [list, playerCounts, webCounts, unapproved, brandList] = await Promise.all([
    db.select({ id: rackets.id, brandId: rackets.brandId, createdAt: rackets.createdAt, name: rackets.name, slug: rackets.slug, year: rackets.year, shape: rackets.shape, imageUrl: rackets.imageUrl, amazonAsin: rackets.amazonAsin, amazonImage: rackets.amazonImage }).from(rackets).orderBy(asc(rackets.name)),
    db.select({ racketId: reviews.racketId, n: count() }).from(reviews).where(eq(reviews.status, "approved")).groupBy(reviews.racketId),
    db.select({ racketId: externalReviews.racketId, n: count() }).from(externalReviews).groupBy(externalReviews.racketId),
    db.select({ racketId: reviews.racketId, createdAt: reviews.createdAt }).from(reviews).where(ne(reviews.status, "approved")),
    db.select({ id: brands.id, name: brands.name }).from(brands),
  ]);
  const brandName = new Map(brandList.map(b => [b.id, b.name]));
  const visible = publicCatalogItems([], list, playerCounts.map(c => c.racketId), webCounts.map(c => c.racketId), unapproved).rackets;
  const notes = new Map<string, number>();
  for (const { racketId, n } of [...playerCounts, ...webCounts]) notes.set(racketId, (notes.get(racketId) ?? 0) + Number(n));
  // Thread's extras: the Player score (app/signals.ts) and one current row per model (the catalog's rule, MIN_FIT_REPORTS).
  // The v3 sites (padel, audio, sim racing) show no score, so they don't get one (and skip the score read).
  const noScore = v3Site(niche.id);
  const [sig, current] = [noScore ? new Map<string, { signal: number }>() : await productSignals().catch(() => new Map<string, { signal: number }>()), familyRowIds(visible, r => (notes.get(r.id) ?? 0) >= MIN_FIT_REPORTS)];
  return Response.json(visible.map(r => ({ name: r.name, slug: r.slug, shape: r.shape, brand: brandName.get(r.brandId), notes: notes.get(r.id) ?? 0, photo: shopPhoto(r) ?? amazonPhoto(r)?.image ?? null,
    year: r.year, ...(noScore ? {} : { score: sig.get(r.id)?.signal ?? null }), current: current.has(r.id) })));
}
