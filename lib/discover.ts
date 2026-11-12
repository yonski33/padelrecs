// "Discover more" at the end of a product page (owner, 2026-11-12): a different handful of well-reviewed products of the
// same kind on every product page, reshuffled each week. Seeded rather than random, so cached pages and Google see a
// stable set, while someone moving from page to page keeps meeting new products. Pure, for tests.

/** A small deterministic hash (FNV-1a) of a string, as an unsigned 32-bit number. */
export function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/** Week number since 1970, so the picks move on once a week (weeks start on Thursdays, as 1 Jan 1970 did) without a schedule. */
export const weekOf = (now = new Date()) => Math.floor(now.getTime() / (7 * 86_400_000));

/** Up to `n` ids from `pool` (best first), skipping `exclude`, shuffled by `seed`: the top half of the pool is the draw, so
 *  every pick is well reviewed. */
export function discoverPicks(pool: string[], exclude: Set<string>, seed: string, n = 5): string[] {
  const candidates = pool.filter(id => !exclude.has(id));
  const draw = candidates.slice(0, Math.max(n * 2, Math.ceil(candidates.length / 2)));
  return draw.map(id => ({ id, k: hash(`${seed}|${id}`) })).sort((a, b) => a.k - b.k).slice(0, n).map(x => x.id);
}
