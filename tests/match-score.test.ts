import { test } from "node:test";
import assert from "node:assert/strict";
import { matchScore, matchFit, MATCH_BANDS, type MatchInputs } from "../lib/match-score";
import { DEFAULT_CHOICE, type QuickChoice } from "../lib/quick-match";
import type { FitVerdict } from "../lib/fit-verdict";

const v = (kind: FitVerdict["kind"]): FitVerdict => ({ kind, label: "", icon: "", reasons: [] });
const pick = (c: Partial<QuickChoice>): QuickChoice => ({ ...DEFAULT_CHOICE, ...c });
const base: Omit<MatchInputs, "verdict"> = { control: 80, power: 30, arm: 70, band: { from: 0, to: 1 }, likedAtLevel: 3, signal: 85 };

test("the % always agrees with the verdict: a 'probably not' never beats a 'strong fit'", () => {
  const best = matchScore(pick({ style: "power" }), { ...base, control: 99, power: 99, arm: 99, signal: 99, likedAtLevel: 9, verdict: v("no") })!;
  const worst = matchScore(pick({ style: "power" }), { ...base, control: 0, power: 0, arm: 0, signal: 0, likedAtLevel: 0, band: { from: 2, to: 2 }, verdict: v("good") })!;
  assert.ok(best <= MATCH_BANDS.no[1] && worst >= MATCH_BANDS.good[0] && worst > best);
});

test("thin data: no %", () => {
  assert.equal(matchScore(pick({ style: "control" }), { ...base, verdict: v("thin") }), null);
});

test("style follows the trait scores: a control racket fits a control pick better than a power pick", () => {
  assert.ok(matchFit(pick({ style: "control" }), base) > matchFit(pick({ style: "power" }), base));
});

test("level and arm count: outside the band or a harsh racket for a sore arm lowers the fit", () => {
  assert.ok(matchFit(pick({ level: "beginner" }), base) > matchFit(pick({ level: "advanced" }), base));
  assert.ok(matchFit(pick({ arm: true }), base) > matchFit(pick({ arm: true }), { ...base, arm: 5 }));
  const s = matchScore(pick({ style: "control", level: "beginner", arm: true }), { ...base, verdict: v("good") })!;
  assert.ok(s >= 70 && s <= 99);
});
