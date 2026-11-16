import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rankHome, matchPcts, type RankItem } from "../lib/home-rank";
import { curatedFor, curatedKey } from "../lib/curated";
import { padel } from "../lib/niche/padel";
import curated from "../db/curated/padel.json";

// The curated layer (owner 2026-11-17) over the live padel items of that day (tests/fixtures/padel-rank-items-curated.json).
const fx = JSON.parse(readFileSync(new URL("./fixtures/padel-rank-items-curated.json", import.meta.url), "utf8")) as { items: RankItem[]; names: Record<string, string> };
const items = fx.items, byId = new Map(items.map(x => [x.id, x])), bySlug = new Map(items.map(x => [x.slug, x.id]));
const SETUP = { ...padel.finder!, levelGate: padel.fit!.levelGate, engine: padel.fit!.engine };
const BAD = padel.tags.filter(t => t.tone === "neg").map(t => t.label);
const STYLES = ["control", "balance", "power"] as const, LEVELS = ["beginner", "intermediate", "advanced"] as const;
const PICKS = STYLES.flatMap(style => LEVELS.flatMap(level => [false, true].map(arm => ({ style, level, arm }))));
const rows = (c: (typeof PICKS)[number], older = false) => rankHome(items, SETUP, BAD, c, older, 20).rows;

test("the file holds all 18 picks; every slug is in the catalog", () => {
  assert.equal(Object.keys(curated.lists).length, 18);
  for (const c of PICKS) assert.ok(curatedKey(c) in curated.lists, curatedKey(c));
  for (const [k, l] of Object.entries(curated.lists)) for (const e of l as { slug: string }[]) assert.ok(bySlug.has(e.slug), `${k}: ${e.slug}`);
});

test("each curated list renders exactly in order at the top, the % stepping down and never topped by the engine rows", () => {
  let checked = 0;
  for (const c of PICKS) {
    const want = curatedFor(c).map(s => bySlug.get(s)!).filter(Boolean); if (!want.length) continue; checked++;
    const r = rows(c);
    assert.deepEqual(r.slice(0, want.length).map(x => x.id), want, curatedKey(c));
    const pcts = r.map(x => x.pct ?? 0);
    for (let i = 1; i < pcts.length; i++) assert.ok(pcts[i] <= pcts[i - 1], `${curatedKey(c)} #${i + 1}: ${pcts[i]} after ${pcts[i - 1]}`);
    assert.equal(pcts[0], 97);
    const m = matchPcts(items, c, SETUP.levelGate, SETUP.engine);
    assert.deepEqual(want.map(id => m.get(id)), pcts.slice(0, want.length), "the racket pages show the same %");
  }
  assert.ok(checked >= 1);
});

test("shape rule: no diamond in the engine's top 6 for control or balance at beginner and intermediate", () => {
  for (const style of ["control", "balance"] as const) for (const level of ["beginner", "intermediate"] as const) for (const arm of [false, true]) {
    const c = { style, level, arm }, cur = new Set(curatedFor(c).map(s => bySlug.get(s))), eng = rows(c).filter(x => !cur.has(x.id)).slice(0, 6);
    const d = eng.filter(x => byId.get(x.id)!.facts.fine?.shape === "diamond").map(x => fx.names[x.id]);
    assert.deepEqual(d, [], curatedKey(c));
  }
});

test("newest model wins: no older year while a newer year of the model has 10+ reviews (unless older models are asked for)", () => {
  const top = new Map<string, number>();
  for (const x of items) if (x.eng && x.facts.reports >= 10) top.set(x.row, Math.max(top.get(x.row) ?? -1, x.eng.year));
  for (const c of PICKS) {
    const cur = new Set(curatedFor(c).map(s => bySlug.get(s)));
    const old = rows(c).filter(x => !cur.has(x.id)).map(x => byId.get(x.id)!).filter(x => x.eng!.year < (top.get(x.row) ?? -1)).map(x => fx.names[x.id]);
    assert.deepEqual(old, [], curatedKey(c));
  }
  assert.ok(rows({ style: "control", level: "intermediate", arm: false }, true).length >= rows({ style: "control", level: "intermediate", arm: false }).length);
});

test("the importer reads the Grok pack's split files (curated-<combo>.json)", async () => {
  const { keyOf, listOf } = await import("../scripts/import-curated.mjs");
  assert.equal(keyOf("control-beginner-noarm"), "control/beginner/arm-off");
  assert.equal(keyOf("balance-intermediate-arm"), "balance/intermediate/arm-on");
  assert.equal(keyOf("spin-beginner-arm"), null);
  assert.deepEqual(listOf({ combo: "x", picks: [{ slug: "a", reason: "Soft and roomy.", source: "https://x.com/a" }, { slug: "a" }, { slug: "b" }] }),
    [{ slug: "a", note: "Soft and roomy.", src: "https://x.com/a" }, { slug: "b" }]);
});

test("beginner rule: no high-balance racket in a beginner engine list ahead of any other racket", () => {
  for (const style of STYLES) for (const arm of [false, true]) {
    const c = { style, level: "beginner" as const, arm }, cur = new Set(curatedFor(c).map(s => bySlug.get(s)));
    const eng = rows(c).filter(x => !cur.has(x.id)), firstHH = eng.findIndex(x => byId.get(x.id)!.headHeavy);
    assert.ok(firstHH < 0 || eng.slice(firstHH).every(x => byId.get(x.id)!.headHeavy || byId.get(x.id)!.facts.fine?.shape === "diamond"), curatedKey(c));
  }
});

test("the importer picks the newest year with 10+ reviews, else the newest (owner: 'we always pick the new version')", async () => {
  const { newestOf } = await import("../scripts/import-curated.mjs");
  const cat = [{ slug: "bullpadel-vertex-05-hybrid-2027", reviews: 3 }, { slug: "bullpadel-vertex-05-hybrid-2026", reviews: 49 },
    { slug: "bullpadel-vertex-04-hybrid-2025", reviews: 35 }, { slug: "x-new-2027", reviews: 2 }, { slug: "x-new-2026", reviews: 4 }];
  assert.equal(newestOf("bullpadel-vertex-05-hybrid-2027", cat), "bullpadel-vertex-05-hybrid-2026");
  assert.equal(newestOf("bullpadel-vertex-05-hybrid-2026", cat), "bullpadel-vertex-05-hybrid-2026");
  assert.equal(newestOf("bullpadel-vertex-04-hybrid-2025", cat), "bullpadel-vertex-04-hybrid-2025", "another generation is another model");
  assert.equal(newestOf("x-new-2026", cat), "x-new-2027", "no year with 10+: the newest");
  assert.equal(newestOf("unknown-2026", cat), "unknown-2026");
});
