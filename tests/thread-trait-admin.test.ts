import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { brands, rackets } from "../db/schema";
import { castTraitVote, traitCounts } from "../db/thread-votes";
import { traitOverridesFor, setReviewCounts, setFrozen, removeTraitVote, removeVoter, resetTraitGroup, recentTraitVotes, traitAdminHistory, overriddenRackets, ALL_GROUPS } from "../db/trait-admin";
import { countsFrom, changedCounts } from "../lib/thread/trait-view";
import type { getDb } from "../db/index";

// The admin Traits tab (drizzle/0027) on a throwaway database: never against the live one.
type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) await engine.exec(s);
  const db = drizzle(engine) as unknown as Database;
  await db.insert(brands).values({ id: "b1", name: "Adidas", slug: "adidas" } as never);
  for (const id of ["r1", "r2"]) await db.insert(rackets).values({ id, brandId: "b1", name: id, slug: id, year: 2026, createdAt: "2026-11-19T00:00:00Z" } as never);
  return { engine, db };
}

test("review-count overrides replace and clear, each logged with what it replaced", async () => {
  const { engine, db } = await setup();
  try {
    await setReviewCounts(db, "r1", "feel", { soft: 9 });
    await setReviewCounts(db, "r1", "feel", { hard: 3 });
    assert.deepEqual((await traitOverridesFor(db, "r1")).counts, { feel: { hard: 3 } });
    await setReviewCounts(db, "r1", "feel", null);
    assert.deepEqual((await traitOverridesFor(db, "r1")).counts, {});
    const h = await traitAdminHistory(db, "r1");
    assert.deepEqual(h.map(x => x.action).sort(), ["clear_review_counts", "set_review_counts", "set_review_counts"]);
    assert.ok(h.some(x => { try { assert.deepEqual(x.detail, { from: { soft: 9 }, to: { hard: 3 } }); return true; } catch { return false; } }));
    assert.deepEqual(await overriddenRackets(db), ["r1"]);
  } finally { await engine.close(); }
});

test("a frozen group or racket refuses new votes; unfreezing opens it again", async () => {
  const { engine, db } = await setup();
  try {
    await setFrozen(db, "r1", "feel", true);
    assert.equal(await castTraitVote(db, "r1", "feel", "soft", "dev-a", "net-1"), "frozen");
    assert.equal(await castTraitVote(db, "r1", "arm", "very", "dev-a", "net-1"), "ok");
    await setFrozen(db, "r1", ALL_GROUPS, true);
    assert.equal(await castTraitVote(db, "r1", "arm", "somewhat", "dev-a", "net-1"), "frozen");
    assert.equal(await castTraitVote(db, "r2", "arm", "very", "dev-a", "net-1"), "ok");
    await setFrozen(db, "r1", ALL_GROUPS, false); await setFrozen(db, "r1", "feel", false);
    assert.equal(await castTraitVote(db, "r1", "feel", "soft", "dev-a", "net-1"), "ok");
    assert.deepEqual((await traitOverridesFor(db, "r1")).frozen, []);
  } finally { await engine.close(); }
});

test("remove one vote, all of one voter (here or everywhere), or reset a group; every removal is logged", async () => {
  const { engine, db } = await setup();
  try {
    for (const [r, t, c, v] of [["r1", "feel", "soft", "bot"], ["r1", "arm", "very", "bot"], ["r2", "feel", "soft", "bot"], ["r1", "feel", "hard", "dev-b"], ["r1", "feel", "soft", "dev-c"]] as const)
      await castTraitVote(db, r, t, c, v, "net-1");
    assert.equal((await recentTraitVotes(db, "r1")).length, 4);
    assert.equal(await removeTraitVote(db, "r1", "dev-c", "feel"), 1);
    assert.equal(await removeVoter(db, "r1", "bot", false), 2);
    assert.deepEqual(await traitCounts(db, "r2"), { feel: { soft: 1 } });
    await castTraitVote(db, "r1", "feel", "soft", "bot", "net-1");
    assert.equal(await removeVoter(db, "r1", "bot", true), 2);
    assert.deepEqual(await traitCounts(db, "r2"), {});
    await setReviewCounts(db, "r1", "feel", { soft: 7 }); await setFrozen(db, "r1", "feel", true);
    assert.equal(await resetTraitGroup(db, "r1", "feel"), 1);
    const o = await traitOverridesFor(db, "r1");
    assert.deepEqual(await traitCounts(db, "r1"), {}); assert.deepEqual(o.counts, {}); assert.deepEqual(o.frozen, ["feel"]);
    const acts = (await traitAdminHistory(db, "r1")).map(x => x.action);
    for (const a of ["remove_vote", "remove_voter", "reset_group", "freeze", "set_review_counts"]) assert.ok(acts.includes(a), a);
    assert.ok((await traitAdminHistory(db, "r2")).some(x => x.action === "remove_voter"));
    const reset = (await traitAdminHistory(db, "r1")).find(x => x.action === "reset_group")!.detail as { votes: { voter: string }[]; reviewCounts: unknown };
    assert.equal(reset.votes[0].voter, "dev-b"); assert.deepEqual(reset.reviewCounts, { soft: 7 });
  } finally { await engine.close(); }
});

test("typed review counts: whole numbers per option, blanks are 0, anything else is refused", () => {
  assert.deepEqual(countsFrom("feel", { c_soft: "4", c_medium: "", c_hard: "0" }), { soft: 4 });
  assert.equal(countsFrom("feel", { c_soft: "-1" }), null);
  assert.equal(countsFrom("feel", { c_soft: "2.5" }), null);
  assert.equal(countsFrom("feel", { c_soft: "lots" }), null);
});

test("Save all: only the groups whose numbers changed are saved; one group's Save saves just that group", () => {
  const groups = [{ key: "feel", title: "Feel", options: [["soft", "Soft"], ["hard", "Hard"]] as [string, string][] },
    { key: "pop", title: "Pop", options: [["low", "Low"], ["high", "High"]] as [string, string][] }];
  const form = { c_feel__soft: "4", o_feel__soft: "4", c_feel__hard: "1", o_feel__hard: "0", c_pop__low: "2", o_pop__low: "2", c_pop__high: "", o_pop__high: "0" };
  assert.deepEqual(changedCounts(form, groups), [{ trait: "feel", counts: { soft: 4, hard: 1 } }]);
  assert.deepEqual(changedCounts({ ...form, only: "pop" }, groups), [{ trait: "pop", counts: { low: 2 } }]);
  assert.deepEqual(changedCounts({ ...form, c_feel__hard: "0" }, groups), []);
  assert.equal(changedCounts({ ...form, c_pop__low: "-3" }, groups), null);
});
