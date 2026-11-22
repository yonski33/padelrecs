import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleanTitle, postIdOf, threadLinkText, THREAD_LINK } from "../lib/thread/reddit-titles";
import { threadTitle } from "../lib/thread/web-sources";

test("titles follow the site rules or are left out", () => {
  assert.equal(cleanTitle("Metalbone CTRL for a Left Side Player?"), "Metalbone CTRL for a Left Side Player?");
  assert.equal(cleanTitle("Time for a new racket — what’s a good step up 🔥"), "Time for a new racket - what’s a good step up");
  assert.equal(cleanTitle("Is a €150 racket worth it?"), null);
  assert.equal(cleanTitle("x".repeat(104)), null);
  assert.equal(cleanTitle("[deleted by user]"), null);
});

test("the link line: the real title, else a slug that can't have been cut, else the plain link", () => {
  const titles = { "1sqioz2": "How to get used to a head-heavy balance?" };
  assert.equal(postIdOf("https://www.reddit.com/r/Padelracket/comments/1SQIOZ2/how_to_get/"), "1sqioz2");
  assert.equal(threadLinkText("https://www.reddit.com/r/Padelracket/comments/1sqioz2/how_to_get_used_to_head_heavy_balance/", titles, threadTitle),
    "How to get used to a head-heavy balance?");
  // A 45-character slug (owner report): Reddit may have cut it, so no slug title.
  assert.equal(threadLinkText("https://www.reddit.com/r/Padelracket/comments/1abc123/best_padel_racket_for_someone_struggling_with/x1/", {}, threadTitle), THREAD_LINK);
  assert.equal(threadLinkText("https://www.reddit.com/r/Padelracket/comments/1abc123/narrowing_down_choices/", {}, threadTitle), "Narrowing down choices");
  assert.equal(threadLinkText(null, {}, threadTitle), THREAD_LINK);
});

test("the stored padel titles are clean", () => {
  const f = JSON.parse(readFileSync("db/reddit-titles/padel.json", "utf8")) as { titles: Record<string, string> };
  for (const t of Object.values(f.titles)) { assert.ok(t.length <= 103); assert.ok(!/—/.test(t)); assert.equal(cleanTitle(t), t); }
});
