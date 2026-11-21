// PadelRecs home (v3 "Home Thread v6", owner 2026-11-21): the site's own line under the title (owner 2026-11-22), one squiggle (on the hero), "PadelRecs
// picks" sort, "N votes" in Top picks, no score, and the list shared with the catalogue (client-side only).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/thread/live/home-padel.tsx", "utf8"), list = readFileSync("app/thread/live/padel-list.tsx", "utf8"), page = readFileSync("app/thread/page.tsx", "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

test("the hero has the site's own line under the title and the page has one squiggle", () => {
  // The words live in lib/thread/words.ts per site (no hard-coded padel line in the shared hero).
  assert.doesNotMatch(code(home), /Real player opinions/);
  assert.match(code(home), /<p className="hp3-tag">\{W\.tagline\}<\/p>/);
  const words = readFileSync("lib/thread/words.ts", "utf8");
  for (const line of ["Real player opinions, votes, and comments on the top padel rackets.", "Real listener opinions, votes, and comments on the top headphones.",
    "Real racer opinions, votes, and comments on the top sim racing gear.", "Real player opinions, votes, and comments on the top tennis rackets."]) assert.ok(words.includes(line), line);
  for (const m of words.matchAll(/tagline: "([^"]+)"/g)) assert.doesNotMatch(m[1], /—|\bwe\b|\bus\b|\bour\b|owners?/i, m[1]);
  assert.equal((code(home).match(/<Squiggle\/>/g) ?? []).length, 1);
  assert.doesNotMatch(code(page.slice(page.indexOf("if (PADEL) {"), page.indexOf("  return <Shell>\n    <main className={PADEL"))), /#B9E85A|Squiggle/);
});

test("the catalogue starts on PadelRecs picks, the home on Most loved (season pool), Top picks say votes, no score", () => {
  assert.match(list, /\["picks", `\$\{niche\.site\.name\} picks`\]/);  // "PadelRecs picks" on padel
  assert.match(list, /const base: Sort = season \? "loved" : BASE_SORT/);
  assert.match(list, /useState<Sort>\(base\)/);
  assert.match(home, /useRacketList\(\{ rows, curated, added, season, match: useAudioListMatch\(wire\) \}\)/);
  // The home's menu has no "PadelRecs picks" (owner: read as random there).
  assert.match(list, /HOME_SORTS: \[Sort, string\]\[\] = \[\["loved", "Most loved"\], \["opinions", "Most opinions"\], \["match", "By your match"\]\]/);
  assert.match(list, /const sorts = season \? HOME_SORTS : SORTS/);
  // PadelRecs' catalogue starts on "picks"; AudioRecs (no curated lists) on "loved" (V3-ROLLOUT-BRIEF).
  assert.match(list, /const BASE_SORT: Sort = SORTS\[0\]\[0\]/);
  assert.match(page, /unit=\{\["vote", "votes"\]\}/);
  assert.doesNotMatch(code(list) + code(home), /\.score\b|Player score|th-badge/);
});

test("the home and the catalogue share one list (match re-orders, fine-tune hides, in the browser)", () => {
  assert.match(home, /from "\.\/padel-list"/);
  assert.match(readFileSync("app/thread/live/catalog-padel.tsx", "utf8"), /from "\.\/padel-list"/);
  assert.doesNotMatch(code(list) + code(home), /useSearchParams\(|router\.(push|replace)\(/);
  assert.match(list, /"padelrecs-ft"/);
});
