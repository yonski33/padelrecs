// "Top picks by players" on the Thread home (owner mock 2026-11-19): six lists of three, the first six of PICK_CATS that qualify. Pure, so tests feed plain rows.
//   - A pick's count is what players said and voted for that trait on the racket page ("How does it play?": the review
//     prefill, or the owner's override, plus real votes).
//   - Ranked by share: that count divided by the racket's total for the same group, from the same sources (owner 2026-11-19:
//     Plays like Power ÷ everything said and voted on Plays like), so shares stay at or under 100% and a well-reviewed racket
//     doesn't win on volume alone. The group needs 10+ opinions, and the pick 5+ backers (the copy rule); the grey number is
//     the raw count.
//   - Current models only, one version per model.
//   - No racket is #1 in more than 2 lists: it keeps its 2 strongest, and in the others the runner-up moves up.

/** `trait`/`choice` is a "How does it play?" option; `score` instead counts the players behind a review trait score
 *  (lib/trait-score.ts, the old "Best in defence" board's source), for lists without a vote group. */
import { niche } from "../niche";
export type PickCat = { key: string; title: string; trait: string; choice: string; href: string; score?: string };
/** The lists in order (owner 2026-11-19): the first six that qualify show, so Best for beginners and Softest feel step in
 *  on their own once enough players back them, or when one of the six falls short. Each has a quiet "See all ›" link. */
const PADEL_CATS: PickCat[] = [
  { key: "sweet", title: "Biggest sweet spot", trait: "sweet_spot", choice: "big", href: "/rankings/best-padel-rackets" },
  { key: "arm", title: "Most arm friendly", trait: "arm", choice: "very", href: "/rankings/best-padel-rackets-for-sore-arms" },
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
/** PickleballRecs' lists, same rules (plans/PICKLEBALL-THREAD-PLAN.md): Most spin takes padel's Best at the net (no
 *  Maneuverable group here), then the waiting lists. */
const PICKLEBALL_CATS: PickCat[] = [
  { key: "sweet", title: "Biggest sweet spot", trait: "sweet_spot", choice: "big", href: "/rankings/best-pickleball-paddles" },
  { key: "arm", title: "Most arm friendly", trait: "arm", choice: "very", href: "/rankings/best-pickleball-paddles-for-tennis-elbow" },
  { key: "control", title: "Most control", trait: "plays_like", choice: "control", href: "/rankings/best-control-pickleball-paddles" },
  { key: "power", title: "Most power", trait: "plays_like", choice: "power", href: "/rankings/best-power-pickleball-paddles" },
  { key: "spin", title: "Most spin", trait: "spin", choice: "lots", href: "/rankings/best-spin-pickleball-paddles" },
  { key: "intermediate", title: "Best for intermediate", trait: "level", choice: "intermediate", href: "/paddles?level=Intermediate" },
  { key: "beginner", title: "Best for beginners", trait: "level", choice: "beginner", href: "/rankings/best-pickleball-paddles-for-beginners" },
  { key: "soft", title: "Softest feel", trait: "feel", choice: "soft", href: "/paddles?feel=Soft" },
  { key: "pop", title: "Most pop", trait: "pop", choice: "high", href: "/rankings/best-power-pickleball-paddles" },
];
export const pickCatsFor = (nicheId: string) => nicheId === "pickleball" ? PICKLEBALL_CATS : PADEL_CATS;
/** The running site's lists. */
export const PICK_CATS = pickCatsFor(niche.id);
/** How many lists the grid shows (3 columns × 2 rows). */
export const SHOWN = 6;
export const MIN_OPINIONS = 10, MIN_BACKERS = 5, PER_LIST = 3, MAX_FIRSTS = 2;

/** `counts` and `totals` are per list key: the pick's backers, and everything said and voted on that list's group. */
export type PickRacket = { id: string; name: string; family: string; counts: Record<string, number>; totals: Record<string, number> };
export type PickRow = { id: string; name: string; n: number; share: number };
export type PickList = { cat: PickCat; rows: PickRow[] };

export function topPicks(rackets: PickRacket[], cats: PickCat[] = PICK_CATS): PickList[] {
  // Every qualified racket per list, best share first (ties: more backers), one version per model.
  const ranked = cats.map(cat => {
    const seen = new Set<string>();
    const all = rackets.filter(r => (r.totals[cat.key] ?? 0) >= MIN_OPINIONS && (r.counts[cat.key] ?? 0) >= MIN_BACKERS)
      .map(r => ({ id: r.id, name: r.name, family: r.family, n: r.counts[cat.key], share: r.counts[cat.key] / Math.max(r.totals[cat.key], r.counts[cat.key]) }))
      .sort((a, b) => b.share - a.share || b.n - a.n || a.name.localeCompare(b.name))
      .filter(r => !seen.has(r.family) && !!seen.add(r.family));
    return { cat, all };
  }).filter(l => l.all.length >= PER_LIST).slice(0, SHOWN); // the first six that qualify; spreading only counts those
  // Spread the #1 spots: a racket first in more than MAX_FIRSTS lists keeps its strongest ones (by share); elsewhere it
  // swaps with the runner-up. Repeats until no racket holds too many firsts (each swap only moves a racket down).
  for (let guard = 0; guard < 20; guard++) {
    const firsts = new Map<string, number[]>();
    ranked.forEach((l, i) => { const top = l.all[0]; if (top) firsts.set(top.id, [...(firsts.get(top.id) ?? []), i]); });
    const over = [...firsts].find(([, idx]) => idx.length > MAX_FIRSTS);
    if (!over) break;
    const [, idx] = over;
    const keep = new Set([...idx].sort((a, b) => ranked[b].all[0].share - ranked[a].all[0].share).slice(0, MAX_FIRSTS));
    for (const i of idx) if (!keep.has(i) && ranked[i].all.length > 1) { const [a, b, ...rest] = ranked[i].all; ranked[i].all = [b, a, ...rest]; }
    if (idx.every(i => keep.has(i) || ranked[i].all.length < 2)) break;
  }
  return ranked.map(({ cat, all }) => ({ cat, rows: all.slice(0, PER_LIST).map(({ id, name, n, share }) => ({ id, name, n, share })) }));
}
