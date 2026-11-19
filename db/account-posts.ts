// "Your posts" on /account (PadelRecs member zone): a member's own reviews and comments, newest first, with edit (text only,
// within 24 hours of posting) and delete. Ownership is always checked through account_posts. Votes stay device-based.
import { and, eq, inArray } from "drizzle-orm";
import type { getDb } from "./index";
import { accountPosts, comments, reviews, rackets } from "./schema";
import { commentStatus, deleteComment, REMOVED } from "./comments";
import { deleteRejectedReviews } from "./review-editing";
import { spamScore } from "../lib/review-spam";
import type { PostKind } from "./accounts";

type Database = ReturnType<typeof getDb>;
/** How long a post stays editable after it was posted. */
export const EDIT_WINDOW_MS = 24 * 60 * 60_000;
export const REVIEW_MIN = 20, COMMENT_MIN = 2, TEXT_MAX = 2000;
export type PostStatus = "pending" | "live" | "hidden";
export type OwnPost = { kind: PostKind; id: string; page: string; racket: { slug: string; name: string; shape: string | null } | null;
  at: string; text: string; status: PostStatus; editable: boolean };
const statusOf = (s: string): PostStatus => s === "approved" ? "live" : s === "pending" ? "pending" : "hidden";
export const canEdit = (at: string, status: PostStatus, now = Date.now()) => status !== "hidden" && now - Date.parse(at) < EDIT_WINDOW_MS;

/** The account's posts, newest first. `page` is the comment's page key ("racket:<id>", "ranking:<slug>", "guide:<key>"),
 *  or "racket:<id>" for a review. A removed comment kept for its replies is left out. */
export async function ownPosts(db: Pick<Database, "select">, accountId: string, now = Date.now()): Promise<OwnPost[]> {
  const owned = await db.select({ kind: accountPosts.kind, id: accountPosts.postId }).from(accountPosts).where(eq(accountPosts.accountId, accountId));
  const ids = (k: PostKind) => owned.filter(p => p.kind === k).map(p => p.id);
  const [rv, cm] = await Promise.all([
    ids("review").length ? db.select({ id: reviews.id, racketId: reviews.racketId, text: reviews.reviewText, status: reviews.status, at: reviews.createdAt }).from(reviews).where(inArray(reviews.id, ids("review"))) : [],
    ids("comment").length ? db.select({ id: comments.id, page: comments.page, text: comments.body, status: comments.status, at: comments.createdAt }).from(comments).where(inArray(comments.id, ids("comment"))) : [],
  ]);
  const racketIds = [...new Set([...rv.map(r => r.racketId), ...cm.map(c => c.page.startsWith("racket:") ? c.page.slice(7) : "").filter(Boolean)])];
  const rk = new Map((racketIds.length ? await db.select({ id: rackets.id, slug: rackets.slug, name: rackets.name, shape: rackets.shape }).from(rackets).where(inArray(rackets.id, racketIds)) : []).map(r => [r.id, r]));
  const one = (kind: PostKind, id: string, page: string, text: string, status: string, at: string): OwnPost => {
    const st = statusOf(status), r = page.startsWith("racket:") ? rk.get(page.slice(7)) ?? null : null;
    return { kind, id, page, racket: r && { slug: r.slug, name: r.name, shape: r.shape }, at, text, status: st, editable: canEdit(at, st, now) };
  };
  return [...rv.map(r => one("review", r.id, `racket:${r.racketId}`, r.text, r.status, r.at)),
    ...cm.filter(c => c.text !== REMOVED).map(c => one("comment", c.id, c.page, c.text, c.status, c.at))].sort((a, b) => b.at.localeCompare(a.at));
}

async function owns(db: Pick<Database, "select">, accountId: string, kind: PostKind, id: string) {
  const [p] = await db.select({ id: accountPosts.postId }).from(accountPosts).where(and(eq(accountPosts.accountId, accountId), eq(accountPosts.kind, kind), eq(accountPosts.postId, id)));
  return !!p;
}

/** Edit the text of an own post within 24 hours. A review goes back to the review queue (pending), as every new review does;
 *  a comment runs the posting check again (a link or very short text waits for a person). Spam is refused. */
export async function editOwnPost(db: Database, accountId: string, kind: PostKind, id: string, text: string, now = Date.now()) {
  if (!(await owns(db, accountId, kind, id))) return { result: "missing" as const };
  const body = text.trim(), min = kind === "review" ? REVIEW_MIN : COMMENT_MIN;
  if (body.length < min || body.length > TEXT_MAX) return { result: "invalid" as const };
  if (kind === "review") {
    const [r] = await db.select({ status: reviews.status, at: reviews.createdAt }).from(reviews).where(eq(reviews.id, id));
    if (!r) return { result: "missing" as const };
    if (!canEdit(r.at, statusOf(r.status), now)) return { result: "locked" as const };
    if (spamScore({ reviewText: body }).spam) return { result: "spam" as const };
    await db.update(reviews).set({ reviewText: body, status: "pending", highlights: null }).where(eq(reviews.id, id));
    return { result: "ok" as const, status: "pending" as PostStatus };
  }
  const [c] = await db.select({ status: comments.status, at: comments.createdAt, alias: comments.alias }).from(comments).where(eq(comments.id, id));
  if (!c || c.alias === REMOVED) return { result: "missing" as const };
  if (!canEdit(c.at, statusOf(c.status), now)) return { result: "locked" as const };
  const status = commentStatus(body, c.alias);
  if (status === "rejected") return { result: "spam" as const };
  await db.update(comments).set({ body, status }).where(eq(comments.id, id));
  return { result: "ok" as const, status: statusOf(status) };
}

/** Delete an own post for good (any age). A comment with replies keeps them under "[removed]", as the admin delete does. */
export async function deleteOwnPost(db: Database, accountId: string, kind: PostKind, id: string) {
  if (!(await owns(db, accountId, kind, id))) return "missing" as const;
  if (kind === "comment") { const r = await deleteComment(db, id); await db.delete(accountPosts).where(and(eq(accountPosts.kind, kind), eq(accountPosts.postId, id))); return r === "missing" ? "missing" as const : "deleted" as const; }
  await db.update(reviews).set({ status: "rejected" }).where(eq(reviews.id, id));
  await deleteRejectedReviews(db, [id]);
  await db.delete(accountPosts).where(and(eq(accountPosts.kind, kind), eq(accountPosts.postId, id)));
  return "deleted" as const;
}
