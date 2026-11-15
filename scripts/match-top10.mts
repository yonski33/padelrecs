// The quick-match home's top 10 for a few picks (as app/home-v2.tsx orders them): name, shape, %, verdict, power/control.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/match-top10.mts [out.json]
import { writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { quickMatch, type QuickChoice } from "../lib/quick-match";
import { fitVerdict } from "../lib/fit-verdict";
import { rowOfFamily } from "../lib/compare-pairs";
import { MIN_FIT_REPORTS } from "../lib/fit-verdict";

const CASES: [string, QuickChoice][] = [
  ["power + advanced + teardrop/hybrid", { style: "power", level: "advanced", arm: false, fine: { shape: "hybrid" } }],
  ["power + advanced", { style: "power", level: "advanced", arm: false }],
  ["control + intermediate + round", { style: "control", level: "intermediate", arm: false, fine: { shape: "round" } }],
  ["sore arm: power + advanced + diamond + heavy", { style: "power", level: "advanced", arm: true, fine: { shape: "diamond", weight: "heavy" } }],
  ["sore arm: control + intermediate", { style: "control", level: "intermediate", arm: true }],
];
const ctx = await matchContext();
const name = new Map(ctx.data.rackets.map(r => [r.id, r.name]));
const out: Record<string, string[]> = {};
for (const [label, c] of CASES) {
  const cands = quickMatch(ctx.pool, ctx.finder, c, { signal: ctx.signal, negativeTags: ctx.bad, level: ctx.level, count: ctx.pool.length, rankWeight: ctx.finder.rankWeight })
    .filter(m => !c.fine?.shape || ctx.fineOf(m.product.id)?.shape === c.fine.shape);
  const pcts = ctx.matchPct(c), byId = new Map(ctx.data.rackets.map(r => [r.id, r]));
  // One row per model, newest year (as app/home-v2.tsx) unless --all-years.
  const newest = (id: string) => process.argv.includes("--all-years") ? id : rowOfFamily(byId.get(id)!, ctx.data.listed, r => ctx.facts(r.id).reports >= MIN_FIT_REPORTS).shown.id;
  const seen = new Set<string>(), order = new Map(cands.map((m, i) => [m.product.id, i]));
  const shapeOk = (id: string) => !c.fine?.shape || ctx.fineOf(id)?.shape === c.fine.shape;
  const ids = cands.flatMap(m => { const n0 = newest(m.product.id), id = shapeOk(n0) ? n0 : m.product.id; if (seen.has(id)) return []; seen.add(id); return [{ id, i: order.get(id) ?? cands.length + order.get(m.product.id)! }]; });
  const rows = ids.map(x => ({ ...x, pct: pcts.get(x.id) ?? null })).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || a.i - b.i).slice(0, 10);
  out[label] = rows.map((r, k) => { const t = ctx.traits(r.id).scores, v = fitVerdict(c, ctx.factsFor(c, r.id));
    const tg = ctx.facts(r.id).tags;
    return `${k + 1}. ${name.get(r.id)} — ${r.pct ?? "–"}% (${v.kind}) · ${ctx.fineOf(r.id)?.shape ?? "?"} · power ${t?.power?.score ?? "–"} control ${t?.control?.score ?? "–"} · arm ${t?.arm?.score ?? "–"} (friendly ${tg["arm-friendly"] ?? 0} / vibrates ${tg["vibrates on mishits"] ?? 0})`; });
  console.log(`\n## ${label}\n${out[label].join("\n")}`);
}
const file = process.argv[2]; if (file) writeFileSync(file, JSON.stringify(out, null, 1));
process.exit(0);
