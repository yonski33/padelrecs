import { test } from "node:test";
import assert from "node:assert/strict";
import { niches } from "../lib/niche/all";

// TL;DR lines on the Thread product pages read "N reviews <says>." (app/thread/racket-data.ts). Each tag on a Thread site
// carries its own phrase, so no line comes out as "8 reviews say it is holds lines." (owner, DiscGolfRecs, 2026-11-20).
const THREAD = ["padel", "pickleball", "skin", "discgolf", "simracing", "stackrecs"];

test("every tag on a Thread site has a TL;DR phrase that reads after a count", () => {
  for (const id of THREAD) for (const t of niches[id].tags) {
    assert.ok(t.says, `${id}: "${t.label}" has no says phrase`);
    assert.match(t.says!, /^(say|report|call|note|warn) /, `${id}: "${t.says}" should start with a verb after "N reviews"`);
    assert.ok(!/\bis (\w+ )?(holds|has|gives|lots|beats|flies)\b|say it is (great|good|lots) (pop|grip|glide|spin)\b/.test(t.says!), `${id}: "${t.says}"`);
    assert.ok(!/—/.test(t.says!) && t.says!.length <= 50, `${id}: "${t.says}"`);
  }
});
