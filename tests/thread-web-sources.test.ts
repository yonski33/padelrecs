import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { W } from "../lib/thread/words";
import { countLine, isThin, playersWord, POLL_POINT_MIN, splitSources, threadTitle, THIN_REVIEWS, thumbOf, videoId } from "../lib/thread/web-sources";

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
  assert.match(page, /<CommunityFeed id=\{p\.id\} model=\{p\.model\} cards=\{src\.players\} web=\{src\.web\}/); // DiscGolfRecs adds its plastic chips
  assert.match(readFileSync("app/thread/live/feed-v7b.tsx", "utf8"), /<WebSources web=\{web\} open=\{thin\}\/>/);
  assert.doesNotMatch(live, /All sources/);
  assert.ok(live.includes("Short summaries of Reddit threads, YouTube reviews and blogs. Not counted in the ${W.person} poll above."));
  const box = live.slice(live.indexOf("function WebCard"));
  assert.doesNotMatch(box, /written by PadelRecs|—/);
});

test("few-review pages: one threshold, an honest count line, the poll pointer from 5 votes", () => {
  assert.equal(THIN_REVIEWS, 3);
  assert.deepEqual([0, 1, 2, 3, 6].map(isThin), [true, true, true, false, false]);
  assert.equal(countLine(1, 13), "1 player review · 13 from around the web");
  assert.equal(countLine(0, 3), "0 player reviews · 3 from around the web");
  assert.equal(countLine(6, 0), "6 player reviews");
  assert.equal(POLL_POINT_MIN, 5);
  const live = readFileSync("app/thread/live/racket-v7b.tsx", "utf8"), poll = readFileSync("app/thread/live/racket.tsx", "utf8");
  // The words are the site's (lib/thread/words.ts; padel: "player", "Played with it?"), so AudioRecs says "listener" (V3-ROLLOUT-BRIEF).
  assert.ok(live.includes("`No ${W.person} reviews yet. ${W.usedIt} Add the first one`"));
  assert.ok(live.includes("${W.people} voted in the poll above"));
  assert.deepEqual([W.person, W.people, W.usedIt], ["player", "players", "Played with it?"]);
  // The post-vote prompt: padel's countsOnly poll only, once per racket (localStorage), dismissable.
  assert.match(poll, /Want to add a line about why\?/);
  assert.match(poll, /if \(countsOnly\) setAsk\(off \? false : askOnce\(id\)\)/);
  assert.match(poll, /aria-label="No thanks"/);
  const copy = ["No player reviews yet. Played with it? Add the first one", "Played with it? Add yours", " players voted in the poll above",
    "Want to add a line about why?", "Add a line", "No thanks"];
  const words = (t: string) => t.replaceAll("${W.person}", W.person).replaceAll("${W.usedIt}", W.usedIt).replaceAll("${W.people}", W.people);
  for (const t of copy) { assert.ok(words(live + poll).includes(t), t); assert.doesNotMatch(t, /—|\bowners?\b|\bverdict\b|\b(we|us)\b/i); }
});

test("From around the web is one newest-first list with a count line naming only the sources present", async () => {
  const { webList, webLine, WEB_FIRST } = await import("../lib/thread/web-sources");
  const c = (kind: string, at: string, url: string | null = null) => ({ kind, at, url, id: `${kind}${at}` });
  const s = splitSources([c("youtube", "2026-10-01"), c("reddit", "2026-11-02", "https://www.reddit.com/r/padel/comments/a1/some_long_title/"),
    c("reddit", "2026-09-03", "https://www.reddit.com/r/padel/comments/a1/some_long_title/x9/"), c("blog", "2026-11-10")]);
  assert.deepEqual(webList(s.web).map(x => x.c.at), ["2026-11-10", "2026-11-02", "2026-10-01", "2026-09-03"]);
  assert.equal(webLine(s.web), "4 summaries · Reddit, YouTube, blogs");
  assert.equal(webLine(splitSources([c("youtube", "2026-01-01")]).web), "1 summary · YouTube");
  assert.equal(WEB_FIRST, 6);
  const live = readFileSync("app/thread/live/racket-v7b.tsx", "utf8");
  assert.doesNotMatch(live, /summarised|th-web-groups/);
  assert.match(live, /\(all \? list : list\.slice\(0, WEB_FIRST\)\)/);
});
