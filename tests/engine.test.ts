import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { engineBase, engineScore, engineCandidates, engineAnchors, enginePct, engineTraitDots, type EngineFacts } from "../lib/engine";
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
// The prototype predates the owner's Team cap ("Yes, cap Team", 2026-11-15) and the match-audit tuning pass (2026-11-16), so
// parity runs on the prototype's own numbers: the engine's maths is unchanged, only the site's settings moved.
const PROTO = { ...P, allRoundLabels: [], z: 1.5, wq: 0.30, wf: 0.55, wp: 0.15, armShare: 0.3,
  controlLabels: [" ctrl", "control", "comfort", " soft", " light", " lite"],
  levelShare: undefined, balanceSquared: false, anyByQuality: false, anchorsPerStyle: false, hardCap: undefined, familyBestWithin: undefined, tieByReports: false };
const GATE = padel.fit!.levelGate as Record<string, number>;
const items = fx.items.map(x => ({ ...x, id: x.slug, e: { name: x.name, year: x.year, pos: x.pos, mix: x.mix, neg: x.neg, voices: x.voices, spec: x.spec, expert: x.expert } as EngineFacts }));
const base = engineBase(items, P), protoBase = engineBase(items, PROTO);
const passes = (x: Item, level: string) => (x.suits[level] ?? 0) >= fx.gate[level];
/** The prototype's list (its gate, no level term), for the parity test. */
const protoList = (pick: string) => {
  const [level, style] = pick.split("+") as [string, "control" | "balance" | "power"];
  return engineCandidates(items, x => passes(x, level), PROTO.minReports).map(x => ({ x, c: engineScore(protoBase.get(x.id)!, { style }, PROTO).cautious }))
    .sort((a, b2) => b2.c - a.c);
};
/** The site's list as it ranks today: its own gate, the level's suits in the score, ties by reports. */
const list = (pick: string) => {
  const [level, style] = pick.split("+") as [string, "control" | "balance" | "power"];
  return engineCandidates(items, x => (x.suits[level] ?? 0) >= GATE[level], P.minReports).map(x => ({ x, c: engineScore(base.get(x.id)!, { style, suits: x.suits[level] }, P).cautious }))
    .sort((a, b2) => b2.c - a.c || (P.tieByReports ? b2.x.n - a.x.n : 0));
};
const PICKS = ["beginner", "intermediate", "advanced"].flatMap(l => ["control", "balance", "power"].map(s => `${l}+${s}`));

test("the engine reproduces the prototype's lists for the 9 picks (order, cautious scores and %)", () => {
  const anchors = engineAnchors(items, protoBase, passes, PROTO);
  for (const pick of PICKS) {
    const got = protoList(pick), want = fx.expected[pick];
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

// With the Team cap, Coello Team no longer leads beginner + power; the one open check is now Metalbone CTRL 3.5 at #5 for
// intermediate + power (few power rackets pass the intermediate gate).
test("the owner's yardstick: 23 of 24 hold (open: Metalbone CTRL 3.5 #5 for intermediate + power)", () => {
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
  assert.deepEqual(fails, ["intermediate+power: adidas-metalbone-ctrl-2026 not in top 5"]);
});

test("trait dots from the engine: a control-side racket shows 4+ control dots unless control complaints win; 2 only for complaint traits", () => {
  const fx2 = items.map(x => ({ ...x, e: { ...x.e, voices: { ...x.e.voices, defence: { plus: 1, minus: 0 } } } }));
  const dots = engineTraitDots(fx2, engineBase(fx2, P), P);
  const ctrl = fx2.find(x => x.slug === "adidas-metalbone-ctrl-2026")!;
  assert.ok(dots.get(ctrl.id)!.control.dots >= 4, "Metalbone CTRL 3.5: control side, more praise than complaints");
  for (const [, d] of dots) { assert.ok(d.control.dots >= 3 && d.power.dots >= 3 && d.defence.dots >= 3 && d.speed.dots >= 3); }
  assert.ok([...dots.values()].every(d => d.arm.dots >= 2 && d.forgiveness.dots >= 2));
});
