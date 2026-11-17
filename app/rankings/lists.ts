import { cache } from "react";
import { catalog, type Catalog } from "../../db/data";
import { sameInputs } from "../../db/same-inputs";
import type { Signal } from "../../lib/signal";
import { niche } from "../../lib/niche";
import { productSignals } from "../signals";
import { homePayload } from "../home-payload";
import { rankHome, type RankItem } from "../../lib/home-rank";
import { RANK_SETUP, NEGATIVE_TAGS } from "../../lib/rank-seed";
import { rankList, listTotals, rankingHref, withNicheWindow, withModelYears, MIN_LIST_ENTRIES } from "../../lib/top-lists";
import { curatedRanking } from "../../lib/curated";
import { modelFamily } from "../../lib/compare-pairs";

export const topLists = withModelYears(withNicheWindow(niche.topLists ?? [], niche.recentMonths));
export const listHref = rankingHref;

const ranked = (list: (typeof topLists)[number], data: Catalog, order: ReadonlyMap<string, number>, sig: Map<string, Signal>) => {
  const entries = rankList(list, data, niche.tags, new Date(), order).map(e => ({ ...e, signal: sig.get(e.product.id) ?? null }));
  return { list, entries, ...listTotals(entries) };
};
/** The lists ranked by Player score alone (no list.picks), from one catalogue read. The match context reads these for each
 *  product's ranking places, so they can't wait on the match context themselves. */
export const baseLists = cache(async () => baseOf(...await Promise.all([catalog(), productSignals()])));
/** Ranked again only when the instance's catalogue copy changes (db/same-inputs.ts). */
const baseOf = sameInputs((data: Catalog, sig: Map<string, Signal>) => {
  // Signal first, then its place in the category, so ties read the same here and on the product list.
  const order = new Map([...sig].map(([id, s]) => [id, s.signal * 10_000 - s.rank]));
  const lists = topLists.filter(l => !l.picks).map(list => ranked(list, data, order, sig)).filter(l => l.entries.length >= MIN_LIST_ENTRIES);
  return { data, sig, lists };
});
/** Every list long enough to show, shared by a page and its metadata. Lists for a kind of player (list.picks) take the home
 *  quick match's candidates for those picks, in its order, so a level pick keeps the level gate. */
export const rankedLists = cache(async () => {
  const base = await baseLists();
  const picked = !topLists.some(l => l.picks) || !niche.finder ? { data: base.data, lists: base.lists } : withPicks(base, (await homePayload()).items);
  return withCurated(base, picked);
});
/** Pages built from the curated lists (db/curated/<site>.json rankings): the curated order, the page's own format. The list's
 *  trait, filters and age window are the curators' call here, so they don't apply; the review floor still does. */
const withCurated = (base: Awaited<ReturnType<typeof baseOf>>, picked: { data: Catalog; lists: ReturnType<typeof ranked>[] }) => {
  const { data, sig } = base, bySlug = new Map(data.listed.map(p => [p.slug, p]));
  const lists = topLists.flatMap(list => {
    const order = curatedRanking(list.slug, s => { const p = bySlug.get(s); return p ? { key: modelFamily(p), year: p.year } : null; });
    if (!order) return picked.lists.filter(l => l.list.slug === list.slug);
    const ids = order.map(s => bySlug.get(s)!.id);
    const l = ranked({ ...list, trait: undefined, filters: undefined, maxAgeYears: undefined, modelYearsBack: undefined }, { ...data, listed: data.listed.filter(p => ids.includes(p.id)) },
      new Map(ids.map((id, i) => [id, ids.length - i])), sig);
    return l.entries.length >= MIN_LIST_ENTRIES ? [l] : picked.lists.filter(x => x.list.slug === list.slug);
  });
  return { data, lists };
};
const withPicks = sameInputs((base: Awaited<ReturnType<typeof baseOf>>, items: RankItem[]) => {
  const { data, sig } = base;
  const lists = topLists.flatMap(list => {
    if (!list.picks) return base.lists.filter(l => l.list.slug === list.slug);
    const rows = rankHome(items, RANK_SETUP, NEGATIVE_TAGS, { style: "any", arm: !!list.picks.arm, ...(list.picks.level ? { level: list.picks.level } : {}) }, false, 40).rows;
    const ids = new Set(rows.map(r => r.id));
    const l = ranked(list, { ...data, listed: data.listed.filter(p => ids.has(p.id)) }, new Map(rows.map((r, i) => [r.id, rows.length - i])), sig);
    return l.entries.length >= MIN_LIST_ENTRIES ? [l] : [];
  });
  return { data, lists };
});
/** Slugs of the lists on show. */
export const rankedSlugs = async () => topLists.length ? (await rankedLists()).lists.map(l => l.list.slug) : [];
export type RankedList = Awaited<ReturnType<typeof rankedLists>>["lists"][number];

// "Bullpadel Vertex 05 2026" under a "Bullpadel" line reads as "Vertex 05 2026", like the rest of the site.
export const modelName = (name: string, brand: string) => brand && name.toLowerCase().startsWith(`${brand.toLowerCase()} `) ? name.slice(brand.length + 1) : name;

/** "22 October 2026", from a stored ISO timestamp. */
export const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const currentYear = () => new Date().getUTCFullYear();
