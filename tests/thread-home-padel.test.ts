// PadelRecs home (v3 "Home Thread v6", owner 2026-11-21): no subline under the title, one squiggle (on the hero), "PadelRecs
// picks" sort, "N votes" in Top picks, no score, and the list shared with the catalogue (client-side only).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync("app/thread/live/home-padel.tsx", "utf8"), list = readFileSync("app/thread/live/padel-list.tsx", "utf8"), page = readFileSync("app/thread/page.tsx", "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

test("the hero has no subline and the page has one squiggle", () => {
  assert.doesNotMatch(code(home), /Real player opinions/);
  assert.equal((code(home).match(/<Squiggle\/>/g) ?? []).length, 1);
  assert.doesNotMatch(code(page.slice(page.indexOf("if (PADEL) {"), page.indexOf("  return <Shell>\n    <main className={PADEL"))), /#B9E85A|Squiggle/);
});

test("the catalogue starts on PadelRecs picks, the home on Most loved (season pool), Top picks say votes, no score", () => {
  assert.match(list, /\["picks", "PadelRecs picks"\]/);
  assert.match(list, /const base: Sort = season \? "loved" : "picks"/);
  assert.match(list, /useState<Sort>\(base\)/);
  assert.match(home, /useRacketList\(\{ rows, curated, added, season \}\)/);
  assert.match(page, /unit=\{\["vote", "votes"\]\}/);
  assert.doesNotMatch(code(list) + code(home), /\.score\b|Player score|th-badge/);
});

test("the home and the catalogue share one list (match re-orders, fine-tune hides, in the browser)", () => {
  assert.match(home, /from "\.\/padel-list"/);
  assert.match(readFileSync("app/thread/live/catalog-padel.tsx", "utf8"), /from "\.\/padel-list"/);
  assert.doesNotMatch(code(list) + code(home), /useSearchParams\(|router\.(push|replace)\(/);
  assert.match(list, /"padelrecs-ft"/);
});
