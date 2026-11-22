import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { atSecond, chaptersOf, clock, isoSeconds, pickChips, usableChapters } from "../lib/thread/video-meta";

// the4Set's AT10 12K 2026 review (ZphX6W2G_Kc), the description's chapter lines as the channel wrote them.
const THE4SET = `NOX has just unveiled the new AT10...\n\n00:00 - 2:10 AT10 12K Alum Xtrem Intro\n2:11 - 4:59 AT10 2026 vs 2025
5:00 - 5:55 AT10 Hardness & Ball Output\n5:56 - 7:07 AT10 Defense\n7:08 - 8:06 AT10 Volleys\n8:07 - 8:52 AT10 Bandeja & Vibora
8:53 - 9:32 AT10 Power\n9:33 - 10:40 AT10 Conclusions`;

test("lengths and clocks", () => {
  assert.equal(isoSeconds("PT10M41S"), 641); assert.equal(isoSeconds("PT1H2M5S"), 3725); assert.equal(isoSeconds("P0D"), null); assert.equal(isoSeconds(null), null);
  assert.equal(clock(641), "10:41"); assert.equal(clock(3725), "1:02:05"); assert.equal(clock(130), "2:10");
});

test("chapters are read the way YouTube reads them, never made up", () => {
  const ch = chaptersOf(THE4SET, 641);
  assert.equal(ch.length, 8); assert.deepEqual(ch[3], [356, "AT10 Defense"]);
  assert.deepEqual(chaptersOf("1:00 A\n2:00 B\n3:00 C", 600), [], "first chapter must be 0:00");
  assert.deepEqual(chaptersOf("0:00 A\n2:00 B", 600), [], "at least three");
  assert.deepEqual(chaptersOf("0:00 A\n0:05 B\n2:00 C", 600), [], "10 seconds apart");
  assert.deepEqual(chaptersOf("0:00 A\n2:00 B\n12:00 C", 600), [], "inside the video");
  assert.deepEqual(chaptersOf("Great racket, check it out", 600), []);
});

test("kept chapters: English, no intro or outro", () => {
  const ch = usableChapters(chaptersOf(THE4SET, 641), "en");
  assert.ok(!ch.some(([, t]) => /Intro|Conclusions/.test(t)));
  assert.deepEqual(usableChapters(chaptersOf(THE4SET, 641), "es"), []);
  assert.deepEqual(usableChapters([[60, "Defensa y salida de bola"], [120, "AT10 Defense"]], null), [[120, "AT10 Defense"]]);
});

test("chips per racket: this racket and play topics, never another model in the same video", () => {
  const ch = usableChapters(chaptersOf(THE4SET, 641), "en");
  const chips = pickChips(ch, "Nox AT10 Genius 12K Alum Xtrem 2026", ["Nox", "Bullpadel", "Adidas"]);
  assert.equal(chips.length, 3); assert.ok(chips.every((c, i) => i === 0 || c[0] > chips[i - 1]![0]), "time order");
  // A three-racket video: only this racket's chapter.
  const multi: [number, string][] = [[29, "Nox Genius 18K Alum"], [212, "Nox Genius 12K Alum Xtrem"], [419, "Nox Genius 12K Alum Xtrem Lite"]];
  assert.deepEqual(pickChips(multi, "Nox AT10 Genius 12K Alum Xtrem 2026", ["Nox"]), [[212, "Nox Genius 12K Alum Xtrem"]]);
  assert.deepEqual(pickChips([[42, "Metalbone HRD+"], [190, "Metalbone"], [290, "Metalbone Carbon"]], "Adidas Metalbone Carbon 2025", ["Adidas"]), [[290, "Metalbone Carbon"]]);
  assert.deepEqual(pickChips([[40, "From the Back - Vertex 04"], [279, "At Net - Vertex 04 Comfort"]], "Bullpadel Vertex 04 2025", ["Bullpadel"]), [[40, "From the Back - Vertex 04"]]);
  // Another brand's chapter, a match round and filler: none.
  assert.deepEqual(pickChips([[60, "Bullpadel Hack 04"], [120, "Emiliano vs Alvin 1st Round"], [200, "Histrips"]], "Nox AT10 Genius 12K 2025", ["Bullpadel", "Nox"]), []);
});

test("chip links open the video at that second, without the comment id", () => {
  assert.equal(atSecond("https://www.youtube.com/watch?v=ZphX6W2G_Kc", 356), "https://www.youtube.com/watch?v=ZphX6W2G_Kc&t=356s");
  assert.equal(atSecond("https://www.youtube.com/watch?v=ZphX6W2G_Kc&lc=Ugw1", 5), "https://www.youtube.com/watch?v=ZphX6W2G_Kc&t=5s");
});

test("the stored padel file is small and only holds real lengths and kept chapters", () => {
  const f = JSON.parse(readFileSync("db/video-meta/padel.json", "utf8")) as { at: string; videos: Record<string, { d: number | null; ch: [number, string][] }> };
  assert.match(f.at, /^\d{4}-\d{2}-\d{2}$/);
  for (const v of Object.values(f.videos)) { assert.ok(v.d === null || v.d > 0); for (const [s, t] of v.ch) { assert.ok(s > 0 && (!v.d || s < v.d)); assert.ok(t.length <= 32); } }
});
