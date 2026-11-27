// Creator (reviewer) pages (owner 2026-11-27): who gets a page, the counts, the agreement line, favourites and similar taste.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewersFrom, reviewerSlug, consensusWithout, favourites, productTakes, similarTaste, rowLine, subsShort, socialLinks, type ReviewerRow } from "../lib/thread/reviewers";

let n = 0;
const row = (creator: string, product: string, stance: ReviewerRow["stance"], date = "2026-01-01"): ReviewerRow => ({ id: `r${++n}`, creator, kind: "youtube",
  url: "https://www.youtube.com/watch?v=abcdefghijk", channel: `https://www.youtube.com/@${creator.replace(/\W/g, "")}`, lang: "en", date, video: null, len: 600,
  stance, productSlug: product, productName: product.toUpperCase(), line: "Line.", tie: null, disclosure: null });

test("slugs drop emoji, apostrophes and case, so name spellings merge", () => {
  assert.equal(reviewerSlug("Matt's Pickleball"), "matts-pickleball");
  assert.equal(reviewerSlug("Pickleball Medicine 💊"), reviewerSlug("Pickleball Medicine"));
  assert.equal(reviewerSlug("STS PICKLEBALL"), reviewerSlug("STS Pickleball"));
  assert.notEqual(reviewerSlug("패들러"), reviewerSlug("수달피클볼"));
  assert.match(reviewerSlug("패들러"), /^creator-[a-z0-9]+$/);
});

test("only 5+ reviews get a page; spellings count together", () => {
  const rows = [...["a", "b", "c"].map(p => row("STS PICKLEBALL", p, "pos")), ...["d", "e"].map(p => row("STS Pickleball", p, "mix")), ...["a", "b"].map(p => row("Small", p, "pos"))];
  const list = reviewersFrom(rows);
  assert.deepEqual(list.map(r => [r.slug, r.n, r.pos, r.mix, r.name]), [["sts-pickleball", 5, 3, 2, "STS PICKLEBALL"]]);
});

test("consensus leaves the review out and needs a clear lead", () => {
  assert.equal(consensusWithout({ pos: 3, mix: 0, neg: 1 }, "neg"), "pos");
  assert.equal(consensusWithout({ pos: 1, mix: 1, neg: 0 }, "pos"), null); // one other review only
  assert.equal(consensusWithout({ pos: 2, mix: 2, neg: 1 }, "neg"), null); // a tie
});

test("agreement share over reviews with a consensus, only from 5", () => {
  const rows: ReviewerRow[] = [];
  for (const p of ["p1", "p2", "p3", "p4", "p5", "p6"]) { rows.push(row("Other A", p, "pos"), row("Other B", p, "pos")); }
  ["p1", "p2", "p3", "p4"].forEach(p => rows.push(row("Me", p, "pos"))); ["p5", "p6"].forEach(p => rows.push(row("Me", p, "neg")));
  const me = reviewersFrom(rows).find(r => r.slug === "me")!;
  assert.equal(me.agree, 67);
  const few = reviewersFrom([...rows.filter(r => r.creator !== "Me"), ...["p1", "x", "y", "z", "w"].map(p => row("Me", p, "pos"))]).find(r => r.slug === "me")!;
  assert.equal(few.agree, null);
});

test("favourites are loved products, most reviewed first; similar taste is smoothed", () => {
  const rows = [row("Me", "a", "pos"), row("Me", "b", "pos"), row("Me", "c", "neg"), row("Me", "d", "pos"), row("Me", "e", "mix"),
    row("X", "b", "pos"), row("Y", "b", "pos"), row("X", "a", "pos"), row("X", "c", "neg"), row("X", "d", "pos"), row("X", "e", "pos")];
  const list = reviewersFrom(rows, 1), me = list.find(r => r.slug === "me")!;
  assert.deepEqual(favourites(me, productTakes(rows)).map(r => r.productSlug), ["b", "a", "d"]);
  const sim = similarTaste(me, list);
  assert.deepEqual(sim.map(s => [s.reviewer.slug, s.same, s.shared]), [["x", 4, 5]]);
});

test("row line from existing fields; subscribers; social links", () => {
  assert.equal(rowLine({ short: null, keyPoint: "Great spin", trade: "Heavy head", summary: "x" }), "Great spin. Heavy head.");
  assert.equal(rowLine({ short: " Short one. ", keyPoint: "k", trade: null, summary: "x" }), "Short one.");
  assert.equal(rowLine({ short: null, keyPoint: null, trade: null, summary: "First. Second." }), "First.");
  assert.equal(subsShort(58100), "58.1K"); assert.equal(subsShort(212000), "212K"); assert.equal(subsShort(1250000), "1.3M"); assert.equal(subsShort(null), null);
  assert.deepEqual(socialLinks(["Follow https://instagram.com/foo and https://www.tiktok.com/@bar. Shop https://shop.example.com"]).map(l => l.label), ["Instagram", "TikTok"]);
});

test("an owner alias puts a second channel's reviews on the first one's page", () => {
  const rows = [...["a", "b", "c"].map(p => row("Padel Review", p, "pos")), ...["d", "e"].map(p => row("PADELREVIEW ENG", p, "mix"))];
  assert.deepEqual(reviewersFrom(rows).map(r => r.slug), []);
  const [one] = reviewersFrom(rows, 5, { "PADELREVIEW ENG": "Padel Review" });
  assert.deepEqual([one!.slug, one!.name, one!.n, one!.channel], ["padel-review", "Padel Review", 5, "https://www.youtube.com/@PadelReview"]);
});
