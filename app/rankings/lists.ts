import { cache } from "react";
import { catalog } from "../../db/data";
import { niche } from "../../lib/niche";
import { rankList, listTotals, rankingHref, withNicheWindow } from "../../lib/top-lists";

export const topLists = withNicheWindow(niche.topLists ?? [], niche.recentMonths);
export const listHref = rankingHref;

/** Every configured list ranked from one catalogue read, shared by a page and its metadata. */
export const rankedLists = cache(async () => {
  const data = await catalog();
  const lists = topLists.map(list => {
    const entries = rankList(list, data, niche.tags);
    return { list, entries, ...listTotals(entries) };
  });
  return { data, lists };
});
/** Slugs of the lists that rank at least one product. Empty lists stay reachable (noindex) but aren't linked. */
export const rankedSlugs = async () => topLists.length ? (await rankedLists()).lists.filter(l => l.entries.length).map(l => l.list.slug) : [];
export type RankedList = Awaited<ReturnType<typeof rankedLists>>["lists"][number];

// "Bullpadel Vertex 05 2026" under a "Bullpadel" line reads as "Vertex 05 2026", like the rest of the site.
export const modelName = (name: string, brand: string) => brand && name.toLowerCase().startsWith(`${brand.toLowerCase()} `) ? name.slice(brand.length + 1) : name;

/** "22 October 2026", from a stored ISO timestamp. */
export const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const currentYear = () => new Date().getUTCFullYear();
