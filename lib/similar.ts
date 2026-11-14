import { hash } from "./discover";
// "Similar" products: the ones reviewers describe the same way. Shape alone can't do this: many products have no shape on
// file, and two rackets of one shape can still play nothing alike.

type Tagged = { racketId: string; tags: string[] };
type Candidate = { id: string; shape?: string | null };

/** Below this the two products share too little to call them similar, so the list stays short rather than padded. */
export const MIN_SIMILARITY = 0.3;

/** Tag counts per product, from published reviews of either kind. */
export function tagProfiles(reviews: Tagged[]) {
  const profiles = new Map<string, Map<string, number>>();
  for (const r of reviews) {
    const p = profiles.get(r.racketId) ?? new Map<string, number>();
    for (const t of r.tags) p.set(t, (p.get(t) ?? 0) + 1);
    profiles.set(r.racketId, p);
  }
  return profiles;
}

/** Products closest to `product` by what reviewers say, best first. A rare tag says more than one nearly everything carries.
 *  A known shape is respected; a product with none on file is judged on its reviews alone. */
export function similarProducts<T extends Candidate>(product: Candidate, candidates: T[], profiles: Map<string, Map<string, number>>, limit = 4) {
  const seen = new Map<string, number>();
  for (const p of profiles.values()) for (const t of p.keys()) seen.set(t, (seen.get(t) ?? 0) + 1);
  const weight = (t: string) => Math.log(1 + profiles.size / (seen.get(t) ?? 1));
  const vector = (id: string) => new Map([...(profiles.get(id) ?? [])].map(([t, n]) => [t, Math.sqrt(n) * weight(t)]));
  const size = (v: Map<string, number>) => Math.sqrt([...v.values()].reduce((a, x) => a + x * x, 0));
  const own = vector(product.id), ownSize = size(own);
  if (!ownSize) return [];
  return candidates.filter(x => x.id !== product.id && (!product.shape || !x.shape || x.shape === product.shape)).map(x => {
    const v = vector(x.id), dot = [...own].reduce((a, [t, n]) => a + n * (v.get(t) ?? 0), 0);
    return { x, similarity: size(v) ? dot / (ownSize * size(v)) : 0 };
  }).filter(s => s.similarity >= MIN_SIMILARITY).sort((a, b) => b.similarity - a.similarity).slice(0, limit).map(s => s.x);
}

/** The similar products a page shows (owner 2026-11-14): `shown` drawn from the pool of closest matches by `seed`, so moving
 *  between similar products keeps turning up new ones; none is fixed (owner: "fully dynamic"). `fixed` keeps that many of
 *  the closest in place if ever wanted. Keeps closest-first order. */
export function similarRotation<T extends { id: string }>(pool: T[], seed: string, shown = 4, fixed = 0): T[] {
  const rest = pool.slice(fixed).map(x => ({ x, k: hash(`${seed}|${x.id}`) })).sort((a, b) => a.k - b.k).slice(0, shown - fixed).map(r => r.x);
  const keep = new Set(rest.map(x => x.id));
  return [...pool.slice(0, fixed), ...pool.slice(fixed).filter(x => keep.has(x.id))];
}
