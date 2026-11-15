// The SkinRecs known-correct set (db/known-dots/skin.json, the owner's sheet; ENGINE-PLAN §2F) against the computed scores:
// expert 1–10 vs score / 10 for the skin types, and the finish / texture side. Lists every product more than 2 points off.
// Read-only.   NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/check-skin-expert.mts
import { readFileSync } from "node:fs";
import { catalog } from "../db/data";
import { evidenceRows } from "../db/evidence";
import { niche } from "../lib/niche";
import { attrProfileFor } from "../lib/attr-profile";
import { scoreAll } from "../lib/attr-score";

const profile = attrProfileFor(niche)!;
const known = JSON.parse(readFileSync(new URL("../db/known-dots/skin.json", import.meta.url), "utf8")) as Record<string, Record<string, string | number>>;
const [data, rows] = await Promise.all([catalog(), evidenceRows()]);
const cnt = new Map(data.listed.map(r => [r.id, { n: 0, p: 0, neg: 0, j: 0 }]));
for (const x of data.reviews) { const c = cnt.get(x.racketId); if (c) { c.n++; c.j++; if (x.rating >= 4) c.p++; else if (x.rating <= 2) c.neg++; } }
for (const e of data.external) { const c = cnt.get(e.racketId); if (c) { c.n++; if (e.sentiment) { c.j++; if (e.sentiment === "positive") c.p++; if (e.sentiment === "negative") c.neg++; } } }
const attrs = scoreAll(profile, data.listed.map(r => { const c = cnt.get(r.id)!; return { id: r.id, shape: r.shape, reports: c.n, verdict: c.j ? (c.p - c.neg) / c.j : null }; }), rows);
const bySlug = new Map(data.listed.map(r => [r.slug, r]));
let pairs = 0, within = 0, noScore = 0; const off: string[] = [];
const side = (s: number) => s < 43 ? "low" : s > 57 ? "high" : "between";
for (const [slug, k] of Object.entries(known)) {
  const r = bySlug.get(slug); if (!r) { off.push(`${slug}: not listed`); continue; }
  const a = attrs.get(r.id)!;
  for (const g of ["dry", "oily", "combination", "sensitive", "acne"]) {
    const e = k[g]; if (typeof e !== "number") continue;
    const s = a.scores[`suits_${g}`];
    if (!s) { noScore++; off.push(`${r.name} · ${g}: expert ${e}, no score yet`); continue; }
    pairs++; const d = s.score / 10 - e;
    if (Math.abs(d) <= 2) within++; else off.push(`${r.name} · ${g}: expert ${e}, ours ${(s.score / 10).toFixed(1)} (${s.n} voices)`);
  }
  for (const [key, ends] of [["finish", ["matte", "dewy"]], ["texture", ["light", "rich"]]] as const) {
    const e = k[key]; if (typeof e !== "string") continue;
    const s = a.scores[key]; const want = e === ends[0] ? "low" : e === ends[1] ? "high" : "between";
    if (!s) { noScore++; off.push(`${r.name} · ${key}: expert ${e}, no score yet`); continue; }
    pairs++; if (side(s.score) === want || (want === "between" && Math.abs(s.score - 50) <= 15)) within++; else off.push(`${r.name} · ${key}: expert ${e}, ours ${s.score}`);
  }
}
console.log(`${Object.keys(known).length} products, ${pairs} expert values with a score: ${within} within 2 points (${pairs ? Math.round(100 * within / pairs) : 0}%), ${noScore} without a score yet`);
for (const o of off) console.log(`  ${o}`);
process.exit(0);
