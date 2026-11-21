// SimRacingRecs' accent layer on the v3 pages (owner 2026-11-21): generated from the v3 CSS, accents only, scoped to .th-srv3.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

test("sr-colors.css is up to date, accents only, every rule under .th-srv3", () => {
  const before = readFileSync("app/thread/sr-colors.css", "utf8");
  execFileSync(process.execPath, ["scripts/gen-sr-colors.mjs"]);
  assert.equal(readFileSync("app/thread/sr-colors.css", "utf8"), before, "run node scripts/gen-sr-colors.mjs");
  for (const l of before.split("\n").slice(1).filter(Boolean)) assert.match(l, /th-srv3/);
  assert.doesNotMatch(before, /#FEFAF4|#f1f1ed|--bg:|--card:|--ink:/, "no background or ink changes");
  assert.match(readFileSync("app/thread/shell.tsx", "utf8"), /"th th-pr th-srv3"/);
});
