import { test } from "node:test";
import assert from "node:assert/strict";
import { traitNote, TRAIT_SAY } from "../lib/trait-note";
import { hasAttribution } from "../lib/voice";
import { TRAITS } from "../lib/trait-score";

test("trait notes: strong, middling and weak read as plain statements", () => {
  assert.equal(traitNote("power", 5, 20, 2), "Easy power; the ball jumps off the face.");
  assert.equal(traitNote("power", 3, 6, 4), "Moderate power; smashes need a full swing.");
  assert.equal(traitNote("power", 1, 1, 9), "Little free power; you supply the pace.");
});

test("trait notes: a real split names both sides; a lopsided one doesn't", () => {
  assert.equal(traitNote("control", 3, 8, 7), "Splits opinion: some find it precise, others hard to control.");
  assert.equal(traitNote("control", 4, 12, 3), TRAIT_SAY.control.hi, "12 against 3 is not a split");
  assert.equal(traitNote("control", 3, 2, 2), TRAIT_SAY.control.mid, "too few reports to call a split");
});

// The old generator built "Lots of players want more power; lots of praise the power" (owner bug, 2026-11-16).
test("trait notes: never a count word without a subject, never who-said-it, always one sentence", () => {
  for (const t of TRAITS) for (const dots of [1, 2, 3, 4, 5]) for (const [p, m] of [[0, 0], [20, 3], [3, 20], [9, 8]]) {
    const n = traitNote(t, dots, p, m);
    assert.ok(!/\b(lots of|many|some|a few|several)\s+(want|praise|find|say|call)\b/i.test(n.replace(/^Splits opinion: some find/, "")), n);
    assert.ok(!hasAttribution(n), n);
    assert.ok(/^[A-Z].*\.$/.test(n) && n.length <= 105, n);
  }
});
