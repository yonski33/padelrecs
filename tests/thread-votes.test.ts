import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrationSql } from "../db/migrations";
import { brands, rackets } from "../db/schema";
import { castTraitVote, traitCounts, myTraitVotes, boardCounts, pollVotes } from "../db/thread-votes";
import { reviews, productVotes } from "../db/schema";
import { addComment, listComments, voteComment, commentStatus, PAGE_KEY, adminComments, setCommentStatus } from "../db/comments";
import { validTraitVote, TRAIT_GROUPS } from "../lib/thread/traits";
import type { getDb } from "../db/index";

// Thread trait votes and comments (drizzle/0024–0025) on a throwaway database: never against the live one.
type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const s of migrationSql("padelrecs")) await engine.exec(s);
  const db = drizzle(engine) as unknown as Database;
  await db.insert(brands).values({ id: "b1", name: "Adidas", slug: "adidas" } as never);
  await db.insert(rackets).values({ id: "r1", brandId: "b1", name: "Metalbone CTRL", slug: "metalbone-ctrl", year: 2026, createdAt: "2026-11-19T00:00:00Z" } as never);
  return { engine, db };
}

test("trait votes: one per group per device, changeable, a second tap clears; invalid choices are refused", async () => {
  const { engine, db } = await setup();
  try {
    assert.equal(await castTraitVote(db, "r1", "feel", "soft", "dev-a", "net-1"), "ok");
    assert.equal(await castTraitVote(db, "r1", "feel", "soft", "dev-b", "net-1"), "ok");
    assert.equal(await castTraitVote(db, "r1", "feel", "hard", "dev-a", "net-1"), "ok");
    assert.deepEqual(await traitCounts(db, "r1"), { feel: { soft: 1, hard: 1 } });
    assert.deepEqual(await myTraitVotes(db, "r1", "dev-a"), { feel: "hard" });
    assert.equal(await castTraitVote(db, "r1", "feel", null, "dev-a", "net-1"), "ok");
    assert.deepEqual(await traitCounts(db, "r1"), { feel: { soft: 1 } });
    assert.deepEqual(await boardCounts(db, "feel", "soft"), [{ racketId: "r1", n: 1 }]);
    assert.equal(await castTraitVote(db, "nope", "feel", "soft", "dev-a", "net-1"), "missing");
    assert.equal(validTraitVote("feel", "soft"), true);
    assert.equal(validTraitVote("feel", "crunchy"), false);
    assert.equal(validTraitVote("colour", "red"), false);
    assert.equal(validTraitVote("feel", null), true);
    assert.equal(TRAIT_GROUPS.length, 9);
  } finally { await engine.close(); }
});

test("comments: clean ones show at once, links and very short ones wait, spam is refused; replies and ▲▼ work", async () => {
  assert.equal(commentStatus("Does the CTRL 3.5 play well on the left side?", "Gali"), "approved");
  assert.equal(commentStatus("Cheap rackets here https://spam.example", "Gali"), "pending");
  assert.equal(commentStatus("Agreed", "Gali"), "pending");
  assert.equal(commentStatus("Best deal https://spam.example buy now", "DkJhGfRtYq"), "rejected");
  assert.match("racket:r1", PAGE_KEY); assert.match("guide:elbow", PAGE_KEY); assert.doesNotMatch("home:x", PAGE_KEY);
  const { engine, db } = await setup();
  try {
    const page = "racket:r1", base = { page, voter: "dev-a", network: "net-1", question: false };
    const a = await addComment(db, { ...base, parentId: null, alias: "Gali", body: "Torn between this and the Genius 18K for a sore elbow?" });
    assert.equal(a.status, "approved");
    const held = await addComment(db, { ...base, parentId: null, alias: "Gali", body: "My full review with photos is at www.example.com for anyone curious" });
    assert.equal(held.status, "pending");
    const reply = await addComment(db, { ...base, parentId: a.comment!.id, alias: "Marta", body: "Go CTRL, the sweet spot is huge." });
    assert.equal(reply.status, "approved");
    // One level of replies only.
    assert.equal((await addComment(db, { ...base, parentId: reply.comment!.id, alias: "X", body: "A reply to a reply here." })).status, "invalid");
    assert.equal(await voteComment(db, a.comment!.id, "dev-b", 1), true);
    assert.equal(await voteComment(db, a.comment!.id, "dev-c", 1), true);
    assert.equal(await voteComment(db, a.comment!.id, "dev-c", -1), true);
    const list = await listComments(db, page, "dev-c");
    assert.deepEqual(list.map(c => c.body).sort(), ["Go CTRL, the sweet spot is huge.", "Torn between this and the Genius 18K for a sore elbow?"]);
    const top = list.find(c => c.id === a.comment!.id)!;
    assert.equal(top.score, 0); assert.equal(top.mine, -1);
    assert.equal(await voteComment(db, held.status === "pending" ? "00000000-0000-4000-8000-000000000000" : "", "dev-b", 1), false);
  } finally { await engine.close(); }
});

test("comment moderation: a held comment shows once approved, hides once rejected; totals per status", async () => {
  const { engine, db } = await setup();
  try {
    const page = "guide:elbow", base = { page, voter: "dev-a", network: "net-1", question: false, parentId: null };
    const held = await addComment(db, { ...base, alias: "Iker", body: "Photos of my elbow brace setup at www.example.com if useful" });
    assert.equal(held.status, "pending");
    assert.deepEqual((await listComments(db, page, null)).length, 0);
    const queue = await adminComments(db, "pending");
    assert.equal(queue.rows.length, 1); assert.equal(queue.totals.pending, 1);
    const id = queue.rows[0].id;
    assert.equal(await setCommentStatus(db, id, "approved"), true);
    assert.equal((await listComments(db, page, null)).length, 1);
    assert.equal(await setCommentStatus(db, id, "rejected"), true);
    assert.equal((await listComments(db, page, null)).length, 0);
    assert.equal((await adminComments(db, "rejected")).totals.rejected, 1);
    assert.equal(await setCommentStatus(db, "00000000-0000-4000-8000-000000000000", "approved"), false);
  } finally { await engine.close(); }
});

test("poll: a quick vote paired with the same person's approved review counts once (the review), other votes count", async () => {
  const { engine, db } = await setup();
  try {
    const vote = (voter: string, rating: number, at: string) => ({ racketId: "r1", voter, network: "n", rating, createdAt: at, updatedAt: at });
    await db.insert(reviews).values({ id: "rv1", racketId: "r1", rating: 5, reviewText: "Huge sweet spot and easy on the arm, love it.", status: "approved", createdAt: "2026-11-10T10:00:30.000Z" } as never);
    await db.insert(productVotes).values([
      vote("composer", 5, "2026-11-10T10:00:00.000Z"),   // saved with rv1: counted once, as the review
      vote("other", 5, "2026-11-12T09:00:00.000Z"),      // a separate person
      vote("mixed", 3, "2026-11-10T10:01:00.000Z"),      // a different verdict: not the same opinion
    ] as never);
    assert.deepEqual(await pollVotes(db, "r1"), { positive: 1, mixed: 1, negative: 0 });
  } finally { await engine.close(); }
});

test("poll: tapping your pick again takes the quick vote back (this device only)", async () => {
  const { engine, db } = await setup();
  try {
    const { castVote, removeVote, voteStats } = await import("../db/product-votes");
    await castVote(db, "r1", 5, {}, "dev-a", "net-1"); await castVote(db, "r1", 5, {}, "dev-b", "net-1");
    assert.equal((await voteStats(db, "r1")).positive, 2);
    assert.equal(await removeVote(db, "r1", "dev-a"), true);
    assert.equal(await removeVote(db, "r1", "dev-a"), false);
    assert.equal((await voteStats(db, "r1")).positive, 1);
  } finally { await engine.close(); }
});
