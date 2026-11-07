import type { Niche } from "./niche/types";

/**
 * Product variants on web reviews (Niche.variants; DiscGolfRecs: the plastic a disc was thrown in). A product's allowed
 * variants are its `core` spec as a comma-separated list. Data module only, shared by publishing and the product page.
 */
const key = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();

/** The product's variants in its own spelling, in catalogue order: "Star, GStar, DX" → ["Star", "GStar", "DX"]. */
export function productVariants(core: string | null | undefined) {
  const seen = new Set<string>();
  return (core ?? "").split(",").map(v => v.trim().replace(/\s+/g, " ")).filter(v => v && !seen.has(key(v)) && seen.add(key(v)));
}

/** The variant to store for a review: one of the product's variants (matched ignoring case and spacing), in the product's
 *  spelling; null when the niche has no variants, the review names none, or it names one the product doesn't list. */
export function matchVariant(niche: Pick<Niche, "variants">, core: string | null | undefined, variant: string | null | undefined) {
  if (!niche.variants || !variant?.trim()) return null;
  return productVariants(core).find(v => key(v) === key(variant)) ?? null;
}

/** How many reviews name each variant, most first (then by name): [["Star", 12], ["DX", 4]]. Reviews without one don't count. */
export function variantCounts(reviews: { variant?: string | null }[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const r of reviews) if (r.variant) counts.set(r.variant, (counts.get(r.variant) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
