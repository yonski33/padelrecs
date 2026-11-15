import { test } from "node:test";
import assert from "node:assert/strict";
import { rankHome, matchPcts, shrunkTraits, SHRINK_K, type RankItem } from "../lib/home-rank";
import { fitVerdict, FEW_FIT_REPORTS } from "../lib/fit-verdict";
import { padel } from "../lib/niche/padel";

// Owner 2026-11-15: "no way for this intermediate control pick that a racket like the hack hybrid would be above the metalbone
// ctrl 3.5 or the nox at10 18k … we are placing in high places rackets with very few reviews and low player score".
const finder = { ...padel.finder!, levelGate: padel.fit?.levelGate };
const suits = { beginner: 50, intermediate: 80, advanced: 70, basis: ["players"] };
const item = (id: string, reports: number, control: number, signal: number): RankItem => ({
  id, facts: { reports, tags: { "good control": Math.round(reports * 0.4), "great in defence": Math.round(reports * 0.2), forgiving: 2 }, suits },
  control, power: 50, arm: 50, signal, level: { liked: {}, suits },
  pool: { reviews: reports, positive: Math.round(reports * 0.8), mixed: 1, negative: 1, shape: "Round", lists: {} }, row: id });

test("trait scores are pulled toward the catalog mean by report count", () => {
  const items = [item("thin", 9, 99, 63), item("fav", 67, 80, 92), item("mid", 30, 60, 75)];
  const s = shrunkTraits(items), mean = (99 + 80 + 60) / 3;
  assert.equal(s.get("thin")!.control, (9 * 99 + SHRINK_K * mean) / (9 + SHRINK_K));
  // 9 reports lose most of their lead (99 → ~87); 67 reports barely move (80 → ~80).
  assert.ok(99 - s.get("thin")!.control! > 10 && Math.abs(80 - s.get("fav")!.control!) < 1);
});

test("a racket with few reports can't take the top 3 or 'best match' while well-reviewed rackets fit", () => {
  const items = [item("hack", 9, 99, 63), item("ctrl", 67, 85, 92), item("at10", 68, 84, 87), item("neuron", 30, 82, 79), item("other", 40, 70, 70)];
  const { rows } = rankHome(items, finder, [], { style: "control", level: "intermediate", arm: false }, false);
  assert.ok(rows.findIndex(r => r.id === "hack") >= 3, `hack at ${rows.findIndex(r => r.id === "hack") + 1}`);
  assert.notEqual(rows[0].id, "hack");
  const pct = matchPcts(items, { style: "control", level: "intermediate", arm: false }, finder.levelGate);
  assert.ok(pct.get("hack")! < pct.get("ctrl")! && pct.get("hack")! < pct.get("at10")!);
});

test("a Strong fit needs the site's few-reports line; under it the best word is 'Worth a look'", () => {
  assert.equal(FEW_FIT_REPORTS, 15);
  const facts = (reports: number) => ({ reports, tags: { "good control": 8, "great in defence": 4, forgiving: 3 }, suits });
  assert.equal(fitVerdict({ style: "control", level: "intermediate", arm: false }, facts(30)).kind, "good");
  assert.equal(fitVerdict({ style: "control", level: "intermediate", arm: false }, facts(12)).kind, "maybe");
});
