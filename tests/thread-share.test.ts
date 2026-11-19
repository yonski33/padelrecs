import { test } from "node:test";
import assert from "node:assert/strict";
import { fitLine, toneOf, pageTitle, PADEL_WORDS } from "../lib/thread/share-text";

// Thread share cards (owner 2026-11-19): the TL;DR line, the badge colours and which pages get a titled card.
test("one TL;DR line: ~90 characters, cut at a word with an ellipsis", () => {
  assert.equal(fitLine("A light, quick control racket."), "A light, quick control racket.");
  const long = "Easy punch overhead, with more control than most diamonds. The catch: bad timing gets punished hard at the net.";
  const cut = fitLine(long, 90);
  assert.ok(cut.length <= 90, cut); assert.ok(cut.endsWith("…")); assert.ok(!/[ ,.]…$/.test(cut)); assert.ok(long.startsWith(cut.slice(0, -1)));
});
test("badge colours follow the live rule", () => {
  assert.deepEqual([94, 85, 84, 70, 69, 40].map(toneOf), ["g", "g", "y", "y", "w", "w"]);
});
test("titled pages: only known keys draw a title, in the niche's own words", () => {
  assert.equal(pageTitle("catalog")?.title, "Every padel racket, rated by players");
  assert.equal(pageTitle("guide:racket")?.title, "How to choose a padel racket");
  assert.equal(pageTitle("brand:adidas", { adidas: "Adidas" })?.title, "Adidas padel rackets");
  for (const k of ["brand:nope", "guide:nope", "Buy cheap rackets now", "", null]) assert.equal(pageTitle(k as string | null, { adidas: "Adidas" }), null, String(k));
  const pickle = { ...PADEL_WORDS, noun: "pickleball paddle", nouns: "pickleball paddles", site: "PickleballRecs" };
  assert.equal(pageTitle("rankings", {}, pickle)?.title, "Pickleball paddle rankings");
  assert.equal(pageTitle("about", {}, pickle)?.line, "Real player reviews of pickleball paddles");
});
test("withShare: og:image with size and alt, and the large Twitter card, over the page's own metadata", async () => {
  const { withShare } = await import("../app/thread/seo");
  const m = withShare({ title: "X", openGraph: { title: "X", url: "/x" } }, "/x/share-image", "X on PadelRecs");
  assert.deepEqual(m.openGraph?.images, [{ url: "/x/share-image", width: 1200, height: 630, alt: "X on PadelRecs" }]);
  assert.equal((m.openGraph as { url?: string }).url, "/x");
  assert.equal((m.twitter as { card?: string }).card, "summary_large_image");
  assert.equal((withShare({}, "/s", "a").openGraph as { siteName?: string }).siteName, "PadelRecs");
});
