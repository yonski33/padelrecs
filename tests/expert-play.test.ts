// Expert How it plays files (db/expert-play, owner decision 2026-11-18): every bar has whole dots 1–5 and a line that reads as
// plain expert advice; the hand-set dot wins over the expert's.
import { test } from "node:test";
import assert from "node:assert/strict";
import padel from "../db/expert-play/padel.json";
import pickleball from "../db/expert-play/pickleball.json";
import tennis from "../db/expert-play/tennis.json";
import { readExpertPlay, lineProblem, shownDots } from "../lib/expert-play";

for (const [site, raw, keys] of [["padel", padel, ["power", "control", "forgiveness", "arm"]], ["pickleball", pickleball, ["power", "control", "spin"]], ["tennis", tennis, ["power", "control", "spin", "arm"]]] as const) {
  test(`${site}: every expert bar has dots and a clean line`, () => {
    const f = readExpertPlay(raw), bad: string[] = [];
    assert.ok(Object.keys(f.products).length > 100);
    for (const [slug, e] of Object.entries(f.products)) for (const k of keys) {
      const t = e.traits[k];
      if (!t) { bad.push(`${slug} ${k}: missing`); continue; }
      const p = t.line ? lineProblem(t.line) : "no line";
      if (p) bad.push(`${slug} ${k}: ${p}`);
    }
    assert.deepEqual(bad, []);
  });
}
test("a hand-set dot wins over the expert's", () => {
  const e = { traits: { power: { dots: 2, note: "" }, control: { dots: 5, note: "" } } };
  assert.deepEqual(shownDots(e, { power: 4 }), { control: 5 });
});
test("lines with counts, tests or lab numbers are flagged", () => {
  assert.ok(lineProblem("3 players say it has easy power."));
  assert.ok(lineProblem("Spin hits 2,400 rpm in the lab."));
  assert.equal(lineProblem("Among the spinniest faces, with grit that lasts."), null);
});
