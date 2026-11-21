import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { playersWord, splitSources, threadTitle, thumbOf, videoId } from "../lib/thread/web-sources";

const card = (kind: string, url: string | null = null) => ({ kind, url });

test("player reviews and outside sources split into the mock's groups", () => {
  const s = splitSources([card("player"), card("player"), card("youtube", "https://www.youtube.com/watch?v=abcdefghijk"),
    card("reddit", "https://www.reddit.com/r/padel/comments/1vk5zp9/metalbone_ctrl_for_a_left_side_player/"),
    card("reddit", "https://www.reddit.com/r/padel/comments/1vk5zp9/metalbone_ctrl_for_a_left_side_player/p2sw3ti/"),
    card("blog", "https://example.com/review"), card("forum", "https://example.org/t/1")]);
  assert.equal(s.players.length, 2);
  assert.deepEqual([s.web.threads.length, s.web.videos.length, s.web.comments.length, s.web.blogs.length], [1, 1, 1, 2]);
});

test("thread titles come from the link, videos get YouTube's own thumbnail", () => {
  assert.equal(threadTitle("https://www.reddit.com/r/Padelracket/comments/1vk5zp9/metalbone_ctrl_for_a_left_side_player/p2sw3ti/"),
    "Metalbone ctrl for a left side player");
  assert.equal(threadTitle("https://www.reddit.com/r/padel/comments/abc/hi/"), null);
  assert.equal(videoId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(videoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&lc=Ugx1"), "dQw4w9WgXcQ");
  assert.equal(thumbOf("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg");
  assert.equal(thumbOf("https://example.com"), null);
});

test("summaries say players, never owners", () => {
  assert.equal(playersWord("Owners agree it needs clean contact. An owner says the owner's grip wears."),
    "Players agree it needs clean contact. A player says the player's grip wears.");
  assert.equal(playersWord("The co-owner and the shop owner"), "The co-owner and the shop player");
});

test("the racket page lists only player reviews and puts the rest in From around the web", () => {
  const page = readFileSync("app/thread/racket-v7b.tsx", "utf8"), live = readFileSync("app/thread/live/racket-v7b.tsx", "utf8");
  assert.match(page, /<ReviewsV7b id=\{p\.id\} cards=\{src\.players\}\/>/);
  assert.match(page, /<WebSources web=\{src\.web\}\/>/);
  assert.doesNotMatch(live, /All sources/);
  assert.match(live, /Short summaries of Reddit threads, YouTube reviews and blogs\. Not counted in the player poll above\./);
  const box = live.slice(live.indexOf("function WebCard"));
  assert.doesNotMatch(box, /written by PadelRecs|—/);
});
