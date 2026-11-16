import { test } from "node:test";
import assert from "node:assert/strict";
import { aheadWord, completeBag, flightOf, stabilityOf, routinePairs, worksWith, platformsOf, STRONG, type Disc, type SkinItem, type RigPart } from "../lib/similar-picks";

// "Similar products" (owner 2026-11-16): the lists' rules.
test("the why chip names the trait the other product is furthest ahead on", () => {
  assert.equal(aheadWord([3, 4, 2], [4, 4, 4], ["more power", "more control", "more forgiving"]), "more forgiving");
  assert.equal(aheadWord([4, 4, 4], [3, 4, 2], ["a", "b", "c"]), "similar feel");
  assert.equal(aheadWord([0, 3], [5, 3], ["a", "b"]), "similar feel", "an unrated trait never counts");
});

test("complete your bag: fills the overstable-approach and understable-driver gaps, then one of each other type", () => {
  const d = (id: string, kind: string, f: string, signal: number, levelOk = true): Disc => ({ id, kind, flight: flightOf(f), signal, levelOk });
  const me = d("buzzz", "mid", "5 / 4 / -1 / 1", 90);
  const all = [me, d("roc", "mid", "4 / 4 / 0 / 3", 80), d("leopard", "fairway", "6 / 5 / -2 / 1", 85), d("destroyer", "distance", "12 / 5 / -1 / 3", 95),
    d("envy", "putter", "3 / 3 / 0 / 1", 88), d("hard", "putter", "3 / 3 / 0 / 1", 99, false)];
  const bag = completeBag(me, all, k => k);
  assert.deepEqual(bag.map(b => b.id), ["leopard", "destroyer", "envy"], "no other mid; the understable driver first; no disc above the level");
  assert.equal(bag[0].why, "understable driver");
  assert.ok(!bag.some(b => b.id === "roc"), "same type as the disc itself");
  assert.equal(stabilityOf(flightOf("4 / 4 / 0 / 3")), "overstable");
  const fairway = d("teebird", "fairway", "7 / 5 / 0 / 2", 80);
  assert.equal(completeBag(fairway, [...all, fairway], k => k)[0].why, "for approaches", "an overstable mid fills the approach gap");
});

test("pairs well with: one per routine step, compatible with sensitive skin, never two strong actives", () => {
  const s = (id: string, type: string, signal: number, sens: number | null = 70, gentle: number | null = 70): SkinItem => ({ id, type, signal, gentle, suits: { suits_sensitive: sens, suits_dry: 70 } });
  const moist = s("cream", "Moisturizer", 90);
  const all = [moist, s("harsh-cleanser", "Cleanser", 99, 20, 30), s("gentle-cleanser", "Cleanser", 80), s("spf", "Sunscreen", 85), s("retinol", "Treatment", 88), s("serum", "Serum", 70)];
  const pairs = routinePairs(moist, all);
  assert.deepEqual(pairs.map(p => p.id), ["gentle-cleanser", "spf", "serum", "retinol"]);
  assert.match(pairs[0].why, /step 1/);
  const retinol = all.find(x => x.id === "retinol")!;
  assert.ok(!routinePairs(retinol, [...all, s("aha", "Exfoliant", 99)]).some(p => STRONG.has(all.find(x => x.id === p.id)?.type ?? "Exfoliant")), "no second strong active");
});

test("works with: rims and bases from the same ecosystem on a shared platform; a cockpit of any brand", () => {
  const p = (id: string, type: string, brand: string, platforms: string, signal: number): RigPart => ({ id, type, brand, platforms: platformsOf(platforms), signal });
  const base = p("csl-dd", "Wheelbase", "Fanatec", "PC, Xbox", 90);
  const all = [base, p("moza-rim", "Wheel", "MOZA", "PC", 99), p("fanatec-rim", "Wheel", "Fanatec", "PC", 80), p("ps-rim", "Wheel", "Fanatec", "PlayStation", 95),
    p("pedals", "Pedals", "Fanatec", "PC", 70), p("rig", "Cockpit", "Sim-Lab", "", 88)];
  const w = worksWith(base, all);
  assert.deepEqual(w.map(x => x.id), ["fanatec-rim", "pedals", "rig"]);
  assert.equal(w[0].why, "same ecosystem");
  assert.deepEqual(platformsOf("PC, PlayStation and Xbox"), ["PC", "PlayStation", "Xbox"]);
});

test("card lines keep the expert voice: the clauses before a 'many / some players' one", async () => {
  const { expertLine } = await import("../lib/similar-picks");
  assert.equal(expertLine("Big distance once seasoned, especially forehand; many turn it over."), "Big distance once seasoned, especially forehand.");
  assert.equal(expertLine("A soft, forgiving control racket. The catch: little power."), "A soft, forgiving control racket. The catch: little power.");
  assert.equal(expertLine("Solid, arm-friendly and better than the 2024; heavy for a few."), "Solid, arm-friendly and better than the 2024.");
  assert.equal(expertLine("Users mostly find it slick."), null);
  assert.equal(expertLine(null), null);
});
