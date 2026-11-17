// One verdict scale for every match pill and headline on the racket page (owner 2026-11-17: never "Decent fit" beside
// "Probably not"): the word and the headline come from the same thresholds.
export const FIT_MIN = 60;
export type FitStep = { word: string; head: string; fits: boolean };
export function fitStep(pct: number): FitStep {
  return pct >= 85 ? { word: "Strong fit", head: "Yes, a strong option.", fits: true }
    : pct >= 70 ? { word: "Good fit", head: "A good match for you.", fits: true }
    : pct >= FIT_MIN ? { word: "Worth a look", head: "Worth a look.", fits: true }
    : { word: "Probably not", head: "Probably not for you.", fits: false };
}
/** "Other rackets for your game": rackets that fit the picks (FIT_MIN+), never this one, best match first, at most `n`. */
export function fittingRows<T extends { id: string; pct: number | null }>(rows: T[], exclude: string, has: (id: string) => boolean, n = 3): T[] {
  return rows.filter(r => r.id !== exclude && has(r.id) && (r.pct ?? 0) >= FIT_MIN).sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0)).slice(0, n);
}
