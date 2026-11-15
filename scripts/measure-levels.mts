// For level picks: how many listed rackets get a fit that isn't "probably not" (the home list's pool), the home's top 10,
// and the suits / verdict for a few check rackets. Read-only.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/measure-levels.mts <out.json>
import { writeFileSync } from "node:fs";
import { catalog } from "../db/data";
import { matchContext } from "../app/match-context";
import { quickMatch, type QuickChoice } from "../lib/quick-match";
import { fitVerdict } from "../lib/fit-verdict";
import { matchScore } from "../lib/match-score";
const [data, ctx] = await Promise.all([catalog(), matchContext()]);
const slug = new Map(data.rackets.map(r => [r.id, r.slug]));
const out: Record<string, unknown> = {};
for (const level of ["beginner", "intermediate", "advanced"] as const) {
  const choice: QuickChoice = { style: "any", level, arm: false };
  const kinds: Record<string, number> = {}, levelHard: string[] = [];
  for (const r of data.listed) { const f = fitVerdict(choice, ctx.facts(r.id) as never); kinds[f.kind] = (kinds[f.kind] ?? 0) + 1; }
  const cands = quickMatch(ctx.pool, ctx.finder, choice, { signal: ctx.signal, negativeTags: ctx.bad, level: ctx.level, count: 40, rankWeight: ctx.finder.rankWeight, levelGate: ctx.levelGate });
  const rated = cands.map(m => { const fit = fitVerdict(choice, ctx.facts(m.product.id) as never), t = ctx.traits(m.product.id).scores, lv = ctx.level(m.product.id);
    return { slug: slug.get(m.product.id), kind: fit.kind, short: fit.short, pct: matchScore(choice, { verdict: fit, control: t?.control?.score ?? null, power: t?.power?.score ?? null, arm: t?.arm?.score ?? null, band: lv?.band, likedAtLevel: lv?.liked[level] ?? 0, signal: ctx.signal(m.product.id), ...(lv && "suits" in lv ? { suits: (lv as { suits?: Record<string, number> }).suits?.[level] } : {}) } as never) }; });
  const top = [...rated].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1)).slice(0, 10);
  out[level] = { verdicts: kinds, notNo: data.listed.length - (kinds.no ?? 0), top10: top.map(x => `${x.slug} ${x.pct ?? "–"}% ${x.kind}`), levelHard };
  console.log(level, kinds, "not 'probably not':", data.listed.length - (kinds.no ?? 0));
}
const checks = ["nox-at10-genius-18k-2026", "adidas-metalbone-ctrl-2026", "adidas-metalbone-ctrl-3-4-2025", "siux-fenix-pro-5-2025", "siux-fenix-pro-6-2026", "adidas-metalbone-hrd-plus-3-4-2025", "adidas-metalbone-hrd-plus-3-5-2026"];
out.checks = Object.fromEntries(checks.map(s => { const r = data.rackets.find(x => x.slug === s); if (!r) return [s, null];
  const lv = ctx.level(r.id); return [s, { level: lv, verdicts: Object.fromEntries((["beginner", "intermediate", "advanced"] as const).map(l => [l, fitVerdict({ style: "any", level: l, arm: false }, ctx.facts(r.id) as never).kind])) }]; }));
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
process.exit(0);
