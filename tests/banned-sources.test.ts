import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Review sources the owner banned (AI-written or excluded): padel.how (2026-11-24) and Padelful (2026-11-25, AI-generated
// reviews). No PadelRecs content file may cite them again. Left on purpose: db/catalogs/padel.json (sources there only
// prove a model exists) and db/expert-play/padel.json (the expert's own notes, never shown). PickleballRecs' banned
// sources (pickleball3.com, The Kitchen Pickle) still sit in its files and get their own cleanup, so pickleball is not
// checked here yet.
const BANNED = /padel\.how|padelful/i;
const SKIP = new Set(["db/catalogs/padel.json", "db/expert-play/padel.json"]);

function padelFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return padelFiles(p);
    return p.endsWith(".json") && /(^|[/-])padel[.-]/.test(p) && !SKIP.has(p) ? [p] : [];
  });
}

test("PadelRecs content files cite no banned review source", () => {
  const files = padelFiles("db");
  assert.ok(files.length > 5, "padel content files found");
  const hits = files.filter(f => BANNED.test(readFileSync(f, "utf8")));
  assert.deepEqual(hits, []);
});

test("the padel parts of shared creator files cite no banned review source", () => {
  for (const f of ["db/creators/reviewer-wrapups.json", "db/creators/reddit-roundups.json", "db/creators/tldrs.json"]) {
    const padel = (JSON.parse(readFileSync(f, "utf8")) as Record<string, unknown>).padel;
    assert.ok(!BANNED.test(JSON.stringify(padel ?? {})), f);
  }
});
