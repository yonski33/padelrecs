// One verdict scale for every match pill and headline on the racket page (owner 2026-11-17: never "Decent fit" beside
// "Probably not"): the word and the headline come from the same thresholds.
// The bands are the engine's own cut-offs (lib/niche fit.engine cuts: good 75, maybe 55), the same as the fit check's word
// and the method page (owner audit 2026-11-17: one label set everywhere).
export const FIT_MIN = 60, STRONG = 75, MAYBE = 55;
export type FitStep = { word: string; head: string; fits: boolean };
export function fitStep(pct: number): FitStep {
  return pct >= STRONG ? { word: "Strong fit", head: "Yes, a strong option.", fits: true }
    : pct >= MAYBE ? { word: "Worth a look", head: "Worth a look.", fits: true }
    : { word: "Probably not", head: "Probably not for you.", fits: false };
}
/** "Other rackets for your game": rackets that fit the picks (FIT_MIN+), never this one, best match first, at most `n`. */
export function fittingRows<T extends { id: string; pct: number | null }>(rows: T[], exclude: string, has: (id: string) => boolean, n = 3): T[] {
  return rows.filter(r => r.id !== exclude && has(r.id) && (r.pct ?? 0) >= FIT_MIN).sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0)).slice(0, n);
}
