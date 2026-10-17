import { getDb } from "../../../db";
import { rackets, reviews, externalReviews } from "../../../db/schema";
import { publicCatalogItems } from "../../../db/data";
import { asc, count, eq, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Only public catalog fields are sent to the browser; note counts include approved player reviews only.
  const db = getDb();
  const [list, playerCounts, webCounts, unapproved] = await Promise.all([
    db.select({ id: rackets.id, brandId: rackets.brandId, createdAt: rackets.createdAt, name: rackets.name, slug: rackets.slug, shape: rackets.shape }).from(rackets).orderBy(asc(rackets.name)),
    db.select({ racketId: reviews.racketId, n: count() }).from(reviews).where(eq(reviews.status, "approved")).groupBy(reviews.racketId),
    db.select({ racketId: externalReviews.racketId, n: count() }).from(externalReviews).groupBy(externalReviews.racketId),
    db.select({ racketId: reviews.racketId, createdAt: reviews.createdAt }).from(reviews).where(ne(reviews.status, "approved")),
  ]);
  const visible = publicCatalogItems([], list, playerCounts.map(c => c.racketId), webCounts.map(c => c.racketId), unapproved).rackets;
  const notes = new Map<string, number>();
  for (const { racketId, n } of [...playerCounts, ...webCounts]) notes.set(racketId, (notes.get(racketId) ?? 0) + Number(n));
  return Response.json(visible.map(({ id, name, slug, shape }) => ({ name, slug, shape, notes: notes.get(id) ?? 0 })));
}
