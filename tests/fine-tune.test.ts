import { test } from "node:test";
import assert from "node:assert/strict";
import { shapeOf, gramsOf, weightOf, readFine, fineHidden, fineFit, fineMismatches, feelClasses } from "../lib/fine-tune";
import { spreadMatch } from "../lib/match-score";
import { readChoice, choiceHref } from "../lib/quick-match";

test("specs map to fine-tune classes", () => {
  assert.equal(shapeOf("Diamond (oversized)"), "diamond");
  assert.equal(shapeOf("Teardrop"), "hybrid");
  assert.equal(shapeOf(null), null);
  assert.equal(gramsOf("360–375 g"), 367.5);
  assert.equal(weightOf(gramsOf("345–360 g")), "light");
  assert.equal(weightOf(gramsOf("370 g")), "heavy");
});

test("shape is a hard filter, weight and feel only boost, and mismatches read as soft reasons", () => {
  const f = readFine({ shape: "diamond", weight: "light", feel: "soft" });
  assert.ok(fineHidden(f, { shape: "round", grams: 350, feel: "soft", forgiveness: 50 }));
  assert.ok(fineHidden(f, { shape: null, grams: 350, feel: "soft", forgiveness: 50 }), "unknown shape is hidden only when a shape is picked");
  assert.ok(!fineHidden({}, { shape: null, grams: 350, feel: "soft", forgiveness: 50 }));
  assert.ok(fineFit(f, { shape: "diamond", grams: 350, feel: "soft", forgiveness: 50 })! > fineFit(f, { shape: "diamond", grams: 375, feel: "firm", forgiveness: 50 })!);
  assert.match(fineMismatches(f, { shape: "diamond", grams: 375, feel: "soft", forgiveness: 50 }, "370–380 g")[0], /Heavier than you asked for \(370–380 g\)/);
});

test("feel is split into catalog thirds", () => {
  const c = feelClasses(new Map([["a", -0.9], ["b", -0.5], ["c", -0.1], ["d", 0.0], ["e", 0.3], ["f", 0.8]]));
  assert.equal(c.get("a"), "firm"); assert.equal(c.get("f"), "soft"); assert.equal(c.get("d"), "medium");
});

test("fine-tune picks travel in the URL", () => {
  const c = readChoice({ style: "power", level: "advanced", shape: "diamond", weight: "light", sweet: "1" });
  assert.equal(choiceHref(c, ""), "/?style=power&level=advanced&shape=diamond&weight=light&sweet=1");
});

test("spread: no two neighbours in a band share a % unless truly equal", () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({ id: `r${i}`, kind: "good" as const, fit: 0.9, tie1: 80 - i, tie2: 50 }));
  const p = rows.map(r => spreadMatch(rows).get(r.id)!);
  for (let i = 1; i < p.length; i++) assert.ok(p[i] < p[i - 1]);
  assert.ok(p.every(x => x >= 70 && x <= 99));
  const same = spreadMatch([{ id: "a", kind: "good", fit: 0.8, tie1: 1, tie2: 1 }, { id: "b", kind: "good", fit: 0.8, tie1: 1, tie2: 1 }]);
  assert.ok(Math.abs(same.get("a")! - same.get("b")!) <= 30);
});
