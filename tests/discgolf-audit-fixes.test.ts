import { test } from "node:test";
import assert from "node:assert/strict";
import { kept } from "../db/keep";
import { STRAIGHT, buildPrefill } from "../lib/thread/trait-prefill";
import { levelRange } from "../lib/fit-verdict";

// DiscGolfRecs audit 2026-11-20 (Grok, manual-fixes.md).

test("kept: a copy older than the shared edit stamp is reloaded once, then kept", async () => {
  let t = 1000, loads = 0, stamp = 0;
  const k = kept(async () => ++loads, () => t, async () => stamp);
  assert.equal(await k.get(), 1);
  t = 1500; assert.equal(await k.get(), 1, "no edit: the fresh copy is kept");
  stamp = 1200; assert.equal(await k.get(), 2, "an edit on another instance after this copy loaded: reload before serving");
  t = 1600; assert.equal(await k.get(), 2, "the same stamp again: no second reload");
  stamp = 1100; assert.equal(await k.get(), 2, "an older stamp changes nothing");
  const broken = kept(async () => "x", () => t, async () => { throw new Error("no data cache"); });
  assert.equal(await broken.get(), "x", "a stamp that can't be read never breaks the page");
});

test("STRAIGHT: straight-flight words count for Stable, negations and leans don't", () => {
  for (const t of ["Flies dead straight for 250 ft.", "A straight flier with a soft fade", "my neutral mid", "neither overstable nor understable",
    "holds straight lines", "perfectly stable in the wind"]) assert.ok(STRAIGHT.test(t), t);
  for (const t of ["very stable, a real meathook", "more stable than the numbers", "overstable", "mine aren't straight flying",
    "you need to hyzer flip them to get any straight flight", "it doesn't fly straight", "understable turnover disc"]) assert.ok(!STRAIGHT.test(t), t);
});

test("disc prefill: a straight-flight report adds Stable only where the source gave no lean", () => {
  const cat = [{ id: "d1", slug: "d1", name: "D1", shape: "Midrange", core: null, balance: null, weight: "5 / 4 / 0 / 1" }];
  const lean = { productId: "d1", sourceKind: "player_report" as const, sourceRef: "w:a", authorKey: null, attribute: "stability", value: 1, valueText: null, strength: 1 as const, quote: "q", saidAt: null, extractedBy: "x" };
  const out = buildPrefill(cat, [lean], [
    { productId: "d1", key: "w:a", negative: false, text: "flies dead straight" },
    { productId: "d1", key: "w:b", negative: false, text: "flies dead straight" },
    { productId: "d1", key: "w:c", negative: false, text: "great glide" },
  ], "2026-11-20", "discgolf");
  assert.deepEqual(out.rackets.d1.groups.stability, { overstable: 1, stable: 1 });
  // Padel ignores the disc words.
  const padel = buildPrefill([{ ...cat[0], weight: null }], [], [{ productId: "d1", key: "p:1", negative: false, text: "flies dead straight" }], "2026-11-20", "padel");
  assert.equal(padel.rackets.d1.groups.stability, undefined);
});

test("levelRange: one formatter for the card and the page", () => {
  assert.equal(levelRange([]), null);
  assert.equal(levelRange(["intermediate"]), "intermediate");
  assert.equal(levelRange(["beginner", "intermediate"]), "beginner to intermediate");
  assert.equal(levelRange(["beginner", "intermediate", "advanced"]), "beginner to advanced");
});
