import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceOf, faceOf, shapeWord } from "../lib/guide";

test("balanceOf reads words first, then a lone length", () => {
  assert.equal(balanceOf("Medium-high (~25.4 cm)"), "high");
  assert.equal(balanceOf("High (272 mm)"), "high");
  assert.equal(balanceOf("Low/Medium"), "medium");
  assert.equal(balanceOf("Low"), "low");
  assert.equal(balanceOf("Balanced"), "medium");
  assert.equal(balanceOf("270 mm"), "high");
  assert.equal(balanceOf("250 mm"), "low");
  assert.equal(balanceOf("26 cm"), "medium");
  assert.equal(balanceOf(""), null);
  assert.equal(balanceOf(null), null);
});

test("faceOf sorts face materials", () => {
  assert.equal(faceOf("3K carbon"), "carbon");
  assert.equal(faceOf("18K"), "carbon");
  assert.equal(faceOf("Fiberglass"), "fibreglass");
  assert.equal(faceOf("Fibrix (fiberglass + carbon)"), "mixed");
  assert.equal(faceOf("Glaphite"), null);
  assert.equal(faceOf(undefined), null);
});

test("shapeWord falls back to hybrid", () => {
  assert.equal(shapeWord("Diamond (oversized)"), "diamond");
  assert.equal(shapeWord("Teardrop"), "teardrop");
  assert.equal(shapeWord("Round"), "round");
  assert.equal(shapeWord("Hybrid"), "hybrid");
  assert.equal(shapeWord(""), null);
});

import { niches } from "../lib/niche/all";
import { CATALOG_PARAMS, catalogView, catalogHref, readCatalogFilters, type CatalogRow } from "../lib/catalog-filter";
import { specGroups, specValues, keyOf, happiest, optionCount } from "../lib/guide";

const LAYOUTS = ["cards", "scale", "toggles", "numbers", "split", "dark-split"];

test("every niche's guide config is consistent", () => {
  for (const n of Object.values(niches)) {
    const g = n.guide;
    if (!g) continue;
    const ids = g.sections.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, `${n.id}: section ids repeat`);
    for (const s of g.sections) {
      assert.ok(LAYOUTS.includes(s.layout), `${n.id}/${s.id}: unknown layout ${s.layout}`);
      assert.ok(s.options.length >= 2 && s.options.length <= 4, `${n.id}/${s.id}: 2–4 options`);
      assert.ok(!(s.filter && s.spec), `${n.id}/${s.id}: filter or spec, not both`);
      const key = keyOf(s);
      if (key) assert.ok(s.options.every(o => o.value), `${n.id}/${s.id}: a counted section needs a value on every option`);
      else assert.ok(s.textOnlyNote, `${n.id}/${s.id}: a text-only section says why (textOnlyNote)`);
      if (s.spec) assert.ok(!(CATALOG_PARAMS as readonly string[]).includes(s.spec.key), `${n.id}/${s.id}: spec key clashes with a catalogue param`);
    }
    for (const ref of [g.buys?.section, g.home?.section]) if (ref) assert.ok(ids.includes(ref), `${n.id}: no section ${ref}`);
    assert.ok(g.tldr.length >= 2 && g.tldr.length <= 4, `${n.id}: 2–4 tl;dr personas`);
    assert.ok(!/owners?\b/i.test(JSON.stringify(g)), `${n.id}: say "players", never "owners"`);
    assert.ok(!/% (liked|loved)/i.test(JSON.stringify(g)), `${n.id}: no "% liked"`);
  }
});

const row = (id: string, x: Partial<CatalogRow>): CatalogRow => ({ id, name: id, lean: null, shape: null, year: "2026", arm: false, weight: null, feel: null,
  sweet: false, signal: null, n: 0, judged: 0, newest: true, ...x });

test("spec filters count, filter and keep their address", () => {
  const g = { sections: [{ id: "balance", title: "", sub: "", layout: "toggles", options: [{ value: "low", label: "Low", text: "" }, { value: "high", label: "High", text: "" }],
    spec: { key: "balance", label: "Balance", column: "balance", classify: balanceOf } }] } as unknown as Parameters<typeof specGroups>[0];
  const spec = specGroups(g);
  assert.deepEqual(spec, [{ key: "balance", label: "Balance", values: ["low", "high"] }]);
  assert.deepEqual(specValues(g, { balance: "High (272 mm)" }), { balance: "high" });
  const rows = [row("a", { spec: { balance: "low" } }), row("b", { spec: { balance: "high" } }), row("c", { spec: { balance: "high" } })];
  assert.equal(optionCount(rows, "balance", "high", 62, spec), 2);
  assert.deepEqual(catalogView(rows, { balance: "low" }, 62, spec).counts.balance, { low: 1, high: 2 });
  assert.equal(catalogHref("/rackets", { balance: "low" }, {}, ["balance"]), "/rackets?balance=low");
  assert.equal(catalogHref("/rackets", { balance: "low" }), "/rackets");
  assert.deepEqual(readCatalogFilters({ balance: "low", nope: "x" }, ["balance"]), { balance: "low" });
});

test("happiest names the two options with the best positive share (50+ reviews)", () => {
  const rows = [row("a", { shape: "round", judged: 100 }), row("b", { shape: "diamond", judged: 60 }), row("c", { shape: "hybrid", judged: 80 }), row("d", { shape: "teardrop", judged: 10 })];
  const pos = new Map([["a", 50], ["b", 54], ["c", 64], ["d", 10]]);
  assert.deepEqual(happiest(rows, "shape", pos), { top: ["diamond", "hybrid"], reviews: 250 });
});
