// The quick-match home's top 10 for the level-gate picks (as app/home-v2.tsx orders them), with each racket's brand level,
// expert level and suits scores, and how many rackets each level's list can draw on. Diff two runs to check a level change.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/level-gate-report.mts out.json
import { writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { quickMatch, passesLevel, type QuickChoice } from "../lib/quick-match";
import { fitVerdict, MIN_FIT_REPORTS } from "../lib/fit-verdict";
import { rowOfFamily } from "../lib/compare-pairs";
import { EXTRACTORS } from "../lib/evidence";

const PICKS: [string, QuickChoice][] = [
  ["intermediate + power", { style: "power", level: "intermediate", arm: false }],
  ["intermediate + balance", { style: "balance", level: "intermediate", arm: false }],
  ["intermediate + control", { style: "control", level: "intermediate", arm: false }],
  ["beginner + power", { style: "power", level: "beginner", arm: false }],
  ["advanced + power", { style: "power", level: "advanced", arm: false }],
];
const ctx = await matchContext();
const { data, finder, bad, pool, level, signal, factsFor, matchPct, fineOf, evidence } = ctx;
const byId = new Map(data.rackets.map(r => [r.id, r]));
const L = ["beginner", "intermediate", "advanced"];
const band = (from: number, to: number) => from === to ? L[from] : `${L[from]}-${L[to]}`;
const brandOf = new Map(evidence.filter(r => r.extractedBy === EXTRACTORS.brandLevel).map(r => { const [a, b] = (r.valueText ?? "").split("-").map(Number); return [r.productId, band(a, b)]; }));
const expertOf = (id: string) => { const e = ctx.traits(id).edits?.expert; if (!e?.suits_intermediate) return null;
  const v = [e.suits_beginner?.value, e.suits_intermediate?.value, e.suits_advanced?.value]; const inb = [0, 1, 2].filter(i => (v[i] ?? 0) >= 80); return inb.length ? band(inb[0], inb[inb.length - 1]) : null; };
const reportsOf = new Map<string, number>();
for (const x of [...data.reviews, ...data.external]) reportsOf.set(x.racketId, (reportsOf.get(x.racketId) ?? 0) + 1);
const out: Record<string, unknown> = {};
for (const [label, choice] of PICKS) {
  const candidates = quickMatch(pool, finder, choice, { signal, negativeTags: bad, level, count: pool.length, rankWeight: finder.rankWeight, levelGate: ctx.levelGate });
  const pcts = matchPct(choice);
  const rowOf = (id: string) => rowOfFamily(byId.get(id)!, data.listed, r => (reportsOf.get(r.id) ?? 0) >= MIN_FIT_REPORTS).shown.id;
  const order = new Map(candidates.map((m, i) => [m.product.id, i])), seen = new Set<string>();
  const models = candidates.flatMap(m => { const n = rowOf(m.product.id), id = passesLevel(level(n), choice.level, ctx.levelGate) ? n : m.product.id; if (seen.has(id)) return []; seen.add(id); return [{ id, i: order.get(id) ?? candidates.length + order.get(m.product.id)! }]; });
  const rows = models.map(m => ({ ...m, pct: pcts.get(m.id) ?? null })).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || a.i - b.i).slice(0, 10);
  out[label] = { listSize: models.length, rows: rows.map(r => { const s = level(r.id)?.suits, v = fitVerdict(choice, factsFor(choice, r.id));
    return { name: byId.get(r.id)!.name, pct: r.pct, verdict: v.kind, brand: brandOf.get(r.id) ?? null, expert: expertOf(r.id), suits: s ? `${s.beginner}/${s.intermediate}/${s.advanced}` : null }; }) };
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out) as [string, { listSize: number; rows: { name: string; pct: number | null; verdict: string; brand: string | null; expert: string | null; suits: string | null }[] }][]) {
  console.log(`\n## ${k} (list draws on ${v.listSize} models)`);
  v.rows.forEach((r, i) => console.log(`${i + 1}. ${r.name} — ${r.pct ?? "–"}% ${r.verdict} · brand ${r.brand ?? "–"} · expert ${r.expert ?? "–"} · suits b/i/a ${r.suits ?? "–"}`));
}
process.exit(0);
