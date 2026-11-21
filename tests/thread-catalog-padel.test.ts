// PadelRecs catalogue (owner mock 2026-11-21): one vote pill per row from the fixed template, "opinions" counts, no score,
// and every filter, pick and sort in the browser.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { votePill } from "../lib/thread/vote-pill";

test("a row's pill: one answer, 5+ and a clear lead, else none", () => {
  assert.equal(votePill({ plays_like: { power: 22, all_round: 6, control: 2 } }), "Most picked for power · 22 players");
  assert.equal(votePill({ plays_like: { power: 20, control: 18 } }), null);
  assert.equal(votePill({ plays_like: { power: 4 } }), null);
  // Never two answers in one pill.
  assert.doesNotMatch(votePill({ plays_like: { power: 30 }, sweet_spot: { big: 30 } }) ?? "", / and /);
});

test("the catalogue shows no score, says opinions, and filters in the browser", () => {
  const src = readFileSync("app/thread/live/catalog-padel.tsx", "utf8");
  assert.doesNotMatch(src, /\.score\b|W\.score|Player score|th-badge/);
  assert.match(src, /"opinion"/);
  assert.doesNotMatch(src, /"review"\)|Arm friendly only|"level", "Level"/);
  assert.doesNotMatch(src, /useSearchParams\(|router\.(push|replace)\(/);
  const route = readFileSync("app/thread/rackets/page.tsx", "utf8");
  assert.match(route, /niche\.id !== "padel"/, "other sites keep the shared Catalog");
});
