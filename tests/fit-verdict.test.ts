import { test } from "node:test";
import assert from "node:assert/strict";
import { bestFor, fitVerdict, styleLean, MIN_FIT_REPORTS, type FitFacts } from "../lib/fit-verdict";
import { DEFAULT_CHOICE, type QuickChoice } from "../lib/quick-match";

const ctrl: FitFacts = { reports: 60, tags: { "good control": 20, "great in defence": 6, "easy power": 4, forgiving: 10, "arm-friendly": 8, "vibrates on mishits": 1 }, band: { from: 0, to: 1 } };
const pow: FitFacts = { reports: 60, tags: { "easy power": 18, "great on smashes": 9, "good control": 3, demanding: 7, forgiving: 1, "vibrates on mishits": 6, "arm-friendly": 1 } };
const pick = (c: Partial<QuickChoice>): QuickChoice => ({ ...DEFAULT_CHOICE, ...c });

test("lean from what players praise", () => {
  assert.equal(styleLean(ctrl).lean, "control");
  assert.equal(styleLean(pow).lean, "power");
  assert.equal(styleLean({ reports: 30, tags: { "good control": 6, "easy power": 5 } }).lean, "balance");
  assert.equal(styleLean({ reports: 30, tags: {} }).lean, null);
});

test("good match: style, level and arm all fit, with reasons that carry counts", () => {
  const v = fitVerdict(pick({ style: "control", level: "beginner", arm: true }), ctrl);
  assert.equal(v.kind, "good");
  assert.ok(v.reasons.length >= 2 && v.reasons.length <= 3);
  assert.ok(v.reasons.some(r => r.includes("26 players praise the control")));
  assert.ok(v.reasons.some(r => r.includes("8 players call it arm-friendly")));
});

test("maybe: one soft conflict (balance vs a control racket)", () => {
  assert.equal(fitVerdict(pick({ style: "balance", level: "intermediate" }), ctrl).kind, "maybe");
});

test("probably not: opposite style, level outside the band, or a sore arm on a vibrating racket", () => {
  assert.equal(fitVerdict(pick({ style: "power" }), ctrl).kind, "no");
  assert.equal(fitVerdict(pick({ level: "advanced" }), ctrl).kind, "no");
  assert.equal(fitVerdict(pick({ arm: true }), pow).kind, "no");
  assert.equal(fitVerdict(pick({ level: "beginner", style: "power" }), pow).kind, "no", "demanding beats forgiving for a beginner");
});

test("thin data: never a confident verdict", () => {
  assert.equal(fitVerdict(pick({ style: "control" }), { ...ctrl, reports: MIN_FIT_REPORTS - 1 }).kind, "thin");
  const v = fitVerdict(pick({ level: "advanced", arm: true }), { reports: 40, tags: {} });
  assert.equal(v.kind, "thin");
  assert.equal(v.label, "Not enough reports from players like you yet");
});

test("generally best for: only what the data supports", () => {
  assert.deepEqual(bestFor(ctrl), ["beginner → intermediate", "control players", "sore arms"]);
  assert.deepEqual(bestFor(pow), ["power players"]);
});
