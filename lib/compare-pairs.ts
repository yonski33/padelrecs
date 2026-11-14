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

/** The same model's nearest other version (same brand, same name without the year): the latest earlier one, else the
 *  earliest later one. "Nox AT10 Genius 12K 2026" pairs with the 2025; a 2025 model with only a 2026 successor pairs with that. */
export function previousModel<T extends Product>(product: T, candidates: T[]): T | undefined {
  if (!hasYears) return undefined;
  const base = baseName(product.name);
  const same = candidates.filter(x => x.id !== product.id && x.brandId === product.brandId && x.year !== product.year && baseName(x.name) === base);
  return same.filter(x => x.year < product.year).sort((p, q) => q.year - p.year)[0] ?? same.filter(x => x.year > product.year).sort((p, q) => p.year - q.year)[0];
}

/** The product page's "Compare with …" (owner, 2026-11-14): the previous version of the same model when it is listed;
 *  otherwise the most similar product (by what reviewers say) from this model year or the one before, on sites with
 *  years; otherwise the best reviewed of the three most similar. Falls back to the closest match of any age. */
export function comparePick(data: Catalog, product: Product): Product | undefined {
  const pool = data.listed.filter(x => score(data, x.id).judged >= 5);
  const version = previousModel(product, pool);
  if (version) return version;
  const similar = similarProducts(product, pool, tagProfiles([...data.reviews, ...data.external]), 8);
  const closest = comparePairs(data).partners.get(product.id)?.[0] ?? similar[0];
  if (!closest) return undefined;
  // Sites with years: a rival from this season or the one before, not a model shoppers have moved past.
  if (hasYears) return closest.year >= product.year - 1 ? closest : similar.find(x => x.year >= product.year - 1) ?? closest;
  // Others: the closest match, unless it is thinly reviewed and a near match has far more reviews.
  if (score(data, closest.id).judged >= 10) return closest;
  return [...similar.slice(0, 3)].sort((p, q) => score(data, q.id).judged - score(data, p.id).judged)[0] ?? closest;
}
