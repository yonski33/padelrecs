import { test } from "node:test";
import assert from "node:assert/strict";
import { whyLine, loveLine, watchLine, skipLine, tipLine, comparedLine, quickPicks, tagPills, lineOk, PICK_MAX, DEEP_MAX, type DeepRow } from "../lib/ranking-deep";
import { padel } from "../lib/niche/padel";

// "Get to know the top 10" (owner-approved mock 2026-11-19): every line from evidence, inside the copy rules.
const row = (o: Partial<DeepRow> & { id: string; rank: number }): DeepRow => ({ signal: 80, dots: { forgiveness: 3, power: 3, control: 3, defence: 3, arm: 3, speed: 3 },
  grams: 365, shape: "Teardrop", balance: "Medium", tags: {}, reports: 30, beginner: 40, yes: [], no: [], ...o });
const src = (n: number) => Array.from({ length: n }, (_, i) => `s${i}`);

test("only the padel best-overall list carries the deep section", () => {
  assert.deepEqual((padel.topLists ?? []).filter(l => l.deep).map(l => l.slug), ["best-padel-rackets"]);
});

test("love holds praise only; a line its bars contradict is left out", () => {
  const r = row({ id: "a", rank: 1, dots: { arm: 2, forgiveness: 3 }, yes: [
    { title: "Kind to sore arms", t: "==Kind to sore elbows and wrists==.", src: src(9) },
    { title: "Comfy", t: "Comfortable even on long days.", src: src(9) },
    { title: "Mixed", t: "Precise, but smashes need help.", src: src(8) },
    { title: "Dry touch", t: "Lobs and blocks ==land where you aim==.", src: src(4) }] });
  assert.equal(loveLine(r)?.line, "Lobs and blocks land where you aim.");
  assert.equal(loveLine(row({ id: "b", rank: 1, yes: [{ title: "x", t: "Great control.", src: ["one"] }] })), null, "one source is not enough");
});

test("watch and skip come from sourced catches, and skip names who it matters to", () => {
  const r = row({ id: "a", rank: 2, dots: { power: 3, forgiveness: 2 }, no: [
    { title: "Little free power", t: "Flat smashes ==need your own arm==.", src: src(9) },
    { title: "Smaller sweet spot", t: "The sweet spot is ==smaller and less forgiving==.", src: src(4) },
    { title: "Paint chips", t: "The coating can peel.", src: src(5) }] });
  assert.equal(watchLine(r)?.line, "Flat smashes need your own arm.");
  assert.equal(skipLine(r, watchLine(r)?.item), "Skip it if you mishit often; off-centre hits get little help.");
  assert.equal(skipLine(row({ id: "c", rank: 1, no: [{ title: "Paint chips", t: "The coating can peel.", src: src(5) }] })), null, "durability says nothing about who should skip it");
});

test("a player tip needs two players and keeps no counts", () => {
  assert.equal(tipLine([{ text: "It can take a few sessions to settle. Three players say it clicked once they adapted.", reports: [1, 2, 3] }]), "It can take a few sessions to settle.");
  assert.equal(tipLine([{ text: "Add a strip of lead tape at 3 and 9 for stability on blocks.", reports: [1] }]), null);
  assert.equal(tipLine([{ text: "Two players added small weights, 2 to 4 g, and liked the change.", reports: [1, 2] }]), null);
});

test("why it's #N: standing on the Player score and a lead it holds alone", () => {
  const a = row({ id: "a", rank: 1, signal: 94, dots: { speed: 5 } }), b = row({ id: "b", rank: 2, signal: 93, dots: { arm: 5 }, tags: { "good control": 9 } });
  assert.equal(whyLine(a, null, [a, b], "this season"), "Top player score this season, and the quickest at the net in the top 10.");
  assert.equal(whyLine(b, a, [a, b], "this season"), "Just behind #1 on player score, and the kindest on the arm in the top 10.");
  const c = row({ id: "c", rank: 3, signal: 88, tags: { "good control": 9, "arm-friendly": 7 } });
  // arm-friendly beside an average Comfort bar would contradict it: only control is named.
  assert.equal(whyLine(c, b, [a, b, c], "this season"), "Next on player score after #2, and most praised for its control.");
});

test("compared with the next one: only the edges the claim rule allows, within the line", () => {
  const ok = (ups: string[], downs: string[]) => (k: string, d: 1 | -1) => (d > 0 ? ups : downs).includes(k);
  assert.equal(comparedLine("12K", "Metalbone CTRL", ok(["speed"], ["forgiveness", "power"])), "The 12K is quicker at the net; the Metalbone CTRL is more forgiving and hits harder.");
  assert.equal(comparedLine("A", "B", ok([], [])), "No clear edge on the bars; the player score sets them apart.");
  const t = comparedLine("Ultimate Tour", "Extreme Motion", ok(["forgiveness", "defence"], ["power"]), 60);
  assert.ok(t && t.length <= 60, t ?? "");
});

test("quick picks: eight labels from the bars, reasons under 60 characters, a catch rules a racket out", () => {
  const rows = [
    row({ id: "soft", rank: 1, signal: 90, dots: { forgiveness: 5, power: 3, control: 4, defence: 4, arm: 5, speed: 3 }, shape: "Round", grams: 350 }),
    row({ id: "hit", rank: 2, signal: 88, dots: { forgiveness: 3, power: 5, control: 3, defence: 3, arm: 3, speed: 4 }, grams: 370, balance: "High" }),
    row({ id: "fast", rank: 3, signal: 86, dots: { forgiveness: 4, power: 4, control: 4, defence: 4, arm: 3, speed: 5 }, grams: 345, tags: { "fast at the net": 12 } }),
    row({ id: "wall", rank: 4, signal: 84, dots: { forgiveness: 4, power: 4, control: 5, defence: 5, arm: 3, speed: 4 },
      no: [{ title: "Not a first racket", t: "==Not a beginner racket==.", src: src(5) }] }),
  ];
  const p = quickPicks(rows), by = Object.fromEntries(p.map(x => [x.label, x.id]));
  assert.equal(p.length, 8);
  assert.deepEqual(by, { "Best for beginners": "soft", "Softest on the arm": "soft", "Hardest smash": "hit", "Best at the net": "fast", "Best for control": "wall",
    "Best for defenders": "wall", "Lightest and fastest": "fast", "Best all-rounder": "wall" });
  for (const x of p) assert.ok(x.reason.length < PICK_MAX && lineOk(x.reason), x.reason);
});

test("tag pills hide counts under 5, neutral tags and tags the bars contradict", () => {
  const tone = (t: string) => ({ "good control": "pos", "arm-friendly": "pos", firm: "neutral", demanding: "neg" } as Record<string, string>)[t] ?? "neutral";
  const r = row({ id: "a", rank: 1, dots: { arm: 2, control: 4 }, tags: { "good control": 12, "arm-friendly": 9, firm: 20, demanding: 4 } });
  assert.deepEqual(tagPills(r, tone).map(x => x.tag), ["good control"]);
});

test("line rules: length, no em dash, no we/us, no counts", () => {
  assert.ok(lineOk("Lobs and blocks land where you aim."));
  for (const bad of ["x".repeat(DEEP_MAX + 1), "Firm — and fast.", "We love it.", "12 players say it is quick."]) assert.ok(!lineOk(bad), bad);
});
