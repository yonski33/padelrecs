// The expert yardstick for a site (ENGINE-PLAN.md section F, step 3): rank correlation per trait between the dots the
// site shows (and the 0–99 score behind them) and the expert's 1–10 ratings in db/known-dots/<niche>.json, plus every
// paddle more than 1 dot (2 points) off. Read-only. Exit 1 when a trait is under the target or a paddle is too far off.
//   NICHE=pickleball npx tsx --conditions=react-server --env-file=.env.local scripts/check-expert-ratings.mts [--auto] [--min=0.7]
import { readFileSync } from "node:fs";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { matchContext } from "../app/match-context";
import { spearman, pointsOff } from "../lib/expert-check";

const auto = process.argv.includes("--auto"), min = Number(process.argv.find(a => a.startsWith("--min="))?.slice(6) ?? 0.7);
const known = JSON.parse(readFileSync(`db/known-dots/${niche.id}.json`, "utf8")) as Record<string, Record<string, { expert?: number }>>;
const [data, ctx] = await Promise.all([catalog(), matchContext()]);
const rated = Object.entries(known).filter(([slug]) => !slug.startsWith("_"));
const traits = [...new Set(rated.flatMap(([, t]) => Object.entries(t).filter(([k, v]) => !k.startsWith("_") && typeof v?.expert === "number").map(([k]) => k)))];
let fail = 0;
const off: string[] = [];
console.log(`${niche.id}: ${rated.length} rated products, ${auto ? "auto" : "shown"} dots\n`);
console.log("trait        rho(dots)  rho(score)  >1 dot off  exactly 1 dot");
for (const t of traits) {
  const e: number[] = [], d: number[] = [], s: number[] = [];
  let far = 0, edge = 0;
  for (const [slug, v] of rated) {
    const r = data.rackets.find(x => x.slug === slug);
    if (!r) { console.log(`MISSING ${slug}`); fail++; continue; }
    const sc = (auto ? ctx.traits(r.id).auto : ctx.traits(r.id).scores)?.[t];
    if (!sc || typeof v[t]?.expert !== "number") continue;
    e.push(v[t].expert!); d.push(sc.dots); s.push(sc.score);
    const p = pointsOff(sc.dots, v[t].expert!);
    if (p > 2) { far++; off.push(`${slug} ${t}: ${sc.dots} dots (${sc.dots * 2}/10) vs expert ${v[t].expert}`); } else if (p === 2) edge++;
  }
  const rd = spearman(e, d), rs = spearman(e, s);
  if (rd < min || far) fail++;
  console.log(`${t.padEnd(12)} ${rd.toFixed(2).padStart(9)}  ${rs.toFixed(2).padStart(10)}  ${String(far).padStart(10)}  ${String(edge).padStart(13)}`);
}
if (off.length) console.log(`\nMore than 1 dot off:\n  ${off.join("\n  ")}`);
console.log(fail ? `\n${fail} checks under target (rho ≥ ${min}, none more than 1 dot off)` : "\nall traits on target");
process.exit(fail ? 1 : 0);
