import { createHmac } from "node:crypto";
import { and, count, desc, eq, gte, inArray, ne, notInArray, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { productVotes, rackets } from "./schema";

// Quick votes (2026-11-14 pivot): one tap per product (love / ok / no), with the voter's level, style and side when they
// gave them. Votes are kept apart from written reviews: they are shown as "N players voted" and never mixed into the
// review counts or the signal score.

type Database = ReturnType<typeof getDb>;
export const VERDICTS = ["love", "ok", "no"] as const;
export type Verdict = typeof VERDICTS[number];
export type VoteProfile = { level?: string | null; style?: string | null; side?: string | null };
/** Votes one network (IP + browser) may cast or change per hour: enough to fill in the whole "rackets you've played" grid. */
export const PRODUCT_VOTES_PER_HOUR = 120;
/** Co-voters needed before "players who loved this also loved" names a product, so one person can't steer it. */
export const MIN_ALSO_LOVED = 2;

/** Keyed one-way hash, so neither the device cookie nor the IP address is stored as is. */
export const voteHash = (value: string, secret: string) => createHmac("sha256", secret).update(value).digest("hex").slice(0, 32);

export type VoteStats = { love: number; ok: number; no: number; total: number; level?: { name: string; love: number; total: number } };

/** Totals for one product, plus the same for the given level when there is one. */
export async function voteStats(db: Pick<Database, "select">, racketId: string, level?: string | null): Promise<VoteStats> {
  const rows = await db.select({ verdict: productVotes.verdict, level: productVotes.level, n: count() }).from(productVotes)
    .where(eq(productVotes.racketId, racketId)).groupBy(productVotes.verdict, productVotes.level);
  const sum = (v: Verdict, l?: string) => rows.filter(r => r.verdict === v && (!l || r.level === l)).reduce((s, r) => s + Number(r.n), 0);
  const love = sum("love"), ok = sum("ok"), no = sum("no");
  const stats: VoteStats = { love, ok, no, total: love + ok + no };
  if (level) stats.level = { name: level, love: sum("love", level), total: sum("love", level) + sum("ok", level) + sum("no", level) };
  return stats;
}

/** Cast or change a vote. Profile fields only overwrite earlier ones when given. */
export async function castVote(db: Database, racketId: string, verdict: Verdict, profile: VoteProfile, voter: string, network: string, now = new Date()) {
  const [exists] = await db.select({ id: rackets.id }).from(rackets).where(eq(rackets.id, racketId));
  if (!exists) return { status: "missing" as const };
  const hourAgo = new Date(now.getTime() - 3_600_000).toISOString();
  const [recent] = await db.select({ n: count() }).from(productVotes).where(and(eq(productVotes.network, network), gte(productVotes.updatedAt, hourAgo)));
  if (Number(recent.n) >= PRODUCT_VOTES_PER_HOUR) return { status: "limited" as const };
  const at = now.toISOString(), level = profile.level ?? null, style = profile.style ?? null, side = profile.side ?? null;
  await db.insert(productVotes).values({ racketId, voter, network, verdict, level, style, side, createdAt: at, updatedAt: at })
    .onConflictDoUpdate({ target: [productVotes.racketId, productVotes.voter], set: {
      verdict, network, updatedAt: at,
      level: sql`coalesce(${level}, ${productVotes.level})`, style: sql`coalesce(${style}, ${productVotes.style})`, side: sql`coalesce(${side}, ${productVotes.side})`,
    } });
  return { status: "ok" as const, stats: await voteStats(db, racketId, level) };
}

/** This device's votes, product id → verdict. */
export async function myVotes(db: Pick<Database, "select">, voter: string) {
  const rows = await db.select({ racketId: productVotes.racketId, verdict: productVotes.verdict }).from(productVotes).where(eq(productVotes.voter, voter));
  return Object.fromEntries(rows.map(r => [r.racketId, r.verdict])) as Record<string, Verdict>;
}

/** Products that other players who loved any of `loved` also loved, most shared first. Excludes `loved` and `skip`. */
export async function alsoLoved(db: Pick<Database, "select">, loved: string[], skip: string[], voter: string, limit = 4) {
  if (!loved.length) return [];
  const fans = db.select({ voter: productVotes.voter }).from(productVotes)
    .where(and(eq(productVotes.verdict, "love"), inArray(productVotes.racketId, loved), ne(productVotes.voter, voter)));
  const n = count(productVotes.voter);
  const rows = await db.select({ racketId: productVotes.racketId, n }).from(productVotes)
    .where(and(eq(productVotes.verdict, "love"), inArray(productVotes.voter, fans), notInArray(productVotes.racketId, [...new Set([...loved, ...skip])])))
    .groupBy(productVotes.racketId).having(gte(n, MIN_ALSO_LOVED)).orderBy(desc(n)).limit(limit);
  return rows.map(r => ({ racketId: r.racketId, fans: Number(r.n) }));
}
