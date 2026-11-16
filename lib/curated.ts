// Curated top 10s (owner 2026-11-17, "Yes, build it"): per pick (style × level × sore arm), an owner-edited list of products
// that lead the match list in that order (db/curated/<site>.json). Padel only for now; other sites have none.
import padel from "../db/curated/padel.json";
import { niche } from "./niche";
import type { QuickChoice } from "./quick-match";

export type CuratedEntry = { slug: string; note?: string; /** The source the reason rests on (Grok pack). */ src?: string };
const SITES: Record<string, { lists: Record<string, CuratedEntry[]> }> = { padel };
export const curatedKey = (c: Pick<QuickChoice, "style" | "level" | "arm">) => `${c.style}/${c.level}/arm-${c.arm ? "on" : "off"}`;
/** The curated slugs for these picks, in order; none for "any" style, no level, or an empty list. */
export function curatedFor(c: Pick<QuickChoice, "style" | "level" | "arm">, site = niche.id): string[] {
  if (c.style === "any" || !c.level) return [];
  return (SITES[site]?.lists[curatedKey(c)] ?? []).map(e => e.slug);
}
export const hasCurated = (site = niche.id) => !!SITES[site];
/** The display % for curated place i (0-based) of n: 97 for #1, stepping down evenly to about 80. */
export const curatedPct = (i: number, n: number) => Math.round(97 - (n > 1 ? i * 17 / (n - 1) : 0));
