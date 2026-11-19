// The pending player reviews of one racket, for the owner's box on the Thread racket page (app/thread/live/review-admin.tsx).
// Admin only (session checked on the server), never cached, on the private /api/funtimes path. Read only: approving,
// editing and deleting go through the existing review routes (reviews, review-quick, delete-rejected).
import { and, desc, eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { reviews } from "../../../../db/schema";
import { isAdmin } from "../../../funtimes/auth";

const json = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: Request) {
  if (!(await isAdmin().catch(() => false))) return json({ error: "Admin access required." }, 403);
  const racketId = new URL(request.url).searchParams.get("racket");
  if (!racketId || racketId.length > 100) return json({ error: "Which racket?" }, 400);
  try {
    const rows = await (await database()).select({ id: reviews.id, alias: reviews.alias, rating: reviews.rating, text: reviews.reviewText, tags: reviews.tags, level: reviews.playerLevel, at: reviews.createdAt })
      .from(reviews).where(and(eq(reviews.racketId, racketId), eq(reviews.status, "pending"))).orderBy(desc(reviews.createdAt)).limit(50);
    return json({ pending: rows });
  } catch { return json({ error: "Could not load the pending reviews." }, 500); }
}
