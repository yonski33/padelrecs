import { test } from "node:test";
import assert from "node:assert/strict";
import { fitConfigFor, levelCue, tennisPtsHL } from "../lib/fit-config";
import { traitScores, specLean, type TraitInput } from "../lib/trait-score";

const tn = fitConfigFor({ id: "tennis" })!;
const p = (id: string, tags: Record<string, number>, specs?: TraitInput["specs"]): TraitInput => ({ id, tagged: Object.values(tags).reduce((a, b) => a + b, 0), tags, specs });

test("tennis: seven traits from the tag bank, every racket scored, floor 3 except arm / forgiveness", () => {
  assert.deepEqual(tn.traits.map(t => t.key), ["power", "control", "spin", "arm", "maneuverability", "stability", "forgiveness"]);
  assert.deepEqual(tn.complaint, ["arm", "forgiveness"]);
  const pool = Array.from({ length: 12 }, (_, i) => p(`x${i}`, { "good control": i, "easy power": 12 - i, "great spin": 3, stable: i % 3 }));
  for (const s of traitScores(pool, tn).values()) for (const t of tn.traits) { const v = s[t.key]!; assert.ok(v.dots >= 3 && v.dots <= 5, `${t.key} ${v.dots}`); }
});

test("tennis balance: pts HL / HH / even and balance points in mm or cm", () => {
  assert.equal(tennisPtsHL("7 pts HL strung"), 7);
  assert.equal(tennisPtsHL("1 pts HH strung"), -1);
  assert.equal(tennisPtsHL("even balance strung"), 0);
  assert.equal(tennisPtsHL("320 mm"), 7);
  assert.equal(tennisPtsHL("32.0 cm"), 7);
  assert.equal(tennisPtsHL("31.98 cm / 7 pts HL strung"), 7);
});

test("tennis spec prior: big head leans power and forgiveness, 18x20 control, open pattern spin, stiff frame against the arm, light frame quick", () => {
  const big = specLean({ shape: "107 sq in (690 cm²)", weight: "285 g", balance: "8 pts HL", core: "16x18", surface: "70 RA" }, tn);
  assert.ok(big.power > 0 && big.forgiveness > 0 && big.spin > 0 && big.arm < 0 && big.maneuverability > 0 && big.stability < 0);
  const tour = specLean({ shape: "97 sq in", weight: "315 g (11.1 oz)", balance: "315 mm", core: "18x20", surface: "60 RA" }, tn);
  assert.ok(tour.control > 0 && tour.spin < 0 && tour.arm > 0 && tour.stability > 0 && tour.forgiveness < 0);
  // Strung weights count about 15 g heavier than unstrung.
  assert.equal(specLean({ weight: "326 g strung" }, tn).stability, specLean({ weight: "311 g" }, tn).stability);
  // Sold in two patterns: no lean from the pattern.
  assert.equal(specLean({ core: "16x19 or 18x20" }, tn).spin, 0);
});

test("tennis level cues: NTRP numbers, not weights or head sizes", () => {
  assert.equal(levelCue(tn, "I'm a 3.5 player and it suits me"), "intermediate");
  assert.equal(levelCue(tn, "NTRP 4.5, plays tournaments"), "advanced");
  assert.equal(levelCue(tn, "as a 2.5 it's easy to use"), "beginner");
  assert.equal(levelCue(tn, "weighs 300 g with a 100 sq in head"), null);
});

test("tennis heads-up: durability needs a broken frame or grommets, not a negation", () => {
  const h = tn.headsUp![0];
  assert.ok(h.text!.test("the throat cracked after two months"));
  assert.ok(!h.text!.test("plenty of mass to swing"));
});
