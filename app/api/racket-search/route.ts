import { getDb } from "../../../db";
import { brands, rackets, reviews, externalReviews } from "../../../db/schema";
import { publicCatalogItems } from "../../../db/data";
import { amazonPhoto } from "../../../lib/amazon-photos";
import { shopPhoto } from "../../../lib/shop-photos";
import { asc, count, eq, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Only public catalog fields are sent to the browser; note counts include approved player reviews only.
  const db = getDb();
  const [list, playerCounts, webCounts, unapproved, brandList] = await Promise.all([
    db.select({ id: rackets.id, brandId: rackets.brandId, createdAt: rackets.createdAt, name: rackets.name, slug: rackets.slug, shape: rackets.shape, imageUrl: rackets.imageUrl, amazonAsin: rackets.amazonAsin, amazonImage: rackets.amazonImage }).from(rackets).orderBy(asc(rackets.name)),
    db.select({ racketId: reviews.racketId, n: count() }).from(reviews).where(eq(reviews.status, "approved")).groupBy(reviews.racketId),
    db.select({ racketId: externalReviews.racketId, n: count() }).from(externalReviews).groupBy(externalReviews.racketId),
    db.select({ racketId: reviews.racketId, createdAt: reviews.createdAt }).from(reviews).where(ne(reviews.status, "approved")),
    db.select({ id: brands.id, name: brands.name }).from(brands),
  ]);
  const brandName = new Map(brandList.map(b => [b.id, b.name]));
  const visible = publicCatalogItems([], list, playerCounts.map(c => c.racketId), webCounts.map(c => c.racketId), unapproved).rackets;
  const notes = new Map<string, number>();
  for (const { racketId, n } of [...playerCounts, ...webCounts]) notes.set(racketId, (notes.get(racketId) ?? 0) + Number(n));
  return Response.json(visible.map(r => ({ name: r.name, slug: r.slug, shape: r.shape, brand: brandName.get(r.brandId), notes: notes.get(r.id) ?? 0, photo: shopPhoto(r) ?? amazonPhoto(r)?.image ?? null })));
}
