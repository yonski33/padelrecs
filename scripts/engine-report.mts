// The match engine on live data (lib/engine via lib/home-rank.ts, exactly as the home ranks): top 10s for the 9 level × style
// picks with reports, Player score, % and verdict word; the yardstick (tests/fixtures/engine-yardstick-padel.json) on the live
// lists; and the % distribution behind the verdict cut-offs.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/engine-report.mts [out.json]
import { readFileSync, writeFileSync } from "node:fs";
import { homePayload } from "../app/home-payload";
import { matchContext } from "../app/match-context";
import { rankHome } from "../lib/home-rank";
import { niche } from "../lib/niche";
import { LEVELS, type QuickChoice } from "../lib/quick-match";

const [ctx, payload] = await Promise.all([matchContext(), homePayload()]);
const { items } = JSON.parse(JSON.stringify(payload)) as typeof payload;
const setup = { ...niche.finder!, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
const bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
const r = (id: string) => ctx.data.rackets.find(x => x.id === id)!;
const lists = Object.fromEntries(LEVELS.flatMap(level => (["control", "balance", "power"] as const).map(style => {
  const choice: QuickChoice = { style, level, arm: false };
  return [`${level}+${style}`, rankHome(items, setup, bad, choice, false, 10_000).rows.map(x => ({ slug: r(x.id).slug, name: r(x.id).name, shape: r(x.id).shape ?? "", reports: ctx.facts(x.id).reports, ps: ctx.signal(x.id), pct: x.pct, kind: x.fit?.kind }))];
})));
for (const [pick, L] of Object.entries(lists)) { console.log(`\n## ${pick} (${L.length} candidates)`); L.slice(0, 10).forEach((x, i) => console.log(`${i + 1}. ${x.name} · ${x.reports} rep · PS ${x.ps ?? "—"} · ${x.pct}% ${x.kind}`)); }
// Yardstick
const Y = JSON.parse(readFileSync(new URL("../tests/fixtures/engine-yardstick-padel.json", import.meta.url), "utf8"));
const fails: string[] = []; let n = 0; const check = (ok: boolean, m: string) => { n++; if (!ok) fails.push(m); };
for (const b of Y.beats) { const L = lists[b.pick].map(x => x.slug), ia = L.indexOf(b.above), ib = L.indexOf(b.below); check(ib < 0 || (ia >= 0 && ia < ib), `${b.pick}: ${b.above} (#${ia + 1}) above ${b.below} (#${ib + 1})`); }
for (const t of Y.not_top) { const i = lists[t.pick].map(x => x.slug).indexOf(t.slug); check(i < 0 || i >= t.top, `${t.pick}: ${t.slug} not in top ${t.top} (#${i + 1})`); }
for (const [pick, L] of Object.entries(lists)) { const [level, style] = pick.split("+"), top = L.slice(0, 3);
  check(!(top.some(x => x.reports <= 12) && L.slice(3).some(x => x.reports >= 40)), `${pick}: no thin top 3 (${top.filter(x => x.reports <= 12).map(x => x.name).join(", ")})`);
  if (level === "beginner") check(!L.some(x => /diamond/i.test(x.shape) && !["bullpadel-vertex-05-women-2026", "head-coello-team-2026"].includes(x.slug)), `${pick}: no diamonds (${L.filter(x => /diamond/i.test(x.shape)).map(x => x.name).join(", ")})`);
  if (style === "power" && level !== "beginner") check(!top.some(x => /^round/i.test(x.shape)), `${pick}: top 3 no round`);
  if (style === "control") check(!top.some(x => /diamond/i.test(x.shape)), `${pick}: top 3 no diamond`); }
console.log(`\nYardstick on live data: ${n - fails.length} of ${n} pass`); fails.forEach(f => console.log("FAIL", f));
// % distribution (every candidate of the 9 picks)
const all = Object.values(lists).flat().map(x => x.pct!).sort((a, b) => a - b), q = (p: number) => all[Math.floor(p * (all.length - 1))];
const hist: Record<string, number> = {}; for (const p of all) { const b = `${Math.floor(p / 5) * 5}–${Math.floor(p / 5) * 5 + 4}`; hist[b] = (hist[b] ?? 0) + 1; }
console.log(`\n% over ${all.length} list rows: p10 ${q(0.1)} · p25 ${q(0.25)} · median ${q(0.5)} · p75 ${q(0.75)} · p90 ${q(0.9)}`);
console.log(Object.entries(hist).map(([k, v]) => `${k}: ${v}`).join(" | "));
const top10 = Object.values(lists).flatMap(L => L.slice(0, 10)).map(x => x.pct!).sort((a, b) => a - b);
console.log(`top-10 rows: min ${top10[0]} · p25 ${top10[Math.floor(0.25 * top10.length)]} · median ${top10[Math.floor(0.5 * top10.length)]}`);
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ lists, fails, distribution: hist }, null, 1));
process.exit(0);
