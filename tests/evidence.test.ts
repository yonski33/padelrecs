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

test("balance: one voice once, comparisons count half, and the 2-dot rule needs the extreme end", async () => {
  const { evidenceBalance } = await import("../lib/evidence");
  const { balanceScores } = await import("../lib/trait-score");
  const row = (pid: string, ref: string, attribute: string, value: number, quote = "plain words here", strength: 0.5 | 1 | 1.5 = 1): EvidenceRow =>
    ({ productId: pid, sourceKind: "player_report", sourceRef: `${ref}#reader`, authorKey: null, attribute, value, valueText: null, strength, quote, saidAt: null, extractedBy: EXTRACTORS.reader });
  // Two reports by the same person count once; a comparison quote counts 0.5.
  const b = evidenceBalance([row("a", "w:1", "control", 1), row("a", "w:2", "control", 1), row("a", "w:3", "control", -1, "a bit less precise than the Pro 5")], ref => ref === "w:2" ? "w:1" : ref);
  assert.deepEqual(b.get("a")!.control, { P: 1, C: 0.5, voices: 2, plusVoices: 1, minusVoices: 1, people: { players: { plus: 1, minus: 1 }, reviewers: { plus: 0, minus: 0 } } });
  // 40 rackets: one with many forgiveness complaints drops to 2, a well-liked one rises, the rest sit at the 3 floor or above.
  const inputs = Array.from({ length: 40 }, (_, i) => ({ id: `r${i}`, reports: 20, balance: { forgiveness: i === 0 ? { P: 1, C: 12, plusVoices: 1, minusVoices: 12 } : i === 1 ? { P: 20, C: 0, plusVoices: 20, minusVoices: 0 } : { P: 4, C: 3, plusVoices: 4, minusVoices: 3 } } }));
  const s = balanceScores(inputs);
  assert.equal(s.get("r0")!.forgiveness!.dots, 2);
  assert.ok(s.get("r1")!.forgiveness!.dots >= 4);
  assert.ok([...s.values()].every(x => x.forgiveness!.dots >= 2));
  assert.equal(s.get("r5")!.power!.dots, 3, "no evidence: the 3 floor");
});
