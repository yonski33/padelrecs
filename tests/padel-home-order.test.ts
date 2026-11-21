import { test } from "node:test";
import assert from "node:assert/strict";
import { seasonIds, bandOrder, HOME_ORDER } from "../lib/thread/home-order";

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

test("by your match: never jumps a band; inside a band, most loved first", () => {
  const rows = [{ id: "a", pos: 107 }, { id: "b", pos: 79 }, { id: "c", pos: 142 }, { id: "d", pos: 48 }, { id: "e", pos: 5 }];
  const pct = new Map<string, number | null>([["a", 90], ["b", 82], ["c", 73], ["d", 77], ["e", null]]);
  assert.deepEqual(rows.sort((x, y) => bandOrder(x, y, pct)).map(r => r.id), ["a", "b", "c", "d", "e"]);
});
