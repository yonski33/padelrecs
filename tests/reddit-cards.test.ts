import { test } from "node:test";
import assert from "node:assert/strict";
import { cardLine, redditPick, subOf, CARD_MAX, type RedditRow } from "../lib/reddit-cards";
import { videoLabel } from "../lib/video-label";

const row = (id: string, summary: string | null, sentiment: RedditRow["sentiment"], sourceDate: string, racketId = "p1"): RedditRow => ({
  id, racketId, sourcePlatform: "Reddit", sourceUrl: `https://www.reddit.com/r/discgolf/comments/x/${id}/`, sourceName: "r/discgolf", sourceDate, summary, sentiment });

test("a card line is the stored summary, our words: no quote marks, no markdown, whole sentences up to the cap", () => {
  assert.equal(cardLine('Reviewer says it is **"a beast"** off the tee and holds any line.'), "It is a beast off the tee and holds any line.");
  const long = "Flies straight and far with a late, reliable fade on every throw. " + "It also holds a hyzer line for a long way before it fades out. ".repeat(4);
  const line = cardLine(long)!;
  assert.ok(line.length <= CARD_MAX && line.endsWith("."), line);
  assert.equal(cardLine("x".repeat(250)), null);
  assert.equal(cardLine("Likes it."), null);
  assert.equal(cardLine(null), null);
});

test("the pick: up to 5, one per verdict first, verdict-first lines before backstory, only rows with a summary", () => {
  const rows = [
    row("a", "After trying many drivers, they settled on it because it flies the furthest.", "positive", "2026-11-10"),
    row("b", "Flies the furthest of any driver they have thrown, with a dependable fade.", "positive", "2026-10-01"),
    row("c", "Turns over too much at light weights and needs a big arm to hold a line.", "negative", "2026-09-01"),
    row("d", null, "mixed", "2026-11-11"),
    row("e", "Good glide but the rim feels too wide for small hands, so mixed overall.", "mixed", "2026-08-01"),
    ...[1, 2, 3].map(n => row(`f${n}`, `Holds a straight line and fades late in the wind, take ${n} on the same course.`, "positive", `2026-07-0${n}`)),
    row("z", "Another product's comment that should not show up on this page at all.", "positive", "2026-11-12", "p2"),
  ];
  const ids = redditPick(rows, "p1").map(x => x.row.id);
  assert.equal(ids.length, 5);
  assert.deepEqual(ids.slice(0, 3), ["b", "e", "c"]);
  assert.ok(!ids.includes("d") && !ids.includes("z"));
  assert.equal(subOf("https://www.reddit.com/r/padel/comments/1/x/", "Reddit"), "r/padel");
});

test("YouTube summary label names the creator and the date", () => {
  assert.equal(videoLabel("Padel Coach", "2026-10-14"), "Summary of Padel Coach's video, 14 Oct 2026");
  assert.equal(videoLabel("Disc Golf Reviews", "2026-03"), "Summary of Disc Golf Reviews' video, Mar 2026");
  assert.equal(videoLabel("Padel Coach", null), "Summary of Padel Coach's video");
});
