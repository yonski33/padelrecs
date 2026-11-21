import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { brands, rackets, reviews, reviewVotes, comments, commentVotes, helpfulAudit } from "../db/schema";
import { voteCounts, setVote } from "../db/votes";
import { listComments, racketComments } from "../db/comments";
import { helpfulState, setHelpful, resetHelpful, removeVoter, helpfulOverrideMap, helpfulHistory } from "../db/helpful";
import type { getDb } from "../db/index";

// The owner's Helpful clean-up (drizzle/0036) on a throwaway database: never against the live one.
type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) await engine.exec(s);
  const db = drizzle(engine) as unknown as Database;
  await db.insert(brands).values({ id: "b1", name: "Adidas", slug: "adidas" } as never);
  await db.insert(rackets).values({ id: "r1", brandId: "b1", name: "Metalbone CTRL", slug: "metalbone-ctrl", year: 2026, createdAt: "2026-11-01T00:00:00Z" } as never);
  await db.insert(reviews).values({ id: "rv1", racketId: "r1", rating: 5, reviewText: "Plays really well from the left side.", alias: "Marta", status: "approved", tags: [], createdAt: "2026-11-20T10:00:00Z" } as never);
  await db.insert(reviewVotes).values(["a", "b", "c"].map(v => ({ reviewType: "player", reviewId: "rv1", voter: `voter-${v}-0000`, createdAt: "2026-11-21T10:00:00Z" })) as never);
  await db.insert(comments).values(["c1", "c2"].map((id, i) => ({ id, page: "racket:r1", parentId: null, alias: "Leo", body: "Anyone tried it with an overgrip?", status: "approved", voter: "v", network: "n", createdAt: `2026-11-21T1${i}:00:00Z` })) as never);
  await db.insert(commentVotes).values([
    { commentId: "c1", voter: "voter-a-0000", value: 1, updatedAt: "2026-11-21T12:00:00Z" }, { commentId: "c1", voter: "voter-x-0000", value: 1, updatedAt: "2026-11-21T12:00:00Z" },
    { commentId: "c2", voter: "voter-x-0000", value: 1, updatedAt: "2026-11-21T12:00:00Z" },
  ] as never);
  return { engine, db };
}

test("a review's override is what shows, votes are kept, reset goes back, all audited", async () => {
  const { engine, db } = await setup();
  try {
    assert.equal((await voteCounts(db)).get("player:rv1"), 3);
    assert.deepEqual(await setHelpful(db, "player", "rv1", 1, "owner@example.com"), { real: 3, override: 1, shown: 1 });
    assert.equal((await voteCounts(db)).get("player:rv1"), 1);
    assert.equal((await db.select().from(reviewVotes)).length, 3, "real votes stay");
    // A visitor's vote still counts in the real total, the shown number stays the override.
    assert.deepEqual(await setVote(db, { type: "player", id: "rv1" }, "voter-new-0000", true), { status: "ok", count: 1 });
    assert.equal((await helpfulState(db, "player", "rv1")).real, 4);
    assert.deepEqual(await resetHelpful(db, "player", "rv1", "owner@example.com"), { real: 4, override: null, shown: 4 });
    assert.equal((await voteCounts(db)).get("player:rv1"), 4);
    const log = await helpfulHistory(db, "player", "rv1");
    assert.deepEqual(log.map(h => [h.action, h.fromShown, h.toShown, h.realCount, h.by]), [["reset", 1, 4, 4, "owner@example.com"], ["set", 3, 1, 3, "owner@example.com"]]);
  } finally { await engine.close(); }
});

test("comments: the override drives the shown total and the Top order", async () => {
  const { engine, db } = await setup();
  try {
    let list = await listComments(db, "racket:r1", null);
    assert.deepEqual(list.map(c => [c.id, c.score]), [["c2", 1], ["c1", 2]]);
    await setHelpful(db, "comment", "c1", -3, "owner");
    list = await listComments(db, "racket:r1", null);
    assert.equal(list.find(c => c.id === "c1")?.score, -3);
    assert.equal((await racketComments(db)).find(c => c.id === "c1")?.score, -3);
    assert.equal((await helpfulOverrideMap(db, ["comment"])).get("comment:c1"), -3);
  } finally { await engine.close(); }
});

test("remove one voter: here only, or every vote they cast", async () => {
  const { engine, db } = await setup();
  try {
    const st = await helpfulState(db, "comment", "c1");
    assert.deepEqual(st.voters.map(v => [v.key, v.total]).sort(), [["voter-a-0000", 1], ["voter-x-0000", 2]]);
    assert.equal((await removeVoter(db, "comment", "c1", "voter-x-0000", false, "owner")).shown, 1);
    assert.equal((await db.select().from(commentVotes)).filter(v => v.voter === "voter-x-0000").length, 1, "their vote elsewhere stays");
    const r = await removeVoter(db, "player", "rv1", "voter-a-0000", true, "owner");
    assert.equal(r.shown, 2); assert.equal(r.removed, 1);
    assert.deepEqual((await db.select().from(helpfulAudit)).map(a => a.action).sort(), ["remove-voter", "remove-voter-everywhere"]);
  } finally { await engine.close(); }
});

test("a site without the 0036 tables shows the real counts", async () => {
  const { engine, db } = await setup();
  try {
    await engine.exec(`drop table padelrecs.helpful_overrides; drop table padelrecs.helpful_audit;`);
    assert.equal((await voteCounts(db)).get("player:rv1"), 3);
    assert.equal((await listComments(db, "racket:r1", null)).find(c => c.id === "c1")?.score, 2);
    assert.deepEqual(await helpfulHistory(db, "player", "rv1"), []);
  } finally { await engine.close(); }
});
