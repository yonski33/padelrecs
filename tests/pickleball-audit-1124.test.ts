// PickleballRecs Grok audit 2026-11-24: creator text clean-up, shop rows, the play-style tag and the model families.
import test from "node:test";
import assert from "node:assert/strict";
import { catalogSpelling, withoutPrices, cleanCreatorText, shopName, shownShop } from "../lib/thread/creator-text";
import { styleTag, reviewerLean, voteLean, levelTag } from "../lib/thread/style-tag";
import { modelFamily } from "../lib/compare-pairs";

test("creator text: the catalogue's Boomstik spelling", () => {
  assert.equal(catalogSpelling("less raw power than the Boomstick, and two Boomsticks"), "less raw power than the Boomstik, and two Boomstiks");
  assert.equal(catalogSpelling("Selkirk Boomstik"), "Selkirk Boomstik");
});

test("creator text: quoted prices are cut, the rest of the sentence stays", () => {
  assert.equal(withoutPrices("Softer and lighter than the Boomstik, and about $83 cheaper"), "Softer and lighter than the Boomstik");
  assert.equal(withoutPrices("Likes the Paddletek Bantam ESQ-C a little more at $25 less"), "Likes the Paddletek Bantam ESQ-C a little more");
  assert.equal(withoutPrices("Competes with the Selkirk Boomstik for over $100 less, a touch denser."), "Competes with the Selkirk Boomstik, a touch denser.");
  assert.equal(withoutPrices("Q2 has more power and less spin; Spitfire near $100 is better value."), "Q2 has more power and less spin; Spitfire is better value.");
  assert.equal(withoutPrices("No price here."), "No price here.");
  assert.equal(withoutPrices(null), null);
  assert.equal(cleanCreatorText("Beats the Boomstick for $50 less."), "Beats the Boomstik.");
});

test("shops: bare web addresses get the shop's name; non-US, review sites and dead links are left out", () => {
  assert.equal(shopName("Hometownpickleball.com"), "Hometown Pickleball");
  assert.equal(shopName("Pickleball Central"), "Pickleball Central");
  assert.equal(shownShop("https://www.prismpickleball.ie/store/p/vatic-pro-prism-flash-16mm"), false);
  assert.equal(shownShop("https://www.pickleheads.com/pickleball-gear/joola-hyperion-pro-iv-review"), false);
  assert.equal(shownShop("https://www.pickleballgalaxy.com/six-zero-coral-hybrid-pickleball-paddle.html"), false);
  assert.equal(shownShop("https://www.pickleballgalaxy.com/crbn-4-trufoam-waves-pickleball-paddle.html"), true);
  assert.equal(shownShop("https://www.pickleballcentral.com/x"), true);
});

test("style tag: kept unless reviewers clearly disagree; then theirs only with the vote behind it", () => {
  const a = (counts: number[]) => ({ counts, n: counts.reduce((x, y) => x + y, 0) });
  // Excellent, Great, Good, Okay, Weak
  const powerGreat = a([0, 2, 1, 0, 0]), controlOkay = a([0, 0, 1, 1, 0]), good = a([0, 0, 3, 0, 0]);
  assert.equal(reviewerLean(powerGreat, controlOkay), "power");
  assert.equal(reviewerLean(good, good), null);
  assert.equal(reviewerLean(null, good), null);
  assert.equal(voteLean({ power: 24, control: 4, all_round: 12 }), "power");
  assert.equal(voteLean({ power: 15, control: 21 }), null);
  assert.equal(voteLean({ power: 2, control: 1 }), null);
  assert.equal(styleTag("control", "power", "power"), "power");
  assert.equal(styleTag("control", "power", "control"), null);
  assert.equal(styleTag("control", "power", null), null);
  assert.equal(styleTag("power", "power", null), "power");
  assert.equal(styleTag("control", null, "power"), "control");
});

test("level tag: a level only, never a style", () => {
  assert.equal(levelTag("intermediate → advanced, control players"), "Intermediate to advanced");
  assert.equal(levelTag("control players"), null);
  assert.equal(levelTag(null), null);
});

test("model families: CRBN shapes and Black Ace thicknesses are separate paddles; generations are one family", () => {
  const f = (name: string) => modelFamily({ name, brandId: "b" });
  assert.notEqual(f("CRBN¹ TruFoam Genesis"), f("CRBN² TruFoam Genesis"));
  assert.notEqual(f("ProKennex Black Ace 14"), f("ProKennex Black Ace 16"));
  assert.notEqual(f("ProKennex Black Ace LG"), f("ProKennex Black Ace LG 14"));
  assert.equal(f("11SIX24 Pegasus Power"), f("11SIX24 Pegasus Power 2"));
});

test("PickleballRecs About and affiliate: no score wording, honest review-check line (owner 2026-11-24)", async () => {
  const { PADEL_COPY } = await import("../lib/thread/copy");
  const { pickleballInfo, PB_INFO_SWAPS, PB_INFO_DROP, toPickleball } = await import("../lib/thread/copy-pickleball");
  const before = PADEL_COPY.INFO.filter(c => c.key === "about" || c.key === "affiliate").map(c => toPickleball([...c.intro, ...c.sections.flatMap(s => s.body)].join("\n"))).join("\n");
  for (const [from] of PB_INFO_SWAPS) assert.ok(before.includes(from), from);
  const out = pickleballInfo(PADEL_COPY.INFO).filter(c => c.key === "about" || c.key === "affiliate");
  const text = out.map(c => [...c.intro, ...c.sections.flatMap(s => s.title + "\n" + s.body.join("\n"))].join("\n")).join("\n");
  assert.doesNotMatch(text, /\bscores?\b|0 to 100|checked by a real person/i);
  assert.match(text, /written with AI and checked by a second pass/);
  assert.ok(!out.find(c => c.key === "about")!.sections.some(s => PB_INFO_DROP.includes(s.title)));
});

test("brand intro: the most loved paddle by its loved count, no score", async () => {
  const { brandIntro } = await import("../lib/thread/brand-intro");
  assert.equal(brandIntro("Six Zero", 14, 592, { name: "Coral Pro 16mm", score: 92 }, "paddle", { name: "Coral Pro 16mm", pos: 266 }),
    "Six Zero: 14 current paddles, 592 player reviews. Most loved: the Coral Pro 16mm, loved by 266 players.");
  assert.match(brandIntro("Six Zero", 14, 592, { name: "Coral Pro 16mm", score: 92 }, "paddle"), /Top player score: 92/);
});
