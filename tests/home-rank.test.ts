import { test } from "node:test";
import assert from "node:assert/strict";
import { rankHome, slimItems, matchPcts, type RankItem } from "../lib/home-rank";
import { choiceKey, readChoiceKey, homeHref, readChoice, INDEXABLE_CHOICES, type QuickChoice } from "../lib/quick-match";
import { padel } from "../lib/niche/padel";
import { RANK_CASES } from "../scripts/home-rank-cases";

// A made-up catalog: 60 rackets in families of three years, some thin, some off the pool, spread over shapes, levels, arm and
// style, with tags outside the ones the ranking counts (the browser payload drops those).
const finder = { ...padel.finder!, levelGate: padel.fit?.levelGate };
const bad = padel.tags.filter(t => t.tone === "neg").map(t => t.label);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const int = (n: number) => Math.floor(rnd() * n);
const SHAPES = ["round", "hybrid", "diamond", null] as const;
const items: RankItem[] = Array.from({ length: 60 }, (_, i) => {
  const id = `r${String(i).padStart(2, "0")}`, family = Math.floor(i / 3), reports = int(70);
  const tags: Record<string, number> = { "good control": int(12), "great in defence": int(6), "easy power": int(12), "great on smashes": int(6), forgiving: int(5), demanding: int(5),
    "arm-friendly": int(6), "vibrates on mishits": int(3), "head-heavy": int(3), soft: int(4), firm: int(4), "looks great": int(9), "ships fast": int(4) };
  const lists: Record<string, number> = {};
  if (rnd() < 0.3) lists["best-control-padel-rackets"] = 1 + int(10);
  if (rnd() < 0.3) lists["best-power-padel-rackets"] = 1 + int(10);
  const shape = SHAPES[int(4)], suits = rnd() < 0.6 ? { beginner: int(100), intermediate: int(100), advanced: int(100), basis: rnd() < 0.5 ? ["players"] : ["the brand"] } : undefined;
  const score = () => rnd() < 0.15 ? null : int(100);
  const pos = int(30), mix = int(8);
  return { id, facts: { reports, tags, band: rnd() < 0.5 ? { from: int(2), to: 2 } : undefined,
      levels: rnd() < 0.5 ? { maker: { from: int(2), to: 2, words: "Professional", url: "https://example.com" }, players: { from: 0, to: 1 } } : undefined,
      fine: { shape: shape ?? null, grams: 340 + int(40), feel: (["soft", "medium", "firm", null] as const)[int(4)], forgiveness: score(), weightSpec: "355-370 g" },
      ...(suits ? { suits } : {}), ...(rnd() < 0.1 ? { levelDisagree: "The brand says advanced; players say intermediate." } : {}),
      places: { control: lists["best-control-padel-rackets"], power: lists["best-power-padel-rackets"] }, ...(rnd() < 0.5 ? { armDots: 1 + int(5) } : {}) },
    control: score(), power: score(), arm: score(), signal: rnd() < 0.1 ? null : 50 + int(50),
    level: rnd() < 0.7 ? { liked: { beginner: int(4), intermediate: int(6), advanced: int(3) }, band: { from: int(2), to: 2 }, ...(suits ? { suits } : {}) } : undefined,
    ...(reports >= 10 && rnd() < 0.8 ? { pool: { reviews: reports, positive: pos, mixed: mix, negative: Math.max(0, reports - pos - mix), shape: shape ? shape[0].toUpperCase() + shape.slice(1) : null, lists } } : {}),
    row: `r${String(family * 3 + 2).padStart(2, "0")}` };
});
const fine: QuickChoice[] = [{ style: "power", level: "advanced", arm: false, fine: { shape: "diamond" } }, { style: "control", level: "beginner", arm: true, fine: { weight: "light", feel: "soft", sweet: true } },
  { style: "balance", level: "intermediate", arm: false, fine: { shape: "round", weight: "heavy" } }];
const cases = [...RANK_CASES, ...fine.map(choice => ({ choice, older: false })), ...fine.map(choice => ({ choice, older: true }))];

test("the browser's list equals the server's for all 31 combinations and the fine-tune samples", () => {
  // The browser ranks the slim payload after a JSON round trip; the server ranks the full items.
  const browser = JSON.parse(JSON.stringify(slimItems(items, finder))) as RankItem[];
  for (const { choice, older } of cases) {
    const server = rankHome(items, finder, bad, choice, older), client = rankHome(browser, finder, bad, choice, older);
    assert.deepEqual(client, server, `${choiceKey(choice, older)}`);
    assert.ok(server.rows.length > 0, `${choiceKey(choice, older)} has rows`);
  }
});

test("every match % agrees between the full and the slim items", () => {
  const browser = JSON.parse(JSON.stringify(slimItems(items, finder))) as RankItem[];
  for (const { choice } of cases) assert.deepEqual(matchPcts(browser, choice, finder.levelGate), matchPcts(items, choice, finder.levelGate));
});

test("one row per model unless older models are shown, and picks change the order", () => {
  const c: QuickChoice = { style: "power", level: "advanced", arm: false };
  const one = rankHome(items, finder, bad, c, false), all = rankHome(items, finder, bad, c, true);
  assert.ok(one.rows.every(r => items.find(x => x.row === r.id || x.id === r.id)));
  assert.equal(new Set(one.rows.map(r => items.find(x => x.id === r.id)!.row)).size, one.rows.length);
  assert.equal(all.olderN, 0);
  assert.notDeepEqual(rankHome(items, finder, bad, { style: "control", level: "beginner", arm: true }, false).rows.map(r => r.id), one.rows.map(r => r.id));
});

test("cache keys: one canonical key per combination, round trip to the same picks and address", () => {
  const keys = new Set<string>();
  for (const { choice, older } of cases) {
    const key = choiceKey(choice, older), back = readChoiceKey(key);
    assert.ok(back, key); keys.add(key);
    assert.equal(homeHref(back!.choice, back!.older), homeHref(choice, older));
    const q = Object.fromEntries(new URLSearchParams(homeHref(choice, older).split("?")[1] ?? ""));
    assert.equal(choiceKey(readChoice(q), q.older === "1"), key);
  }
  assert.equal(INDEXABLE_CHOICES.length, 31);
  assert.equal(readChoiceKey("power.beginner.1.-.-.-.0.0")?.choice.style, "power");
  for (const bad of ["", "x", "power.nope.1.-.-.-.0.0", "power.beginner.yes.-.-.-.0.0", "any.intermediate.0.-.-.-.0.0.extra", "../etc"]) assert.equal(readChoiceKey(bad), null, bad);
});
