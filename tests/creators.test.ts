import { test } from "node:test";
import assert from "node:assert/strict";
import { attrSummary, bigPicture, cardChips, checkedDay, howItPlays, lowestOffer, marks, splitSummary, usd, takeaway, sortReviews, stanceCounts, measuredLine, initials, WORDS } from "../lib/thread/creators";
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
      if (r.creator === "Pickleheads") { assert.equal(r.score, null); for (const t of [r.summary, r.more ?? "", r.short]) assert.doesNotMatch(t, /\d(\.\d)? out of 5|stars/); }
      for (const h of r.highlights) assert.ok(r.summary.includes(h), `${slug}: ${r.creator} highlight not in summary`);
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
  const many = [{ attrs: { spin: "Excellent" as const, control: "Okay" as const } }, { attrs: { spin: "Excellent" as const, control: "Good" as const } },
    { attrs: { spin: "Excellent" as const, control: "Weak" as const } }, { attrs: { spin: "Great" as const, control: "Great" as const } }];
  assert.deepEqual(bigPicture(many), { likes: ["Excellent spin"], concerns: ["Control Okay or weaker for 2 of 4"] });
  assert.deepEqual(howItPlays(many).find(h => h.k === "control"), { k: "control", label: "Control", word: "Okay", line: "1 of 4 call it Excellent or Great; 2 Okay or weaker." });
  assert.equal(howItPlays(many).find(h => h.k === "spin")!.word, "Excellent");
  assert.deepEqual(cardChips({ control: "Okay", spin: "Excellent", power: "Good" }), [{ tone: "pos", text: "Excellent spin" }, { tone: "neg", text: "Okay control" }]);
  assert.deepEqual(marks("a big hit, a soft touch", ["big hit", "soft"]), [{ t: "a ", on: false }, { t: "big hit", on: true }, { t: ", a ", on: false }, { t: "soft", on: true }, { t: " touch", on: false }]);
  const o = (shop: string, price: number, inStock = true) => ({ shop, url: "https://x.test", price, inStock, edition: null, affiliate: false });
  assert.deepEqual(lowestOffer([o("A", 159), o("B", 159.99), o("Brand", 99.99, false)])?.shops.map(x => x.shop), ["A"]);
  assert.equal(lowestOffer([o("A", 110), o("B", 110), o("C", 200)])?.shops.length, 2);
  assert.equal(lowestOffer([o("Brand", 99.99, false)]), null);
  assert.equal(usd(110), "$110"); assert.equal(usd(159.99), "$159.99"); assert.equal(checkedDay("2026-11-22"), "Nov 22, 2026");
});

test("creator page: prices are USD snapshots, sold-out rows last and never the lowest", () => {
  for (const [slug, p] of pages) {
    const offers = p.prices?.offers ?? [];
    assert.ok(offers.length > 0, slug);
    const firstOut = offers.findIndex(x => !x.inStock);
    if (firstOut >= 0) assert.ok(offers.slice(firstOut).every(x => !x.inStock), `${slug}: sold out rows last`);
    const low = lowestOffer(offers)!;
    assert.ok(low.shops.every(x => x.inStock), slug);
  }
});

test("creators home: fixture rules and the boards", async () => {
  const { creatorHome } = await import("../lib/thread/creator-data");
  const { boards, praiseLine } = await import("../lib/thread/creator-home");
  const h = creatorHome("pickleball")!;
  assert.equal(Object.keys(h.paddles).length, 20);
  const text = JSON.stringify(h);
  assert.doesNotMatch(text, /verdict|—|\bowners?\b/i);
  for (const [slug, p] of Object.entries(h.paddles)) {
    assert.equal(p.pos + p.mix + p.neg, p.reviews, slug);
    if (p.praise) assert.ok(p.praise.n >= 2 && p.praise.n <= p.reviews, slug);
    if (p.price) assert.ok(p.price.usd > 0 && /^https:\/\//.test(p.price.url), slug);
  }
  assert.equal(h.total, Object.values(h.paddles).reduce((a, p) => a + p.reviews, 0));
  assert.equal(praiseLine({ ...h.paddles["11six24-vapor-power-2"]!, praise: { key: "spin", words: "spin", n: 14 } }), "Praised for spin in 14 reviews");
  const b = boards(h.paddles);
  assert.equal(b.length, 6);
  for (const x of b) { assert.ok(x.rows.length <= 3); for (let i = 1; i < x.rows.length; i++) assert.ok(x.rows[i - 1]!.n >= x.rows[i]!.n); }
  // The latest summaries are YouTube, newest first.
  for (let i = 1; i < h.latest.length; i++) assert.ok(h.latest[i - 1]!.date >= h.latest[i]!.date);
});
