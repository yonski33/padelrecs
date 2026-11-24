import test from "node:test";
import assert from "node:assert/strict";
import { dayLabel, isVideoComment, QUOTE_MAX_WORDS, shortQuote, tabOf, webTabs } from "../lib/thread/web-sources";
import { webV2Site } from "../lib/thread/sites";

const g = (v: number, t: number, c: number, b: number) => ({ videos: Array(v).fill(0), threads: Array(t).fill(0), comments: Array(c).fill(0), blogs: Array(b).fill(0) });

test("v2 is on for padel only, so other sites keep the earlier box", () => {
  assert.equal(webV2Site("padel"), true);
  for (const s of ["pickleball", "skin", "discgolf", "audio", "simracing", "tennis"]) assert.equal(webV2Site(s), false);
});

test("tabs: All plus each source with a card; none when only one source is present", () => {
  assert.deepEqual(webTabs(g(2, 1, 3, 0)), ["all", "videos", "reddit"]);
  assert.deepEqual(webTabs(g(1, 0, 0, 1)), ["all", "videos", "blogs"]);
  assert.deepEqual(webTabs(g(0, 2, 4, 0)), []);
  assert.deepEqual(webTabs(g(0, 0, 0, 0)), []);
  assert.equal(tabOf("threads"), "reddit"); assert.equal(tabOf("comments"), "reddit"); assert.equal(tabOf("videos"), "videos");
});

test("the headline quote is the source's exact words, short, or nothing", () => {
  // Real padel excerpts (2026-11-22).
  assert.equal(shortQuote("Loved the 2025 version and haven't tried the 2026 yet "), "Loved the 2025 version and haven't tried the 2026 yet");
  assert.equal(shortQuote("Great Control especially for volleys and nice Sweetspot but still enough power for smashes"),
    "Great Control especially for volleys and nice Sweetspot but still enough power for smashes");
  // Too long as a whole: its first sentence, kept exactly.
  assert.equal(shortQuote("I tried the Trilogy for a few minutes. It is indeed very light, I actually had to downshift the power of my shots compared to Head."),
    "I tried the Trilogy for a few minutes.");
  // Starts mid-sentence, too long, not English, a question, a price, too short: no quote.
  assert.equal(shortQuote("despite being lower level than you, i found a nice mix between control and power"), null);
  assert.equal(shortQuote("I recently switched from a 2024 Nox AT10 12k that I’ve had for a year and a half, to a 2026 Bullpadel XPLO"), null);
  assert.equal(shortQuote("Una pasada yo me la pille hace poco y es brutal"), null);
  assert.equal(shortQuote("Great racket for the price", "es"), null);
  assert.equal(shortQuote("Is it worth it for a beginner like me?"), null);
  assert.equal(shortQuote("Got it for €150 and it is a great racket."), null);
  assert.equal(shortQuote("Love it."), null);
  assert.equal(shortQuote(null), null);
  const q = shortQuote("This is a long line with many words that is still under the limit ok");
  assert.ok(!q || q.split(" ").length <= QUOTE_MAX_WORDS);
});

test("dates read as the mock's (Sep 21, older years with the year), the same on server and browser", () => {
  assert.equal(dayLabel("2026-09-21", 2026), "Sep 21");
  assert.equal(dayLabel("2024-03-05T10:00:00Z", 2026), "Mar 5, 2024");
  assert.equal(dayLabel("", 2026), ""); assert.equal(dayLabel(null, 2026), "");
});

test("a YouTube viewer comment is told apart from the channel's own video", () => {
  assert.equal(isVideoComment("https://www.youtube.com/watch?v=abcdefghijk&lc=UgwJCnT59"), true);
  assert.equal(isVideoComment("https://www.youtube.com/watch?v=abcdefghijk"), false);
});
