import { test } from "node:test";
import assert from "node:assert/strict";
import { onePerChannel, videoOf } from "../lib/youtube-pick";

// Owner 2026-11-15: one YouTube card per channel on a racket page, the video about that racket alone where there is one.
const row = (id: string, sourceName: string, sourceUrl: string, summary: string | null = "s", sourceDate = "2026-09-01") => ({ id, sourceName, sourceUrl, sourceDate, summary });

test("one card per channel: its video about this racket alone beats a comparison and the comments under it", () => {
  const rows = [row("c1", "Probando Palas", "https://www.youtube.com/watch?v=AAA&lc=x1", null), row("c2", "Probando Palas", "https://www.youtube.com/watch?v=AAA&lc=x2", null),
    row("cmp", "Probando Palas", "https://www.youtube.com/watch?v=CMP"), row("own", "Probando Palas", "https://www.youtube.com/watch?v=AAA"),
    row("other", "PadelGeek", "https://youtu.be/BBB")];
  const n = (v: string) => v === "CMP" ? 6 : 1;
  assert.deepEqual(onePerChannel(rows, n).map(r => r.id).sort(), ["other", "own"]);
});

test("a channel with only viewer comments keeps its newest one", () => {
  const rows = [row("old", "X", "https://www.youtube.com/watch?v=A&lc=1", null, "2026-01-01"), row("new", "x", "https://www.youtube.com/watch?v=A&lc=2", null, "2026-03-01")];
  assert.deepEqual(onePerChannel(rows, () => 1).map(r => r.id), ["new"]);
  assert.equal(videoOf("https://youtu.be/QQ"), "QQ");
});
