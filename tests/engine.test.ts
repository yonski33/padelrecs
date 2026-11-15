import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { engineBase, engineScore, engineCandidates, engineAnchors, enginePct, type EngineFacts } from "../lib/engine";
import { padel } from "../lib/niche/padel";

// The match engine (lib/engine) against the offline prototype the owner's yardstick checked (ENGINE-ALGO.md §5): the same
// inputs (tests/fixtures/engine-padel.json, the prototype's own load()) must give the prototype's lists for the 9 picks, and
// the yardstick (tests/fixtures/engine-yardstick-padel.json) must hold.
type Item = { slug: string; name: string; year: number; shape: string; family: string; n: number; pos: number; mix: number; neg: number;
  voices: EngineFacts["voices"]; spec: EngineFacts["spec"]; expert: EngineFacts["expert"]; suits: Record<string, number> };
const fx = JSON.parse(readFileSync(new URL("./fixtures/engine-padel.json", import.meta.url), "utf8")) as {
  gate: Record<string, number>; items: Item[]; expected: Record<string, { slug: string; cautious: number; pct: number }[]> };
const Y = JSON.parse(readFileSync(new URL("./fixtures/engine-yardstick-padel.json", import.meta.url), "utf8")) as {
  beats: { pick: string; above: string; below: string }[]; not_top: { pick: string; slug: string; top: number }[] };
const P = padel.fit!.engine!;
const items = fx.items.map(x => ({ ...x, id: x.slug, e: { name: x.name, year: x.year, pos: x.pos, mix: x.mix, neg: x.neg, voices: x.voices, spec: x.spec, expert: x.expert } as EngineFacts }));
const base = engineBase(items, P);
const passes = (x: Item, level: string) => (x.suits[level] ?? 0) >= fx.gate[level];
const list = (pick: string) => {
  const [level, style] = pick.split("+") as [string, "control" | "balance" | "power"];
  return engineCandidates(items, x => passes(x, level), P.minReports).map(x => ({ x, c: engineScore(base.get(x.id)!, { style }, P).cautious }))
    .sort((a, b) => b.c - a.c);
};
const PICKS = ["beginner", "intermediate", "advanced"].flatMap(l => ["control", "balance", "power"].map(s => `${l}+${s}`));

test("the engine reproduces the prototype's lists for the 9 picks (order, cautious scores and %)", () => {
  const anchors = engineAnchors(items, base, passes, P);
  for (const pick of PICKS) {
    const got = list(pick), want = fx.expected[pick];
    assert.equal(got.length, want.length, `${pick}: list size`);
    got.forEach((g, i) => {
      const w = want[i];
      // Ties (equal cautious scores to 4 places) may swap places.
      if (g.x.slug !== w.slug) assert.ok(Math.abs(g.c - w.cautious) < 1e-4 && want.some(o => o.slug === g.x.slug && Math.abs(o.cautious - w.cautious) < 1e-4), `${pick} #${i + 1}: ${g.x.slug} vs ${w.slug}`);
      assert.ok(Math.abs(g.c - w.cautious) < 1e-4, `${pick} #${i + 1} cautious ${g.c} vs ${w.cautious}`);
      // The prototype rounds half to even; allow that one point.
      assert.ok(Math.abs(enginePct(g.c, anchors) - w.pct) <= 1, `${pick} #${i + 1} pct ${enginePct(g.c, anchors)} vs ${w.pct}`);
    });
  }
});

test("the owner's yardstick: 23 of 24 hold (the one open: Coello Team leads beginner + power, accepted)", () => {
  const fails: string[] = [];
  const check = (ok: boolean, msg: string) => { if (!ok) fails.push(msg); };
  for (const b of Y.beats) {
    const L = list(b.pick).map(r => r.x.slug), ia = L.indexOf(b.above), ib = L.indexOf(b.below);
    check(ib < 0 || (ia >= 0 && ia < ib), `${b.pick}: ${b.above} above ${b.below}`);
  }
  for (const t of Y.not_top) { const i = list(t.pick).map(r => r.x.slug).indexOf(t.slug); check(i < 0 || i >= t.top, `${t.pick}: ${t.slug} not in top ${t.top}`); }
  for (const pick of PICKS) {
    const [level, style] = pick.split("+"), L = list(pick).map(r => r.x), top = L.slice(0, 3);
    check(!(top.some(x => x.n <= 12) && L.slice(3).some(x => x.n >= 40)), `${pick}: no 12-or-fewer-report racket in top 3 while a 40+ one waits below`);
    if (level === "beginner") check(!L.some(x => x.shape.toLowerCase().includes("diamond") && !["bullpadel-vertex-05-women-2026", "head-coello-team-2026"].includes(x.slug)), `${pick}: no diamonds`);
    if (style === "power" && level !== "beginner") check(!top.some(x => x.shape.toLowerCase().startsWith("round")), `${pick}: top 3 has no round shape`);
    if (style === "control") check(!top.some(x => x.shape.toLowerCase().includes("diamond")), `${pick}: top 3 has no diamond`);
  }
  assert.deepEqual(fails, ["beginner+power: no 12-or-fewer-report racket in top 3 while a 40+ one waits below"]);
});
