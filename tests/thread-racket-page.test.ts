// PadelRecs racket page (owner mock "Racket Page", 2026-11-21): the vote pill, the tie rule in "How does it play?", no
// Player score and no star rating.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { votePill, PILL_MIN } from "../lib/thread/vote-pill";
import { groupView } from "../lib/thread/trait-view";

test("the pill names the group whose leader holds the biggest share", () => {
  assert.equal(votePill({ plays_like: { power: 34, all_round: 28, control: 26 }, feel: { hard: 43, medium: 23, soft: 7 }, maneuver: { very: 44, somewhat: 8, not_really: 16 } }),
    "Most picked for quick handling · 44 players");
  assert.equal(votePill({ plays_like: { power: 22, all_round: 6, control: 2 } }), "Most picked for power · 22 players");
  assert.equal(votePill({ sweet_spot: { big: 12, medium: 3 } }), "Most picked for a big sweet spot · 12 players");
});

test("no pill without 5+ behind the leader, a clear lead, or words for the answer", () => {
  assert.equal(votePill({ plays_like: { power: PILL_MIN - 1 } }), null);
  assert.equal(votePill({ plays_like: { power: 20, control: 18 } }), null, "not a clear lead");
  assert.equal(votePill({ sweet_spot: { small: 30, big: 2 } }), null, "a small sweet spot is no selling line");
  assert.equal(votePill({ trampoline: { high: 40 } }), null, "groups without words never make a pill");
  assert.equal(votePill({}), null);
});

test("How does it play?: a tie for the lead highlights neither answer on the racket page", () => {
  const opts: [string, string][] = [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]];
  const tie = groupView(opts, { very: 23, not_really: 23, somewhat: 15 }, {}, undefined, true);
  assert.equal(tie.opts.filter(o => o.top).length, 0);
  // Other sites keep both lit; a clear leader is lit either way.
  assert.equal(groupView(opts, { very: 23, not_really: 23 }, {}, undefined).opts.filter(o => o.top).length, 2);
  assert.deepEqual(groupView(opts, { very: 24, not_really: 23 }, {}, undefined, true).opts.filter(o => o.top).map(o => o.key), ["very"]);
});

test("the padel racket page shows no Player score and sends no star rating", () => {
  const page = readFileSync("app/thread/racket-v7b.tsx", "utf8"), route = readFileSync("app/thread/rackets/[slug]/page.tsx", "utf8");
  assert.match(page, /export const SHOW_SCORE = false;/);
  assert.doesNotMatch(route, /aggregateRating|ratingValue/);
  // Copy rules: no em dashes, no "verdict", no "we/us" in the page's own words.
  const copy = [...page.matchAll(/(?:>|`|")([^<>`"{}]*[A-Za-z][^<>`"{}]*)(?:<|`|")/g)].map(m => m[1]).filter(t => !t.includes("/") && t.includes(" "));
  for (const t of copy) {
    assert.doesNotMatch(t, /—/, t);
    assert.doesNotMatch(t, /\bverdict\b/i, t);
    assert.doesNotMatch(t, /\b(we|us|our)\b/i, t);
  }
});

import { whoPlays, weekLine } from "../lib/thread/community";

test("this week's line: real counts, a part at 0 left out, both 0 hides it", () => {
  assert.equal(weekLine(3, 2), "3 new opinions · 2 posts this week");
  assert.equal(weekLine(1, 0), "1 new opinion this week");
  assert.equal(weekLine(0, 1), "1 post this week");
  assert.doesNotMatch(weekLine(4, 3)!, /question/);
  assert.equal(weekLine(0, 0), null);
});

test("who plays it: only vote groups with 5+ and a clear leader; side only when it qualifies", () => {
  const w = whoPlays({ level: { advanced: 35, intermediate: 10, beginner: 2 }, plays_like: { power: 30, control: 8 }, side: { right: 6, left: 5 } });
  assert.equal(w?.headline, "Mostly advanced · power");
  assert.deepEqual(w?.rows.map(r => [r.title, r.label, r.n]), [["Level", "Advanced", 35], ["Style", "Power", 30]]);
  // A tie or near tie skips the row; nothing qualifying hides the card.
  assert.equal(whoPlays({ level: { intermediate: 39, beginner: 34 }, plays_like: { control: 58, all_round: 31 } })?.headline, "Mostly control");
  assert.equal(whoPlays({ level: { advanced: 4 } }), null);
  assert.equal(whoPlays({ side: { right: 20, both: 4 } })?.headline, "Mostly right side");
});

test("the sidebar has no curated ranking box and no More from <brand>", () => {
  const page = readFileSync("app/thread/racket-v7b.tsx", "utf8");
  assert.doesNotMatch(page, /`More from \$\{|th8-rank\b/);
  assert.match(page, /Check price ↗/);
});
