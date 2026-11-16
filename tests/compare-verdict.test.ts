import { test } from "node:test";
import assert from "node:assert/strict";
import { compareVerdict, differRows, superlative, catchShort, MAX_LINE, type VProduct, type VTrait } from "../lib/compare-verdict";

// The compare verdict (owner 2026-11-17): built from data only, expert voice, every line ≤ 105 characters, never filler.
const T: VTrait[] = [
  { label: "Forgiveness", diff: "more forgiving", ifYou: "want margin for error" },
  { label: "Power", diff: "more power", ifYou: "win points with smashes" },
  { label: "Speed", diff: "quicker", ifYou: "want fast hands at the net" },
];
const P: VProduct[] = [
  { id: "ctrl", short: "Metalbone CTRL 3.5", signal: 92, dots: [5, 3, 3], catchShort: "less free power on smashes" },
  { id: "tour", short: "Ultimate Tour X", signal: 90, dots: [4, 5, 4], catchShort: "a smaller sweet spot" },
  { id: "nox", short: "AT10 Genius 12K Alum XTREM", signal: 94, dots: [3, 4, 5], catchShort: null },
];
const all = (v: ReturnType<typeof compareVerdict>) => [v.head, ...v.rest].map(l => l.pre + l.name + l.post);

test("the owner's case: get the CTRL 3.5, take the diamond if…, skip the 12K for now (level cap)", () => {
  const v = compareVerdict(P, T, { ctrl: { pct: 95, hard: null, levelWord: "beginner to intermediate" }, tour: { pct: 82, hard: null, levelWord: "intermediate" },
    nox: { pct: 54, hard: "level", levelWord: "advanced" } });
  assert.deepEqual(v.order, ["ctrl", "tour", "nox"]);
  assert.equal(all(v)[0], "Get the Metalbone CTRL 3.5. It's the most forgiving of the three.");
  assert.equal(all(v)[1], "Take the Ultimate Tour X instead if you win points with smashes and can live with a smaller sweet spot.");
  assert.equal(all(v)[2], "Skip the AT10 Genius 12K Alum XTREM for now: built for advanced players.");
  for (const l of all(v)) assert.ok(l.length <= MAX_LINE, l);
});

test("a near tie (within 3 points) says either works, each for its own strength", () => {
  const two = [{ ...P[0], short: "CTRL 3.5" }, { ...P[1], short: "Tour X" }];
  const v = compareVerdict(two, T, { ctrl: { pct: 88, hard: null, levelWord: null }, tour: { pct: 86, hard: null, levelWord: null } });
  assert.equal(all(v)[0], "Either works: pick the CTRL 3.5 if you want margin for error, the Tour X if you win points with smashes.");
  // Too long for one line: the second clause is dropped, never the 105-character rule.
  const long = compareVerdict(P.slice(0, 2), T, { ctrl: { pct: 88, hard: null, levelWord: null }, tour: { pct: 86, hard: null, levelWord: null } });
  assert.ok(all(long)[0].length <= MAX_LINE && all(long)[0].startsWith("Either works: pick the Metalbone CTRL 3.5"));
});

test("before picks: the best score leads, the others by their own strength, no filler line", () => {
  const v = compareVerdict([...P, { id: "flat", short: "Plain One", signal: 50, dots: [3, 3, 3], catchShort: null }], T, null, "player score");
  assert.equal(v.picked, false);
  assert.equal(all(v)[0], "The AT10 Genius 12K Alum XTREM has the best player score here and is the quickest.");
  assert.ok(all(v).every(l => !/close to the others/.test(l)));
  assert.equal(v.rest.length, 2, "no line for a product with no lead of its own");
});

test("words: superlatives, differ rows hide ties, catch cut short", () => {
  assert.equal(superlative("more forgiving"), "the most forgiving");
  assert.equal(superlative("easier on the arm"), "the easiest on the arm");
  assert.equal(superlative("better in defence"), "the best in defence");
  assert.deepEqual(differRows(P, T).map(r => `${r.label} → ${r.id}`), ["More forgiving → ctrl", "More power → tour", "Quicker → nox"]);
  assert.deepEqual(differRows([P[0], { ...P[1], dots: [5, 3, 3] }], T), []);
  assert.equal(catchShort("Smaller sweet spot; flat smashes need your own arm."), "smaller sweet spot");
});

test("3 points apart is a clear pick; a product with no lead uses its own strongest trait, never 'Skip' at a high match", () => {
  const flat = [P[0], { ...P[1], dots: [4, 3, 3] }];
  const v = compareVerdict(flat, T, { ctrl: { pct: 95, hard: null, levelWord: null }, tour: { pct: 92, hard: null, levelWord: null } });
  assert.match(all(v)[0], /^Get the Metalbone CTRL 3\.5\./);
  assert.match(all(v)[1], /^Take the Ultimate Tour X instead if you want margin for error/);
});
