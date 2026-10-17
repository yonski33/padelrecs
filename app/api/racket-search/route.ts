import { getDb } from "../../../db";
import { rackets, reviews, externalReviews } from "../../../db/schema";
import { asc, count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Only public catalog fields are sent to the browser; note counts include approved player reviews only.
  const db = getDb();
  const [list, playerCounts, webCounts] = await Promise.all([
    db.select({ id: rackets.id, name: rackets.name, slug: rackets.slug, shape: rackets.shape }).from(rackets).orderBy(asc(rackets.name)),
    db.select({ racketId: reviews.racketId, n: count() }).from(reviews).where(eq(reviews.status, "approved")).groupBy(reviews.racketId),
    db.select({ racketId: externalReviews.racketId, n: count() }).from(externalReviews).groupBy(externalReviews.racketId),
  ]);
  const notes = new Map<string, number>();
  for (const { racketId, n } of [...playerCounts, ...webCounts]) notes.set(racketId, (notes.get(racketId) ?? 0) + Number(n));
  return Response.json(list.map(({ id, ...r }) => ({ ...r, notes: notes.get(id) ?? 0 })));
}
