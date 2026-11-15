// "X vs Y" compare pages Google may index: each well-reviewed product with the one or two products reviewers describe
// most like it (lib/similar.ts), both with enough judged reviews that the page has real numbers. Every other mix of
// products still works at /compare?ids=… but is kept out of the index (owner, 2026-11-12), so a catalog of a few hundred
// products yields a few hundred pages, not millions of near-duplicates.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { similarProducts, tagProfiles } from "./similar";
import { hasYears } from "./niche";

/** Judged reviews each side needs before its pair gets a page. */
export const MIN_PAIR_JUDGED = 10;
/** How many of a product's closest matches get a page with it. */
export const PAIRS_PER_PRODUCT = 2;

type Product = Catalog["rackets"][number];
export type ComparePair = { key: string; a: Product; b: Product };

/** The pair's address part: both slugs in alphabetical order, so "a vs b" and "b vs a" are one page. */
export const pairKey = (x: string, y: string) => [x, y].sort().join("-vs-");
export const pairHref = (x: string, y: string) => `/compare/${pairKey(x, y)}`;

const cached = new WeakMap<Catalog, { pairs: ComparePair[]; byKey: Map<string, ComparePair>; partners: Map<string, Product[]> }>();

/** Every indexable pair, plus lookups by address and by product (closest partner first). Worked out once per catalog read. */
export function comparePairs(data: Catalog) {
  const hit = cached.get(data);
  if (hit) return hit;
  const eligible = data.listed.filter(r => score(data, r.id).judged >= MIN_PAIR_JUDGED);
  const profiles = tagProfiles([...data.reviews, ...data.external]);
  const byKey = new Map<string, ComparePair>(), partners = new Map<string, Product[]>();
  const link = (x: Product, y: Product) => { const list = partners.get(x.id) ?? []; if (!list.includes(y)) list.push(y); partners.set(x.id, list); };
  for (const a of eligible) {
    // A product and its previous model ("2026 vs 2025") also get a page: the comparison shoppers look for most.
    const prev = previousModel(a, eligible);
    for (const b of [...(prev ? [prev] : []), ...similarProducts(a, eligible, profiles, PAIRS_PER_PRODUCT)]) {
      const key = pairKey(a.slug, b.slug);
      if (!byKey.has(key)) byKey.set(key, a.slug < b.slug ? { key, a, b } : { key, a: b, b: a });
      link(a, b); link(b, a);
    }
  }
  const out = { pairs: [...byKey.values()], byKey, partners };
  cached.set(data, out);
  return out;
}

/** "Nox AT10 Genius 12K 2026" → "nox at10 genius 12k": the model name without its year, to find earlier versions. */
const baseName = (name: string) => name.toLowerCase().replace(/\b(19|20)\d{2}\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

/** The same model's other versions (same brand, same name without the year), e.g. Nox AT10 Genius 12K 2025 for the 2026. */
export function otherVersions<T extends Product>(product: T, candidates: T[]): T[] {
  if (!hasYears) return [];
  const base = baseName(product.name);
  return candidates.filter(x => x.id !== product.id && x.brandId === product.brandId && x.year !== product.year && baseName(x.name) === base);
}
/** The latest earlier version, else the earliest later one: the pair that gets its own "X vs Y" page. */
export function previousModel<T extends Product>(product: T, candidates: T[]): T | undefined {
  const same = otherVersions(product, candidates);
  return same.filter(x => x.year < product.year).sort((p, q) => q.year - p.year)[0] ?? same.filter(x => x.year > product.year).sort((p, q) => p.year - q.year)[0];
}

/** The product page's "Compare with …" (owner, 2026-11-14: this year's models first, people care less about older
 *  ones). On sites with years: the same model's newer version; else the closest match (by what reviewers say) from this
 *  year or later; else the previous version; else the closest match from the last two seasons; else the closest. On
 *  other sites: the closest match, unless it is thinly reviewed and a near match has far more reviews. */
export function comparePick(data: Catalog, product: Product, now = new Date()): Product | undefined {
  const pool = data.listed.filter(x => score(data, x.id).judged >= 5);
  const similar = similarProducts(product, pool, tagProfiles([...data.reviews, ...data.external]), 12);
  const closest = comparePairs(data).partners.get(product.id)?.[0] ?? similar[0];
  if (hasYears) {
    const thisYear = now.getUTCFullYear(), versions = otherVersions(product, pool);
    return versions.filter(x => x.year > product.year).sort((p, q) => p.year - q.year)[0]
      ?? similar.find(x => x.year >= thisYear)
      ?? versions.filter(x => x.year < product.year).sort((p, q) => q.year - p.year)[0]
      ?? similar.find(x => x.year >= thisYear - 1)
      ?? closest;
  }
  if (!closest) return undefined;
  if (score(data, closest.id).judged >= 10) return closest;
  return [...similar.slice(0, 3)].sort((p, q) => score(data, q.id).judged - score(data, p.id).judged)[0] ?? closest;
}

/** A model family (owner 2026-11-15, quick match shows one row per model): the name without years and generation numbers,
 *  so Metalbone HRD+ 3.4 2025 → 3.5 2026, Electra Pro ST4 → ST5, Fenix Pro 5 → 6, Hack 04 → 05 and Neuron → Neuron 02 are one
 *  family. Carbon grades (12K, 18K) and model codes (AT10, EA10) stay part of the name. */
export const modelFamily = (p: { name: string; brandId: string }) => `${p.brandId}:${p.name.toLowerCase().replace(/\b(19|20)\d{2}\b/g, " ").replace(/\b(?:v|st|gen ?)?\d+(?:\.\d+)?\b(?![k+])/g, " ").replace(/[^a-z0-9+]+/g, " ").trim()}`;
/** The newest year of each racket's family among `candidates` (the highest name when two share the newest year). */
export function newestInFamily<T extends Product>(product: T, candidates: T[]): T {
  if (!hasYears) return product;
  const key = modelFamily(product);
  return [product, ...candidates.filter(x => x.id !== product.id && modelFamily(x) === key)].sort((a, b) => b.year - a.year || b.name.localeCompare(a.name, "en", { numeric: true }))[0];
}
/** The family's older years, newest first. */
export function olderInFamily<T extends Product>(product: T, candidates: T[]): T[] {
  if (!hasYears) return [];
  const key = modelFamily(product);
  return candidates.filter(x => x.id !== product.id && modelFamily(x) === key && x.year < product.year).sort((a, b) => b.year - a.year);
}
/** Which year of a family takes the row (owner 2026-11-15, "Yes, fall back"): the newest year with `enough` reports for a
 *  match %, else the newest. `newer` is the family's newest year when that isn't the one shown (it gets a "new: <year> version"
 *  link); once it has enough reports, it takes the row. */
export function rowOfFamily<T extends Product>(product: T, candidates: T[], enough: (p: T) => boolean): { shown: T; newer: T | null } {
  if (!hasYears) return { shown: product, newer: null };
  const key = modelFamily(product);
  const years = [product, ...candidates.filter(x => x.id !== product.id && modelFamily(x) === key)].sort((a, b) => b.year - a.year || b.name.localeCompare(a.name, "en", { numeric: true }));
  const shown = years.find(enough) ?? years[0];
  return { shown, newer: shown.id === years[0].id ? null : years[0] };
}
