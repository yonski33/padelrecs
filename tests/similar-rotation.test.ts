import { test } from "node:test";
import assert from "node:assert/strict";
import { similarRotation } from "../lib/similar";

const pool = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}` }));

test("similar products: 4 drawn from the whole pool, in closest-first order", () => {
  const picks = similarRotation(pool, "seed-a");
  assert.equal(picks.length, 4);
  const at = picks.map(x => pool.indexOf(x));
  assert.deepEqual(at, [...at].sort((a, b) => a - b));
});

test("different seeds reach every product in the pool", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) for (const x of similarRotation(pool, `s${i}`)) seen.add(x.id);
  assert.equal(seen.size, 12);
});

test("a fixed count keeps that many of the closest in place; a short pool shows what there is", () => {
  assert.deepEqual(similarRotation(pool, "x", 4, 2).slice(0, 2).map(x => x.id), ["p0", "p1"]);
  assert.deepEqual(similarRotation(pool.slice(0, 3), "x").map(x => x.id), ["p0", "p1", "p2"]);
  assert.deepEqual(similarRotation([], "x"), []);
});
