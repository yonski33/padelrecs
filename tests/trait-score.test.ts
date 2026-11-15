import { test } from "node:test";
import assert from "node:assert/strict";
import { traitScores, dotsFor, MIN_TAGGED, type TraitInput } from "../lib/trait-score";

const r = (id: string, tagged: number, tags: Record<string, number>, override?: TraitInput["override"]): TraitInput => ({ id, tagged, tags, override });

test("ranks against the catalog: most power mentions per report scores highest", () => {
  const m = traitScores([r("a", 40, { "easy power": 20 }), r("b", 40, { "easy power": 8 }), r("c", 40, { "easy power": 3 })]);
  assert.equal(m.get("a")!.power!.score, 99);
  assert.equal(m.get("c")!.power!.score, 0);
  assert.ok(m.get("b")!.power!.score > 0 && m.get("b")!.power!.score < 99);
  assert.equal(m.get("a")!.power!.dots, 5);
  assert.equal(m.get("c")!.power!.dots, 1);
});

test("negatives count against: vibration lowers arm comfort", () => {
  const m = traitScores([r("a", 30, { "arm-friendly": 6 }), r("b", 30, { "arm-friendly": 6, "vibrates on mishits": 6 })]);
  assert.ok(m.get("a")!.arm!.score > m.get("b")!.arm!.score);
});

test("thin data: no score under the report or mention bar", () => {
  const m = traitScores([r("thin", MIN_TAGGED - 1, { forgiving: 6 }), r("one", 30, { forgiving: 1 }), r("ok", 30, { forgiving: 6 }), r("ok2", 30, { forgiving: 3 })]);
  assert.equal(m.get("thin")!.forgiveness, null);
  assert.equal(m.get("one")!.forgiveness, null);
  assert.ok(m.get("ok")!.forgiveness);
});

test("smoothing: a few reports with all mentions don't beat many reports with most", () => {
  const m = traitScores([r("few", 8, { "good control": 8 }), r("many", 80, { "good control": 70 }), r("low", 60, { "good control": 6 })]);
  assert.ok(m.get("many")!.control!.score > m.get("few")!.control!.score);
});

test("an owner's override wins, even on thin data", () => {
  const m = traitScores([r("a", 3, {}, { speed: 85 }), r("b", 30, { "fast at the net": 5 })]);
  assert.deepEqual([m.get("a")!.speed!.score, m.get("a")!.speed!.dots, m.get("a")!.speed!.set], [85, 5, true]);
  assert.equal(dotsFor(19), 1); assert.equal(dotsFor(20), 2); assert.equal(dotsFor(99), 5);
});
