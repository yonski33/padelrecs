import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Banned PickleballRecs review sources (AI-written or excluded): pickleball3.com and The Kitchen Pickle (its blog
// thekitchenpickle.com and its YouTube channel, "The Kitchen Pickleball", UC8Kri-ozieZq01LLzQSNavQ). Not the same as
// Tickle My Pickleball (ticklemypickleball35.com) or Pickleball3en (a player's own channel), which stay.
// Left on purpose: db/expert-play/pickleball.json (the expert's own notes, never shown).
const BANNED = /(^|[^a-z0-9])pickleball3\.com|thekitchenpickle|the kitchen pickle|UC8Kri-ozieZq01LLzQSNavQ/i;
const SKIP = new Set(["db/expert-play/pickleball.json"]);

function siteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return siteFiles(p);
    return p.endsWith(".json") && /(^|[/-])pickleball[.-]/.test(p) && !SKIP.has(p) ? [p] : [];
  });
}

test("PickleballRecs content files cite no banned review source", () => {
  const files = siteFiles("db");
  assert.ok(files.length > 3, "pickleball content files found");
  assert.deepEqual(files.filter(f => BANNED.test(readFileSync(f, "utf8"))), []);
});

test("the pickleball parts of shared creator files cite no banned review source", () => {
  for (const f of ["db/creators/reviewer-wrapups.json", "db/creators/reddit-roundups.json", "db/creators/tldrs.json"]) {
    const site = (JSON.parse(readFileSync(f, "utf8")) as Record<string, unknown>).pickleball;
    assert.ok(!BANNED.test(JSON.stringify(site ?? {})), f);
  }
});

test("the pattern leaves the allowed look-alikes alone", () => {
  for (const ok of ["https://www.ticklemypickleball35.com/blog-2-1/six-zero-coral-review", "Pickleball3en", "Tickle My Pickleball"]) assert.ok(!BANNED.test(ok), ok);
  for (const bad of ["https://pickleball3.com/x", "https://thekitchenpickle.com/blogs/gear/a", "The Kitchen Pickle"]) assert.ok(BANNED.test(bad), bad);
});
