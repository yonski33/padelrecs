import { cache } from "react";
import { catalog } from "../../db/data";
import { niche } from "../../lib/niche";
import { productSignals } from "../signals";
import { homePayload } from "../home-payload";
import { rankHome } from "../../lib/home-rank";
import { rankList, listTotals, rankingHref, withNicheWindow, withModelYears, MIN_LIST_ENTRIES } from "../../lib/top-lists";

export const topLists = withModelYears(withNicheWindow(niche.topLists ?? [], niche.recentMonths));
export const listHref = rankingHref;

type ListData = Awaited<ReturnType<typeof catalog>>;
const ranked = (list: (typeof topLists)[number], data: ListData, order: ReadonlyMap<string, number>, sig: Awaited<ReturnType<typeof productSignals>>) => {
  const entries = rankList(list, data, niche.tags, new Date(), order).map(e => ({ ...e, signal: sig.get(e.product.id) ?? null }));
  return { list, entries, ...listTotals(entries) };
};
/** The lists ranked by Player score alone (no list.picks), from one catalogue read. The match context reads these for each
 *  product's ranking places, so they can't wait on the match context themselves. */
export const baseLists = cache(async () => {
  const [data, sig] = await Promise.all([catalog(), productSignals()]);
  // Signal first, then its place in the category, so ties read the same here and on the product list.
  const order = new Map([...sig].map(([id, s]) => [id, s.signal * 10_000 - s.rank]));
  const lists = topLists.filter(l => !l.picks).map(list => ranked(list, data, order, sig)).filter(l => l.entries.length >= MIN_LIST_ENTRIES);
  return { data, sig, lists };
});
/** Every list long enough to show, shared by a page and its metadata. Lists for a kind of player (list.picks) take the home
 *  quick match's candidates for those picks, in its order, so a level pick keeps the level gate. */
export const rankedLists = cache(async () => {
  const base = await baseLists(), { data, sig } = base;
  if (!topLists.some(l => l.picks) || !niche.finder) return { data, lists: base.lists };
  const items = (await homePayload()).items;
  const setup = { ...niche.finder, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
  const bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
  const lists = topLists.flatMap(list => {
    if (!list.picks) return base.lists.filter(l => l.list.slug === list.slug);
    const rows = rankHome(items, setup, bad, { style: "any", arm: !!list.picks.arm, ...(list.picks.level ? { level: list.picks.level } : {}) }, false, 40).rows;
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
