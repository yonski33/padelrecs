// Where the engine's own reading and the expert's How it plays score (db/expert-play) differ by 2 dots or more, for the owner
// (owner decision 2026-11-18: the bars show the expert; the engine keeps its evidence for matching). Also lists bars an admin
// hand-set dot keeps off the expert's value, and the admin expert-grid values the expert file now overrides. Read-only.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/expert-play-gaps.mts <out.md>
import { writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { matchData } from "../db/match-data";
import { niche } from "../lib/niche";
import { V11_SITES } from "../lib/v11-site";

const [out] = process.argv.slice(2);
if (!out) throw new Error("Usage: expert-play-gaps.mts <out.md>");
const ctx = await matchContext(), file = matchData(niche.id).expertPlay?.products ?? {};
const bands = (V11_SITES as Record<string, { bands: [string, string][] | ((s: string | null) => [string, string][]) }>)[niche.id]?.bands;
const label = new Map<string, string>((typeof bands === "function" ? bands(null) : bands ?? []).map(([k, l]) => [k, l]));
label.set("arm", label.get("arm") ?? "Arm comfort");
const gaps: string[] = [], hand: string[] = [], grid: string[] = [];
let n = 0, changed = 0;
for (const r of ctx.data.listed) {
  const e = file[r.slug]; if (!e) continue; n++;
  const tr = ctx.traits(r.id), was = ctx.engineDots(r.id) ?? {};
  for (const [k, t] of Object.entries(e.traits)) {
    if (!t) continue;
    const shown = tr.scores?.[k as keyof typeof tr.scores]?.dots, eng = was[k] ?? shown;
    const set = tr.edits?.traits[k as keyof typeof tr.edits.traits]?.dots;
    if (set !== undefined && set !== t.dots) hand.push(`- ${r.name} (${r.slug}) ${label.get(k) ?? k}: admin hand-set ${set}, expert ${t.dots} — the hand-set dot stays`);
    const gv = (tr.edits?.expert as Record<string, { value: number } | undefined> | undefined)?.[k]?.value;
    if (eng === undefined) continue;
    if (gv !== undefined && eng !== t.dots) grid.push(`- ${r.name} (${r.slug}) ${label.get(k) ?? k}: admin expert grid ${gv}/100 showed ${eng}, expert file ${t.dots} — the expert file shows`);
    if (eng !== shown) changed++;
    if (Math.abs(eng - t.dots) >= 2) gaps.push(`| ${r.name} | ${label.get(k) ?? k} | ${eng} | ${t.dots} | ${e.confidence ?? ""} | ${t.note.replace(/\|/g, "/")} |`);
  }
}
const md = [`# ${niche.id}: engine vs expert How it plays (${new Date().toISOString().slice(0, 10)})`, "",
  `${n} listed products carry expert scores; ${changed} bars change from the engine's dots. The match % keeps the engine's reading.`, "",
  `## Engine and expert 2+ dots apart (${gaps.length})`, "", "| Product | Bar | Engine | Expert | Confidence | Expert's reason |", "|---|---|---|---|---|---|", ...gaps, "",
  `## Admin hand-set dots kept over the expert (${hand.length})`, ...hand, "",
  `## Admin expert-grid values the expert file overrides (${grid.length})`, ...grid, ""].join("\n");
writeFileSync(out, md);
console.log(`${niche.id}: ${n} products, ${changed} bars change, ${gaps.length} gaps of 2+, ${hand.length} hand-set kept, ${grid.length} grid values overridden → ${out}`);
process.exit(0);
