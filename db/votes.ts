import { createHmac } from "node:crypto";
import { and, count, eq, gte } from "drizzle-orm";
import type { getDb } from "./index";
import { externalReviews, rackets, reviews, reviewVotes } from "./schema";

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
  return { status: "ok" as const, count: Number(total.n) };
}

/** The slug of the product a review belongs to, so its cached page can be refreshed after a vote. */
export async function reviewProductSlug(db: Pick<Database, "select">, target: VoteTarget) {
  const [row] = target.type === "player"
    ? await db.select({ slug: rackets.slug }).from(reviews).innerJoin(rackets, eq(rackets.id, reviews.racketId)).where(eq(reviews.id, target.id))
    : await db.select({ slug: rackets.slug }).from(externalReviews).innerJoin(rackets, eq(rackets.id, externalReviews.racketId)).where(eq(externalReviews.id, target.id));
  return row?.slug ?? null;
}

/** Vote totals keyed "player:<id>" / "web:<id>". */
export async function voteCounts(db: Pick<Database, "select">) {
  const rows = await db.select({ type: reviewVotes.reviewType, id: reviewVotes.reviewId, n: count() }).from(reviewVotes).groupBy(reviewVotes.reviewType, reviewVotes.reviewId);
  return new Map(rows.map(r => [`${r.type}:${r.id}`, Number(r.n)]));
}
