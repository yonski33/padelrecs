import { test } from "node:test";
import assert from "node:assert/strict";
import { tagRows, evidenceTotals, sentenceWith, EXTRACTORS, type EvidenceRow } from "../lib/evidence";
import { traitScores, type TraitInput } from "../lib/trait-score";

const base = { productId: "a", kind: "player_report" as const, author: null, at: null };
const reader = (ref: string, attribute: string, value: number, strength: 0.5 | 1 | 1.5): EvidenceRow =>
  ({ productId: "a", sourceKind: "player_report", sourceRef: `${ref}#reader`, authorKey: null, attribute, value, valueText: null, strength, quote: "x", saidAt: null, extractedBy: EXTRACTORS.reader });

test("tag rows carry today's weights: good control feeds control 1 and defence 0.5", () => {
  const rows = tagRows({ ...base, ref: "w:1", tags: ["good control"] });
  assert.deepEqual(rows.map(r => [r.attribute, r.value, r.strength]), [["control", 1, 1], ["defence", 1, 0.5]]);
});

test("totals from tag rows give the same trait scores as tag counts", () => {
  const reports = [["good control", "arm-friendly"], ["good control"], ["easy power"], ["small sweet spot", "demanding"], ["head-heavy"]];
  const rows = reports.flatMap((tags, i) => tagRows({ ...base, ref: `w:${i}`, tags }));
  const tags: Record<string, number> = {}; for (const r of reports) for (const t of r) tags[t] = (tags[t] ?? 0) + 1;
  const totals = evidenceTotals(rows, new Map([["a", new Set(reports.map((_, i) => `w:${i}`))]])).get("a")!;
  const old: TraitInput = { id: "a", tagged: 5, tags }, ev: TraitInput = { id: "a", tagged: totals.tagged, tags: {}, totals: totals.traits };
  assert.deepEqual(traitScores([ev]).get("a"), traitScores([old]).get("a"));
});

test("a reader row counts once per report and trait, and only where no tag already counts", () => {
  const rows = [...tagRows({ ...base, ref: "w:1", tags: ["good control"] }), reader("w:1", "control", 1, 1), reader("w:2", "control", 1, 1), reader("w:3", "control", -1, 0.5)];
  const t = evidenceTotals(rows, new Map([["a", new Set(["w:1"])]])).get("a")!;
  assert.deepEqual(t.traits.control, { net: 1 + 1 - 0.5, plus: 2, minus: 1 });
  assert.equal(t.tagged, 3, "reports with only reader evidence join the pool");
});

test("rule-read quotes are exact sentences of the text", () => {
  const text = "Great racket overall. After a month my elbow started to hurt! Power is fine.";
  assert.equal(sentenceWith(text, s => /elbow/.test(s)), "After a month my elbow started to hurt!");
});
