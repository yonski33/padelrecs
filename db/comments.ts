// Thread comments (drizzle/0025, PadelRecs): light Q&A on racket, ranking and guide pages, one level of replies, ▲▼ votes.
// Auto-moderated with the review form's checks (lib/review-spam.ts): spam is rejected; a link or a very short comment waits as
// pending (kept, not shown); the rest shows at once.
import { and, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { comments, commentVotes } from "./schema";
import { spamScore } from "../lib/review-spam";
import { postProblem, typedName } from "../lib/thread/display-name";

type Database = ReturnType<typeof getDb>;
export const COMMENTS_PER_HOUR = 20;
export const PAGE_KEY = /^(racket|ranking|guide):[A-Za-z0-9_-]{1,100}$/;
/** No tags (owner 2026-11-19): the is_question column stays in the table, unused (always false). */
export type ThreadComment = { id: string; parentId: string | null; alias: string; /** Level and side the commenter picked, or null. */ level: string | null; side: string | null;
  body: string; at: string; score: number; mine: number };

/** How a new comment is filed: rejected (spam), pending (held for a person: links, very short), or approved (shown). */
export function commentStatus(body: string, alias: string) {
  const s = spamScore({ reviewText: body, alias });
  return s.spam ? "rejected" as const : s.score > 0 ? "pending" as const : "approved" as const;
}

// Level and side (drizzle/0028) are read and written only when the columns exist, so comments keep working in the gap between
// this code going live and the migration running: a missing column (Postgres 42703) falls back to the columns 0025 made.
const BASE = { id: comments.id, page: comments.page, parentId: comments.parentId, alias: comments.alias, body: comments.body, isQuestion: comments.isQuestion,
  status: comments.status, spamScore: comments.spamScore, voter: comments.voter, network: comments.network, createdAt: comments.createdAt };
const PROFILE = { playerLevel: comments.playerLevel, playingSide: comments.playingSide };
const noColumn = (e: unknown): boolean => { const x = e as { code?: string; message?: string; cause?: unknown } | null;
  return !!x && (x.code === "42703" || /column .* does not exist/i.test(x.message ?? "") || (!!x.cause && noColumn(x.cause))); };
async function withProfile<T>(full: () => Promise<T>, base: () => Promise<T>): Promise<T> {
  try { return await full(); } catch (e) { if (noColumn(e)) return base(); throw e; }
}

export async function listComments(db: Pick<Database, "select">, page: string, voter: string | null): Promise<ThreadComment[]> {
  const where = and(eq(comments.page, page), eq(comments.status, "approved"));
  const rows: { id: string; parentId: string | null; alias: string; body: string; createdAt: string; playerLevel?: string | null; playingSide?: string | null }[] = await withProfile(
    () => db.select({ ...BASE, ...PROFILE }).from(comments).where(where).orderBy(desc(comments.createdAt)).limit(300),
    () => db.select(BASE).from(comments).where(where).orderBy(desc(comments.createdAt)).limit(300));
  if (!rows.length) return [];
  const ids = rows.map(r => r.id);
  const sums = await db.select({ id: commentVotes.commentId, s: sql<number>`coalesce(sum(${commentVotes.value}), 0)` }).from(commentVotes).where(inArray(commentVotes.commentId, ids)).groupBy(commentVotes.commentId);
  const mine = voter ? await db.select({ id: commentVotes.commentId, v: commentVotes.value }).from(commentVotes).where(and(inArray(commentVotes.commentId, ids), eq(commentVotes.voter, voter))) : [];
  const sum = new Map(sums.map(x => [x.id, Number(x.s)])), my = new Map(mine.map(x => [x.id, x.v]));
  // A reply shows only under a shown parent.
  const shown = new Set(rows.filter(r => !r.parentId).map(r => r.id));
  return rows.filter(r => !r.parentId || shown.has(r.parentId)).map(r => ({ id: r.id, parentId: r.parentId, alias: r.alias, level: r.playerLevel ?? null, side: r.playingSide ?? null, body: r.body, at: r.createdAt, score: sum.get(r.id) ?? 0, mine: my.get(r.id) ?? 0 }));
}

/** Post a comment or reply. The author's own ▲ comes with it (owner 2026-11-19, like Reddit): it starts at 1, the author's
 *  arrow shows as up, and tapping it takes the vote back like any other. */
export async function addComment(db: Database, c: { page: string; parentId: string | null; alias: string; level?: string | null; side?: string | null; body: string; voter: string; network: string }, now = new Date()) {
  const [recent] = await db.select({ n: count() }).from(comments).where(and(eq(comments.network, c.network), gte(comments.createdAt, new Date(now.getTime() - 3_600_000).toISOString())));
  if (Number(recent.n) >= COMMENTS_PER_HOUR) return { status: "limited" as const };
  if (c.parentId) {
    const [parent] = await db.select({ page: comments.page, parentId: comments.parentId, status: comments.status }).from(comments).where(eq(comments.id, c.parentId));
    if (!parent || parent.page !== c.page || parent.parentId || parent.status !== "approved") return { status: "invalid" as const };
  }
  const status = commentStatus(c.body, c.alias), s = spamScore({ reviewText: c.body, alias: c.alias });
  const id = crypto.randomUUID(), at = now.toISOString();
  const level = c.level || null, side = c.side || null;
  const row = { id, page: c.page, parentId: c.parentId, alias: c.alias, body: c.body, isQuestion: false, status, spamScore: s.score, voter: c.voter, network: c.network, createdAt: at };
  await withProfile(() => db.insert(comments).values({ ...row, playerLevel: level, playingSide: side }), () => db.insert(comments).values(row));
  await db.insert(commentVotes).values({ commentId: id, voter: c.voter, value: 1, updatedAt: at });
  return { status, comment: { id, parentId: c.parentId, alias: c.alias, level, side, body: c.body, at, score: 1, mine: 1 } satisfies ThreadComment };
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
    db.select(BASE).from(comments).where(where).orderBy(desc(comments.createdAt)).limit(limit),
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
export async function editComment(db: Database, id: string, change: string | { body?: string | null; alias?: string | null; level?: string | null; side?: string | null }) {
  const c = typeof change === "string" ? { body: change } : change;
  const set: { body?: string; alias?: string; playerLevel?: string | null; playingSide?: string | null } = {};
  if (c.body != null) { const text = c.body.trim(); if (text.length < 2 || text.length > 2000) return "invalid" as const; set.body = text; }
  // Name, level and side ("" clears one) follow the posting rule together: a name, or a level or side (owner 2026-11-19).
  if (c.alias != null || c.level != null || c.side != null) {
    const [row]: { alias: string; level: string | null; side: string | null }[] = await withProfile(
      () => db.select({ alias: comments.alias, level: comments.playerLevel, side: comments.playingSide }).from(comments).where(eq(comments.id, id)),
      async () => (await db.select({ alias: comments.alias }).from(comments).where(eq(comments.id, id))).map(r => ({ ...r, level: null, side: null })));
    if (!row) return "missing" as const;
    const alias = c.alias != null ? c.alias.trim() : row.alias, level = c.level != null ? c.level || null : row.level, side = c.side != null ? c.side || null : row.side;
    // A new name is checked as typed; an untouched one counts when it's a real typed name.
    if (postProblem(c.alias != null ? alias : typedName(alias) ?? "", level, side)) return "invalid" as const;
    if (c.alias != null) set.alias = alias;
    if (c.level != null) set.playerLevel = level;
    if (c.side != null) set.playingSide = side;
  }
  if (!Object.keys(set).length) return "invalid" as const;
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
