import { test } from "node:test";
import assert from "node:assert/strict";
import { spearman, pointsOff } from "../lib/expert-check";
import { labPercentiles, type EvidenceRow } from "../lib/evidence";
import { balanceScores } from "../lib/trait-score";
import { fitConfigFor } from "../lib/fit-config";

const pb = fitConfigFor({ id: "pickleball" })!, padel = fitConfigFor({ id: "padel" })!;
const lab = (id: string, metric: string, value: number, site = "Blog:a"): EvidenceRow => ({ productId: id, sourceKind: "blog", sourceRef: `https://${site}/${id}`, authorKey: site,
  attribute: `lab:${metric}`, value, valueText: null, strength: 1.5, quote: String(value), saidAt: null, extractedBy: "lab-v1" });

test("expert check: Spearman with ties, points off on the 1–10 scale", () => {
  assert.equal(spearman([1, 2, 3, 4], [10, 20, 30, 40]), 1);
  assert.equal(spearman([1, 2, 3, 4], [4, 3, 2, 1]), -1);
  assert.ok(Math.abs(spearman([1, 2, 3, 4], [3, 3, 4, 4]) - 0.894) < 0.01);
  assert.equal(spearman([1, 2, 3], [3, 3, 3]), 0);
  assert.equal(pointsOff(3, 9), 3); assert.equal(pointsOff(4, 9), 1);
});

test("lab percentiles: ranked within one site, lower swing weight is quicker, small groups don't rank", () => {
  const ids = ["a", "b", "c", "d", "e", "f"];
  const rows = [...ids.map((id, i) => lab(id, "swing_weight", 104 + i * 3)), ...ids.map((id, i) => lab(id, "power_mph", 55 + i * 0.4)),
    lab("a", "power_mph", 60, "Blog:other")]; // another site's scale, one product: doesn't rank
  const p = labPercentiles(rows, pb);
  assert.equal(p.get("a")!.speed, 1); assert.equal(p.get("f")!.speed, 0);
  assert.equal(p.get("f")!.power, 1); assert.equal(p.get("a")!.power, 0, "the other site's 60 mph doesn't lift it");
  assert.equal(labPercentiles(rows, padel).size, 0, "padel has no lab metrics");
});

test("scorer v2 with lab: a strong lab reading lifts a paddle to 4+, padel ignores lab", () => {
  const mk = (id: string, P: number, labPower?: number) => ({ id, reports: 20, balance: { power: { P, C: 0, plusVoices: P, minusVoices: 0 } }, lab: labPower === undefined ? undefined : { power: labPower } });
  const pool = [...Array.from({ length: 9 }, (_, i) => mk(`x${i}`, 3 + (i % 3), 0.4)), mk("banger", 3, 1)];
  assert.ok(balanceScores(pool, pb).get("banger")!.power!.dots >= 4);
  const padelPool = pool.map(p => ({ ...p, balance: { power: p.balance.power } }));
  assert.equal(balanceScores(padelPool).get("banger")!.power!.dots, 3, "padel: praise rate alone");
});
