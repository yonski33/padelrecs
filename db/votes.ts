import { createHmac } from "node:crypto";
import { and, count, eq, gte } from "drizzle-orm";
import type { getDb } from "./index";
import { externalReviews, reviews, reviewVotes } from "./schema";
import { helpfulOverrideMap } from "./helpful";

type Database = ReturnType<typeof getDb>;
export type VoteTarget = { type: "player" | "web"; id: string };
export const VOTES_PER_HOUR = 60;

/** One-way, keyed fingerprint of a visitor (network + browser). The raw IP is never stored. */
export function voterId(ip: string, userAgent: string, secret: string) {
  return createHmac("sha256", secret).update(`${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

/** Add or remove a "helpful" vote. Only public reviews (approved player reviews, web quotes) can be voted on. */
export async function setVote(db: Database, target: VoteTarget, voter: string, on: boolean, now = new Date()) {
  const [exists] = target.type === "player"
    ? await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.id, target.id), eq(reviews.status, "approved")))
    : await db.select({ id: externalReviews.id }).from(externalReviews).where(eq(externalReviews.id, target.id));
  if (!exists) return { status: "missing" as const };
  const match = and(eq(reviewVotes.reviewType, target.type), eq(reviewVotes.reviewId, target.id));
  if (on) {
    const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
    const [recent] = await db.select({ n: count() }).from(reviewVotes).where(and(eq(reviewVotes.voter, voter), gte(reviewVotes.createdAt, hourAgo)));
    if (Number(recent.n) >= VOTES_PER_HOUR) return { status: "limited" as const };
    await db.insert(reviewVotes).values({ reviewType: target.type, reviewId: target.id, voter, createdAt: now.toISOString() }).onConflictDoNothing();
  } else {
    await db.delete(reviewVotes).where(and(match, eq(reviewVotes.voter, voter)));
  }
  const [total] = await db.select({ n: count() }).from(reviewVotes).where(match);
  // With the owner's override set (drizzle/0036) the vote still counts in the real total, but the shown number stays put.
  const fixed = (await helpfulOverrideMap(db, [target.type], [target.id])).get(`${target.type}:${target.id}`);
  return { status: "ok" as const, count: fixed ?? Number(total.n) };
}

/** Vote totals keyed "player:<id>" / "web:<id>": the real votes, or the owner's override (drizzle/0036) where one is set. */
export async function voteCounts(db: Pick<Database, "select">) {
  const rows = await db.select({ type: reviewVotes.reviewType, id: reviewVotes.reviewId, n: count() }).from(reviewVotes).groupBy(reviewVotes.reviewType, reviewVotes.reviewId);
  const out = new Map(rows.map(r => [`${r.type}:${r.id}`, Number(r.n)]));
  for (const [k, v] of await helpfulOverrideMap(db, ["player", "web"])) out.set(k, v);
  return out;
}
