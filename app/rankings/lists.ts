import { cache } from "react";
import { catalog } from "../../db/data";
import { niche } from "../../lib/niche";
import { productSignals } from "../signals";
import { rankList, listTotals, rankingHref, withNicheWindow, withModelYears, MIN_LIST_ENTRIES } from "../../lib/top-lists";

export const topLists = withModelYears(withNicheWindow(niche.topLists ?? [], niche.recentMonths));
export const listHref = rankingHref;

/** Every list long enough to show, ranked from one catalogue read, shared by a page and its metadata. */
export const rankedLists = cache(async () => {
  const [data, sig] = await Promise.all([catalog(), productSignals()]);
  // Signal first, then its place in the category, so ties read the same here and on the product list.
  const order = new Map([...sig].map(([id, s]) => [id, s.signal * 10_000 - s.rank]));
  const lists = topLists.map(list => {
    const entries = rankList(list, data, niche.tags, new Date(), order).map(e => ({ ...e, signal: sig.get(e.product.id) ?? null }));
    return { list, entries, ...listTotals(entries) };
  }).filter(l => l.entries.length >= MIN_LIST_ENTRIES);
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
