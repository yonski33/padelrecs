// Thread "How does it play?" votes (drizzle/0024, PadelRecs): one per trait group per device, changeable or cleared.
import { and, count, eq, gte, sql } from "drizzle-orm";
import type { getDb } from "./index";
import { traitVotes, rackets } from "./schema";
import type { TraitCounts } from "../lib/thread/traits";

type Database = ReturnType<typeof getDb>;
export const TRAIT_VOTES_PER_HOUR = 200;

export async function traitCounts(db: Pick<Database, "select">, racketId: string): Promise<TraitCounts> {
  const rows = await db.select({ trait: traitVotes.trait, choice: traitVotes.choice, n: count() }).from(traitVotes).where(eq(traitVotes.racketId, racketId)).groupBy(traitVotes.trait, traitVotes.choice);
  const out: TraitCounts = {};
  for (const r of rows) (out[r.trait] ??= {})[r.choice] = Number(r.n);
  return out;
}
export async function myTraitVotes(db: Pick<Database, "select">, racketId: string, voter: string) {
  const rows = await db.select({ trait: traitVotes.trait, choice: traitVotes.choice }).from(traitVotes).where(and(eq(traitVotes.racketId, racketId), eq(traitVotes.voter, voter)));
  return Object.fromEntries(rows.map(r => [r.trait, r.choice])) as Record<string, string>;
}
/** Cast, change (another choice) or clear (null) this device's vote in one group. */
export async function castTraitVote(db: Database, racketId: string, trait: string, choice: string | null, voter: string, network: string, now = new Date()) {
  const [exists] = await db.select({ id: rackets.id }).from(rackets).where(eq(rackets.id, racketId));
  if (!exists) return "missing" as const;
  const [recent] = await db.select({ n: count() }).from(traitVotes).where(and(eq(traitVotes.network, network), gte(traitVotes.updatedAt, new Date(now.getTime() - 3_600_000).toISOString())));
  if (Number(recent.n) >= TRAIT_VOTES_PER_HOUR) return "limited" as const;
  if (choice === null) { await db.delete(traitVotes).where(and(eq(traitVotes.racketId, racketId), eq(traitVotes.voter, voter), eq(traitVotes.trait, trait))); return "ok" as const; }
  const at = now.toISOString();
  await db.insert(traitVotes).values({ racketId, voter, network, trait, choice, createdAt: at, updatedAt: at })
    .onConflictDoUpdate({ target: [traitVotes.racketId, traitVotes.voter, traitVotes.trait], set: { choice, network, updatedAt: at } });
  return "ok" as const;
}
/** Every racket's voters for one trait choice, most first (the home and ranking boards). */
export async function boardCounts(db: Pick<Database, "select">, trait: string, choice: string) {
  const n = count();
  return (await db.select({ racketId: traitVotes.racketId, n }).from(traitVotes).where(and(eq(traitVotes.trait, trait), eq(traitVotes.choice, choice)))
    .groupBy(traitVotes.racketId).orderBy(sql`count(*) desc`).limit(50)).map(r => ({ racketId: r.racketId, n: Number(r.n) }));
}
