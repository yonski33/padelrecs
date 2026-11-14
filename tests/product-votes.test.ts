import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { fixture } from "./fixture";
import { parseSnapshot, importSnapshot } from "../db/transfer";
import { rackets } from "../db/schema";
import { alsoLoved, castVote, myVotes, voteHash, voteStats, PRODUCT_VOTES_PER_HOUR } from "../db/product-votes";
import type { getDb } from "../db/index";

type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const file of (await readdir("drizzle")).filter(f => f.endsWith(".sql")).sort()) await engine.exec(await readFile(`drizzle/${file}`, "utf8"));
  const db = drizzle(engine) as unknown as Database;
  await importSnapshot(db, parseSnapshot(fixture));
  for (const id of ["racket-b", "racket-c"]) await db.insert(rackets).values({ ...(await db.select().from(rackets))[0], id, slug: id, name: `Test ${id}` });
  return { engine, db };
}

test("quick votes: one per device, changeable, keep the profile, count by level", async () => {
  const { engine, db } = await setup();
  try {
    const a = voteHash("device|a", "s"), b = voteHash("device|b", "s"), net = voteHash("network|x", "s");
    assert.notEqual(a, b);
    assert.equal((await castVote(db, "racket-nox", "love", { level: "Beginner" }, a, net)).status, "ok");
    const changed = await castVote(db, "racket-nox", "ok", {}, a, net);
    assert.equal(changed.status, "ok");
    assert.deepEqual(await voteStats(db, "racket-nox", "Beginner"), { love: 0, ok: 1, no: 0, total: 1, level: { name: "Beginner", love: 0, total: 1 } });
    await castVote(db, "racket-nox", "love", { level: "Advanced" }, b, net);
    const stats = await voteStats(db, "racket-nox");
    assert.equal(stats.total, 2); assert.equal(stats.love, 1);
    assert.deepEqual(await myVotes(db, a), { "racket-nox": "ok" });
    assert.equal((await castVote(db, "missing", "love", {}, a, net)).status, "missing");
  } finally { await engine.close(); }
});

test("quick votes: also-loved needs two fans in common and skips what you voted on", async () => {
  const { engine, db } = await setup();
  try {
    const net = voteHash("network|y", "s");
    const [me, f1, f2, f3] = ["me", "f1", "f2", "f3"].map(x => voteHash(`device|${x}`, "s"));
    await castVote(db, "racket-nox", "love", {}, me, net);
    for (const f of [f1, f2]) { await castVote(db, "racket-nox", "love", {}, f, net); await castVote(db, "racket-b", "love", {}, f, net); }
    await castVote(db, "racket-nox", "love", {}, f3, net); await castVote(db, "racket-c", "love", {}, f3, net);
    assert.deepEqual(await alsoLoved(db, ["racket-nox"], [], me), [{ racketId: "racket-b", fans: 2 }]);
    assert.deepEqual(await alsoLoved(db, ["racket-nox"], ["racket-b"], me), []);
  } finally { await engine.close(); }
});

test("quick votes are rate limited per network", async () => {
  const { engine, db } = await setup();
  try {
    const net = voteHash("network|z", "s");
    for (let i = 0; i < PRODUCT_VOTES_PER_HOUR; i++) await castVote(db, "racket-nox", "love", {}, voteHash(`device|${i}`, "s"), net);
    assert.equal((await castVote(db, "racket-nox", "love", {}, voteHash("device|extra", "s"), net)).status, "limited");
  } finally { await engine.close(); }
});
