import { test } from "node:test";
import assert from "node:assert/strict";
import { seasonIds, wantOrder, wantPill, leadVotes, HOME_ORDER, type WantCtx } from "../lib/thread/home-order";

test("home pool: the season's year only, the opinion floor, one row per model", () => {
  const ids = seasonIds([
    { id: "ctrl-26", family: "ctrl", year: 2026, opinions: 164 },
    { id: "bela-24", family: "bela", year: 2024, opinions: 70 },
    { id: "geo-27", family: "geo", year: 2027, opinions: 50 },
    { id: "thin-26", family: "thin", year: 2026, opinions: HOME_ORDER.minOpinions - 1 },
    { id: "v05-a", family: "v05", year: 2026, opinions: 40 },
    { id: "v05-b", family: "v05", year: 2026, opinions: 109 },
  ], 2026);
  assert.deepEqual(ids.sort(), ["ctrl-26", "v05-b"]);
});

const ctx = (pct: [string, number | null][], over: Partial<WantCtx> = {}): WantCtx =>
  ({ pct: new Map(pct), trait: null, level: true, arm: false, plays: {}, armVotes: {}, ...over });

test("by your match: never jumps a band; inside a band, most loved first", () => {
  const rows = [{ id: "a", pos: 107 }, { id: "b", pos: 79 }, { id: "c", pos: 142 }, { id: "d", pos: 48 }, { id: "e", pos: 5 }];
  const c = ctx([["a", 90], ["b", 82], ["c", 73], ["d", 77], ["e", null]]);
  assert.deepEqual(rows.sort((x, y) => wantOrder(x, y, c)).map(r => r.id), ["a", "b", "c", "d", "e"]);
});

test("a want pick alone ranks by that trait's votes where it leads; the rest by match", () => {
  const plays = { metalbone: { power: 58, control: 3 }, fenix: { power: 63, control: 9 }, nox: { power: 32, control: 70 }, thin: { power: 6 } };
  const rows = [{ id: "metalbone", pos: 59 }, { id: "fenix", pos: 81 }, { id: "nox", pos: 142 }, { id: "thin", pos: 4 }];
  const c = ctx([["metalbone", 92], ["fenix", 83], ["nox", 70], ["thin", 75]], { trait: "power", level: false, plays });
  assert.deepEqual(rows.sort((x, y) => wantOrder(x, y, c)).map(r => r.id), ["fenix", "metalbone", "thin", "nox"]);
});

test("level + want: bands first, the trait's votes inside a band, Arm comfort votes break ties", () => {
  const plays = { a: { power: 40 }, b: { power: 63 }, c: { power: 9, all_round: 28 }, d: { power: 40 } };
  const rows = [{ id: "a", pos: 50 }, { id: "b", pos: 81 }, { id: "c", pos: 83 }, { id: "d", pos: 10 }];
  const c = ctx([["a", 90], ["b", 82], ["c", 86], ["d", 84]], { trait: "power", arm: true, plays, armVotes: { d: 30, b: 1 } });
  assert.deepEqual(rows.sort((x, y) => wantOrder(x, y, c)).map(r => r.id), ["a", "b", "d", "c"]);
});

test("the want pill: only where the trait leads with 5+", () => {
  assert.equal(wantPill({ power: 63, control: 9 }, "power"), "Most picked for power · 63 players");
  assert.equal(wantPill({ power: 9, all_round: 28 }, "power"), null);
  assert.equal(wantPill({ all_round: 30, power: 4 }, "all_round"), "Most picked for all-round play · 30 players");
  assert.equal(wantPill({ power: 4 }, "power"), null);
  assert.equal(leadVotes({ power: 20, control: 20 }, "power", 5), 0, "a tie is no lead");
});
