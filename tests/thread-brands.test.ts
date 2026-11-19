import { test } from "node:test";
import assert from "node:assert/strict";
import { brandIntro } from "../lib/thread/brand-intro";

// Thread brand pages (owner 2026-11-19): a plain intro from the numbers, counts under 5 left out, no "we", no dashes.
test("brand intro: plain, counts under 5 hidden", () => {
  assert.equal(brandIntro("Nox", 18, 1240, { name: "AT10 Genius 18K (2026)", score: 91 }), "Nox: 18 current rackets, 1,240 player reviews. Top player score: 91, the AT10 Genius 18K (2026).");
  assert.equal(brandIntro("Kuikma", 3, 4, null), "Kuikma rackets that players have reviewed.");
  assert.equal(brandIntro("Siux", 4, 60, null), "Siux: 60 player reviews.");
  for (const s of [brandIntro("Nox", 18, 1240, { name: "X", score: 90 }), brandIntro("A", 1, 1, null)]) { assert.doesNotMatch(s, /\b(we|us|our)\b|—|–/i); assert.ok(s.length <= 105, s); }
});
