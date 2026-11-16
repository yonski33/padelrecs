// The match-audit sweep (Grok audit 2026-11-16): ~190 pick combinations over the live items, through the same ranking code the
// home uses (lib/home-rank.ts rankHome), and the audit's summary numbers. Read-only.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/engine-sweep.mts [out.json]
import { writeFileSync } from "node:fs";
import { homePayload } from "../app/home-payload";
import { rankHome } from "../lib/home-rank";
import { RANK_SETUP, NEGATIVE_TAGS } from "../lib/rank-seed";
import { STYLES, LEVELS, type QuickChoice } from "../lib/quick-match";
import { niche } from "../lib/niche";

const { items, cards } = await homePayload();
const shapes = [...new Set(items.map(x => x.facts.fine?.shape).filter(Boolean))] as string[];
const combos: QuickChoice[] = [];
for (const style of STYLES) for (const level of [undefined, ...LEVELS]) for (const arm of [false, true]) for (const shape of [undefined, ...shapes])
  combos.push({ style, ...(level ? { level } : {}), arm, ...(shape ? { fine: { shape } } : {}) });
for (const style of STYLES) for (const level of [undefined, ...LEVELS]) for (const fine of [{ weight: "light" }, { weight: "heavy" }, { feel: "soft" }, { feel: "firm" }] as const)
  combos.push({ style, ...(level ? { level } : {}), arm: false, fine: { ...fine } });
const name = (id: string) => cards[id]?.name ?? id;
const results = combos.map(c => ({ c, rows: rankHome(items, RANK_SETUP, NEGATIVE_TAGS, c, false, 10).rows.map(r => ({ id: r.id, name: name(r.id), pct: r.pct, kind: r.fit?.kind ?? null })) }));
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const byStyle = Object.fromEntries(STYLES.map(st => [st, median(results.filter(r => r.c.style === st && r.rows[0]?.pct != null).map(r => r.rows[0].pct!))]));
const rows95 = results.reduce((a, r) => a + r.rows.filter(x => (x.pct ?? 0) >= 95).length, 0);
const top5 = (needle: RegExp) => results.filter(r => r.rows.slice(0, 5).some(x => needle.test(x.name))).length;
const beginnerPool = new Set(results.filter(r => r.c.level === "beginner").flatMap(r => r.rows.map(x => x.id))).size;
const beginnerMin = Math.min(...results.filter(r => r.c.level === "beginner" && !r.c.fine).map(r => r.rows.length));
const fenix = results.find(r => r.c.style === "power" && r.c.level === "advanced" && r.c.arm && !r.c.fine)?.rows.find(x => /Fenix Pro 6/.test(x.name)) ?? null;
const ties = results.filter(r => { const p = r.rows.map(x => x.pct); return new Set(p).size < p.length; }).length;
const summary = { niche: niche.id, combos: combos.length, medianTop1: byStyle, rows95, metalboneCtrlTop5: top5(/Metalbone CTRL 3\.5/), beginnerRackets: beginnerPool, beginnerMinRows: beginnerMin, fenixSoreArm: fenix, combosWithTies: ties };
console.log(JSON.stringify(summary));
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ summary, results }, null, 1));
process.exit(0);
