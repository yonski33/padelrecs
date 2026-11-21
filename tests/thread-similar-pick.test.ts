import { test } from "node:test";
import assert from "node:assert/strict";
import { pickSimilar, type SimSpec } from "../lib/thread/similar-pick";

const s = (id: string, o: Partial<SimSpec> = {}): SimSpec => ({ id, family: `f-${id}`, year: 2026, shape: "Round", feel: "Soft", balance: "Low",
  levels: ["intermediate"], style: "control", tags: 0.5, votes: 20, ...o });
const self = s("self");

test("similar rackets: 4, closest first, never itself, its model or Often compared with", () => {
  const all = [self, s("own", { family: "f-self", year: 2025 }), s("a", { tags: 0.9 }), s("b"), s("c", { shape: "Diamond", style: "power", feel: "Hard", tags: 0.1 }),
    s("d", { tags: 0.7 }), s("e", { tags: 0.6 }), s("cmp", { tags: 1 })];
  assert.deepEqual(pickSimilar(self, all, new Set(["cmp"])), ["a", "d", "e", "b"]);
});

test("similar rackets: a model's older year never shows when a newer one is listed; one per model", () => {
  const all = [self, s("old", { family: "f-x", year: 2024, tags: 1 }), s("new", { family: "f-x", year: 2026, tags: 0.2 }), s("new2", { family: "f-x", year: 2026, tags: 0.1 })];
  assert.deepEqual(pickSimilar(self, all, new Set()), ["new"]);
});

test("similar rackets: current years first; old years only fill up to 3", () => {
  const all = [self, s("a"), s("b", { year: 2025 }), s("o1", { year: 2023, tags: 1 }), s("o2", { year: 2022, tags: 0.9 })];
  assert.deepEqual(pickSimilar(self, all, new Set()), ["a", "b", "o1"]);
  assert.deepEqual(pickSimilar(self, [self, s("a"), s("b"), s("c"), s("d"), s("o1", { year: 2023, tags: 1 })], new Set()), ["a", "b", "c", "d"]);
});

test("similar rackets: a thin-data racket (no tag match) still gets its closest specs", () => {
  const thin = s("thin", { tags: 0, votes: 1 });
  const all = [thin, s("a", { tags: 0 }), s("b", { tags: 0, shape: "Diamond", style: "power" }), s("c", { tags: 0, feel: "Hard" }), s("d", { tags: 0, levels: ["advanced"] })];
  assert.deepEqual(pickSimilar(thin, all, new Set()), ["a", "c", "d", "b"]);
});
