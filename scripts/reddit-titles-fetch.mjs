// Raw Reddit post titles for scripts/reddit-titles-build.mts. Read-only; uses the research agent's Reddit helper
// (scripts/reddit.mjs token()/get(): the shared app and its shared rate limit), 100 posts per /api/info call.
//   node scripts/reddit-titles-fetch.mjs <posts.json: [[postId, slug], …]> <raw-out.json>
import { readFileSync, writeFileSync } from "node:fs";
const { loadEnv, token, get } = await import(`${process.env.HOME}/Documents/ChatGPT/padelrecs/research-agent/scripts/reddit.mjs`);
const env = { ...loadEnv(), ...process.env }, bearer = await token(env);
const ids = JSON.parse(readFileSync(process.argv[2], "utf8")).map(([id]) => id), out = {};
for (let i = 0; i < ids.length; i += 100) {
  const j = await get(env, bearer, `/api/info?raw_json=1&id=${ids.slice(i, i + 100).map(x => `t3_${x}`).join(",")}`);
  for (const c of j?.data?.children ?? []) out[c.data.id] = { title: c.data.title, removed: !!(c.data.removed_by_category || c.data.title === "[deleted by user]"), over18: !!c.data.over_18 };
}
writeFileSync(process.argv[3], JSON.stringify(out)); console.log(`titles ${Object.keys(out).length} of ${ids.length}`);
