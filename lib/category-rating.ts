// Curated category ratings on PadelRecs, PickleballRecs and SkinRecs ranking pages (owner 2026-11-21). A list in the owner's curated order (or the engine's
// order on a kind-of-player list) showed the overall Player score as its big number, so a 70 sat above an 88. These lists now
// show a category rating instead: "Power rating", "Control rating" and so on, labelled as the site's own pick.
//   - It follows list position on a fixed scale: #1 in 95-97, each place about 1-3 lower, never rising down the list.
//   - Within a place's step, players' own words nudge it: a racket more players call powerful (the "How does it play?" group,
//     the Power score test's variant A, research/padel-power-score-test-2026-11-21.md) and with a higher engine bar sits at
//     the top of its step.
//   - Fixed: no randomness, so the same data gives the same number on every build.
//   - Never in structured data: the real Player score stays the only rating in JSON-LD.
// Pure, so tests feed plain inputs. Padel, pickleball and skin only; other sites and the filter-style lists (Best overall, Best of a
// year, a shape) keep the Player score.
import { ELBOW_SLUG } from "./thread/sites";
import { skinSplits } from "./skin-lists";

export type RatingCategory = {
  /** The big number's label ("Power rating"). */ label: string;
  /** The "How does it play?" group the evidence comes from, and each option's weight (1 = for, 0 = against). */
  trait: string; weights: Record<string, number>;
  /** The engine bar the evidence also reads (1-5): Attack, Control or Arm. */ dots: "power" | "control" | "spin" | "arm" | null;
  /** SkinRecs: the attribute score the evidence comes from instead of a vote group (lib/attr-profile.ts "suits_dry"); its
   *  plus and minus reports are the group. */ attr?: string;
  /** The racket's shape nudges the prior a little (variant A: diamond +0.15, round -0.15 for power). */ shape?: Record<string, number>;
};
/** The ranking page's one line on how ratings work (≤ 105 characters), with the site's name ("PadelRecs"). */
export const ratingHow = (site: string, people = "players") => `Ratings follow the ${site} pick order, set from what ${people} report.`;

const PADEL: Record<string, RatingCategory> = {
  "best-power-padel-rackets": { label: "Power rating", trait: "plays_like", weights: { power: 1, all_round: 0.5, control: 0 }, dots: "power",
    shape: { diamond: 0.15, round: -0.15 } },
  "best-control-padel-rackets": { label: "Control rating", trait: "plays_like", weights: { control: 1, all_round: 0.5, power: 0 }, dots: "control",
    shape: { round: 0.15, diamond: -0.15 } },
  [ELBOW_SLUG]: { label: "Arm comfort rating", trait: "arm", weights: { very: 1, somewhat: 0.5, not_really: 0 }, dots: "arm" },
  "best-padel-rackets-for-beginners": { label: "Beginner rating", trait: "level", weights: { beginner: 1, intermediate: 0.5, advanced: 0 }, dots: null,
    shape: { round: 0.1, diamond: -0.1 } },
};
/** PickleballRecs (owner 2026-11-21, "the same"): its curated power, control and spin lists and its live tennis elbow and
 *  beginner lists. Elongated paddles lean power, standard ones control and forgiveness. */
const PICKLEBALL: Record<string, RatingCategory> = {
  "best-power-pickleball-paddles": { label: "Power rating", trait: "plays_like", weights: { power: 1, all_round: 0.5, control: 0 }, dots: "power",
    shape: { elongated: 0.15, standard: -0.15 } },
  "best-control-pickleball-paddles": { label: "Control rating", trait: "plays_like", weights: { control: 1, all_round: 0.5, power: 0 }, dots: "control",
    shape: { standard: 0.15, elongated: -0.15 } },
  "best-spin-pickleball-paddles": { label: "Spin rating", trait: "spin", weights: { lots: 1, some: 0.5, little: 0 }, dots: "spin" },
  "best-pickleball-paddles-for-tennis-elbow": { label: "Arm comfort rating", trait: "arm", weights: { very: 1, somewhat: 0.5, not_really: 0 }, dots: "arm" },
  "best-pickleball-paddles-for-beginners": { label: "Beginner rating", trait: "level", weights: { beginner: 1, intermediate: 0.5, advanced: 0 }, dots: null,
    shape: { standard: 0.1, elongated: -0.1 } },
};
/** SkinRecs (owner 2026-11-21): the per-type lists for each skin need (lib/skin-lists.ts), rated from how people with that skin
 *  report the product. The need hubs and the plain product-type lists keep the user score. */
const SKIN: Record<string, RatingCategory> = Object.fromEntries(skinSplits().map(x =>
  [x.slug, { label: x.need.rating, trait: "", attr: x.need.attr, weights: { plus: 1, minus: 0 }, dots: null } satisfies RatingCategory]));
const SITES: Record<string, Record<string, RatingCategory>> = { padel: PADEL, pickleball: PICKLEBALL, skin: SKIN };
/** The list's rating category, or null when it keeps the Player score (other sites, filter-style lists). */
export const ratingCategory = (slug: string, nicheId: string): RatingCategory | null => SITES[nicheId]?.[slug] ?? null;

export type RatingInput = {
  /** The group's counts (review prefill or owner override, plus votes), by option. */ group: Record<string, number> | null | undefined;
  /** The engine bar for the category, 1-5. */ dots?: number | null;
  shape?: string | null;
};
const SMOOTH = 8, CAUTION = 1.5;
/** Variant A: the weighted share smoothed toward a prior, then held lower when few players have said anything. */
export function cautiousShare(cat: RatingCategory, x: RatingInput, prior: number): number | null {
  const g = x.group ?? {}, n = Object.values(g).reduce((a, b) => a + b, 0);
  if (!n) return null;
  const e = Object.entries(g).reduce((s, [k, v]) => s + v * (cat.weights[k] ?? 0), 0);
  // A shape word anywhere in the shape ("Elongated", "Hybrid elongated") counts; padel's are one word.
  const sh = x.shape?.toLowerCase() ?? "", lean = Object.entries(cat.shape ?? {}).find(([k]) => new RegExp(`\\b${k}\\b`).test(sh))?.[1] ?? 0;
  const p = Math.min(0.95, Math.max(0.05, prior + lean));
  const v = (e + SMOOTH * p) / (n + SMOOTH);
  return v - CAUTION * Math.sqrt(v * (1 - v) / (n + 1));
}
/** The prior: the weighted share over every racket given (the catalogue), 0.5 when nobody said anything. */
export function priorShare(cat: RatingCategory, groups: (Record<string, number> | null | undefined)[]): number {
  let e = 0, n = 0;
  for (const g of groups) for (const [k, v] of Object.entries(g ?? {})) { n += v; e += v * (cat.weights[k] ?? 0); }
  return n ? e / n : 0.5;
}

/** The top of each place's step: #1 97, then 1.7 lower per place; the step is 2 points deep. */
const TOP = 97, STEP = 1.7, DEPTH = 2, MIN_DROP = 1, MAX_DROP = 3, FLOOR = 60;
/** The ratings for a list in its shown order. Each racket's evidence (0-1 within the list, 0.5 when unknown) picks its spot in
 *  its place's step; the result never rises down the list and drops 1-3 a place. */
export function categoryRatings(cat: RatingCategory, list: RatingInput[], prior: number): number[] {
  const shares = list.map(x => cautiousShare(cat, x, prior));
  const known = shares.filter((s): s is number => s != null), lo = Math.min(...known), hi = Math.max(...known);
  const norm = (s: number | null) => s == null ? null : hi > lo ? (s - lo) / (hi - lo) : 0.5;
  const out: number[] = [];
  list.forEach((x, i) => {
    const s = norm(shares[i]), d = x.dots != null ? Math.min(1, Math.max(0, (x.dots - 1) / 4)) : null;
    // Players' words lead (3 parts), the engine bar adds 1; either alone counts in full; neither puts it mid-step.
    const nudge = s != null && d != null ? (3 * s + d) / 4 : s ?? d ?? 0.5;
    let r = Math.round(TOP - STEP * i - DEPTH + DEPTH * nudge);
    if (i > 0) r = Math.min(out[i - 1] - MIN_DROP, Math.max(out[i - 1] - MAX_DROP, r));
    out.push(Math.max(FLOOR, Math.min(TOP, r)));
  });
  return out;
}

/** The vote groups a site's category rankings are built from, in list order, each once ("plays_like" for Power and Control,
 *  then "spin", "arm", "level" on PickleballRecs). The creator page's vote section asks these (lib/thread/creator-votes.ts).
 *  Empty for a site without category ratings, and SkinRecs' attribute-based lists have no vote group. */
export const rankingTraits = (nicheId: string): string[] =>
  [...new Set(Object.values(SITES[nicheId] ?? {}).map(c => c.trait).filter(Boolean))];
