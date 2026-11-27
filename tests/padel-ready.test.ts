import { test } from "node:test";
import assert from "node:assert/strict";
import { padelReady, padelReadyIds, padelNew, PADEL_READY } from "../lib/thread/padel-ready";

const NOW = Date.parse("2026-11-26T12:00:00Z"), OLD = "2026-09-01T00:00:00Z", NEW = "2026-11-10T00:00:00Z";

test("the owner's rule: fewer than 3 reviews AND fewer than 3 votes hides a racket", () => {
  assert.equal(padelReady({ reviews: 2, votes: 2, createdAt: OLD }, NOW), false);
  assert.equal(padelReady({ reviews: 0, votes: 0, createdAt: OLD }, NOW), false);
  assert.equal(padelReady({ reviews: 3, votes: 0, createdAt: OLD }, NOW), true, "3 reviews is enough");
  assert.equal(padelReady({ reviews: 0, votes: 3, createdAt: OLD }, NOW), true, "3 votes is enough");
});

test("rackets added in the last 30 days are exempt; the exemption ends on its own", () => {
  assert.equal(padelNew({ createdAt: NEW }, NOW), true);
  assert.equal(padelReady({ reviews: 0, votes: 0, createdAt: NEW }, NOW), true);
  assert.equal(padelReady({ reviews: 0, votes: 0, createdAt: NEW }, NOW + 30 * 86_400_000), false);
  assert.equal(padelNew({ createdAt: "not a date" }, NOW), false);
  assert.equal(PADEL_READY.newDays, 30);
});

test("counts per id; a racket comes back once it passes a bar", () => {
  const items = [{ id: "a", createdAt: OLD }, { id: "b", createdAt: OLD }];
  const reviews = new Map([["a", 2]]), votes = new Map([["b", 1]]);
  assert.deepEqual([...padelReadyIds(items, { reviews, votes }, NOW)], []);
  reviews.set("a", 3);
  assert.deepEqual([...padelReadyIds(items, { reviews, votes }, NOW)], ["a"]);
});

// DiscGolfRecs and SkinRecs (owner 2026-11-27): only products with nothing come off lists (1 review or 3 votes, 30-day exemption).
test("disc golf / skin bar: one review or three votes lists a product; new products stay listed", () => {
  const cfg = { reviews: 1, votes: 3, newDays: 30 }, now = Date.parse("2026-11-27T00:00:00Z"), old = "2026-09-01T00:00:00Z";
  assert.equal(padelReady({ reviews: 0, votes: 0, createdAt: old }, now, cfg), false);
  assert.equal(padelReady({ reviews: 1, votes: 0, createdAt: old }, now, cfg), true);
  assert.equal(padelReady({ reviews: 0, votes: 2, createdAt: old }, now, cfg), false);
  assert.equal(padelReady({ reviews: 0, votes: 3, createdAt: old }, now, cfg), true);
  assert.equal(padelReady({ reviews: 0, votes: 0, createdAt: "2026-11-20T00:00:00Z" }, now, cfg), true);
});
