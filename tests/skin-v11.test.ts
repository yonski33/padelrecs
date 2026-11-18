import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { insideOf, routineOf } from "../lib/skin-inside";
import { edgeOf, betterOf, othersOf, ranked, type SkinPeers } from "../app/skin/skin-v11-view";
import { attrProfileFor } from "../lib/attr-profile";
import { readSkinChoice } from "../lib/skin-choice";
import { skin } from "../lib/niche/skin";
import type { SkinWire } from "../app/skin/rank";

// SkinRecs on the shared v11c product page (owner 2026-11-18): What's inside, Where it goes, Better matches and the honest
// gain / give-up lines of Other products, on the real catalogue's ranking inputs (tests/fixtures/skin-match-snapshot.json).
const profile = attrProfileFor(skin)!;
const snap = JSON.parse(readFileSync("tests/fixtures/skin-match-snapshot.json", "utf8")) as (SkinWire & { slug: string })[];
const types = skin.typePages ?? [];
const choice = (q: Record<string, string>) => readSkinChoice(q, types);

test("What's inside: glossary cards in the maker's order, strength kept, fragrance-free fills a slot, never one card", () => {
  const c = insideOf("x", "Ceramides, niacinamide, hyaluronic acid", true);
  assert.deepEqual(c.map(x => x.name), ["Ceramides", "Niacinamide", "Hyaluronic acid", "Fragrance-free"]);
  assert.equal(insideOf("x", "2% salicylic acid, green tea", false)[0].name, "Salicylic acid 2%");
  assert.deepEqual(insideOf("x", "Ceramide NP, ceramide AP", false), [], "one card says too little");
  assert.equal(insideOf("x", "Ceramides, sodium hyaluronate, hyaluronic acid, glycerin, squalane", false).length, 4);
});

test("What's inside: every glossary line is short, plain and in the expert voice", () => {
  const all = "ceramides, niacinamide, polyglutamic acid, hyaluronic acid, glycerin, squalane, panthenol, salicylic acid, benzoyl peroxide, glycolic acid, lactic acid, mandelic acid, pha, azelaic acid, retinol, bakuchiol, tranexamic acid, arbutin, vitamin c, peptides, centella, heartleaf, allantoin, oat, licorice, green tea, aloe, ferulic acid, vitamin e, caffeine, zinc oxide, titanium dioxide, tinosorb, avobenzone, homosalate, petrolatum, shea, urea, cholesterol, snail mucin, kaolin, hydrocolloid, sulfur, collagen, rice";
  const lines = all.split(", ").flatMap(i => insideOf("x", `${i}, glycerin`, true)).map(c => c.line);
  assert.ok(lines.length > 40);
  for (const l of lines) {
    assert.ok(l.length <= 90, l);
    assert.ok(!/—|–|!/.test(l), l);
    assert.ok(!/\b(we|us|our|tested|studies)\b/i.test(l), l);
  }
});

test("Where it goes: the product's step is marked, SPF is last, a toner sits between cleanse and serum", () => {
  const m = routineOf("x", "Moisturizer")!;
  assert.deepEqual(m.steps.map(s => s.label), ["1 cleanse", "2 serum or treatment", "3 this moisturizer", "last · SPF, morning only"]);
  assert.deepEqual(m.steps.filter(s => s.me).map(s => s.label), ["3 this moisturizer"]);
  assert.equal(routineOf("x", "Sunscreen")!.steps.at(-1)!.label, "last · this SPF");
  const t = routineOf("x", "Toner")!;
  assert.deepEqual(t.steps.map(s => s.label), ["1 cleanse", "2 this toner", "3 serum or treatment", "4 moisturize", "last · SPF, morning only"]);
  assert.equal(routineOf("x", null), null);
  for (const type of ["Cleanser", "Toner", "Exfoliant", "Mask", "Serum", "Treatment", "Eye cream", "Moisturizer", "Balm & ointment", "Sunscreen"])
    assert.ok(!/—|–/.test(routineOf("x", type)!.note) && routineOf("x", type)!.note.length <= 105, type);
});

const moisturizers = snap.filter(x => x.shape === "Moisturizer");
const peersFor = (self: SkinWire): SkinPeers => {
  const peers = moisturizers.filter(x => x.id !== self.id);
  return { self, peers, similar: peers.map(p => p.id), ref: "Self", cards: Object.fromEntries(peers.map(p => [p.id, { id: p.id, name: p.name, href: `/m/${p.id}`, pic: null, line: null, shop: null, score: p.signal }])) };
};

test("Other products: every gain and give-up line is a real score or price gap between the two, on different traits", () => {
  let checked = 0;
  for (const self of moisturizers.slice(0, 12)) for (const other of moisturizers.slice(0, 20)) {
    if (other.id === self.id) continue;
    const e = edgeOf(profile, self, other, choice({ skin: "dry", goal: "hydrate" }), "Self");
    if (!e) continue;
    checked++;
    assert.match(e.gain, / than the Self\.$/); assert.match(e.give, / than the Self\.$/);
    const trait = (t: string) => t.split(" than")[0].replace(/^(More|Less|Gentler|Better|Costs)\s?/, "");
    assert.notEqual(trait(e.gain), trait(e.give));
    if (/Costs less/.test(e.gain)) assert.ok(String(other.attrs.facts.price).length < String(self.attrs.facts.price).length);
    if (/Costs more/.test(e.give)) assert.ok(String(other.attrs.facts.price).length > String(self.attrs.facts.price).length);
  }
  assert.ok(checked > 10, `${checked} pairs`);
});

test("Better matches only under 60%, and only products that beat this one; Other products hide meanwhile on the page", () => {
  const rows = [{ id: "a", pct: 80 }, { id: "b", pct: 58 }, { id: "c", pct: 52 }, { id: "d", pct: null }];
  assert.deepEqual(betterOf(rows, 70), []);
  assert.deepEqual(betterOf(rows, 55).map(r => r.id), ["a", "b"]);
  assert.deepEqual(betterOf(rows, null), []);
});

test("Other products after an answer: 60%+ only, at most 2, each with both lines", () => {
  const self = moisturizers[0], P = peersFor(self), c = choice({ skin: "oily", goal: "clear" });
  const rows = ranked(profile, P, c), out = othersOf(profile, P, c, rows);
  assert.ok(out.length <= 2);
  for (const o of out) { assert.ok((o.pct ?? 0) >= 60); assert.ok(o.gain && o.give); }
});
