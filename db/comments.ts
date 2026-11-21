// Thread comments (drizzle/0025, PadelRecs): light Q&A on racket, ranking and guide pages, one level of replies, ▲▼ votes.
// Auto-moderated with the review form's checks (lib/review-spam.ts): spam is rejected; a link or a very short comment waits as
// pending (kept, not shown); the rest shows at once.
import { and, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { comments, commentVotes } from "./schema";
import { spamScore } from "../lib/review-spam";
import { nameProblem } from "../lib/thread/display-name";

type Database = ReturnType<typeof getDb>;
export const COMMENTS_PER_HOUR = 20;
export const PAGE_KEY = /^(racket|ranking|guide|story):[A-Za-z0-9_-]{1,100}$/;
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

/** Every shown comment on the racket pages, newest first, with its ▲▼ total: the home's "Latest questions" and /questions
 *  (owner 2026-11-21). Read only; replies show only under a shown parent, as on the page. */
export type SiteComment = { id: string; page: string; parentId: string | null; alias: string; body: string; at: string; score: number };
export async function racketComments(db: Pick<Database, "select">, limit = 2000): Promise<SiteComment[]> {
  const rows = await db.select().from(comments).where(and(ilike(comments.page, "racket:%"), eq(comments.status, "approved"))).orderBy(desc(comments.createdAt)).limit(limit);
  if (!rows.length) return [];
  const sums = await db.select({ id: commentVotes.commentId, s: sql<number>`coalesce(sum(${commentVotes.value}), 0)` }).from(commentVotes)
    .where(inArray(commentVotes.commentId, rows.map(r => r.id))).groupBy(commentVotes.commentId);
  const sum = new Map(sums.map(x => [x.id, Number(x.s)])), shown = new Set(rows.filter(r => !r.parentId).map(r => r.id));
  return rows.filter(r => !r.parentId || shown.has(r.parentId))
    .map(r => ({ id: r.id, page: r.page, parentId: r.parentId, alias: r.alias, body: r.body, at: r.createdAt, score: sum.get(r.id) ?? 0 }));
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

/** A post's optional type (drizzle/0035, PadelRecs community feed, owner OK 2026-11-21): a question or a tip; null for a
 *  plain post and for every row from before it. Read and written with plain SQL and kept out of the shared table definition
 *  on purpose: only schemas that ran 0035 have the column, and a missing column there must never break a select() of the
 *  table. Both helpers are quiet no-ops where the column is missing (Postgres 42703). */
export type PostType = "question" | "tip";
const noColumn = (e: unknown) => /42703|column .* does not exist/.test(String((e as { code?: string })?.code ?? "") + String((e as Error)?.message ?? e) + String((e as { cause?: { code?: string } })?.cause?.code ?? ""));
export async function setPostType(db: Pick<Database, "execute">, id: string, type: PostType) {
  try { await db.execute(sql`update ${comments} set "post_type" = ${type} where ${comments.id} = ${id}`); return true; }
  catch (error) { if (!noColumn(error)) console.error("Post type save failed", error); return false; }
}
export async function postTypes(db: Pick<Database, "execute">, ids: string[]): Promise<Map<string, PostType>> {
  if (!ids.length) return new Map();
  try {
    const rows = await db.execute(sql`select ${comments.id} as id, "post_type" as t from ${comments} where ${inArray(comments.id, ids)} and "post_type" is not null`);
    // node-postgres (the app's client, db/index.ts) answers { rows }; postgres-js (the scripts') an array. Read either.
    const list = (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? []) as { id: string; t: PostType }[];
    return new Map(list.filter(r => r.t === "question" || r.t === "tip").map(r => [r.id, r.t]));
  } catch (error) { if (!noColumn(error)) console.error("Post types read failed", error); return new Map(); }
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
/** The admin's comment list (app/funtimes?tab=comments): one status (or "all"), newest first, with each status's total.
 *  `page` narrows it to one page ("racket:<id>"), `q` to comments whose text or name has those words. */
export async function adminComments(db: Pick<Database, "select">, status: AdminComment["status"] | "all", limit = 50, find: { page?: string | null; q?: string | null } = {}) {
  const words = (find.q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  const where = and(status === "all" ? undefined : eq(comments.status, status), find.page ? eq(comments.page, find.page) : undefined,
    ...words.map(w => or(ilike(comments.body, `%${w.replace(/[%_\\]/g, m => `\\${m}`)}%`), ilike(comments.alias, `%${w.replace(/[%_\\]/g, m => `\\${m}`)}%`))));
  const [rows, totals] = await Promise.all([
    db.select().from(comments).where(where).orderBy(desc(comments.createdAt)).limit(limit),
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

/** The text a deleted comment with replies keeps, so its replies stay readable under it. */
export const REMOVED = "[removed]";
/** Owner edit (admin Comments tab): new text, the same author, time, status and votes. No public "edited" mark. */
/** Owner edit (admin Comments tab, the page's own Edit): new text, a new name (abuse cases, the same name rules as posting,
 *  lib/thread/display-name.ts), or both. The time, status and votes stay. */
export async function editComment(db: Database, id: string, change: string | { body?: string | null; alias?: string | null }) {
  const c = typeof change === "string" ? { body: change } : change;
  const set: { body?: string; alias?: string } = {};
  if (c.body != null) { const text = c.body.trim(); if (text.length < 2 || text.length > 2000) return "invalid" as const; set.body = text; }
  if (c.alias != null) { if (nameProblem(c.alias)) return "invalid" as const; set.alias = c.alias.trim(); }
  if (!set.body && !set.alias) return "invalid" as const;
  return (await db.update(comments).set(set).where(eq(comments.id, id)).returning({ id: comments.id })).length ? "ok" as const : "missing" as const;
}
/** Owner delete: a comment with replies becomes "[removed]" (name and text) so the replies stay; one with none goes, with its
 *  votes (comment_votes cascade). */
export async function deleteComment(db: Database, id: string) {
  const [c] = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id));
  if (!c) return "missing" as const;
  const [kids] = await db.select({ n: count() }).from(comments).where(eq(comments.parentId, id));
  if (Number(kids.n) > 0) { await db.update(comments).set({ body: REMOVED, alias: REMOVED }).where(eq(comments.id, id)); return "removed" as const; }
  await db.delete(comments).where(eq(comments.id, id));
  return "deleted" as const;
}
