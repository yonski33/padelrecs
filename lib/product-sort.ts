// Catalogue ordering for the products and type pages. Shares only rank a product once enough people weighed in,
// so one glowing comment can't put a product on top; products below the minimum follow, in the same order.
export const MIN_JUDGED = 5;   // user ratings plus web reviews with a sentiment before "% positive" counts

export const SORTS = [
  // "positive" keeps its old URL value; it orders by the signal score where the page passes one, and is the default so
  // the signal numbers on the rows always run high to low (owner, 2026-11-12).
  { value: "positive", label: "Top rated" },
  { value: "discussed", label: "Most discussed" },
  { value: "newest", label: "Newest" },
] as const;
export type SortKey = typeof SORTS[number]["value"];
// "rated" (Highest rated) was dropped: with so few star ratings it always matched "Most positive", so old links land there.
export const DEFAULT_SORT: SortKey = "positive";
export const parseSort = (v: string | undefined): SortKey => v === "rated" ? "positive" : SORTS.some(s => s.value === v) ? v as SortKey : DEFAULT_SORT;

type Stats = { count: number; average: string | null; web: number; judged: number; positive: number };
type Item = { r: { name: string; createdAt: string }; s: Stats };

/** Share of positive reviews, user and web (0–100), or null below MIN_JUDGED. */
export const positiveShare = (s: Stats) => s.judged >= MIN_JUDGED ? Math.round(s.positive / s.judged * 100) : null;

const total = (s: Stats) => s.count + s.web;
const byName = (a: Item, b: Item) => a.r.name.localeCompare(b.r.name);
const byDiscussed = (a: Item, b: Item) => total(b.s) - total(a.s) || byName(a, b);
// Ranks by the lower bound of the 95% Wilson interval, so "38 of 40 positive" beats "5 of 5" (rows still show the plain share).
const wilson = (s: Stats) => {
  const n = s.judged, p = s.positive / n, z = 1.96;
  return (p + z * z / (2 * n) - z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / (1 + z * z / n);
};
const byPositive = (a: Item, b: Item) => {
  const qa = a.s.judged >= MIN_JUDGED, qb = b.s.judged >= MIN_JUDGED;
  if (qa !== qb) return qa ? -1 : 1;
  if (qa && qb) { const d = wilson(b.s) - wilson(a.s); if (d) return d; }
  return byDiscussed(a, b);
};
const byNewest = (a: Item, b: Item) => b.r.createdAt.localeCompare(a.r.createdAt) || byName(a, b);

/** `signalOf`: the product's signal score (lib/signal.ts), if it has one. With it, "positive" follows the signal, so the
 *  numbers on the rows run high to low; products without one follow, most discussed first. */
export function sortProducts<T extends Item>(list: T[], key: SortKey, signalOf?: (x: T) => number | undefined): T[] {
  if (key === "positive" && signalOf) return [...list].sort((a, b) => (signalOf(b) ?? -1) - (signalOf(a) ?? -1) || byDiscussed(a, b));
  const cmp = { discussed: byDiscussed, positive: byPositive, newest: byNewest }[key];
  return [...list].sort(cmp);
}
