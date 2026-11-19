import { test } from "node:test";
import assert from "node:assert/strict";
import { advise, adviceLine, betterFits, type AdvCandidate, type AdvFacts, type AdvPicks } from "../lib/thread/fit-advice";

// "Is it right for me?" advice (owner 2026-11-19): answers the picks, words only, 1-2 better fits under 60%, 1 at 60-79%.
const ADV: AdvFacts = { suits: { beginner: 20, intermediate: 66, advanced: 85 }, styleDots: { power: 4, control: 4 }, armDots: 2,
  feel: "firm", forgiveness: 40, headHeavy: true, control: 45, power: 80, arm: 40 };
const EASY: AdvFacts = { suits: { beginner: 85, intermediate: 85, advanced: 45 }, styleDots: { power: 3, control: 3 }, armDots: 5,
  feel: "soft", forgiveness: 85, headHeavy: false, control: 62, power: 60, arm: 90 };
const beg = (style: AdvPicks["style"], arm = false): AdvPicks => ({ level: "beginner", style, arm });
const cand = (id: string, pct: number, brand = "X", shape: string | null = null): AdvCandidate => ({ id, name: `Racket ${id}`, href: `/rackets/${id}`, pct, brand, shape });

test("a low match says why it misses, in the player's terms", () => {
  assert.equal(adviceLine(beg("balance"), ADV, 36), "Made for intermediate and up, so it asks more than a beginner wants.");
  assert.equal(adviceLine({ level: "intermediate", style: "balance", arm: true }, ADV, 37), "Stiff and head-heavy, hard on a sore arm.");
  assert.equal(adviceLine({ level: "advanced", style: "power", arm: false }, EASY, 30), "Made for beginners and intermediates, so an advanced player may outgrow it.");
});

test("a mid match says what fits and what doesn't; a high match says why it fits", () => {
  assert.equal(adviceLine(beg("control"), { ...EASY, control: 45, power: 80 }, 70), "Forgiving, but a bit lively for a beginner.");
  assert.equal(adviceLine(beg("balance"), EASY, 88), "Forgiving and well balanced, a good fit for a beginner.");
  assert.equal(adviceLine(beg("control", true), EASY, 85), "Easy on the arm and forgiving, a good fit for a beginner who wants control.");
});

test("lines stay short, plain and free of counts", () => {
  const picks: AdvPicks[] = (["beginner", "intermediate", "advanced"] as const).flatMap(level =>
    (["control", "balance", "power"] as const).flatMap(style => [false, true].map(arm => ({ level, style, arm }))));
  for (const p of picks) for (const f of [ADV, EASY, {}]) for (const pct of [30, 65, 90]) {
    const line = adviceLine(p, f, pct);
    assert.ok(line.length <= 105, line); assert.ok(!/[—\d]|\bwe\b|test/i.test(line), line);
  }
});

test("better fits: 10+ points higher, best first, same brand or shape preferred when close", () => {
  const own = { pct: 40, brand: "Babolat", shape: "round" };
  const pool = [cand("a", 92), cand("b", 90, "Babolat"), cand("c", 88, "Y", "round"), cand("d", 45)];
  // Within 5 points of the best, the same brand wins, then the same shape.
  assert.deepEqual(betterFits(own, pool, 2).map(c => c.id), ["b", "c"]);
  assert.deepEqual(betterFits({ ...own, brand: "Nox", shape: null }, pool, 2).map(c => c.id), ["a", "b"]);
  assert.deepEqual(betterFits(own, pool, 1).map(c => c.id), ["b"]);
  assert.deepEqual(betterFits({ ...own, pct: 85 }, pool, 2).map(c => c.id), []);
});

test("how many suggestions each band gets", () => {
  const pool = [cand("a", 95), cand("b", 93), cand("c", 91)];
  assert.equal(advise(beg("balance"), ADV, { pct: 40, brand: "", shape: null }, pool).better.length, 2);
  assert.equal(advise(beg("balance"), ADV, { pct: 70, brand: "", shape: null }, pool).better.length, 1);
  assert.equal(advise(beg("balance"), EASY, { pct: 84, brand: "", shape: null }, pool).better.length, 0);
});
