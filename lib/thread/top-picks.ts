// "Top picks by players" on the Thread home (owner mock 2026-11-19): six lists of three, the first six of PICK_CATS that qualify. Pure, so tests feed plain rows.
//   - A pick's count is what players said and voted for that trait on the racket page ("How does it play?": the review
//     prefill, or the owner's override, plus real votes).
//   - Ranked by that count, high to low (owner 2026-11-19: ML10 Pro Cup's 10 above Metalbone CTRL's 25 read wrong), so the
//     grey number reads high to low. Ties go to the higher share: the count over the racket's total for the same group, from
//     the same sources (Plays like Power ÷ everything said and voted on Plays like). The group needs 10+ opinions, and the
//     pick 5+ backers (the copy rule).
//   - Current models only, one version per model.
//   - No racket is #1 in more than 2 lists: it keeps its 2 biggest counts and leaves the others, where the runner-up moves up.
//     Leaving (not dropping to #2) keeps every list reading high to low; a list that would fall under 3 keeps it at #2.

/** `trait`/`choice` is a "How does it play?" option; `score` instead counts the players behind a review trait score
 *  (lib/trait-score.ts, the old "Best in defence" board's source), for lists without a vote group. */
import { ELBOW_SLUG } from "./look";

export type PickCat = { key: string; title: string; trait: string; choice: string; href: string; score?: string };
/** The lists in order (owner 2026-11-19): the first six that qualify show, so Best for beginners and Softest feel step in
 *  on their own once enough players back them, or when one of the six falls short. Each has a quiet "See all ›" link. */
export const PICK_CATS: PickCat[] = [
  { key: "sweet", title: "Biggest sweet spot", trait: "sweet_spot", choice: "big", href: "/rankings/best-padel-rackets" },
  { key: "arm", title: "Most arm friendly", trait: "arm", choice: "very", href: `/rankings/${ELBOW_SLUG}` },
  { key: "control", title: "Most control", trait: "plays_like", choice: "control", href: "/rankings/best-control-padel-rackets" },
  { key: "power", title: "Most power", trait: "plays_like", choice: "power", href: "/rankings/best-power-padel-rackets" },
  { key: "net", title: "Best at the net", trait: "maneuver", choice: "very", href: "/rankings/best-control-padel-rackets" },
  { key: "intermediate", title: "Best for intermediate", trait: "level", choice: "intermediate", href: "/rackets?level=Intermediate" },
  // Waiting lists, in order (owner 2026-11-19): each takes a place as soon as it qualifies and one above doesn't. Most
  // maneuverable is left out: it's the same data as Best at the net (Maneuverable Very).
  { key: "defence", title: "Best in defence", trait: "", choice: "", score: "defence", href: "/rankings/best-padel-rackets" },
  { key: "trampoline", title: "Low trampoline", trait: "trampoline", choice: "low", href: "/rankings/best-control-padel-rackets" },
  { key: "beginner", title: "Best for beginners", trait: "level", choice: "beginner", href: "/rackets?level=Beginner" },
  { key: "soft", title: "Softest feel", trait: "feel", choice: "soft", href: "/rackets?feel=Soft" },
];
/** How many lists the grid shows (3 columns × 2 rows). */
export const SHOWN = 6;
export const MIN_OPINIONS = 10, MIN_BACKERS = 5, PER_LIST = 3, MAX_FIRSTS = 2;

/** `counts` and `totals` are per list key: the pick's backers, and everything said and voted on that list's group. */
export type PickRacket = { id: string; name: string; family: string; counts: Record<string, number>; totals: Record<string, number> };
export type PickRow = { id: string; name: string; n: number; share: number };
export type PickList = { cat: PickCat; rows: PickRow[] };

export function topPicks(rackets: PickRacket[], cats: PickCat[] = PICK_CATS): PickList[] {
  // Every qualified racket per list, most backers first (ties: the higher share), one version per model.
  const ranked = cats.map(cat => {
    const seen = new Set<string>();
    const all = rackets.filter(r => (r.totals[cat.key] ?? 0) >= MIN_OPINIONS && (r.counts[cat.key] ?? 0) >= MIN_BACKERS)
      .map(r => ({ id: r.id, name: r.name, family: r.family, n: r.counts[cat.key], share: r.counts[cat.key] / Math.max(r.totals[cat.key], r.counts[cat.key]) }))
      .sort((a, b) => b.n - a.n || b.share - a.share || a.name.localeCompare(b.name))
      .filter(r => !seen.has(r.family) && !!seen.add(r.family));
    return { cat, all };
  }).filter(l => l.all.length >= PER_LIST).slice(0, SHOWN); // the first six that qualify; spreading only counts those
  // Spread the #1 spots: a racket first in more than MAX_FIRSTS lists keeps its biggest ones (by count) and leaves the
  // others (or, where that would leave fewer than 3, swaps with the runner-up). Repeats until no racket holds too many.
  for (let guard = 0; guard < 20; guard++) {
    const firsts = new Map<string, number[]>();
    ranked.forEach((l, i) => { const top = l.all[0]; if (top) firsts.set(top.id, [...(firsts.get(top.id) ?? []), i]); });
    const over = [...firsts].find(([, idx]) => idx.length > MAX_FIRSTS);
    if (!over) break;
    const [, idx] = over;
    const keep = new Set([...idx].sort((a, b) => ranked[b].all[0].n - ranked[a].all[0].n || ranked[b].all[0].share - ranked[a].all[0].share).slice(0, MAX_FIRSTS));
    for (const i of idx) if (!keep.has(i) && ranked[i].all.length > 1) {
      const [a, b, ...rest] = ranked[i].all;
      ranked[i].all = ranked[i].all.length > PER_LIST ? [b, ...rest] : [b, a, ...rest];
    }
    if (idx.every(i => keep.has(i) || ranked[i].all.length < 2)) break;
  }
  return ranked.map(({ cat, all }) => ({ cat, rows: all.slice(0, PER_LIST).map(({ id, name, n, share }) => ({ id, name, n, share })) }));
}
