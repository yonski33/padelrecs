import { test } from "node:test";
import assert from "node:assert/strict";
import { readExpertValue, editExpert, levelToSuits, readTraitOverride, editTraitOverride } from "../db/trait-override";
import { balanceScores } from "../lib/trait-score";

test("expert values: 1–10 counts ×10, 0–100 as is, blank or out of range is nothing", () => {
  assert.equal(readExpertValue("7"), 70); assert.equal(readExpertValue("7.5"), 75); assert.equal(readExpertValue("85"), 85);
  assert.equal(readExpertValue(""), null); assert.equal(readExpertValue("140"), null);
});

test("a value needs a note, every change is logged, and the specs form keeps expert values", () => {
  const a = editExpert(readTraitOverride(null), { control: { value: 80, note: "plays very precise" }, power: { value: 60, note: "" } }, "owner", "2026-11-15T10:00:00Z");
  assert.equal(a.expert?.control?.value, 80); assert.equal(a.expert?.power, undefined, "no note, not saved");
  const b = editExpert(a, { control: { value: null, note: "" } }, "owner", "2026-11-15T11:00:00Z");
  assert.equal(b.expert?.control, undefined); assert.deepEqual(b.expertLog?.map(l => [l.from, l.to]), [[null, 80], [80, null]]);
  const c = editTraitOverride(readTraitOverride(a), { speed: { dots: 4 } }, "owner", "2026-11-15T12:00:00Z");
  assert.equal(c.expert?.control?.value, 80, "saving hand-set dots doesn't drop expert values");
});

test("an expert level becomes suits scores", () => {
  assert.deepEqual(levelToSuits("intermediate"), { suits_beginner: 45, suits_intermediate: 85, suits_advanced: 45 });
  assert.deepEqual(levelToSuits("beginner-intermediate"), { suits_beginner: 85, suits_intermediate: 85, suits_advanced: 45 });
  assert.equal(levelToSuits("pro"), null);
});

test("an expert value wins over the calculated trait score", () => {
  const s = balanceScores([{ id: "a", reports: 30, balance: { control: { P: 2, C: 8, plusVoices: 2, minusVoices: 8 } }, expert: { control: 90 } }]);
  assert.equal(s.get("a")!.control!.score, 90); assert.equal(s.get("a")!.control!.dots, 5); assert.equal(s.get("a")!.control!.set, true);
});
