// Curated top 10s (owner 2026-11-17, "Yes, build it"): per pick (style × level × sore arm), an owner-edited list of products
// that lead the match list in that order (db/curated/<site>.json). Padel only for now; other sites have none.
import padel from "../db/curated/padel.json";
import { niche } from "./niche";
import type { QuickChoice } from "./quick-match";

export type CuratedEntry = { slug: string; /** The owner's own pick: kept whatever its evidence. */ owner?: boolean; note?: string; /** Why an older year is allowed (validator). */ exception?: string; /** The source the reason rests on (Grok pack). */ src?: string };
const SITES: Record<string, { lists: Record<string, CuratedEntry[]>; rankings?: Record<string, string[] | string> }> = { padel };
export const curatedKey = (c: Pick<QuickChoice, "style" | "level" | "arm">) => `${c.style}/${c.level}/arm-${c.arm ? "on" : "off"}`;
/** A drafted pick needs this much evidence to stay on a list (owner 2026-11-17); the owner's picks are exempt. */
export const CURATED_MIN = { reviews: 10, score: 70 };
/** The curated entries for these picks, in order; none for "any" style, no level, or an empty list. */
export function curatedEntries(c: Pick<QuickChoice, "style" | "level" | "arm">, site = niche.id): CuratedEntry[] {
  if (c.style === "any" || !c.level) return [];
  return SITES[site]?.lists[curatedKey(c)] ?? [];
}
/** The curated slugs for these picks, in order (before the evidence rule). */
export const curatedFor = (c: Pick<QuickChoice, "style" | "level" | "arm">, site = niche.id) => curatedEntries(c, site).map(e => e.slug);
/** Every slug on any of the site's curated lists. */
export const curatedSlugs = (site = niche.id) => [...new Set(Object.values(SITES[site]?.lists ?? {}).flat().map(e => e.slug))];
/** A curated pick with a weak match for these picks says why it is on the list (owner 2026-11-17, "Top-rated, but the small
 *  sweet spot asks a lot of intermediates"): its standing, its own catch, and the fit check's reason, in ≤ 105 characters. */
export function whyHere(signal: number | null, catchLine: string | null | undefined, fitShort: string | null | undefined, max = 105): string {
  const who = (signal ?? 0) >= CURATED_MIN.score ? "Top-rated" : "Our pick";
  // Plain words only: no leading mark ("✕ Not aimed …"), no trailing punctuation ("…own arm;").
  const lc = (t: string) => t.replace(/^[^\p{L}]+/u, "").replace(/[.;,:\s]+$/, "").replace(/^\p{Lu}(?!\p{Lu})/u, ch => ch.toLowerCase());
  const c = catchLine ? lc(catchLine.split(/(?<=[.;])\s/)[0]) : null, f = fitShort ? lc(fitShort) : null;
  return [c && f ? `${who}, but ${c}; ${f}.` : null, c ? `${who}, but ${c}.` : null, f ? `${who}, but ${f} for these picks.` : null, `${who}, but a stretch for these picks.`]
    .find((t): t is string => !!t && t.length <= max)!;
}
/** A /rankings page's curated order (owner 2026-11-17): its source lists interleaved by curated rank (#1 of each, then #2 of
 *  each …), repeats dropped; `family` keeps the newest model of each (one row per model). Null when the page has no sources. */
export function curatedRanking(slug: string, family: (slug: string) => { key: string; year: number } | null, site = niche.id): string[] | null {
  const src = SITES[site]?.rankings?.[slug]; if (!Array.isArray(src) || !src.length) return null;
  const lists = src.map(k => SITES[site]?.lists[k] ?? []), out: string[] = [], best = new Map<string, { slug: string; year: number }>();
  for (let i = 0; i < Math.max(0, ...lists.map(l => l.length)); i++) for (const l of lists) { const e = l[i]; if (!e || out.includes(e.slug)) continue;
    const f = family(e.slug); if (!f) continue;
    const had = best.get(f.key);
    if (!had) { best.set(f.key, { slug: e.slug, year: f.year }); out.push(e.slug); }
    else if (f.year > had.year) { out[out.indexOf(had.slug)] = e.slug; best.set(f.key, { slug: e.slug, year: f.year }); } }
  return out;
}
export const hasCurated = (site = niche.id) => !!SITES[site];
/** The style a curated ranking page is picked for ("power" for best-power-padel-rackets), or null when the page keeps its
 *  Player-score order (audit 2026-11-17 #2: the page then says the list is ours, not a score sort). */
export function curatedRankingStyle(slug: string, site = niche.id): string | null {
  const src = SITES[site]?.rankings?.[slug]; if (!Array.isArray(src) || !src.length) return null;
  const styles = [...new Set(src.map(k => k.split("/")[0]))];
  return styles.length === 1 ? styles[0] : "mixed";
}
