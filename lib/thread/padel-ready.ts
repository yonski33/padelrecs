// Which PadelRecs rackets are ready to list and link (owner 2026-11-26: "B with 30-day exemption"), the LaptopRecs not-ready
// rule's padel twin (lib/thread/laptop-lines.ts LAPTOP_READY). A racket with almost no content stays out of the sitemap, the
// home list, rankings, brand pages, similar and mentioned links and search (db/data.ts `listed`, app/api/racket-search). Its
// page stays reachable at its address and is never noindexed. It lists again on its own once it passes either bar.
//   - reviews: approved player reviews + web reviews (external_reviews) + live creator reviewers.
//   - votes: quick votes (product_votes) + distinct voters on "How does it play?" (trait_votes).
//   - Rackets added in the last `newDays` days are exempt, so new models still show in "Just in".
// Pure, so tests feed plain inputs.

export const PADEL_READY = { reviews: 3, votes: 3, newDays: 30 };
export type PadelReadiness = { reviews: number; votes: number; createdAt: string };

export const padelNew = (x: Pick<PadelReadiness, "createdAt">, now: number, cfg = PADEL_READY) => {
  const t = Date.parse(x.createdAt);
  return Number.isFinite(t) && now - t < cfg.newDays * 86_400_000;
};
/** Ready when the racket has enough reviews OR enough votes, or is new. */
export const padelReady = (x: PadelReadiness, now: number, cfg = PADEL_READY) =>
  x.reviews >= cfg.reviews || x.votes >= cfg.votes || padelNew(x, now, cfg);

/** The ids that are ready, from per-id counts (missing ids count 0). */
export function padelReadyIds(items: { id: string; createdAt: string }[], counts: { reviews: Map<string, number>; votes: Map<string, number> }, now: number, cfg = PADEL_READY): Set<string> {
  return new Set(items.filter(r => padelReady({ reviews: counts.reviews.get(r.id) ?? 0, votes: counts.votes.get(r.id) ?? 0, createdAt: r.createdAt }, now, cfg)).map(r => r.id));
}
