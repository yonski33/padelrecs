// The racket page's community cards (owner OK 2026-11-21): this week's new opinions (approved reviews + poll votes cast in the
// last 7 days) and posts (top-level Ask the community posts), and the newest question. Read when the
// page is built (ISR), so "this week" is as fresh as the page. None without a database (CI) or on a read error.
import { and, count, eq, gte } from "drizzle-orm";
import { database } from "../../db/data";
import { reviews, productVotes } from "../../db/schema";
import { listComments } from "../../db/comments";
import { commenterName } from "../../lib/thread/display-name";

export type LatestQuestion = { id: string; name: string; at: string; text: string };
export type Community = { opinions: number; posts: number; latest: LatestQuestion | null };
const WEEK = 7 * 24 * 60 * 60 * 1000;

export async function communityFor(id: string, now = Date.now()): Promise<Community> {
  const none = { opinions: 0, posts: 0, latest: null };
  if (!process.env.DATABASE_URL) return none;
  try {
    const db = await database(), since = new Date(now - WEEK).toISOString();
    const [[rv], [pv], cms] = await Promise.all([
      db.select({ n: count() }).from(reviews).where(and(eq(reviews.racketId, id), eq(reviews.status, "approved"), gte(reviews.createdAt, since))),
      db.select({ n: count() }).from(productVotes).where(and(eq(productVotes.racketId, id), gte(productVotes.createdAt, since))),
      listComments(db, `racket:${id}`, null),
    ]);
    const tops = cms.filter(c => !c.parentId && c.alias !== "[removed]"), top = tops[0];
    return {
      opinions: Number(rv?.n ?? 0) + Number(pv?.n ?? 0),
      posts: tops.filter(c => c.at >= since).length,
      latest: top ? { id: top.id, name: commenterName(top.alias), at: top.at, text: top.body } : null,
    };
  } catch (error) { console.error("[thread] community cards failed", error); return none; }
}
