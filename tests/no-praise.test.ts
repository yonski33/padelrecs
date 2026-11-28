import { test } from "node:test";
import assert from "node:assert/strict";
import { noPraise } from "../lib/no-praise";
import wrapups from "../db/creators/reviewer-wrapups.json";
import roundups from "../db/creators/reddit-roundups.json";
import tldrs from "../db/creators/tldrs.json";
import compareLines from "../db/creators/compare-lines.json";

test("no-praise: the swap patterns", () => {
  const s = (t: string) => noPraise(t).text;
  assert.equal(s("Reviewers praise a plush, forgiving control paddle with spin."), "Reviewers call it a plush, forgiving control paddle with spin.");
  assert.equal(s("Praises a forgiving sweet spot."), "Loves a forgiving sweet spot.");
  assert.equal(s("Reviewers praise the spin."), "Reviewers love the spin.");
  assert.equal(s("A paddle praised for dwell."), "A paddle loved for dwell.");
  assert.equal(s("Every post is positive, with praise for power."), "Every post is positive, with love for power.");
  assert.equal(s("Praises shot shaping. Players mostly praise control."), "Loves shot shaping. Players mostly love control.");
  assert.equal(s("A paddle reviewers praise for power."), "A paddle reviewers love for power.");
  // Uses the patterns don't cover stay as they are, flagged.
  const f = noPraise("The grit gets praised as durable.");
  assert.equal(f.changed, false); assert.equal(f.flags.length, 1);
});

/** The copy guard (owner 2026-11-28): sites whose stored text has been through scripts/no-praise.mts. A site joins once its
 *  swap is written; every word left over must be one of its flagged, hand-checked texts. */
const PRAISE_FREE: string[] = [];
const ALLOWED: Record<string, number> = {};
test("no-praise: stored copy on praise-free sites", () => {
  for (const site of PRAISE_FREE) {
    const texts = [wrapups, roundups, tldrs, compareLines].map(d => JSON.stringify((d as Record<string, unknown>)[site] ?? {}));
    const left = texts.join(" ").match(/\bprais(e|es|ed|ing)\b/gi)?.length ?? 0;
    assert.ok(left <= (ALLOWED[site] ?? 0), `${site}: ${left} uses of "praise" left in stored copy`);
  }
});
