// "Other rackets to consider" and "Similar products" (owner 2026-11-17): each card leads with the main way it beats this one,
// plus at most one thing you give up, and no two cards in a section say the same thing. A racket with no real gain over
// this one is passed over for the next. An arm-comfort gain only counts when that racket is itself kind to the arm (4+ dots).

export type Cand = { id: string; dots: number[] };
export type Edge = { id: string; gain: number; give: number | null };

/** Up to `n` cards from `cands` (best first), each with a distinct gain trait and, where there is one, a distinct give-up trait
 *  (trait indexes into `keys`). */
export function distinctEdges(me: number[], cands: Cand[], keys: string[], n = 3, armKey = "arm",
  /** A site's own check that a gain is real (DiscGolfRecs: "better in wind" needs more fade or less turn). */ gainOk?: (id: string, key: string) => boolean,
  /** v11c (owner 2026-11-18, lib/claim-guard.ts): whether "more" (dir 1) or "less" (dir -1) of trait `i` can be said of `id`
   *  beside this one (a dot gap from enough reports, no spec against it); a blocked trait gives way to the next that holds. */
  allow?: (id: string, i: number, dir: 1 | -1) => boolean,
  /** Only cards with both lines, a gain and a give-up (owner 2026-11-18: no blank cards); a racket without both is passed over. */
  needGive = false,
  /** A gap from other evidence than the dots (disc golf flight numbers), signed as `cand − me`, used where given. */
  gapOf?: (id: string, i: number) => number | undefined,
  /** A gain and give-up that may not share a card (two readings of one fact). */ apart?: (gain: number, give: number) => boolean): Edge[] {
  const out: Edge[] = [], gains = new Set<number>(), gives = new Set<number>();
  for (const c of cands) {
    if (out.length >= n) break;
    const gaps = keys.map((k, i) => ({ i, k, g: gapOf?.(c.id, i) ?? (c.dots[i] && me[i] ? c.dots[i] - me[i] : 0) }));
    const gain = gaps.filter(x => x.g > 0 && !gains.has(x.i) && (x.k !== armKey || c.dots[x.i] >= 4) && (!gainOk || gainOk(c.id, x.k)) && (!allow || allow(c.id, x.i, 1)))
      .sort((a, b) => b.g - a.g || a.i - b.i)[0];
    if (!gain) continue;
    const give = gaps.filter(x => x.g < 0 && !gives.has(x.i) && (!allow || allow(c.id, x.i, -1)) && (!apart || !apart(gain.i, x.i))).sort((a, b) => a.g - b.g || a.i - b.i)[0];
    if (needGive && !give) continue;
    gains.add(gain.i); if (give) gives.add(give.i);
    out.push({ id: c.id, gain: gain.i, give: give ? give.i : null });
  }
  return out;
}
