// "X vs Y" compare pages Google may index: each well-reviewed product with the one or two products reviewers describe
// most like it (lib/similar.ts), both with enough judged reviews that the page has real numbers. Every other mix of
// products still works at /compare?ids=… but is kept out of the index (owner, 2026-11-12), so a catalog of a few hundred
// products yields a few hundred pages, not millions of near-duplicates.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { similarProducts, tagProfiles } from "./similar";

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
    for (const b of similarProducts(a, eligible, profiles, PAIRS_PER_PRODUCT)) {
      const key = pairKey(a.slug, b.slug);
      if (!byKey.has(key)) byKey.set(key, a.slug < b.slug ? { key, a, b } : { key, a: b, b: a });
      link(a, b); link(b, a);
    }
  }
  const out = { pairs: [...byKey.values()], byKey, partners };
  cached.set(data, out);
  return out;
}
