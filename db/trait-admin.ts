// The admin Traits tab (drizzle/0027, PadelRecs): fix "How does it play?" for one racket when votes are abused. Every
// change writes a trait_admin_log row in the same transaction, with what it removed or replaced.
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { getDb } from "./index";
import { traitVotes, traitOverrides, traitAdminLog } from "./schema";

type Database = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
/** The racket-wide row's trait key: frozen there stops votes in every group. */
export const ALL_GROUPS = "_all";
export type TraitOverrides = { counts: Record<string, Record<string, number>>; frozen: string[] };

/** One racket's overrides: review counts per group that replace the file's, and frozen groups ("_all" = every group). */
export async function traitOverridesFor(db: Pick<Database, "select">, racketId: string): Promise<TraitOverrides> {
  const rows = await db.select().from(traitOverrides).where(eq(traitOverrides.racketId, racketId));
  return { counts: Object.fromEntries(rows.filter(r => r.reviewCounts).map(r => [r.trait, r.reviewCounts!])), frozen: rows.filter(r => r.frozen).map(r => r.trait) };
}
export const isFrozen = (o: TraitOverrides, trait: string) => o.frozen.includes(ALL_GROUPS) || o.frozen.includes(trait);

/** The racket's votes, newest first (time, voter key, network key, group, choice). */
export async function recentTraitVotes(db: Pick<Database, "select">, racketId: string, limit = 300) {
  return db.select({ voter: traitVotes.voter, network: traitVotes.network, trait: traitVotes.trait, choice: traitVotes.choice, at: traitVotes.updatedAt })
    .from(traitVotes).where(eq(traitVotes.racketId, racketId)).orderBy(desc(traitVotes.updatedAt)).limit(limit);
}
export async function traitAdminHistory(db: Pick<Database, "select">, racketId: string, limit = 50) {
  return db.select().from(traitAdminLog).where(eq(traitAdminLog.racketId, racketId)).orderBy(desc(traitAdminLog.createdAt)).limit(limit);
}

const log = (tx: Tx, racketId: string, trait: string | null, action: string, detail: Record<string, unknown>, at: string) =>
  tx.insert(traitAdminLog).values({ id: randomUUID(), racketId, trait, action, detail, createdAt: at });
async function upsert(tx: Tx, racketId: string, trait: string, set: { reviewCounts?: Record<string, number> | null; frozen?: boolean }, at: string) {
  const [was] = await tx.select().from(traitOverrides).where(and(eq(traitOverrides.racketId, racketId), eq(traitOverrides.trait, trait)));
  await tx.insert(traitOverrides).values({ racketId, trait, reviewCounts: set.reviewCounts ?? null, frozen: set.frozen ?? false, updatedAt: at })
    .onConflictDoUpdate({ target: [traitOverrides.racketId, traitOverrides.trait], set: { ...set, updatedAt: at } });
  return was ?? null;
}

/** Replace the review-based counts of one group (null = back to the prefill file). */
export async function setReviewCounts(db: Database, racketId: string, trait: string, counts: Record<string, number> | null, now = new Date()) {
  const at = now.toISOString();
  return db.transaction(async tx => { const was = await upsert(tx, racketId, trait, { reviewCounts: counts }, at);
    await log(tx, racketId, trait, counts ? "set_review_counts" : "clear_review_counts", { from: was?.reviewCounts ?? null, to: counts }, at); });
}
/** Freeze or open voting on one group, or the whole racket (trait "_all"). */
export async function setFrozen(db: Database, racketId: string, trait: string, frozen: boolean, now = new Date()) {
  const at = now.toISOString();
  return db.transaction(async tx => { await upsert(tx, racketId, trait, { frozen }, at); await log(tx, racketId, trait, frozen ? "freeze" : "unfreeze", {}, at); });
}
/** Remove one device's vote in one group. Returns how many were removed. */
export async function removeTraitVote(db: Database, racketId: string, voter: string, trait: string, now = new Date()) {
  const at = now.toISOString();
  return db.transaction(async tx => {
    const gone = await tx.delete(traitVotes).where(and(eq(traitVotes.racketId, racketId), eq(traitVotes.voter, voter), eq(traitVotes.trait, trait))).returning();
    if (gone.length) await log(tx, racketId, trait, "remove_vote", { votes: gone.map(v => ({ voter: v.voter, network: v.network, choice: v.choice, at: v.updatedAt })) }, at);
    return gone.length;
  });
}
/** Remove every vote by one voter key: on this racket, or on every racket ("everywhere"; logged once per racket). */
export async function removeVoter(db: Database, racketId: string, voter: string, everywhere: boolean, now = new Date()) {
  const at = now.toISOString();
  return db.transaction(async tx => {
    const gone = await tx.delete(traitVotes).where(everywhere ? eq(traitVotes.voter, voter) : and(eq(traitVotes.racketId, racketId), eq(traitVotes.voter, voter))).returning();
    const byRacket = new Map<string, typeof gone>(); for (const v of gone) byRacket.set(v.racketId, [...(byRacket.get(v.racketId) ?? []), v]);
    for (const [rid, vs] of byRacket) await log(tx, rid, null, "remove_voter", { voter, everywhere, votes: vs.map(v => ({ trait: v.trait, choice: v.choice, network: v.network, at: v.updatedAt })) }, at);
    return gone.length;
  });
}
/** Reset one group: every vote in it goes and its review counts go back to the prefill file. The freeze is kept. */
export async function resetTraitGroup(db: Database, racketId: string, trait: string, now = new Date()) {
  const at = now.toISOString();
  return db.transaction(async tx => {
    const gone = await tx.delete(traitVotes).where(and(eq(traitVotes.racketId, racketId), eq(traitVotes.trait, trait))).returning();
    const [was] = await tx.select().from(traitOverrides).where(and(eq(traitOverrides.racketId, racketId), eq(traitOverrides.trait, trait)));
    if (was?.reviewCounts) await tx.update(traitOverrides).set({ reviewCounts: null, updatedAt: at }).where(and(eq(traitOverrides.racketId, racketId), eq(traitOverrides.trait, trait)));
    await log(tx, racketId, trait, "reset_group", { votes: gone.map(v => ({ voter: v.voter, network: v.network, choice: v.choice, at: v.updatedAt })), reviewCounts: was?.reviewCounts ?? null }, at);
    return gone.length;
  });
}
/** Rackets with any override or freeze (the tab's "changed" list). */
export async function overriddenRackets(db: Pick<Database, "select">) {
  return [...new Set((await db.select({ id: traitOverrides.racketId }).from(traitOverrides)).map(r => r.id))];
}
