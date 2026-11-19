// Thread comments (drizzle/0025, PadelRecs): light Q&A on racket, ranking and guide pages, one level of replies, ▲▼ votes.
// Auto-moderated with the review form's checks (lib/review-spam.ts): spam is rejected; a link or a very short comment waits as
// pending (kept, not shown); the rest shows at once.
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { comments, commentVotes } from "./schema";
import { spamScore } from "../lib/review-spam";

type Database = ReturnType<typeof getDb>;
export const COMMENTS_PER_HOUR = 20;
export const PAGE_KEY = /^(racket|ranking|guide):[A-Za-z0-9_-]{1,100}$/;
/** No tags (owner 2026-11-19): the is_question column stays in the table, unused (always false). */
export type ThreadComment = { id: string; parentId: string | null; alias: string; body: string; at: string; score: number; mine: number };

/** How a new comment is filed: rejected (spam), pending (held for a person: links, very short), or approved (shown). */
export function commentStatus(body: string, alias: string) {
  const s = spamScore({ reviewText: body, alias });
  return s.spam ? "rejected" as const : s.score > 0 ? "pending" as const : "approved" as const;
}

export async function listComments(db: Pick<Database, "select">, page: string, voter: string | null): Promise<ThreadComment[]> {
  const rows = await db.select().from(comments).where(and(eq(comments.page, page), eq(comments.status, "approved"))).orderBy(desc(comments.createdAt)).limit(300);
  if (!rows.length) return [];
  const ids = rows.map(r => r.id);
  const sums = await db.select({ id: commentVotes.commentId, s: sql<number>`coalesce(sum(${commentVotes.value}), 0)` }).from(commentVotes).where(inArray(commentVotes.commentId, ids)).groupBy(commentVotes.commentId);
  const mine = voter ? await db.select({ id: commentVotes.commentId, v: commentVotes.value }).from(commentVotes).where(and(inArray(commentVotes.commentId, ids), eq(commentVotes.voter, voter))) : [];
  const sum = new Map(sums.map(x => [x.id, Number(x.s)])), my = new Map(mine.map(x => [x.id, x.v]));
  // A reply shows only under a shown parent.
  const shown = new Set(rows.filter(r => !r.parentId).map(r => r.id));
  return rows.filter(r => !r.parentId || shown.has(r.parentId)).map(r => ({ id: r.id, parentId: r.parentId, alias: r.alias, body: r.body, at: r.createdAt, score: sum.get(r.id) ?? 0, mine: my.get(r.id) ?? 0 }));
}

/** Post a comment or reply. The author's own ▲ comes with it (owner 2026-11-19, like Reddit): it starts at 1, the author's
 *  arrow shows as up, and tapping it takes the vote back like any other. */
export async function addComment(db: Database, c: { page: string; parentId: string | null; alias: string; body: string; voter: string; network: string }, now = new Date()) {
  const [recent] = await db.select({ n: count() }).from(comments).where(and(eq(comments.network, c.network), gte(comments.createdAt, new Date(now.getTime() - 3_600_000).toISOString())));
  if (Number(recent.n) >= COMMENTS_PER_HOUR) return { status: "limited" as const };
  if (c.parentId) {
    const [parent] = await db.select({ page: comments.page, parentId: comments.parentId, status: comments.status }).from(comments).where(eq(comments.id, c.parentId));
    if (!parent || parent.page !== c.page || parent.parentId || parent.status !== "approved") return { status: "invalid" as const };
  }
  const status = commentStatus(c.body, c.alias), s = spamScore({ reviewText: c.body, alias: c.alias });
  const id = crypto.randomUUID(), at = now.toISOString();
  await db.insert(comments).values({ id, page: c.page, parentId: c.parentId, alias: c.alias, body: c.body, isQuestion: false, status, spamScore: s.score, voter: c.voter, network: c.network, createdAt: at });
  await db.insert(commentVotes).values({ commentId: id, voter: c.voter, value: 1, updatedAt: at });
  return { status, comment: { id, parentId: c.parentId, alias: c.alias, body: c.body, at, score: 1, mine: 1 } satisfies ThreadComment };
}

/** ▲ (1), ▼ (-1) or clear (0) this device's vote on a shown comment. */
export async function voteComment(db: Database, commentId: string, voter: string, value: -1 | 0 | 1, now = new Date()) {
  const [c] = await db.select({ status: comments.status }).from(comments).where(eq(comments.id, commentId));
  if (!c || c.status !== "approved") return false;
  if (value === 0) await db.delete(commentVotes).where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.voter, voter)));
  else await db.insert(commentVotes).values({ commentId, voter, value, updatedAt: now.toISOString() })
    .onConflictDoUpdate({ target: [commentVotes.commentId, commentVotes.voter], set: { value, updatedAt: now.toISOString() } });
  return true;
}

export type AdminComment = { id: string; page: string; parentId: string | null; alias: string; body: string; status: "pending" | "approved" | "rejected"; spamScore: number; at: string };
/** The admin's comment queue (app/funtimes?tab=comments): one status, newest first, with each status's total. */
export async function adminComments(db: Pick<Database, "select">, status: AdminComment["status"], limit = 50) {
  const [rows, totals] = await Promise.all([
    db.select().from(comments).where(eq(comments.status, status)).orderBy(desc(comments.createdAt)).limit(limit),
    db.select({ status: comments.status, n: count() }).from(comments).groupBy(comments.status),
  ]);
  return { rows: rows.map(r => ({ id: r.id, page: r.page, parentId: r.parentId, alias: r.alias, body: r.body, status: r.status, spamScore: r.spamScore, at: r.createdAt })) as AdminComment[],
    totals: Object.fromEntries(totals.map(t => [t.status, Number(t.n)])) as Partial<Record<AdminComment["status"], number>> };
}
/** Approve, reject or hold one comment. A reply waits with its parent: it shows only once the parent is approved. */
export async function setCommentStatus(db: Database, id: string, status: AdminComment["status"]) {
  const done = await db.update(comments).set({ status }).where(eq(comments.id, id)).returning({ id: comments.id });
  return done.length > 0;
}
