// Builds db/video-meta/<site>.json (lib/thread/video-meta.ts): each video's length and the chapter chips the racket page
// shows, from a raw YouTube videos.list dump (snippet + contentDetails; the research agent's scripts/youtube.mjs api(),
// 1 unit per 50 videos). Changes no database. YouTube's policies allow keeping API data 30 days unless refreshed, so
// re-run the fetch and this build monthly; `at` records the fetch day.
//   npx tsx scripts/video-meta-build.mts <raw.json> padel [YYYY-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { chaptersOf, isoSeconds, usableChapters, type VideoMeta } from "../lib/thread/video-meta";

type Raw = { id: string; duration: string | null; description: string; audioLang: string | null; lang: string | null };
const [rawPath, site = "padel", at = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const raw = JSON.parse(readFileSync(rawPath!, "utf8")) as Raw[];
const videos: Record<string, VideoMeta> = {};
let withChapters = 0, withChips = 0;
for (const v of raw.sort((a, b) => a.id.localeCompare(b.id))) {
  const d = isoSeconds(v.duration), chapters = chaptersOf(v.description, d), ch = usableChapters(chapters, v.audioLang ?? v.lang);
  if (chapters.length) withChapters++; if (ch.length) withChips++;
  if (d || ch.length) videos[v.id] = { d, ch };
}
mkdirSync("db/video-meta", { recursive: true });
writeFileSync(`db/video-meta/${site}.json`, JSON.stringify({ at, videos }, null, 0) + "\n");
console.log(`${raw.length} videos · ${Object.values(videos).filter(v => v.d).length} with a length · ${withChapters} with chapters · ${withChips} with English chapters kept`);
