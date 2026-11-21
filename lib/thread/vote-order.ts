// PadelRecs ranking order per list (owner test 2026-11-21): "votes" orders a list by its "Most picked for X · N players" count,
// the same N the row's pill shows; "loved" (owner 2026-11-21, Best overall) by the row's "N loved" count, this season's models
// only; "curated" keeps the db/curated order (that file stays as it is, so switching back is one
// word here). Lists not named here keep their own rule. Pure, so tests feed plain inputs.

export type ListOrder = {
  order: "votes" | "loved" | "curated";
  /** The "How does it play?" answer this list counts (plays_like: power, control). */ option?: string;
  /** "all": every racket that passes the floors below; "curated": the curated top 10, reordered. */ pool?: "all" | "curated";
};
export const LIST_ORDER: Record<string, Record<string, ListOrder>> = {
  padel: {
    "best-power-padel-rackets": { order: "votes", option: "power", pool: "all" },
    "best-control-padel-rackets": { order: "votes", option: "control", pool: "all" },
    "best-padel-rackets": { order: "loved" },
  },
};
/** The floors and the tie-break for a vote-ordered list.
 *  - minVotes: players behind this list's answer.
 *  - minReviews: the list's own review floor (lib/niche/padel.ts topLists: 12).
 *  - lead: the answer must lead the racket's group, so every row's pill names this list ("Most picked for power").
 *  - Ties: the higher share of the racket's group, then more reviews, then the name. */
export const VOTE_ORDER = { trait: "plays_like", minVotes: 10, minReviews: 12, lead: true, size: 10 };

export const listOrder = (site: string, slug: string): ListOrder | null => LIST_ORDER[site]?.[slug] ?? null;
export const votesOrdered = (site: string, slug: string) => listOrder(site, slug)?.order === "votes";
export const lovedOrdered = (site: string, slug: string) => listOrder(site, slug)?.order === "loved";
/** A "loved" list: this season's models (the current year only) with the list's review floor, one row per model; ties go to
 *  the higher loved share of the racket's opinions, then more reviews, then the name. */
export const LOVED_ORDER = { minReviews: 10, size: 10 };

export type VoteCandidate = { id: string; name: string; family: string; year: number; reviews: number; group: Record<string, number> };
/** The list's ids by votes: the floors, one row per model (its newest year that passes them), then the order above. */
export function voteOrder(xs: VoteCandidate[], option: string, cfg = VOTE_ORDER): string[] {
  const share = (x: VoteCandidate) => { const t = Object.values(x.group).reduce((a, b) => a + b, 0); return t ? (x.group[option] ?? 0) / t : 0; };
  const ok = xs.filter(x => { const v = x.group[option] ?? 0;
    return x.reviews >= cfg.minReviews && v >= cfg.minVotes && (!cfg.lead || Object.entries(x.group).every(([k, n]) => k === option || v > n)); });
  const best = new Map<string, VoteCandidate>();
  for (const x of ok) { const b = best.get(x.family); if (!b || x.year > b.year) best.set(x.family, x); }
  return [...best.values()].sort((a, b) => (b.group[option] ?? 0) - (a.group[option] ?? 0) || share(b) - share(a) || b.reviews - a.reviews || a.name.localeCompare(b.name))
    .slice(0, cfg.size).map(x => x.id);
}

export type LovedCandidate = { id: string; name: string; family: string; year: number; reviews: number; loved: number; mixed: number; notForMe: number };
/** The list's ids by "loved" count: the season's year only, the review floor, one row per model, then the order above. */
export function lovedOrder(xs: LovedCandidate[], year: number, cfg = LOVED_ORDER): string[] {
  const share = (x: LovedCandidate) => { const t = x.loved + x.mixed + x.notForMe; return t ? x.loved / t : 0; };
  const best = new Map<string, LovedCandidate>();
  for (const x of xs) if (x.year === year && x.reviews >= cfg.minReviews) { const b = best.get(x.family); if (!b || x.loved > b.loved) best.set(x.family, x); }
  return [...best.values()].sort((a, b) => b.loved - a.loved || share(b) - share(a) || b.reviews - a.reviews || a.name.localeCompare(b.name))
    .slice(0, cfg.size).map(x => x.id);
}
