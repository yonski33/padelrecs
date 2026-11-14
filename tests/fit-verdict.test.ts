import { test } from "node:test";
import assert from "node:assert/strict";
import { bestFor, combinedBand, fitVerdict, levelBacking, styleLean, MIN_FIT_REPORTS, type FitFacts } from "../lib/fit-verdict";
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

test("level band from brand, reviewers and players; disagreement is a demo-first and says who", () => {
  const maker = { from: 0, to: 1, words: "Beginner / Intermediate", url: "https://example.com" };
  const all: FitFacts = { ...ctrl, band: { from: 0, to: 1 }, levels: { maker, youtube: { from: 0, to: 1, channels: 3, of: 4 } } };
  assert.equal(levelBacking(all), "the brand, 3 reviewers and players say beginner to intermediate");
  const v = fitVerdict(pick({ style: "control", level: "beginner" }), all);
  assert.equal(v.kind, "good");
  assert.ok(v.reasons.some(r => r.startsWith("Level: the brand, 3 reviewers and players say beginner to intermediate")));
  // Players put it higher than the brand and reviewers: a beginner gets "maybe", and the reason names the players.
  const split: FitFacts = { ...all, band: { from: 1, to: 2 } };
  const s = fitVerdict(pick({ style: "control", level: "beginner" }), split);
  assert.equal(s.kind, "maybe");
  assert.ok(s.reasons.some(r => r.includes("players say intermediate to advanced") && r.includes("Players don't put it at beginner")));
  assert.deepEqual(combinedBand(split), { from: 0, to: 1 }, "levels at least half the sources include (advanced: players only)");
  // Every source excludes it: probably not.
  assert.equal(fitVerdict(pick({ level: "advanced" }), all).kind, "no");
});

test("a brand's 'Professional' label: not aimed at beginners, but not counted against intermediates", () => {
  const pro: FitFacts = { ...ctrl, band: { from: 0, to: 1 }, levels: { maker: { from: 2, to: 2, words: "Level: Professional", url: "https://example.com" }, youtube: { from: 0, to: 1, channels: 2, of: 3 } } };
  assert.equal(fitVerdict(pick({ level: "intermediate", style: "control" }), pro).kind, "good");
  const b = fitVerdict(pick({ level: "beginner", style: "control" }), pro);
  assert.equal(b.kind, "maybe");
  assert.ok(b.reasons.some(r => r.includes("The brand doesn't put it at beginner")));
});

test("sore arm: the owner's bar is 3 arm-friendly mentions; under it the verdict says so", () => {
  const two: FitFacts = { ...ctrl, tags: { ...ctrl.tags, "arm-friendly": 2, "vibrates on mishits": 0 } };
  const v = fitVerdict(pick({ style: "control", level: "beginner", arm: true }), two);
  assert.ok(v.reasons.some(r => r.startsWith("Sore arm: only 2 players call it arm-friendly")));
  const three: FitFacts = { ...ctrl, tags: { ...ctrl.tags, "arm-friendly": 3, "vibrates on mishits": 0 } };
  assert.ok(fitVerdict(pick({ style: "control", level: "beginner", arm: true }), three).reasons.some(r => r.includes("3 players call it arm-friendly")));
});

test("brand's own short term in the backing line", () => {
  const f: FitFacts = { ...ctrl, band: { from: 1, to: 2 }, levels: { maker: { from: 2, to: 2, words: "Level: Professional", url: "https://e.com" } } };
  assert.equal(levelBacking(f), "the brand says professional · players say intermediate to advanced");
  const g: FitFacts = { ...ctrl, band: { from: 1, to: 2 }, levels: { maker: { from: 1, to: 2, words: "Level: Intermediate - Advanced", url: "https://e.com" } } };
  assert.equal(levelBacking(g), "the brand and players say intermediate to advanced", "agreeing sources share one range");
});
