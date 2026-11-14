import { createHmac } from "node:crypto";
import { and, count, desc, eq, gte, inArray, ne, notInArray, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { productVotes, rackets } from "./schema";

// Quick ratings (2026-11-14 pivot): one tap of 1–5 of the niche's balls per product, with the voter's level, style and
// side when they gave them. Like a written review, 4–5 counts as positive, 3 as mixed and 1–2 as negative. Ratings are
// kept apart from written reviews: shown as "N players rated it", never mixed into review counts or the signal score.

type Database = ReturnType<typeof getDb>;
export type VoteProfile = { level?: string | null; style?: string | null; side?: string | null };
/** Ratings one network (IP + browser) may cast or change per hour: enough to fill in the whole "rate what you've played" page. */
export const PRODUCT_VOTES_PER_HOUR = 120;
/** Co-raters needed before "players who love this also love" names a product, so one person can't steer it. */
export const MIN_ALSO_LOVED = 2;
/** A rating of this or more counts as loving it. */
export const LOVED = 4;

/** Keyed one-way hash, so neither the device cookie nor the IP address is stored as is. */
export const voteHash = (value: string, secret: string) => createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);

export type VoteStats = { total: number; average: number | null; positive: number; mixed: number; negative: number; level?: { name: string; positive: number; total: number } };

/** Totals for one product, plus the same for the given level when there is one. */
export async function voteStats(db: Pick<Database, "select">, racketId: string, level?: string | null): Promise<VoteStats> {
  const rows = await db.select({ rating: productVotes.rating, level: productVotes.level, n: count() }).from(productVotes)
    .where(eq(productVotes.racketId, racketId)).groupBy(productVotes.rating, productVotes.level);
  const sum = (keep: (r: number) => boolean, l?: string) => rows.filter(r => keep(r.rating) && (!l || r.level === l)).reduce((s, r) => s + Number(r.n), 0);
  const total = sum(() => true), points = rows.reduce((s, r) => s + r.rating * Number(r.n), 0);
  const stats: VoteStats = { total, average: total ? Math.round(10 * points / total) / 10 : null, positive: sum(r => r >= LOVED), mixed: sum(r => r === 3), negative: sum(r => r <= 2) };
  if (level) stats.level = { name: level, positive: sum(r => r >= LOVED, level), total: sum(() => true, level) };
  return stats;
}

/** Cast or change a rating. Profile fields only overwrite earlier ones when given. */
export async function castVote(db: Database, racketId: string, rating: number, profile: VoteProfile, voter: string, network: string, now = new Date()) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { status: "invalid" as const };
  const [exists] = await db.select({ id: rackets.id }).from(rackets).where(eq(rackets.id, racketId));
  if (!exists) return { status: "missing" as const };
  const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
  const [recent] = await db.select({ n: count() }).from(productVotes).where(and(eq(productVotes.network, network), gte(productVotes.updatedAt, hourAgo)));
  if (Number(recent.n) >= PRODUCT_VOTES_PER_HOUR) return { status: "limited" as const };
  const at = now.toISOString(), level = profile.level ?? null, style = profile.style ?? null, side = profile.side ?? null;
  await db.insert(productVotes).values({ racketId, voter, network, rating, level, style, side, createdAt: at, updatedAt: at })
    .onConflictDoUpdate({ target: [productVotes.racketId, productVotes.voter], set: {
      rating, network, updatedAt: at,
      level: sql`coalesce(${level}, ${productVotes.level})`, style: sql`coalesce(${style}, ${productVotes.style})`, side: sql`coalesce(${side}, ${productVotes.side})`,
    } });
  return { status: "ok" as const, stats: await voteStats(db, racketId, level) };
}

/** This device's ratings, product id → 1–5. */
export async function myVotes(db: Pick<Database, "select">, voter: string) {
  const rows = await db.select({ racketId: productVotes.racketId, rating: productVotes.rating }).from(productVotes).where(eq(productVotes.voter, voter));
  return Object.fromEntries(rows.map(r => [r.racketId, r.rating])) as Record<string, number>;
}

/** Products that other players who loved any of `loved` also loved, most shared first. Excludes `loved` and `skip`. */
export async function alsoLoved(db: Pick<Database, "select">, loved: string[], skip: string[], voter: string, limit = 4) {
  if (!loved.length) return [];
  const fans = db.select({ voter: productVotes.voter }).from(productVotes)
    .where(and(gte(productVotes.rating, LOVED), inArray(productVotes.racketId, loved), ne(productVotes.voter, voter)));
  const n = count(productVotes.voter);
  const rows = await db.select({ racketId: productVotes.racketId, n }).from(productVotes)
    .where(and(gte(productVotes.rating, LOVED), inArray(productVotes.voter, fans), notInArray(productVotes.racketId, [...new Set([...loved, ...skip])])))
    .groupBy(productVotes.racketId).having(gte(n, MIN_ALSO_LOVED)).orderBy(desc(n)).limit(limit);
  return rows.map(r => ({ racketId: r.racketId, fans: Number(r.n) }));
}
