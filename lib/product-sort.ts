// Catalogue ordering for the products and type pages. Shares only rank a product once enough people weighed in,
// so one glowing comment can't put a product on top; products below the minimum follow, in the same order.
export const MIN_JUDGED = 5;   // web reviews with a sentiment before "% positive" counts

export const SORTS = [
  { value: "discussed", label: "Most discussed" },
  { value: "positive", label: "Most positive" },
  { value: "newest", label: "Newest" },
] as const;
export type SortKey = typeof SORTS[number]["value"];
// "rated" (Highest rated) was dropped: with so few star ratings it always matched "Most positive", so old links land there.
export const parseSort = (v: string | undefined): SortKey => v === "rated" ? "positive" : SORTS.some(s => s.value === v) ? v as SortKey : "discussed";

type Stats = { count: number; average: string | null; web: number; judged: number; positive: number };
type Item = { r: { name: string; createdAt: string }; s: Stats };

/** Share of positive web reviews (0–100), or null below MIN_JUDGED. */
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

export function sortProducts<T extends Item>(list: T[], key: SortKey): T[] {
  const cmp = { discussed: byDiscussed, positive: byPositive, newest: byNewest }[key];
  return [...list].sort(cmp);
}
