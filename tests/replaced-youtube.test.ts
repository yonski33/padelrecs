import { test } from "node:test";
import assert from "node:assert/strict";
import { dropReplacedYouTube } from "../lib/thread/replaced-youtube";

const yt = (id: string, racketId: string, v: string, extra = "") => ({ id, racketId, sourcePlatform: "YouTube", sourceUrl: `https://www.youtube.com/watch?v=${v}${extra}` });
const ROWS = [
  yt("old-1", "a", "AAAAAAAAAAA"),                 // replaced: a has its creator page and a card for this video
  yt("old-2", "a", "BBBBBBBBBBB"),                 // no card for this video: stays
  yt("comment", "a", "AAAAAAAAAAA", "&lc=xyz"),    // a viewer comment under the replaced video: stays
  yt("old-3", "b", "AAAAAAAAAAA"),                 // same video on another racket: stays
  yt("old-4", "c", "CCCCCCCCCCC"),                 // c is still on the usual page: stays
  { id: "reddit", racketId: "a", sourcePlatform: "Reddit", sourceUrl: "https://www.reddit.com/r/padel/x" },
];
const CARDS = [{ racketId: "a", videoId: "AAAAAAAAAAA" }, { racketId: "c", videoId: "CCCCCCCCCCC" }, { racketId: "a", videoId: null }];

test("drops only old YouTube rows a creator review replaced on a creator-page racket", () => {
  assert.deepEqual(dropReplacedYouTube(ROWS, CARDS, new Set(["a"])).map(r => r.id), ["old-2", "comment", "old-3", "old-4", "reddit"]);
});

test("no creator pages: nothing changes", () => {
  assert.equal(dropReplacedYouTube(ROWS, CARDS, new Set()), ROWS);
});

// DiscGolfRecs and SkinRecs (2026-11-27): every product with cards counts, and a blog card replaces its old row by address.
test("disc golf / skin: a blog card replaces the old blog row for the same page; other pages stay", () => {
  const rows = [
    yt("v-old", "d", "DDDDDDDDDDD"),
    { id: "blog-old", racketId: "d", sourcePlatform: "Blog", sourceUrl: "http://www.example.com/disc-review/?ref=x" },
    { id: "blog-other", racketId: "d", sourcePlatform: "Blog", sourceUrl: "https://example.com/another-review" },
    { id: "reddit", racketId: "d", sourcePlatform: "Reddit", sourceUrl: "https://www.reddit.com/r/discgolf/x" },
  ];
  const cards = [{ racketId: "d", videoId: "DDDDDDDDDDD" }, { racketId: "d", videoId: null, url: "https://example.com/disc-review" }];
  assert.deepEqual(dropReplacedYouTube(rows, cards, new Set(cards.map(c => c.racketId))).map(r => r.id), ["blog-other", "reddit"]);
});
