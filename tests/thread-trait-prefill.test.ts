import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrefill, sourcePicks, specLeans, FEEL, TRAMPOLINE, SIDE } from "../lib/thread/trait-prefill";
import { groupView, groupNote, sectionNote } from "../lib/thread/trait-view";
import { TRAIT_GROUPS } from "../lib/thread/traits";
import type { EvidenceRow } from "../lib/evidence";
import file from "../db/thread/padel-traits.json";

// "How does it play?" prefill (owner 2026-11-19): review evidence, one count per source per group, specs kept apart.
const row = (attribute: string, value: number, strength: 0.5 | 1 | 1.5 = 1, extra: Partial<EvidenceRow> = {}): EvidenceRow => ({ productId: "a", sourceKind: "player_report", sourceRef: "w:1#reader",
  authorKey: null, attribute, value, valueText: null, strength, quote: null, saidAt: null, extractedBy: "reader-v1", ...extra });
const first = (rules: [string, RegExp][], t: string) => rules.find(([, re]) => re.test(t))?.[0] ?? null;

test("one source's rows pick one option per group", () => {
  assert.deepEqual(sourcePicks([row("power", 1), row("control", 1)]), { plays_like: "all_round" });
  assert.equal(sourcePicks([row("power", 1)]).plays_like, "power");
  assert.equal(sourcePicks([row("power", -1)]).plays_like, "control");
  assert.equal(sourcePicks([row("forgiveness", 1)]).sweet_spot, "big");
  assert.equal(sourcePicks([row("forgiveness", 1, 0.5)]).sweet_spot, "medium");
  assert.equal(sourcePicks([row("arm", -1)]).arm, "not_really");
  assert.equal(sourcePicks([row("speed", 1, 0.5)]).maneuver, "somewhat");
  assert.equal(sourcePicks([row("durability", -1)]).durability, "wears_fast");
  assert.equal(sourcePicks([row("level", 0, 1, { valueText: "Beginner" })]).level, "beginner");
});

test("a source counts once per group; makers and specs never count", () => {
  const ev = [row("power", 1), row("power", 1, 1, { sourceRef: "w:1#tag:power" }), row("level", 0, 1, { sourceKind: "maker", valueText: "Advanced", sourceRef: "brand-sheet" }),
    row("power", 1, 1, { sourceRef: "w:2#reader" })];
  const out = buildPrefill([{ id: "a", slug: "a", name: "A", shape: "Diamond", core: "EVA Soft", balance: "Low" }], ev,
    [{ productId: "a", key: "w:1", negative: false, text: "A soft feel and I play on the left side." }], "2026-11-19");
  assert.deepEqual(out.rackets.a.groups.plays_like, { power: 2 });
  assert.equal(out.rackets.a.groups.level, undefined);
  assert.deepEqual(out.rackets.a.groups.feel, { soft: 1 });
  assert.deepEqual(out.rackets.a.groups.side, { left: 1 });
  assert.equal(out.rackets.a.sources, 2);
  assert.deepEqual(out.rackets.a.spec, { plays_like: "power", feel: "soft", maneuver: "very" });
});

test("specs only where they settle it", () => {
  assert.deepEqual(specLeans({ shape: "Hybrid", core: "MultiEVA", balance: "Medium-high" }), {});
  assert.deepEqual(specLeans({ shape: "Round", core: "HR3 Hard EVA", balance: "High (270 mm)" }), { plays_like: "control", feel: "hard", maneuver: "not_really" });
});

test("review words: negations and comparisons", () => {
  assert.equal(first(TRAMPOLINE, "Lots of trampoline effect on blocks"), "high");
  assert.equal(first(TRAMPOLINE, "no trampoline at all"), "low");
  assert.equal(first(TRAMPOLINE, "drier and less bouncy than the 2026"), "low");
  assert.equal(first(TRAMPOLINE, "a bit of trampoline but not a lot"), "medium");
  assert.equal(first(FEEL, "a dry touch and good control"), "hard");
  assert.equal(first(FEEL, "it feels soft and comfortable"), "soft");
  assert.equal(first(FEEL, "not too stiff, not too soft"), "medium");
  assert.equal(first(FEEL, "a big sweet spot"), null);
  assert.equal(first(SIDE, "I play on the left side"), "left");
  assert.equal(first(SIDE, "great from either side"), "both");
});

test("an option shows at 5 mentions; reviews and votes add up; thin groups stay empty", () => {
  const opts = TRAIT_GROUPS.find(g => g.key === "plays_like")!.options;
  const v = groupView(opts, { control: 4, power: 2 }, { control: 1 }, undefined);
  assert.deepEqual(v.opts.map(o => [o.key, o.n, o.shown, o.top]), [["control", 5, true, true], ["power", 2, false, false], ["all_round", 0, false, false]]);
  assert.equal(groupNote(v), "6 reviews, 1 vote");
  const thin = groupView(opts, { control: 3 }, {}, undefined);
  assert.equal(thin.anyShown, false); assert.equal(groupNote(thin), ""); assert.ok(thin.opts.every(o => !o.top && !o.shown));
  const spec = groupView(opts, { control: 3 }, {}, "power");
  assert.equal(groupNote(spec), "From the specs"); assert.deepEqual(spec.opts.filter(o => o.spec).map(o => o.key), ["power"]);
  assert.equal(groupView(opts, { control: 9 }, {}, "power").specOnly, false);
});

test("section line has no we/us and names the review count", () => {
  assert.equal(sectionNote(12, 0), "Based on 12 reviews until players vote. Pick what fits, one vote per group.");
  assert.match(sectionNote(12, 3), /12 reviews and 3 player votes/);
  for (const s of [sectionNote(1, 0), sectionNote(12, 3), sectionNote(0, 0)]) assert.doesNotMatch(s, /\b(we|us|our)\b|—/i);
});

test("the committed file covers padel rackets and only known groups and options", () => {
  const racks = Object.values((file as { rackets: Record<string, { groups: Record<string, Record<string, number>> }> }).rackets);
  assert.ok(racks.length >= 200);
  for (const r of racks) for (const [g, o] of Object.entries(r.groups)) {
    const def = TRAIT_GROUPS.find(x => x.key === g); assert.ok(def, g);
    for (const k of Object.keys(o)) assert.ok(def.options.some(([x]) => x === k), `${g}.${k}`);
  }
});
