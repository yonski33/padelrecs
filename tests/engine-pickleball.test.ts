import { test } from "node:test";
import assert from "node:assert/strict";
import { engineScore, engineFit, type EngineBase } from "../lib/engine";
import { pickleball } from "../lib/niche/pickleball";
import { padel } from "../lib/niche/padel";

// The PickleballRecs addendum to the match audit (PM 2026-11-16): the fine-tune pick only ever costs points, and spin is a
// pick of its own (players' spin talk, off the control–power axis).
const P = pickleball.fit!.engine!;
const t = (v: number) => ({ v, sd: 0.05 });
const base: EngineBase = { axis: 0.6, axisN: 8, playerAxis: null, Q: 0.7, sdQ: 0.04, pop: 0.5, n: 40,
  tr: { control: t(0.6), power: t(0.7), arm: t(0.5), spin: t(0.85) } };

test("pickleball and padel: a fine-tune pick never raises the score, and a perfect fit costs nothing", () => {
  for (const p of [P, padel.fit!.engine!]) {
    assert.equal(p.finePenalty, 0.35);
    for (const style of ["any", "control", "balance", "power"] as const) {
      const plain = engineScore(base, { style }, p).score;
      assert.equal(engineScore(base, { style, fine: 1 }, p).score, plain);
      for (const fine of [0, 0.3, 0.7]) assert.ok(engineScore(base, { style, fine }, p).score < plain, `${style} fine ${fine}`);
    }
  }
});

test("pickleball: spin is a pick, scored by players' spin talk", () => {
  assert.ok(P.styles?.includes("spin"));
  assert.deepEqual(engineFit(base, "spin", P), [0.85, 0.05]);
  const hi = engineScore(base, { style: "spin" }, P).score;
  const lo = engineScore({ ...base, tr: { ...base.tr, spin: t(0.3) } }, { style: "spin" }, P).score;
  assert.ok(hi > lo);
});

test("label clamp: pickleball only while players say little, padel always", () => {
  assert.equal(P.labelClamp, "weakEvidence");
  assert.equal(padel.fit!.engine!.labelClamp, "always");
});
