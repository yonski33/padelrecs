import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAttribution } from "../lib/voice";
import page from "../db/racket-page/tennis.json";
import card from "../db/fit-card/tennis.json";
import type { CardContent } from "../lib/fit-card";
import type { PageContent } from "../lib/racket-page";

// TennisRecs racket pages: drafted by Grok from evidence packs (owner 2026-11-16), validated (scripts/grok-tennis/validate_tn.py) and
// spot-checked by us; the pickleball rules, with tennis words ("racket", "players"; never "paddle" / "owners").
const banned = /paddle|\bdiscs?\b|owner|% (liked|loved)|reddit|brand says|roomy/i;

test("tennis racket page content follows the rules", () => {
  for (const [slug, v] of Object.entries(page as Record<string, PageContent>)) {
    for (const t of [v.tagline, v.bottom, ...[...v.yes, ...v.no].flatMap(i => [i.title, i.t.replace(/==/g, "")])]) {
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

test("tennis match-box lines follow the rules (tips and try-instead lines too)", () => {
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
      if (l.alt) assert.ok(l.alt.slug !== slug && l.alt.src.length >= 2, `${slug}: try-instead needs another racket and 2+ sources`);
    }
    assert.ok(!c.strengths[0]?.minor, `${slug}: a side trait leads`);
  }
});

// Owner review of the samples (2026-11-16): the body adds what the title doesn't say, the biggest catch comes first,
// arm wording stays experiential, and defects are said neutrally.
const STOP = new Set("a an the and or of to in on at for with it its is it's your you out off up too very more less no not than from by as be can this that racket frame".split(" "));
const words = (t: string) => new Set((t.toLowerCase().replace(/==/g, "").match(/[a-z0-9.+']+/g) ?? []).filter(w => !STOP.has(w) && w.length > 2).map(w => w.slice(0, 5)));
const medical = /\b(prevent|cure|heal|injur|tendon|inflammat|therap|medical)\w*/i;
const loaded = /\b(junk|defective|garbage|poor quality|cheaply made)\b/i;

test("tennis items: body adds to the title, biggest catch first, no medical or loaded defect claims", () => {
  for (const [slug, v] of Object.entries(page as Record<string, PageContent>)) {
    for (const i of [...v.yes, ...v.no]) {
      const a = words(i.title), b = words(i.t), shared = [...a].filter(w => b.has(w));
      assert.ok(!(shared.length >= 2 || (a.size === 1 && shared.length === 1 && b.size < 4)), `${slug}: body repeats the title "${i.title}": ${i.t}`);
    }
    const n = (i: { src: string[] }) => new Set(i.src).size;
    assert.ok(n(v.no[0]) >= Math.max(...v.no.map(n)), `${slug}: the biggest catch must come first`);
    const c = (card as Record<string, CardContent>)[slug];
    for (const t of [v.tagline, v.bottom, ...[...v.yes, ...v.no].map(i => i.t), ...(c ? [...c.strengths, ...c.catches].flatMap(l => [l.tip?.t, l.alt?.t]) : [])].filter((x): x is string => !!x)) {
      assert.ok(!medical.test(t), `${slug}: medical claim: ${t}`);
      assert.ok(!loaded.test(t), `${slug}: loaded defect wording: ${t}`);
    }
  }
});
