// Builds db/reddit-titles/<site>.json (lib/thread/reddit-titles.ts) from scripts/reddit-titles-fetch.mjs output: each
// post's cleaned title, leaving out removed, NSFW and unusable ones (those cards say "View the thread on Reddit").
// Changes no database.   npx tsx scripts/reddit-titles-build.mts <raw.json> padel [YYYY-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { cleanTitle } from "../lib/thread/reddit-titles";

const [rawPath, site = "padel", at = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const raw = JSON.parse(readFileSync(rawPath!, "utf8")) as Record<string, { title: string; removed: boolean; over18: boolean }>;
const titles: Record<string, string> = {};
for (const id of Object.keys(raw).sort()) { const r = raw[id]!; const t = !r.removed && !r.over18 ? cleanTitle(r.title) : null; if (t) titles[id.toLowerCase()] = t; }
mkdirSync("db/reddit-titles", { recursive: true });
writeFileSync(`db/reddit-titles/${site}.json`, JSON.stringify({ at, titles }, null, 0) + "\n");
console.log(`${Object.keys(raw).length} posts · ${Object.keys(titles).length} titles kept`);
