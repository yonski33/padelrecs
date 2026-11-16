// The DiscGolfRecs match audit's 160 combos (Grok audit 2026-11-16: 5 types × 4 stabilities × 4 levels × slower arm on/off)
// through the home's own ranking (lib/home-rank.ts rankHome), with the audit's behaviour metrics and the PM's four top 5s.
//   NICHE=discgolf npx tsx --conditions=react-server --env-file=.env.local scripts/discgolf-match-sweep.mts [--out file.json] [--fixture]
import { writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { slimItems, rankHome, type RankItem } from "../lib/home-rank";
import { niche } from "../lib/niche";
import { readChoice, type QuickChoice } from "../lib/quick-match";
import { flightOf } from "../lib/discgolf-profile";
import { pageSkips } from "../lib/discgolf-skips";

const { items: full, finder, data } = await matchContext();
const items: RankItem[] = slimItems(full, finder);
const setup = { ...finder, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
const BAD = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
const byId = new Map(data.rackets.map(r => [r.id, r]));
const name = (id: string) => byId.get(id)?.name ?? id;
const fl = (id: string) => flightOf(byId.get(id)?.weight ?? null);
const skip = (id: string) => pageSkips(byId.get(id)?.slug ?? "");
const KINDS = [undefined, "putter", "midrange", "fairway", "distance"], STYLES = ["any", "control", "balance", "power"], LEVELS = [undefined, "beginner", "intermediate", "advanced"];
type Combo = { kind?: string; style: string; level?: string; arm: boolean; key: string; rows: { id: string; pct: number | null }[]; size: number };
const pick = (kind: string | undefined, style: string, level: string | undefined, arm: boolean): QuickChoice =>
  readChoice({ kind, style, level, arm: arm ? "1" : undefined });
const combos: Combo[] = [];
for (const kind of KINDS) for (const style of STYLES) for (const level of LEVELS) for (const arm of [false, true]) {
  const all = rankHome(items, setup, BAD, pick(kind, style, level, arm), false, 9999).rows;
  combos.push({ kind, style, level, arm, key: `${kind ?? "any"}.${style}.${level ?? "-"}.${arm ? 1 : 0}`, rows: all.slice(0, 10), size: all.length });
}
const top10 = (c: Combo) => c.rows, med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const q = (xs: number[], f: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(f * (s.length - 1))] ?? 0; };
const beg = combos.filter(c => c.level === "beginner"), arm = combos.filter(c => c.arm), anyC = combos.filter(c => c.style === "any" && (c.kind || c.level || c.arm));
const fastArm = (id: string) => { const f = fl(id); return !!f && (f.speed >= 13 || (f.speed >= 12 && f.turn + f.fade >= 2)); };
const pcts = combos.flatMap(c => top10(c).map(r => r.pct ?? 0)), firsts = combos.map(c => c.rows[0]?.pct ?? 0);
const top5 = new Map<string, number>(), ones = new Map<string, number>();
for (const c of combos) { c.rows.slice(0, 5).forEach(r => top5.set(r.id, (top5.get(r.id) ?? 0) + 1)); if (c.rows[0]) ones.set(c.rows[0].id, (ones.get(c.rows[0].id) ?? 0) + 1); }
const mostTop5 = [...top5].sort((a, b) => b[1] - a[1])[0];
// A level list that is just the no-level list filtered: same order and same % for every disc it keeps.
const levelLists = combos.filter(c => c.level), justFiltered = levelLists.filter(c => {
  const base = combos.find(b => !b.level && b.kind === c.kind && b.style === c.style && b.arm === c.arm)!;
  const all = rankHome(items, setup, BAD, pick(c.kind, c.style, undefined, c.arm), false, 9999).rows, keep = new Set(rankHome(items, setup, BAD, pick(c.kind, c.style, c.level, c.arm), false, 9999).rows.map(r => r.id));
  const mine = rankHome(items, setup, BAD, pick(c.kind, c.style, c.level, c.arm), false, 9999).rows;
  const f = all.filter(r => keep.has(r.id));
  return base && f.length === mine.length && f.every((r, i) => r.id === mine[i].id && r.pct === mine[i].pct);
});
const overlap = combos.filter(c => c.level === "intermediate").map(c => { const a = combos.find(x => x.level === "advanced" && x.kind === c.kind && x.style === c.style && x.arm === c.arm)!;
  const s = new Set(a.rows.slice(0, 5).map(r => r.id)); return c.rows.slice(0, 5).filter(r => s.has(r.id)).length; });
const metrics = {
  "Beginner combos with speed 12+ in the top 10": `${beg.filter(c => top10(c).some(r => (fl(r.id)?.speed ?? 0) >= 12)).length}/${beg.length}`,
  "Slower-arm combos with speed 12+ & t+f ≥ 2 (or 13+) in the top 10": `${arm.filter(c => top10(c).some(r => fastArm(r.id))).length}/${arm.length}`,
  "… of those at Strong fit": `${arm.filter(c => top10(c).some(r => fastArm(r.id) && (r.pct ?? 0) >= 75)).length}/${arm.length}`,
  "Page-warned discs in beginner top 10s (slots)": beg.reduce((a, c) => a + top10(c).filter(r => skip(r.id).beginner).length, 0),
  "… at Strong fit": beg.reduce((a, c) => a + top10(c).filter(r => skip(r.id).beginner && (r.pct ?? 0) >= 75).length, 0),
  "Slow-arm-warned discs in slower-arm top 10s": arm.reduce((a, c) => a + top10(c).filter(r => skip(r.id).arm).length, 0),
  "Discs passing the beginner gate": combos.find(c => c.key === "any.any.beginner.0")!.size,
  "Any-stability max %": Math.max(...anyC.flatMap(c => c.rows.map(r => r.pct ?? 0))),
  "Any combos with a Strong-fit #1": `${anyC.filter(c => (c.rows[0]?.pct ?? 0) >= 75).length}/${anyC.length}`,
  "Top-10 median % (IQR)": `${med(pcts)} (${q(pcts, 0.25)}–${q(pcts, 0.75)})`,
  "#1 median %": med(firsts),
  "Share of top-10 rows ≥ 85%": +(pcts.filter(p => p >= 85).length / pcts.length).toFixed(2),
  "Combos with tied % in the top 5": `${combos.filter(c => new Set(c.rows.slice(0, 5).map(r => r.pct)).size < Math.min(5, c.rows.length)).length}/${combos.length}`,
  "Most top-5 appearances": `${name(mostTop5[0])} ${mostTop5[1]}`,
  "Most #1s": (() => { const m = [...ones].sort((a, b) => b[1] - a[1])[0]; return `${name(m[0])} ${m[1]}`; })(),
  "Distinct #1 discs": ones.size,
  "Level lists that are just a filtered no-level list": `${justFiltered.length}/${levelLists.length}`,
  "Intermediate vs advanced top-5 overlap (of 5)": +(overlap.reduce((a, b) => a + b, 0) / overlap.length).toFixed(2),
  "Putters in /?kind=putter&level=advanced": combos.find(c => c.key === "putter.any.advanced.0")!.size,
  "Specialty #1 in any-stability combos": anyC.filter(c => { const f = c.rows[0] && fl(c.rows[0].id); return !!f && f.turn <= -4; }).length,
};
const show = (url: string) => { const s = new URLSearchParams(url.replace(/^\/\?/, "")); const ch = readChoice(Object.fromEntries(s));
  return rankHome(items, setup, BAD, ch, false, 5).rows.map(r => `${name(r.id)} ${r.pct ?? "—"}`).join(" · "); };
const tops = Object.fromEntries(["/?level=beginner&arm=1", "/?style=power&level=beginner", "/?kind=fairway&style=power&arm=1", "/?kind=putter&level=advanced"].map(u => [u, show(u)]));
console.log(JSON.stringify({ metrics, tops }, null, 1));
// --fixture: the items the tests rank (tests/fixtures/engine-discgolf.json), with each disc's name, slug and flight numbers.
if (process.argv.includes("--fixture")) writeFileSync("tests/fixtures/engine-discgolf.json", JSON.stringify({ names: Object.fromEntries(items.map(x => [x.id, name(x.id)])),
  discs: Object.fromEntries(items.map(x => { const r = byId.get(x.id)!; return [x.id, { slug: r.slug, flight: r.weight }]; })), items }));
const at = process.argv.indexOf("--out"); if (at > 0) writeFileSync(process.argv[at + 1], JSON.stringify({ metrics, tops, combos: combos.map(c => ({ key: c.key, size: c.size, rows: c.rows.map(r => [name(r.id), r.pct]) })) }));
process.exit(0);
