import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAttribution } from "../lib/voice";
import page from "../db/racket-page/discgolf.json";
import card from "../db/fit-card/discgolf.json";
import type { CardContent } from "../lib/fit-card";
import { evidenceLine, MIN_COUNT_SHOWN, type PageContent } from "../lib/racket-page";

// DiscGolfRecs disc pages: drafted by Grok from an evidence pack (pilot, owner 2026-11-16), validated and spot-checked by us; the
// same rules as the pickleball pages (tests/pickleball-content.test.ts), with the niche's own words: "disc", never "racket" / "paddle".
const banned = /racket|paddle|owner|% (liked|loved)|reddit|brand says|roomy/i;

test("disc golf disc page content follows the rules", () => {
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

test("discgolf match-box lines follow the rules (tips and try-instead lines too)", () => {
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
      if (l.alt) assert.ok(l.alt.slug !== slug && l.alt.src.length >= 2, `${slug}: try-instead needs another disc and 2+ sources`);
    }
    assert.ok(!c.strengths[0]?.minor, `${slug}: a side trait leads`);
  }
});

// Owner review of the samples (2026-11-16): the body adds what the title doesn't say, the biggest catch comes first,
// arm wording stays experiential, and defects are said neutrally.
const STOP = new Set("a an the and or of to in on at for with it its is it's your you out off up too very more less no not than from by as be can this that disc".split(" "));
const words = (t: string) => new Set((t.toLowerCase().replace(/==/g, "").match(/[a-z0-9.+']+/g) ?? []).filter(w => !STOP.has(w) && w.length > 2).map(w => w.slice(0, 5)));
const medical = /\b(prevent|cure|heal|injur|tendon|inflammat|therap|medical)\w*/i;
const loaded = /\b(junk|defective|garbage|poor quality|cheaply made)\b/i;

test("discgolf items: body adds to the title, biggest catch first, no medical or loaded defect claims", () => {
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

// The Grok validator's remaining checks (scripts/grok/validate.py), so CI enforces them on the stored content too:
// no yes/no clash without a condition, and the tagline's catch is the biggest catch.
const PAIRS: [RegExp, RegExp][] = [
  [/stable|holds? (a |its )?line|straight/, /flip|turns? over too|too understable/], [/understable|turns? over|flips? up/, /too overstable|won.t turn|fades? hard/],
  [/glide|glidey/, /little glide|drops? out|no glide/], [/grip|tacky/, /slippery|slick/],
  [/durab|lasts|holds up|keeps its flight/, /beats? in fast|wears? (out )?fast|beat in within/],
  [/easy (to throw|for slow)|slow arm|beginner/, /needs? (a )?(big|power) arm|not a first|too fast for/]];
const CONDITION = /\bcan\b|some|split|\bdx\b|light|beat|worn|wear|plastic|\d+ ?g\b|big arm|power arm|fresh|new|copies|runs?\b|max-weight|heav|slow|bigger arm|hard throws|flat|ripped|snapped|fast|forced|yanked/;
test("disc golf content: no unconditioned yes/no clash, tagline catch is the biggest catch", () => {
  for (const [slug, v] of Object.entries(page as Record<string, PageContent>)) {
    const Y = v.yes.map(i => `${i.title} ${i.t}`).join(" ").toLowerCase(), N = v.no.map(i => `${i.title} ${i.t}`).join(" ").toLowerCase();
    for (const [y, n] of PAIRS) assert.ok(!(y.test(Y) && n.test(N) && !CONDITION.test(N)), `${slug}: yes/no clash ${y} vs ${n} without a condition`);
    const cat = v.tagline.split("The catch:")[1];
    assert.ok(cat, `${slug}: tagline needs "The catch:"`);
    const a = words(cat!), b = words(`${v.no[0].title} ${v.no[0].t}`);
    assert.ok([...a].some(w => b.has(w)), `${slug}: the tagline's catch should be the biggest catch (${v.no[0].title})`);
  }
});

test("every site hides the count line under 5 reports, in its own word for people (owner rule 2026-11-16)", () => {
  const item = (n: number) => ({ title: "x", t: "a ==b== c", src: Array.from({ length: n }, (_, i) => `r${i}`) });
  assert.equal(MIN_COUNT_SHOWN, 5, "the threshold is pinned at 5");
  for (const many of ["players", "users", "drivers"]) {
    assert.equal(evidenceLine(item(4), many), null);
    assert.equal(evidenceLine(item(5), many), `5 ${many} mention it`);
  }
  assert.equal(evidenceLine({ ...item(3), ev: "the #1 complaint, {n} players" }), null, "special count lines follow the same rule");
});
