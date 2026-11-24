import { test } from "node:test";
import assert from "node:assert/strict";
import { levelSuits, type SuitsInput } from "../lib/level-suits";
import { passesLevel, quickMatch, type LevelEvidence } from "../lib/quick-match";
import { fitVerdict } from "../lib/fit-verdict";
import { padel } from "../lib/niche/padel";

// Owner 2026-11-15: pro lines the brand labels advanced "can never show if someone picks intermediate", and never for beginners.
const pro = (padel.fit?.proLines ?? []).map(p => new RegExp(p, "i"));
const isPro = (name: string) => pro.some(re => re.test(name));
const gate = padel.fit!.levelGate!;
const advanced = { from: 2, to: 2 };
const suitsFor = (name: string, x: SuitsInput = {}) => levelSuits({ brand: advanced, ...x, proLine: isPro(name) });
const passes = (s: ReturnType<typeof levelSuits>, level: "beginner" | "intermediate" | "advanced") => passesLevel({ liked: {}, suits: s }, level, gate);

const NAMED = ["Adidas Metalbone HRD+ 3.4 2025", "Adidas Metalbone HRD+ 3.5 2026", "Adidas Metalbone 3.5 2026", "Head Coello Pro 2026", "Bullpadel Neuron 02 Edge 2027",
  "Bullpadel Neuron 02 Edge 2026", "Wilson Blade Pro V3 2025", "Wilson Bela Pro V3 2025", "Siux Electra Pro ST5 2026", "Head Speed Pro 2025", "Nox AT10 Pro EDT 2026"];

test("padel: a 'Pro' in the model name never sets the level (owner 2026-11-17, 'the pro comes from the brand')", () => {
  assert.deepEqual(padel.fit?.proLines ?? [], []);
  for (const name of NAMED) {
    assert.ok(!isPro(name), `${name}: no name rule`);
    // Intermediate players who like it and YouTube at intermediate to advanced put it at intermediate, whatever the name.
    const s = suitsFor(name, { players: [{ level: 1, liked: true }, { level: 1, liked: true }, { level: 1, liked: true }, { level: 2, liked: true }], youtube: { from: 1, to: 2, channels: 3 } });
    assert.ok(passes(s, "intermediate"), `${name} intermediate ${s.intermediate}`);
  }
});

test("control and family lines are not pro lines", () => {
  for (const name of ["Adidas Metalbone CTRL 3.5 2026", "Adidas Metalbone Carbon CTRL 3.4 2025", "Adidas Metalbone Team 2026", "Bullpadel Vertex 05 Hybrid 2026", "Head Extreme Motion 2025", "Wilson Endure V1 2026"])
    assert.ok(!isPro(name), name);
});

test("3+ intermediate players vouching lift the intermediate cap; the brand's label alone never does the capping", () => {
  const vouched = suitsFor("Bullpadel Neuron 02 2026", { players: [{ level: 1, liked: true }, { level: 1, liked: true }, { level: 1, liked: null }, { level: 2, liked: true }] });
  assert.ok(vouched.intermediate > 35 && passes(vouched, "intermediate"));
  // No name rule on padel: beginners stay out on the brand's "advanced" and the players' levels, not the name.
  assert.ok(!passes(vouched, "beginner"), "still not for beginners");
  // Not a pro line, no advanced voices: the brand's "advanced" stays a nudge.
  assert.equal(levelSuits({ brand: advanced }).intermediate, 50);
  // A pro line the brand calls intermediate-advanced keeps its intermediate score; beginners still don't get it.
  const ia = levelSuits({ brand: { from: 1, to: 2 }, proLine: true });
  assert.equal(ia.intermediate, 50); assert.ok(ia.beginner <= 25);
});

test("demanding or advanced voices (3+) cap it like a pro line", () => {
  const s = levelSuits({ brand: advanced, demanding: 2, players: [{ level: 2, liked: true }] });
  assert.ok(s.intermediate <= 35 && s.beginner <= 25 && s.basis.includes("advanced players"));
  const yt = levelSuits({ brand: advanced, youtube: { from: 2, to: 2, channels: 3 } });
  assert.ok(yt.intermediate <= 35);
});

test("the fit check says why: a pro line is 'not aimed at intermediates', not a made-up player claim", () => {
  // The generic rule, for a site that keeps name rules (padel has none since 2026-11-17).
  const s = levelSuits({ brand: advanced, proLine: true });
  const v = fitVerdict({ style: "power", level: "intermediate", arm: false }, { reports: 40, tags: { "easy power": 9 }, suits: s });
  assert.equal(v.kind, "no");
  assert.ok(v.reasons.some(r => /pro line, built for advanced players/.test(r)), v.reasons.join(" | "));
});

test("quick match only offers rackets that pass the level gate", () => {
  const pool = ["a", "b", "c"].map(id => ({ id, reviews: 30, positive: 25, mixed: 3, negative: 2, tags: { "easy power": 8 }, shape: null, lists: {} }));
  const lv: Record<string, LevelEvidence> = { a: { liked: {}, suits: { beginner: 20, intermediate: 35, advanced: 85 } }, b: { liked: {}, suits: { beginner: 70, intermediate: 80, advanced: 60 } }, c: { liked: {} } };
  const ids = (level: "beginner" | "intermediate" | "advanced") => quickMatch(pool, padel.finder!, { style: "power", level, arm: false }, { signal: () => 80, negativeTags: [], level: id => lv[id], count: 10, levelGate: gate }).map(m => m.product.id).sort();
  assert.deepEqual(ids("intermediate"), ["b", "c"]);
  assert.deepEqual(ids("advanced"), ["a", "b", "c"]);
  assert.deepEqual(ids("beginner"), ["b", "c"]);
});

test("diamonds stay out of the beginner list (owner 2026-11-15), except vouched ones; no name exceptions (owner 2026-11-16)", () => {
  for (const name of ["Head Extreme Motion 2025", "Oxdog Ultimate Tour X 2026"]) {
    const s = levelSuits({ brand: { from: 1, to: 2 }, hardShape: true, players: [{ level: 0, liked: true }, { level: 1, liked: true }], forgiveness: { P: 20, C: 1 } });
    assert.ok(s.beginner <= 25 && !passes(s, "beginner"), name);
    assert.ok(passes(s, "intermediate"), `${name} still shows for intermediates`);
  }
  // Match audit 2026-11-16 (owner decision): no beginnerLines; a racket reaches beginners through its suits (the expert level).
  assert.deepEqual(padel.fit?.beginnerLines ?? [], []);
  const women = levelSuits({ brand: advanced, hardShape: true });
  assert.ok(!passes(women, "beginner"), "an advanced-brand diamond no longer reaches beginners by its name");
  const vouched = levelSuits({ hardShape: true, players: [0, 0, 0].map(level => ({ level, liked: true })) });
  assert.ok(vouched.beginner > 25);
  const v = fitVerdict({ style: "power", level: "beginner", arm: false }, { reports: 40, tags: { "easy power": 9 }, suits: levelSuits({ hardShape: true, players: [{ level: 1, liked: true }] }) });
  assert.equal(v.kind, "no"); assert.ok(v.reasons.some(r => /diamond shape/.test(r)), v.reasons.join(" | "));
});
