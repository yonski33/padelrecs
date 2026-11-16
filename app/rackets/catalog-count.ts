// How many products the catalogue shows (one row per model on v2 sites, owner 2026-11-15): its title and the home's
// "see all N" link say the same number (match audit 2026-11-16: the home said 205, /rackets 145).
import type { Catalog } from "../../db/data";
import { rowOfFamily } from "../../lib/compare-pairs";
import { MIN_FIT_REPORTS } from "../../lib/fit-verdict";
import { isV2 } from "../../lib/niche";

export function catalogShownCount(data: Catalog): number {
  if (!isV2) return data.listed.length;
  const reportsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reportsOf.set(x.racketId, (reportsOf.get(x.racketId) ?? 0) + 1);
  return data.listed.filter(r => rowOfFamily(r, data.listed, x => (reportsOf.get(x.id) ?? 0) >= MIN_FIT_REPORTS).shown.id === r.id).length;
}
