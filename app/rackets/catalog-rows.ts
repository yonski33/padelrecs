// One compact filter row per listed racket (lib/catalog-filter.ts CatalogRow), from the same data as quick match and the fit
// check. Shared by the catalogue (app/rackets/catalog-v2.tsx) and the racket guide (app/guide), so a guide count is exactly
// the list its link opens.
import { score, type Catalog } from "../../db/data";
import { styleLean, ARM_BAR, MIN_FIT_REPORTS } from "../../lib/fit-verdict";
import { gramsOf, weightOf } from "../../lib/fine-tune";
import { rowOfFamily } from "../../lib/compare-pairs";
import { balanceOf, faceOf, shapeWord } from "../../lib/guide";
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
  return listed.map(r => {
    const facts = ctx.facts(r.id), sc = score(data, r.id), su = facts.suits;
    return { id: r.id, name: r.name, lean: styleLean(facts).lean, ...(su ? { suits: { beginner: su.beginner, intermediate: su.intermediate, advanced: su.advanced } } : {}),
      shape: shapeWord(r.shape), year: String(r.year), arm: (facts.tags["arm-friendly"] ?? 0) >= ARM_BAR, weight: weightOf(gramsOf(r.weight)), feel: ctx.fineOf(r.id)?.feel ?? null,
      balance: balanceOf(r.balance), face: faceOf(r.surface),
      sweet: (ctx.traits(r.id).scores?.forgiveness?.dots ?? 0) >= 4, signal: ctx.signal(r.id), n: facts.reports, judged: sc.judged, newest: newest.has(r.id) };
  });
}
