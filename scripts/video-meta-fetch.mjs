// Raw YouTube details (snippet + contentDetails) for a list of video ids, for scripts/video-meta-build.mts. Read-only; uses
// the research agent's YouTube Data API helper (scripts/youtube.mjs api(): key from its .env, quota logged), 50 ids per
// call, 1 unit each (padel's 790 videos: 16 units). Run monthly with the build (YouTube's 30-day refresh rule).
//   node scripts/video-meta-fetch.mjs <ids.json> <raw-out.json>
import { readFileSync, writeFileSync } from "node:fs";
const { api } = await import(`${process.env.HOME}/Documents/ChatGPT/padelrecs/research-agent/scripts/youtube.mjs`);
const ids = JSON.parse(readFileSync(process.argv[2], "utf8")), out = [];
for (let i = 0; i < ids.length; i += 50) {
  const r = await api("videos", { part: "snippet,contentDetails", id: ids.slice(i, i + 50).join(","), maxResults: 50 });
  for (const v of r.items ?? []) out.push({ id: v.id, duration: v.contentDetails?.duration ?? null, description: v.snippet?.description ?? "",
    title: v.snippet?.title ?? "", audioLang: v.snippet?.defaultAudioLanguage ?? null, lang: v.snippet?.defaultLanguage ?? null });
}
writeFileSync(process.argv[3], JSON.stringify(out)); console.log(`fetched ${out.length} of ${ids.length}`);
