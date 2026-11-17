// "Other rackets to consider" and "Similar products" (owner 2026-11-17): each card leads with the main way it beats this one,
// plus at most one thing you give up, and no two cards in a section say the same thing. A racket with no real gain over
// this one is passed over for the next. An arm-comfort gain only counts when that racket is itself kind to the arm (4+ dots).

export type Cand = { id: string; dots: number[] };
export type Edge = { id: string; gain: number; give: number | null };

/** Up to `n` cards from `cands` (best first), each with a distinct gain trait and, where there is one, a distinct give-up trait
 *  (trait indexes into `keys`). */
export function distinctEdges(me: number[], cands: Cand[], keys: string[], n = 3, armKey = "arm"): Edge[] {
  const out: Edge[] = [], gains = new Set<number>(), gives = new Set<number>();
  for (const c of cands) {
    if (out.length >= n) break;
    const gaps = keys.map((k, i) => ({ i, k, g: c.dots[i] && me[i] ? c.dots[i] - me[i] : 0 }));
    const gain = gaps.filter(x => x.g > 0 && !gains.has(x.i) && (x.k !== armKey || c.dots[x.i] >= 4)).sort((a, b) => b.g - a.g || a.i - b.i)[0];
    if (!gain) continue;
    const give = gaps.filter(x => x.g < 0 && !gives.has(x.i)).sort((a, b) => a.g - b.g || a.i - b.i)[0];
    gains.add(gain.i); if (give) gives.add(give.i);
    out.push({ id: c.id, gain: gain.i, give: give ? give.i : null });
  }
  return out;
}
