import { test } from "node:test";
import assert from "node:assert/strict";
import { sortProducts, positiveShare, parseSort } from "../lib/product-sort";

const item = (name: string, s: Partial<{ count: number; average: string | null; web: number; judged: number; positive: number }>, createdAt = "2026-01-01") =>
  ({ r: { name, createdAt }, s: { count: 0, average: null, web: 0, judged: 0, positive: 0, ...s } });

test("most positive needs 5 judged reviews and favours bigger samples", () => {
  const list = [item("tiny", { web: 1, judged: 1, positive: 1 }), item("five", { web: 5, judged: 5, positive: 5 }), item("forty", { web: 40, judged: 40, positive: 38 })];
  assert.deepEqual(sortProducts(list, "positive").map(x => x.r.name), ["forty", "five", "tiny"]);
  assert.equal(positiveShare(list[0].s), null);
  assert.equal(positiveShare(list[2].s), 95);
});

test("old Highest rated links land on Most positive", () => {
  assert.equal(parseSort("rated"), "positive");
});

test("unknown sort falls back to most discussed", () => {
  assert.equal(parseSort("nonsense"), "discussed");
  const list = [item("a", { web: 1 }), item("b", { count: 2, web: 3 })];
  assert.deepEqual(sortProducts(list, parseSort(undefined)).map(x => x.r.name), ["b", "a"]);
});
