// TennisRecs on the PadelRecs v3 pages (owner 2026-11-21, wave 2): its site entries, its vote groups and words, its accent layer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { threadSite, threadDefaultFor, v3Site, quickMatchFor, accountSite, storiesSite } from "../lib/thread/sites";
import { traitGroupsFor, voteBoardsFor } from "../lib/thread/traits";
import { pickCatsFor } from "../lib/thread/top-picks";
import { guidePathsFor } from "../lib/thread/look";
import { votePill, TENNIS_PILL_WORDS, TENNIS_PILL_LABELS } from "../lib/thread/vote-pill";
import { TN_GUIDES, toTennis } from "../lib/thread/copy-tennis";
import { specLeans, sourcePicks } from "../lib/thread/trait-prefill";

test("tennis: a Thread site on v3, the engine quick match, no accounts or stories", () => {
  assert.ok(threadSite("tennis") && threadDefaultFor("tennis") && v3Site("tennis"));
  assert.equal(quickMatchFor("tennis"), "engine");
  assert.ok(!accountSite("tennis") && !storiesSite("tennis"));
});

test("tennis: nine vote groups without padel's court side or trampoline; boards and Top picks use them", () => {
  const keys = traitGroupsFor("tennis").map(g => g.key);
  assert.deepEqual(keys, ["plays_like", "level", "sweet_spot", "arm", "feel", "spin", "maneuver", "stability", "durability"]);
  for (const b of [...voteBoardsFor("tennis"), ...pickCatsFor("tennis").filter(c => c.trait)]) assert.ok(keys.includes(b.trait), b.trait);
  for (const c of pickCatsFor("tennis")) assert.doesNotMatch(c.href, /padel/);
  assert.deepEqual(Object.values(guidePathsFor("tennis")), ["/guide", "/guides/beginner-tips", "/guides/head-size", "/guides/string-patterns", "/guides/tennis-elbow"]);
});

test("tennis pills: quality first, its own words for spin, stability and a crisp feel", () => {
  assert.equal(votePill({ spin: { lots: 15, little: 4 } }, "players", TENNIS_PILL_WORDS, TENNIS_PILL_LABELS), "Lots of spin · 15 players");
  assert.equal(votePill({ feel: { hard: 9, soft: 2 } }, "players", TENNIS_PILL_WORDS, TENNIS_PILL_LABELS), "Crisp feel · 9 players");
  assert.equal(votePill({ side: { right: 20 } }, "players", TENNIS_PILL_WORDS, TENNIS_PILL_LABELS), null);
});

test("tennis copy: five guides, no em dashes, no we/us, no prices, no padel left in the info swaps", () => {
  assert.equal(TN_GUIDES.length, 5);
  const all = JSON.stringify(TN_GUIDES);
  assert.doesNotMatch(all, /—|\bwe\b|\bus\b|\$|€|padel/i);
  assert.equal(toTennis("PadelRecs is built by padel players, see r/padel"), "TennisRecs is built by tennis players, see r/tennis");
});

test("tennis prefill: its reader rows fill spin, maneuverable, stable and feel; stiffness is the one spec", () => {
  const row = (attribute: string, value: number) => ({ productId: "x", sourceKind: "player_report", sourceRef: "w:1", authorKey: null, attribute, value, valueText: null, strength: 1, quote: null, saidAt: null, extractedBy: "reader-v1" }) as Parameters<typeof sourcePicks>[0][number];
  assert.deepEqual(sourcePicks([row("spin", 1), row("maneuverability", -1), row("stability", 1), row("feel", -1)], "tennis"),
    { spin: "lots", maneuver: "not_really", stability: "very", feel: "hard" });
  assert.deepEqual(specLeans({ shape: "100 sq in", core: "16x19", balance: "7 pts HL", weight: "300 g", surface: "60 RA" }, "tennis"), { feel: "soft" });
  assert.deepEqual(specLeans({ shape: "98 sq in", core: "18x20", balance: "4 pts HL", weight: "305 g", surface: "65 RA" }, "tennis"), {});
});

test("tn-colors.css is up to date, accents only, every rule under .th-tnv3", () => {
  const before = readFileSync("app/thread/tn-colors.css", "utf8");
  execFileSync(process.execPath, ["scripts/gen-tn-colors.mjs"]);
  assert.equal(readFileSync("app/thread/tn-colors.css", "utf8"), before, "run node scripts/gen-tn-colors.mjs");
  for (const l of before.split("\n").slice(1).filter(Boolean)) assert.match(l, /th-tnv3/);
  assert.doesNotMatch(before, /#FEFAF4|#f1f1ed|--bg:|--card:|--ink:/, "no background or ink changes");
  assert.match(readFileSync("app/thread/shell.tsx", "utf8"), /"th th-pr th-tnv3"/);
});

test("tennis audit notes: feel from stiffness unless votes clearly disagree; unknown years and replaced frames", async () => {
  const { tennisFeel, tennisYearKnown, tennisReplacedBy, tennisStyle } = await import("../lib/thread/tennis-notes");
  assert.equal(tennisFeel("60 RA", null), "Soft"); assert.equal(tennisFeel("66 RA", null), "Medium"); assert.equal(tennisFeel("69 RA", null), "Crisp");
  assert.equal(tennisFeel("66 RA", { soft: 10, medium: 4 }), "Soft");     // 10 vs 4: clear
  assert.equal(tennisFeel("66 RA", { soft: 5, medium: 4 }), "Medium");    // not clear: the stiffness rule
  assert.equal(tennisFeel(null, null), null);
  assert.equal(tennisYearKnown("wilson-blade-98s-v10"), false); assert.equal(tennisYearKnown("head-radical-mp-2023"), true);
  assert.equal(tennisReplacedBy("wilson-blade-98-16x19-v9"), "Wilson Blade 98 16x19 V10");
  assert.equal(tennisStyle("head-radical-mp-2023"), "control");
});
