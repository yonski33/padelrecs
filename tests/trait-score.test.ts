import { test } from "node:test";
import assert from "node:assert/strict";
import { traitScores, dotsFor, MIN_EVIDENCE as MIN_TAGGED, type TraitInput } from "../lib/trait-score";

const r = (id: string, tagged: number, tags: Record<string, number>, override?: TraitInput["override"]): TraitInput => ({ id, tagged, tags, override });

test("fixed scale: a typical racket is 3 dots, clearly praised ones 4-5, and many can share 5", () => {
  // Balanced praise (control as often as power), so the style lean stays out of it.
  const typical = Array.from({ length: 9 }, (_, i) => r(`t${i}`, 40, { "easy power": 8 + (i % 3), "good control": 8 + (i % 3) }));
  const m = traitScores([...typical, r("a", 40, { "easy power": 30, "good control": 30 }), r("b", 40, { "easy power": 29, "good control": 29 })]);
  assert.equal(m.get("t4")!.power!.dots, 3);
  assert.equal(m.get("a")!.power!.dots, 5);
  assert.equal(m.get("b")!.power!.dots, 5, "no percentile: two standouts both get 5");
});

test("a round, low-balance racket praised for control gets Control 4+ (owner's sanity check)", () => {
  const field = Array.from({ length: 9 }, (_, i) => r(`f${i}`, 40, { "good control": 12 + i, "easy power": 10 }));
  const ctrl: TraitInput = { ...r("ctrl", 50, { "good control": 24, "great in defence": 8, "easy power": 4 }), specs: { shape: "Round", balance: "Low" } };
  const s = traitScores([...field, ctrl]).get("ctrl")!;
  assert.ok(s.control!.dots >= 4 && s.defence!.dots >= 4, `control ${s.control!.dots}, defence ${s.defence!.dots}`);
});

test("specs alone move a trait up at most one dot, and never below 3", () => {
  const field = Array.from({ length: 9 }, (_, i) => r(`f${i}`, 40, { "easy power": 10, "good control": 10, "fast at the net": 6 }));
  const d: TraitInput = { ...r("d", 40, { "easy power": 10, "good control": 10, "fast at the net": 6 }), specs: { shape: "Diamond", balance: "High", weight: "375 g" } };
  const s = traitScores([...field, d]).get("d")!;
  assert.equal(s.power!.dots, 4); assert.equal(s.speed!.dots, 3);
});
test("negatives count against: vibration lowers arm comfort", () => {
  const m = traitScores([r("a", 30, { "arm-friendly": 6 }), r("b", 30, { "arm-friendly": 6, "vibrates on mishits": 6 })]);
  assert.ok(m.get("a")!.arm!.score > m.get("b")!.arm!.score);
});

test("thin data: never blank; specs and reviewers set the base, else 3", () => {
  const m = traitScores([r("thin", MIN_TAGGED - 1, { forgiving: 6 }), { ...r("round", 3, {}), specs: { shape: "Round", balance: "Low" } }, { ...r("yt", 2, {}), youtube: { power: { plus: 2, minus: 0 } } }]);
  assert.deepEqual([m.get("thin")!.forgiveness!.dots, m.get("thin")!.forgiveness!.basis], [3, "none"]);
  assert.deepEqual([m.get("round")!.control!.dots, m.get("round")!.control!.basis], [4, "specs"]);
  assert.equal(m.get("yt")!.power!.dots, 4);
});
test("smoothing: a few reports with all mentions stay close to the middle", () => {
  const field = Array.from({ length: 9 }, (_, i) => r(`f${i}`, 40, { "good control": 10 + i, "easy power": 10 + i }));
  const m = traitScores([...field, r("few", 8, { "good control": 6, "easy power": 6 }), r("many", 80, { "good control": 60, "easy power": 60 })]);
  assert.ok(m.get("many")!.control!.score > m.get("few")!.control!.score);
});

test("3 is the floor; 2 only when 5+ players fault that exact trait, more than praise it; 1 only by hand", () => {
  const field = Array.from({ length: 9 }, (_, i) => r(`f${i}`, 40, { "easy power": 20 + i, "good control": 20 + i, "arm-friendly": 6 }));
  const m = traitScores([...field, r("weak", 40, { "easy power": 2, "good control": 2 }), r("harsh", 40, { "vibrates on mishits": 7, "arm-friendly": 1 }), r("hand", 40, {}, { power: 1 })]);
  assert.equal(m.get("weak")!.power!.dots, 3, "little power praise isn't a complaint");
  assert.equal(m.get("harsh")!.arm!.dots, 2);
  assert.equal(m.get("hand")!.power!.dots, 1);
});
test("an owner's override wins, even on thin data", () => {
  const m = traitScores([r("a", 3, {}, { speed: 5 }), r("b", 30, { "fast at the net": 5 }, { speed: 2 })]);
  assert.deepEqual([m.get("a")!.speed!.dots, m.get("a")!.speed!.set], [5, true]);
  assert.equal(m.get("b")!.speed!.dots, 2);
  assert.equal(dotsFor(19), 1); assert.equal(dotsFor(20), 2); assert.equal(dotsFor(99), 5);
});

test("admin edits: the override keeps dots and text, and records who changed what", async () => {
  const { editTraitOverride, readTraitOverride } = await import("../db/trait-override");
  const a = editTraitOverride(readTraitOverride(null), { power: { dots: 4 }, arm: { text: "Kind to the elbow." } }, "owner@x", "2026-11-15T10:00:00Z");
  assert.deepEqual(a.traits, { power: { dots: 4 }, arm: { text: "Kind to the elbow." } });
  assert.equal(a.log.length, 2);
  const b = editTraitOverride(readTraitOverride(JSON.parse(JSON.stringify(a))), { power: {}, arm: { text: "Kind to the elbow." } }, "owner@x", "2026-11-15T11:00:00Z");
  assert.deepEqual(b.traits, { arm: { text: "Kind to the elbow." } });
  assert.deepEqual(b.log.at(-1), { at: "2026-11-15T11:00:00Z", by: "owner@x", trait: "power", field: "dots", from: "4", to: null });
  assert.deepEqual(readTraitOverride({ traits: { power: { dots: 9 }, nope: { dots: 2 } } }).traits, {});
});

test("2 is the extreme end: the Metalbone 3.5 (9 complaints, 2 praise) stays at 3, the hardest rackets drop to 2", () => {
  const field = Array.from({ length: 30 }, (_, i) => r(`f${i}`, 40, { forgiving: 5 + (i % 4), "small sweet spot": i % 3 }));
  const m = traitScores([...field, r("metalbone-3-5", 26, { forgiving: 2, demanding: 6, "small sweet spot": 3 }), r("technical-viper", 31, { demanding: 15, "small sweet spot": 10 })]);
  assert.equal(m.get("metalbone-3-5")!.forgiveness!.dots, 3);
  assert.equal(m.get("technical-viper")!.forgiveness!.dots, 2);
});
