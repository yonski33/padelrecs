// PadelRecs ranking order per list (owner test 2026-11-21): "votes" orders a list by its "Most picked for X · N players" count,
// the same N the row's pill shows; "loved" (owner 2026-11-21, Best overall) by the row's "N loved" count, this season's models
// only; "curated" keeps the db/curated order (that file stays as it is, so switching back is one
// word here). Lists not named here keep their own rule. Pure, so tests feed plain inputs.

export type ListOrder = {
  /** "keep": the list keeps its own order and only its row tag follows the list (PickleballRecs beginners). */
  order: "votes" | "loved" | "curated" | "keep";
  /** The vote group this list counts (default plays_like) and the answer in it (power, control, lots, very, beginner). */ trait?: string; option?: string;
  /** The row tag's words: "Most picked for <word> · N players" (default: the plays_like words). */ word?: string;
  /** The row tag's own words for a "keep" list, in place of "Picked for <word>" (SkinRecs: "No irritation · 14 people"). */ say?: string;
  /** "all": every racket that passes the floors below; "curated": the curated top 10, reordered. */ pool?: "all" | "curated";
  /** "loved" lists: "season" (default) is this year's models only; "current" is each model's current year (PickleballRecs:
   *  its catalogue mixes 2024-2026 models). */ years?: "season" | "current";
};
export const LIST_ORDER: Record<string, Record<string, ListOrder>> = {
  padel: {
    "best-power-padel-rackets": { order: "votes", option: "power", pool: "all" },
    "best-control-padel-rackets": { order: "votes", option: "control", pool: "all" },
    "best-padel-rackets": { order: "loved" },
    // 2026-11-24 (onto the pickleball template): these two keep their own order (the engine's pick and the curated top 10)
    // and only their row tag follows the list, as PickleballRecs' beginners list does.
    "best-padel-rackets-for-tennis-elbow": { order: "keep", trait: "arm", option: "very", word: "arm comfort" },
    "best-padel-rackets-for-beginners": { order: "keep", trait: "level", option: "beginner", word: "beginners" },
  },
  // PickleballRecs (owner 2026-11-23, "do the same like we did on padel"): each list by the votes for its own answer, and
  // each row tagged with that list's count, never another trait ("Lots of spin" sat on every list). Beginner votes are too
  // thin to rank by (4 paddles have more beginner than advanced votes), so that list keeps its order with a beginner tag.
  pickleball: {
    "best-power-pickleball-paddles": { order: "votes", trait: "plays_like", option: "power", word: "power", pool: "all" },
    "best-control-pickleball-paddles": { order: "votes", trait: "plays_like", option: "control", word: "control", pool: "all" },
    "best-spin-pickleball-paddles": { order: "votes", trait: "spin", option: "lots", word: "spin", pool: "all" },
    "best-pickleball-paddles-for-tennis-elbow": { order: "votes", trait: "arm", option: "very", word: "arm comfort", pool: "all" },
    "best-pickleball-paddles-for-beginners": { order: "keep", trait: "level", option: "beginner", word: "beginners" },
    "best-pickleball-paddles": { order: "loved", years: "current" },
    "best-elongated-pickleball-paddles": { order: "loved", years: "current" },
    "best-hybrid-pickleball-paddles": { order: "loved", years: "current" },
  },
  // SkinRecs (2026-11-26, onto the pickleball template): each product-type list by most loved, every product listed (no model
  // years); the skin-need lists keep their own order (the skin engine's match) and only their row tag follows the list.
  skin: {
    ...Object.fromEntries(["best-face-moisturizers", "best-face-cleansers", "best-face-sunscreens", "best-skincare-treatments", "best-balms-ointments"]
      .map(slug => [slug, { order: "loved", years: "current" } as ListOrder])),
    "best-skincare-for-sensitive-skin": { order: "keep", trait: "irritation", option: "none", say: "No irritation" },
    ...Object.fromEntries(["dry", "oily"].flatMap(need => [`best-skincare-for-${need}-skin`, ...["moisturizers", "cleansers", "sunscreens", "serums"].map(t => `best-${t}-for-${need}-skin`)]
      .map(slug => [slug, { order: "keep", trait: "skin_type", option: need, word: `${need} skin` } as ListOrder]))),
    ...Object.fromEntries(["moisturizers", "cleansers", "sunscreens", "serums"].map(t => [`best-${t}-for-sensitive-skin`, { order: "keep", trait: "irritation", option: "none", say: "No irritation" } as ListOrder])),
  },
  // SimRacingRecs (v3 rollout 2026-11-21): Best overall by most loved, like padel; the rest keep their order.
  simracing: { "best-sim-racing-gear": { order: "loved" } },
  // LaptopRecs (owner 2026-11-24, as pickleball): each category list by most loved, current generations (its names carry the
  // generation, no model years), each row tagged "Loved by N owners". Battery life and Budget keep their tag-based order.
  laptop: Object.fromEntries(["best-ultrabooks", "best-gaming-laptops", "best-business-laptops", "best-creator-laptops", "best-2-in-1-laptops",
    "best-chromebooks", "best-macbooks"].map(slug => [slug, { order: "loved", years: "current" } as ListOrder])),
  // DiscGolfRecs (wave 2): Best overall by most loved (app/thread/rankings-data.ts orders it so).
  discgolf: { "best-disc-golf-discs": { order: "loved" } },
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
export function lovedOrder(xs: LovedCandidate[], year: number | null, cfg = LOVED_ORDER): string[] {
  const share = (x: LovedCandidate) => { const t = x.loved + x.mixed + x.notForMe; return t ? x.loved / t : 0; };
  const best = new Map<string, LovedCandidate>();
  for (const x of xs) if ((year === null || x.year === year) && x.reviews >= cfg.minReviews) { const b = best.get(x.family); if (!b || x.loved > b.loved) best.set(x.family, x); }
  return [...best.values()].sort((a, b) => b.loved - a.loved || share(b) - share(a) || b.reviews - a.reviews || a.name.localeCompare(b.name))
    .slice(0, cfg.size).map(x => x.id);
}

/** The row tag a list gives each row, from that list's own count (PickleballRecs, owner 2026-11-23):
 *  - "votes": "Most picked for spin · 157 players" where the answer leads the paddle's group with 5+ (the pill rule).
 *  - "keep": "Picked for beginners · 81 players" with 5+ (the answer need not lead).
 *  - "loved": "Loved by 266 players".
 *  Null: no tag (never another trait's). Undefined: the list has no rule here, so the site's usual pill stays. */
export function listPill(o: ListOrder | null, groups: Record<string, Record<string, number>>, loved: number, people = "players"): string | null | undefined {
  if (!o || o.order === "curated") return undefined;
  const n = (k: number) => `${k} ${k === 1 ? people.replace(/s$/, "") : people}`;
  if (o.order === "loved") return loved > 0 ? `Loved by ${n(loved)}` : null;
  const g = groups[o.trait ?? VOTE_ORDER.trait] ?? {}, v = g[o.option ?? ""] ?? 0, word = o.word ?? o.option;
  if (v < 5) return null;
  if (o.order === "keep") return `${o.say ?? `Picked for ${word}`} · ${n(v)}`;
  return Object.entries(g).every(([k, x]) => k === o.option || v > x) ? `Most picked for ${word} · ${n(v)}` : null;
}
