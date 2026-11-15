// Every listed product's trait scores (auto and with hand-set dots) as JSON, to compare before/after an engine change.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/dump-trait-scores.mts <out.json>
import { writeFileSync } from "node:fs";
import { catalog } from "../db/data";
import { matchContext } from "../app/match-context";
const [out] = process.argv.slice(2);
if (!out) throw new Error("Usage: dump-trait-scores.mts <out.json>");
const [data, ctx] = await Promise.all([catalog(), matchContext()]);
writeFileSync(out, JSON.stringify(Object.fromEntries(data.listed.map(r => { const t = ctx.traits(r.id); return [r.slug, { auto: t.auto, scores: t.scores }]; })), null, 1));
console.log(`${data.listed.length} products → ${out}`);
process.exit(0);
