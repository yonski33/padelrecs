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

test("v3 sites: no em dash in the footer line; the score page is retired to How rankings work (308)", () => {
  assert.match(readFileSync("app/layout.tsx", "utf8"), /\{`\$\{niche\.site\.domain\} · \$\{niche\.site\.footer\}`\}/);
  assert.match(readFileSync("app/thread/shell.tsx", "utf8"), /v3Site\(niche\.id\) \? \{ label: "How rankings work", href: "\/how-rankings-work" \}/);
  assert.match(readFileSync("lib/thread/look.ts", "utf8"), /p === "\/how-rankings-work" && v3Site\(nicheId\)/);
  assert.match(readFileSync("next.config.ts", "utf8"), /const retired=v3Site\(niche\.id\)\?\[\{source:"\/how-we-make-these",destination:"\/how-rankings-work",statusCode:308 as const\}\]/);
  assert.doesNotMatch(readFileSync("app/thread/rankings/[slug]/page.tsx", "utf8"), /how-we-make-these/);
  const how = readFileSync("lib/thread/rankings-hub.ts", "utf8");
  assert.match(how, /export const SR_HOW/);
  assert.doesNotMatch(how.slice(how.indexOf("export const SR_HOW"), how.indexOf("export const AUDIO_HOW")), /—|\bscore\b(?!\.)(?! anywhere)/i);
});
