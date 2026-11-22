import { test } from "node:test";
import assert from "node:assert/strict";
import { attrSummary, splitSummary, takeaway, sortReviews, stanceCounts, measuredLine, initials, WORDS } from "../lib/thread/creators";
import { creatorPage, creatorSlugs } from "../lib/thread/creator-data";
import { creatorPageFor, CREATOR_PAGE_SLUGS } from "../lib/thread/sites";

const pages = creatorSlugs("pickleball").map(s => [s, creatorPage("pickleball", s)!] as const);

test("creator page: the fixture and the proxy's slug list agree", () => {
  assert.deepEqual(creatorSlugs("pickleball").sort(), [...CREATOR_PAGE_SLUGS.pickleball!].sort());
  assert.ok(creatorPageFor("pickleball", "11six24-vapor-power-2"));
  assert.ok(!creatorPageFor("pickleball", "joola-perseus-pro-iv"));
  assert.ok(!creatorPageFor("padel", "11six24-vapor-power-2"));
  assert.equal(creatorPage("padel", "11six24-vapor-power-2"), null);
});

// Owner decisions 2026-11-22: weak sources dropped, Pickleheads scores hidden, real quotes only, site copy rules.
test("creator page: the owner's data rules hold in the fixture", () => {
  const dropped = ["FORWRD", "Man vs Debt", "REDTACKLE", "PickleballCentral", "Pickleball Hustle"];
  for (const [slug, p] of pages) {
    assert.ok(p.reviews.length >= 8, slug);
    const text = JSON.stringify(p);
    assert.doesNotMatch(text, /verdict/i, slug);
    assert.doesNotMatch(text, /—/, slug);
    assert.doesNotMatch(text, /\bowners?\b/i, slug);
    for (const r of p.reviews) {
      assert.ok(!dropped.includes(r.creator), `${slug}: ${r.creator} should be dropped`);
      if (r.creator === "Pickleheads") { assert.equal(r.score, null); assert.doesNotMatch(r.summary, /\d(\.\d)? out of 5/); }
      if (r.quote) assert.ok(r.quote.split(/\s+/).length < 15, `${slug}: ${r.creator} quote too long`);
      for (const w of Object.values(r.attrs)) assert.ok((WORDS as readonly string[]).includes(w!), `${slug}: ${r.creator} ${w}`);
      for (const [s, t] of r.chapters) { assert.ok(s > 0); assert.doesNotMatch(t, /\b(intro|verdict|discount|code)\b/i); }
      assert.equal(new Set(p.reviews.map(x => x.id)).size, p.reviews.length, `${slug}: ids unique`);
    }
  }
});

test("creator page: helpers", () => {
  const rs = [{ attrs: { spin: "Excellent" as const } }, { attrs: { spin: "Great" as const } }, { attrs: {} }];
  assert.deepEqual(attrSummary(rs, "spin"), { counts: [1, 1, 0, 0, 0], n: 2, word: "Great", share: 1 }); // a tie goes to the lower word
  assert.equal(attrSummary(rs, "power"), null);
  assert.deepEqual(splitSummary("One. Two two. Three."), ["One. Two two.", "Three."]);
  assert.equal(takeaway("Calls it 3.5 and up. Then more."), "Calls it 3.5 and up.");
  assert.deepEqual(stanceCounts([{ stance: "pos" }, { stance: "mix" }, { stance: "pos" }]), { pos: 2, mix: 1, neg: 0 });
  assert.deepEqual(sortReviews([{ stance: "mix", date: "2026-03-01" }, { stance: "pos", date: "2025-01-01" }, { stance: "pos", date: "2026-01-01" }], "stance")
    .map(x => x.date), ["2026-01-01", "2025-01-01", "2026-03-01"]);
  assert.equal(measuredLine({ swing_weight: 111, spin_rpm: 2113, other: 1 }), "Swing weight 111 · Spin 2113 rpm");
  assert.equal(initials("Rackets & Runners - Pickleball"), "RR");
});
