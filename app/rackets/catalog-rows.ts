// One compact filter row per listed racket (lib/catalog-filter.ts CatalogRow), from the same data as quick match and the fit
// check. Shared by the catalogue (app/rackets/catalog-v2.tsx) and the racket guide (app/guide), so a guide count is exactly
// the list its link opens.
import { score, type Catalog } from "../../db/data";
import { styleLean, styleOf, ARM_BAR, MIN_FIT_REPORTS, SUITS_OK } from "../../lib/fit-verdict";
import { gramsOf, weightOf } from "../../lib/fine-tune";
import { rowOfFamily } from "../../lib/compare-pairs";
import { shapeWord, specValues } from "../../lib/guide";
import { niche } from "../../lib/niche";
import type { CatalogRow } from "../../lib/catalog-filter";
import type { matchContext } from "../match-context";

type Ctx = Awaited<ReturnType<typeof matchContext>>;

export function catalogRows(data: Catalog, ctx: Ctx, listed: Catalog["listed"] = data.listed): CatalogRow[] {
  // One model, newest year (owner 2026-11-15, as quick match): a newest year without enough reports yet hands the row to the
  // newest year that has them (the same rule as quick match). Older pages stay live.
  const reportsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reportsOf.set(x.racketId, (reportsOf.get(x.racketId) ?? 0) + 1);
  const rowOf = (r: Catalog["listed"][number]) => rowOfFamily(r, data.listed, x => (reportsOf.get(x.id) ?? 0) >= MIN_FIT_REPORTS);
  const newest = new Set(data.listed.filter(r => rowOf(r).shown.id === r.id).map(r => r.id));
  // A type-picker site (DiscGolfRecs, lib/fit-config.ts quick) flags "slow-arm friendly" from its arm score, not padel's tag.
  const armScore = ctx.cfg.quick ? new Map(ctx.items.map(x => [x.id, x.arm])) : null;
  return listed.map(r => {
    const facts = ctx.facts(r.id), sc = score(data, r.id), su = facts.suits;
    // One style per racket, from the bars, as on the racket page and the rankings (audit 2026-11-17); a type-picker site keeps
    // its own lean. Beginner rackets (soft, easy, forgiving) also count as control and balance in the filter (owner 2026-11-17).
    const lean = ctx.cfg.quick ? styleLean(facts).lean : styleOf(facts, ctx.cfg);
    const d = facts.styleDots ? facts.styleDots.power - facts.styleDots.control : null;
    const styles = ctx.cfg.quick ? undefined : [...new Set([lean, ...((su?.beginner ?? 0) >= SUITS_OK ? ["control", "balance"] as const : []), ...(d === -1 ? ["balance"] as const : [])].filter((s): s is "control" | "power" | "balance" => !!s))];
    return { id: r.id, name: r.name, lean, ...(styles ? { styles } : {}), ...(su ? { suits: { beginner: su.beginner, intermediate: su.intermediate, advanced: su.advanced } } : {}),
      shape: shapeWord(r.shape), year: String(r.year), arm: ctx.cfg.quick?.armFilter ? !!ctx.items.find(x => x.id === r.id)?.ff?.[ctx.cfg.quick.armFilter.key]?.includes(ctx.cfg.quick.armFilter.value) : armScore ? (armScore.get(r.id) ?? 0) >= 70 && !!ctx.cfg.quick?.armSpecOk?.(r) && !facts.hard?.arm :(facts.tags["arm-friendly"] ?? 0) >= ARM_BAR, weight: weightOf(gramsOf(r.weight)), feel: ctx.fineOf(r.id)?.feel ?? null,
      spec: specValues(niche.guide, r),
      sweet: (ctx.traits(r.id).scores?.forgiveness?.dots ?? 0) >= 4, signal: ctx.signal(r.id), n: facts.reports, judged: sc.judged, newest: newest.has(r.id) };
  });
}
