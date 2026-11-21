import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Owner 2026-11-22: no score number anywhere on the v3 sites (padel, audio, sim racing). These are the places that still drew
// one: the header search, the shared row, the brands page, and the racket page AudioRecs falls back to.
test("v3 sites: the search, rows, brands and the fallback racket page draw no score", () => {
  const search = readFileSync("app/racket-search.tsx", "utf8"), api = readFileSync("app/api/racket-search/route.ts", "utf8");
  assert.match(search, /const NO_SCORE = v3Site\(niche\.id\);/);
  assert.match(search, /\{!NO_SCORE && r\.score != null && <span className=\{`th-badge xs/);
  assert.match(api, /\.\.\.\(noScore \? \{\} : \{ score: sig\.get\(r\.id\)\?\.signal \?\? null \}\)/);
  assert.match(readFileSync("app/thread/ui.tsx", "utf8"), /const NO_SCORE = v3Site\(niche\.id\);/);
  assert.match(readFileSync("app/thread/brands/page.tsx", "utf8"), /!v3Site\(niche\.id\) && top\?\.score != null && <Badge/);
  const page = readFileSync("app/thread/rackets/[slug]/page.tsx", "utf8");
  assert.match(page, /\{!V3 && <Badge n=\{x\.score\} size="sm"\/>\}/);
  assert.match(page, /\{!V3 && <span className="th-inline-score">/);
  assert.match(page, /\{!V3 && \(row\?\.score != null \? <span className=\{`th-badge/);
});
