import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { claimBlock, firmness, shapeRank, weightMid, balanceRank } from "../lib/claim-guard";
import { distinctEdges } from "../lib/other-picks";

const tr = (dots: number, voices = 10) => ({ dots, plus: voices, minus: 0 });
// The owner's example (2026-11-18): Babolat Viper Soft Lebrón 3.0 vs Nox AT10 12K Alum Xtrem Lite, as stored.
const viperSoft = { shape: "Diamond", core: "EVA Soft / Black EVA", surface: "Soft Carbon / 3K Soft Carbon weave with 3D Spin+", balance: "High", weight: "365 g (±10 g)" };
const noxLite = { shape: "Teardrop", core: "White EVA HR3", surface: "12K Alum Xtrem (aluminized carbon)", balance: "Medium", weight: "355–365 g" };

describe("claim guard (other-racket cards)", () => {
  it("never calls a diamond more forgiving than a teardrop, even with more forgiveness dots", () => {
    assert.match(String(claimBlock("padel", "forgiveness", 1, { spec: viperSoft, tr: tr(4) }, { spec: noxLite, tr: tr(3) })), /shape/);
  });
  it("lets a round racket be more forgiving than a diamond", () => {
    assert.equal(claimBlock("padel", "forgiveness", 1, { spec: { shape: "Round" }, tr: tr(4) }, { spec: { shape: "Diamond" }, tr: tr(3) }), null);
    // …but not when its build is clearly firmer (the Nox's HR3 core and 12K face against the Viper Soft's soft core and face).
    assert.match(String(claimBlock("padel", "forgiveness", 1, { spec: { ...noxLite, shape: "Round" }, tr: tr(4) }, { spec: viperSoft, tr: tr(3) })), /firmer/);
  });
  it("never says a rounder racket has a smaller sweet spot", () => {
    assert.match(String(claimBlock("padel", "forgiveness", -1, { spec: { shape: "Round" }, tr: tr(2) }, { spec: { shape: "Diamond" }, tr: tr(3) })), /shape/);
  });
  it("needs a full dot and enough voices on both rackets", () => {
    assert.equal(claimBlock("padel", "power", 1, { spec: {}, tr: tr(3) }, { spec: {}, tr: tr(3) }), "no dot gap");
    assert.equal(claimBlock("padel", "power", 1, { spec: {}, tr: tr(4, 2) }, { spec: {}, tr: tr(3) }), "too few reports");
    assert.equal(claimBlock("padel", "power", 1, { spec: {}, tr: { dots: 4, plus: 0, minus: 0, set: true } }, { spec: {}, tr: tr(3) }), null);
  });
  it("never calls a firmer build more forgiving or easier on the arm", () => {
    const hard = { core: "Hard EVA", surface: "18K carbon" }, soft = { core: "Soft EVA", surface: "Fiberglass" };
    assert.ok((firmness("padel", hard)! - firmness("padel", soft)!) >= 1);
    assert.match(String(claimBlock("padel", "arm", 1, { spec: hard, tr: tr(5) }, { spec: soft, tr: tr(3) })), /firmer/);
    assert.match(String(claimBlock("padel", "arm", -1, { spec: soft, tr: tr(2) }, { spec: hard, tr: tr(4) })), /softer/);
  });
  it("never calls a heavier or more head-heavy racket quicker", () => {
    assert.equal(claimBlock("padel", "speed", 1, { spec: { weight: "375 g" }, tr: tr(5) }, { spec: { weight: "360 g" }, tr: tr(3) }), "heavier");
    assert.equal(claimBlock("padel", "speed", 1, { spec: { balance: "High" }, tr: tr(5) }, { spec: { balance: "Low" }, tr: tr(3) }), "more head-heavy");
    assert.equal(claimBlock("pickleball", "speed", 1, { spec: { weight: "8.2–8.4 oz" }, tr: tr(5) }, { spec: { weight: "7.8 oz" }, tr: tr(3) }), "heavier");
  });
  it("reads the specs it relies on", () => {
    assert.equal(shapeRank("pickleball", "Elongated"), 1); assert.equal(shapeRank("pickleball", "Widebody"), 3); assert.equal(shapeRank("discgolf", "Putter"), null);
    assert.equal(weightMid("padel", { weight: "355–365 g" }), 360); assert.ok(Math.abs((weightMid("pickleball", { weight: "7.8-8.2 oz" }) ?? NaN) - 8) < 0.01);
    assert.equal(balanceRank({ balance: "Medium-High" }), 2.5);
  });
});

describe("distinctEdges with the guard", () => {
  const KEYS = ["forgiveness", "power", "control"];
  it("takes the next trait that holds when the top gain is blocked", () => {
    const e = distinctEdges([3, 3, 3], [{ id: "a", dots: [5, 4, 2] }], KEYS, 3, "arm", undefined, (_id, i, dir) => !(i === 0 && dir > 0));
    assert.deepEqual(e, [{ id: "a", gain: 1, give: 2 }]);
  });
  it("passes over a racket with no give-up when both lines are needed", () => {
    const e = distinctEdges([3, 3, 3], [{ id: "a", dots: [4, 3, 3] }, { id: "b", dots: [3, 4, 2] }], KEYS, 3, "arm", undefined, undefined, true);
    assert.deepEqual(e.map(x => x.id), ["b"]);
  });
});

it("sim racing: less torque is never 'stronger force feedback', more torque never 'weaker'", () => {
  const ev = (dots: number) => ({ dots, plus: 5, minus: 0 });
  assert.equal(claimBlock("simracing", "ffb_strength", 1, { spec: { weight: "5 Nm" }, tr: ev(5) }, { spec: { weight: "8 Nm" }, tr: ev(3) }), "less torque");
  assert.equal(claimBlock("simracing", "ffb_strength", -1, { spec: { weight: "12 Nm" }, tr: ev(2) }, { spec: { weight: "8 Nm" }, tr: ev(4) }), "more torque");
  assert.equal(claimBlock("simracing", "ffb_strength", 1, { spec: { weight: "12 Nm" }, tr: ev(5) }, { spec: { weight: "8 Nm" }, tr: ev(3) }), null);
});
