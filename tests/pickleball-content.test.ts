import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAttribution } from "../lib/voice";
import page from "../db/racket-page/pickleball.json";
import card from "../db/fit-card/pickleball.json";
import type { CardContent } from "../lib/fit-card";
import type { PageContent } from "../lib/racket-page";

// PickleballRecs paddle pages (v2): the same rules as padel's racket pages (tests/fit-card.test.ts, tests/voice.test.ts), plus
// the niche's own words: "paddle", never "racket"; "players", never "owners".
const banned = /racket|owner|% (liked|loved)|reddit|brand says|roomy/i;

test("pickleball paddle page content follows the rules", () => {
  for (const [slug, v] of Object.entries(page as Record<string, PageContent>)) {
    for (const t of [v.tagline, v.bottom, ...[...v.yes, ...v.no].map(i => i.t.replace(/==/g, ""))]) {
      assert.ok(t.length <= 105, `${slug}: too long: ${t}`);
      assert.ok(!banned.test(t), `${slug}: banned words: ${t}`);
      assert.ok(!hasAttribution(t), `${slug}: says who said it: ${t}`);
    }
    for (const side of [v.yes, v.no]) {
      assert.ok(side.length >= 1 && side.length <= 4, `${slug}: 1-4 items`);
      assert.equal(new Set(side.map(i => i.title)).size, side.length, `${slug}: duplicate titles`);
      for (const i of side) { assert.equal(i.t.split("==").length, 3, `${slug}: one highlight: ${i.t}`); assert.ok(new Set(i.src).size >= 2, `${slug}: 2+ sources: ${i.t}`); }
    }
  }
});

test("pickleball match-box lines follow the rules (tips and try-instead lines too)", () => {
  for (const [slug, c] of Object.entries(card as Record<string, CardContent>)) {
    assert.ok(slug in (page as object), `${slug}: card without page content`);
    for (const l of [...c.strengths, ...c.catches]) {
      for (const t of [l.t, l.tip?.t, l.alt?.t].filter((x): x is string => !!x)) {
        assert.ok(t.length <= 105, `${slug}: too long: ${t}`);
        assert.ok(!banned.test(t), `${slug}: banned words: ${t}`);
        assert.ok(!hasAttribution(t), `${slug}: says who said it: ${t}`);
      }
      assert.ok(new Set(l.src).size >= 2, `${slug}: 2+ sources: ${l.t}`);
      if (l.tip) assert.ok(new Set(l.tip.src).size >= 2, `${slug}: tip needs 2+ sources: ${l.tip.t}`);
      if (l.alt) assert.ok(l.alt.slug !== slug && l.alt.src.length >= 2, `${slug}: try-instead needs another paddle and 2+ sources`);
    }
    assert.ok(!c.strengths[0]?.minor, `${slug}: a side trait leads`);
  }
});
