// "Top picks by players" on the Thread home (owner mock 2026-11-19): six lists of three. Pure, so tests feed plain rows.
//   - A pick's count is what players said and voted for that trait on the racket page ("How does it play?": the review
//     prefill, or the owner's override, plus real votes).
//   - Ranked by share: that count divided by the racket's opinions, so a well-reviewed racket doesn't win on volume alone. A
//     racket needs 10+ opinions to qualify, and 5+ backers for the claim (the copy rule); the grey number is the raw count.
//   - Current models only, one version per model.
//   - No racket is #1 in more than 2 lists: it keeps its 2 strongest, and in the others the runner-up moves up.

export type PickCat = { key: string; title: string; trait: string; choice: string; href: string };
/** The mock's six lists, each from one "How does it play?" option, with a quiet "See all ›" link. */
export const PICK_CATS: PickCat[] = [
  { key: "sweet", title: "Biggest sweet spot", trait: "sweet_spot", choice: "big", href: "/rankings/best-padel-rackets" },
  { key: "arm", title: "Most arm friendly", trait: "arm", choice: "very", href: "/rankings/best-padel-rackets-for-sore-arms" },
  { key: "beginner", title: "Best for beginners", trait: "level", choice: "beginner", href: "/rackets?level=Beginner" },
  { key: "power", title: "Most power", trait: "plays_like", choice: "power", href: "/rankings/best-power-padel-rackets" },
  { key: "net", title: "Best at the net", trait: "maneuver", choice: "very", href: "/rankings/best-control-padel-rackets" },
  { key: "soft", title: "Softest feel", trait: "feel", choice: "soft", href: "/rackets?feel=Soft" },
];
export const MIN_OPINIONS = 10, MIN_BACKERS = 5, PER_LIST = 3, MAX_FIRSTS = 2;

export type PickRacket = { id: string; name: string; family: string; opinions: number; counts: Record<string, number> };
export type PickRow = { id: string; name: string; n: number; share: number };
export type PickList = { cat: PickCat; rows: PickRow[] };

export function topPicks(rackets: PickRacket[], cats: PickCat[] = PICK_CATS): PickList[] {
  // Every qualified racket per list, best share first (ties: more backers), one version per model.
  const ranked = cats.map(cat => {
    const seen = new Set<string>();
    const all = rackets.filter(r => r.opinions >= MIN_OPINIONS && (r.counts[cat.key] ?? 0) >= MIN_BACKERS)
      .map(r => ({ id: r.id, name: r.name, family: r.family, n: r.counts[cat.key], share: r.counts[cat.key] / r.opinions }))
      .sort((a, b) => b.share - a.share || b.n - a.n || a.name.localeCompare(b.name))
      .filter(r => !seen.has(r.family) && !!seen.add(r.family));
    return { cat, all };
  });
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
  return ranked.map(({ cat, all }) => ({ cat, rows: all.slice(0, PER_LIST).map(({ id, name, n, share }) => ({ id, name, n, share })) }))
    .filter(l => l.rows.length === PER_LIST);
}
