import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { fixture } from "./fixture";
import { parseSnapshot, importSnapshot } from "../db/transfer";
import { reviewVotes } from "../db/schema";
import { reviewProductSlug, setVote, voterId, VOTES_PER_HOUR } from "../db/votes";
import { catalog } from "../db/data";
import type { getDb } from "../db/index";

type Database = ReturnType<typeof getDb>;
async function setup() {
  const engine = new PGlite();
  for (const file of (await readdir("drizzle")).filter(f => f.endsWith(".sql")).sort()) await engine.exec(await readFile(`drizzle/${file}`, "utf8"));
  const db = drizzle(engine) as unknown as Database;
  await importSnapshot(db, parseSnapshot(fixture));
  return { engine, db };
}

test("helpful votes: one per voter, undoable, only on public reviews, shown in the catalog", async () => {
  const { engine, db } = await setup();
  try {
    const a = voterId("1.2.3.4", "browser", "secret"), b = voterId("5.6.7.8", "browser", "secret");
    assert.notEqual(a, b); assert(!a.includes("1.2.3.4"));
    assert.deepEqual(await setVote(db, { type: "player", id: "approved-review" }, a, true), { status: "ok", count: 1 });
    assert.deepEqual(await setVote(db, { type: "player", id: "approved-review" }, a, true), { status: "ok", count: 1 });
    assert.deepEqual(await setVote(db, { type: "player", id: "approved-review" }, b, true), { status: "ok", count: 2 });
    assert.deepEqual(await setVote(db, { type: "player", id: "approved-review" }, a, false), { status: "ok", count: 1 });
    assert.deepEqual(await setVote(db, { type: "web", id: "external-review" }, a, true), { status: "ok", count: 1 });
    assert.equal((await setVote(db, { type: "player", id: "pending-review" }, a, true)).status, "missing");
    assert.equal((await setVote(db, { type: "web", id: "approved-review" }, a, true)).status, "missing");
    const data = await catalog(db);
    assert.equal(data.reviews.find(r => r.id === "approved-review")?.helpful, 1);
    assert.equal(data.external.find(e => e.id === "external-review")?.helpful, 1);
  } finally { await engine.close(); }
});

test("helpful votes are rate limited per voter", async () => {
  const { engine, db } = await setup();
  try {
    const now = new Date().toISOString();
    await db.insert(reviewVotes).values(Array.from({ length: VOTES_PER_HOUR }, (_, i) => ({ reviewType: "web" as const, reviewId: `other-${i}`, voter: "busy", createdAt: now })));
    assert.equal((await setVote(db, { type: "player", id: "approved-review" }, "busy", true)).status, "limited");
    assert.equal((await setVote(db, { type: "player", id: "approved-review" }, "busy", false)).status, "ok");
  } finally { await engine.close(); }
});

test("a vote's review leads back to its product page", async () => {
  const { engine, db } = await setup();
  try {
    assert.equal(await reviewProductSlug(db, { type: "player", id: "approved-review" }), "nox-test-2025");
    assert.equal(await reviewProductSlug(db, { type: "web", id: "external-review" }), "nox-test-2025");
    assert.equal(await reviewProductSlug(db, { type: "web", id: "approved-review" }), null);
  } finally { await engine.close(); }
});
