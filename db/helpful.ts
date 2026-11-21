// The owner's "Helpful" clean-up (drizzle/0036): set the count a review, web quote or comment shows, put it back to the real
// votes, or remove one voter's votes. The real votes are kept (review_votes, comment_votes); an override only changes what
// is shown and how the Top / helpful sort orders posts. Every change goes to helpful_audit (who, when, from, to, real).
// On a site without the 0036 tables the reads return nothing and the counts are the real ones.
import { randomUUID } from "node:crypto";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { helpfulOverrides, helpfulAudit, reviewVotes, commentVotes } from "./schema";

type Database = ReturnType<typeof getDb>;
type Reader = Pick<Database, "select">;
export type HelpfulKind = "player" | "web" | "comment";
export const HELPFUL_MAX = 99999;

/** Overrides keyed "<kind>:<id>" (the voteCounts keys, plus "comment:<id>"). Empty when the table isn't there. */
export async function helpfulOverrideMap(db: Reader, kinds: HelpfulKind[], ids?: string[]): Promise<Map<string, number>> {
  if (ids && !ids.length) return new Map();
  try {
    const where = ids ? and(inArray(helpfulOverrides.kind, kinds), inArray(helpfulOverrides.postId, ids)) : inArray(helpfulOverrides.kind, kinds);
    const rows = await db.select({ k: helpfulOverrides.kind, id: helpfulOverrides.postId, v: helpfulOverrides.value }).from(helpfulOverrides).where(where);
    return new Map(rows.map(r => [`${r.k}:${r.id}`, r.v]));
  } catch { return new Map(); }
}

/** The real count: helpful votes on a review or quote, the ▲▼ total on a comment. */
export async function realHelpful(db: Reader, kind: HelpfulKind, id: string) {
  if (kind === "comment") {
    const [r] = await db.select({ s: sql<number>`coalesce(sum(${commentVotes.value}), 0)` }).from(commentVotes).where(eq(commentVotes.commentId, id));
    return Number(r?.s ?? 0);
  }
  const [r] = await db.select({ n: count() }).from(reviewVotes).where(and(eq(reviewVotes.reviewType, kind), eq(reviewVotes.reviewId, id)));
  return Number(r?.n ?? 0);
}

export type Voter = { key: string; at: string; value: number; total: number };
/** One post's state for the admin box: the real count, the override, what shows, and who voted (keyed hashes, newest
 *  first, with how many votes each one cast across the site: a quick abuse signal). */
export async function helpfulState(db: Reader, kind: HelpfulKind, id: string) {
  const real = await realHelpful(db, kind, id);
  const override = (await helpfulOverrideMap(db, [kind], [id])).get(`${kind}:${id}`) ?? null;
  const raw = kind === "comment"
    ? (await db.select({ key: commentVotes.voter, at: commentVotes.updatedAt, value: commentVotes.value }).from(commentVotes).where(eq(commentVotes.commentId, id)).orderBy(desc(commentVotes.updatedAt)).limit(200))
    : (await db.select({ key: reviewVotes.voter, at: reviewVotes.createdAt }).from(reviewVotes).where(and(eq(reviewVotes.reviewType, kind), eq(reviewVotes.reviewId, id))).orderBy(desc(reviewVotes.createdAt)).limit(200)).map(v => ({ ...v, value: 1 }));
  const keys = raw.map(v => v.key);
  const totals = !keys.length ? [] : kind === "comment"
    ? await db.select({ key: commentVotes.voter, n: count() }).from(commentVotes).where(inArray(commentVotes.voter, keys)).groupBy(commentVotes.voter)
    : await db.select({ key: reviewVotes.voter, n: count() }).from(reviewVotes).where(inArray(reviewVotes.voter, keys)).groupBy(reviewVotes.voter);
  const total = new Map(totals.map(t => [t.key, Number(t.n)]));
  return { real, override, shown: override ?? real, voters: raw.map(v => ({ key: v.key, at: v.at, value: v.value, total: total.get(v.key) ?? 1 })) as Voter[] };
}

async function audit(db: Database, a: { kind: HelpfulKind; id: string; action: "set" | "reset" | "remove-voter" | "remove-voter-everywhere"; from: number; to: number; real: number; voter?: string | null; by: string }, now: Date) {
  await db.insert(helpfulAudit).values({ id: randomUUID(), kind: a.kind, postId: a.id, action: a.action, fromShown: a.from, toShown: a.to, realCount: a.real, voter: a.voter ?? null, by: a.by, at: now.toISOString() });
}

/** Show `value` instead of the real count. */
export async function setHelpful(db: Database, kind: HelpfulKind, id: string, value: number, by: string, now = new Date()) {
  const v = Math.max(kind === "comment" ? -HELPFUL_MAX : 0, Math.min(HELPFUL_MAX, Math.round(value)));
  const before = await helpfulState(db, kind, id), at = now.toISOString();
  await db.insert(helpfulOverrides).values({ kind, postId: id, value: v, setBy: by, setAt: at })
    .onConflictDoUpdate({ target: [helpfulOverrides.kind, helpfulOverrides.postId], set: { value: v, setBy: by, setAt: at } });
  await audit(db, { kind, id, action: "set", from: before.shown, to: v, real: before.real, by }, now);
  return { real: before.real, override: v, shown: v };
}
/** Back to the real votes. */
export async function resetHelpful(db: Database, kind: HelpfulKind, id: string, by: string, now = new Date()) {
  const before = await helpfulState(db, kind, id);
  await db.delete(helpfulOverrides).where(and(eq(helpfulOverrides.kind, kind), eq(helpfulOverrides.postId, id)));
  await audit(db, { kind, id, action: "reset", from: before.shown, to: before.real, real: before.real, by }, now);
  return { real: before.real, override: null, shown: before.real };
}
/** Remove one voter's votes: on this post, or (everywhere) every vote that key cast of this kind across the site. */
export async function removeVoter(db: Database, kind: HelpfulKind, id: string, voter: string, everywhere: boolean, by: string, now = new Date()) {
  const before = await helpfulState(db, kind, id);
  let removed: number;
  if (kind === "comment") {
    removed = (await db.delete(commentVotes).where(everywhere ? eq(commentVotes.voter, voter) : and(eq(commentVotes.commentId, id), eq(commentVotes.voter, voter))).returning({ k: commentVotes.voter })).length;
  } else {
    removed = (await db.delete(reviewVotes).where(everywhere ? eq(reviewVotes.voter, voter) : and(eq(reviewVotes.reviewType, kind), eq(reviewVotes.reviewId, id), eq(reviewVotes.voter, voter))).returning({ k: reviewVotes.voter })).length;
  }
  const real = await realHelpful(db, kind, id), shown = before.override ?? real;
  await audit(db, { kind, id, action: everywhere ? "remove-voter-everywhere" : "remove-voter", from: before.shown, to: shown, real, voter, by }, now);
  return { real, override: before.override, shown, removed };
}
export async function helpfulHistory(db: Reader, kind: HelpfulKind, id: string) {
  try { return await db.select().from(helpfulAudit).where(and(eq(helpfulAudit.kind, kind), eq(helpfulAudit.postId, id))).orderBy(desc(helpfulAudit.at)).limit(20); }
  catch { return []; }
}
