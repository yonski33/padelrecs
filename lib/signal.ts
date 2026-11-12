// The signal score (owner, 2026-11-12): one 0–99 number per product that says how well reviewed it is next to the other
// products in its category, and the order every ranking follows. Pure, so tests can feed it plain objects.
//
// Two parts. How it compares: the ranking's own formula (likedScore: positive share, mixed counting half, × log2(1 +
// reviews)) against the best-reviewed product in the same category, 0–1. And its own ceiling: 100 minus
// NEGATIVE_WEIGHT points per % of negative reviews and MIXED_WEIGHT per % mixed, so even the top product only scores
// high when few people are unhappy with it (owner, 2026-11-12: 13% negative and 25% mixed is about 92, not 99).
// Nothing is estimated: a product needs MIN_SIGNAL_REVIEWS reviews with a verdict, or it has no score.
import { likedScore } from "./top-lists";

/** Below this many reviews with a verdict a product shows no signal (the rankings' usual minimum). */
export const MIN_SIGNAL_REVIEWS = 10;
export const TOP_SIGNAL = 99;
export const NEGATIVE_WEIGHT = 0.4, MIXED_WEIGHT = 0.1;

/** The most a product can score: 100 less points for its negative and mixed shares. */
export const signalCeiling = (positive: number, mixed: number, judged: number) =>
  100 - NEGATIVE_WEIGHT * 100 * (judged - positive - mixed) / judged - MIXED_WEIGHT * 100 * mixed / judged;

export type SignalInput = { id: string; category: string; positive: number; mixed: number; judged: number };
export type Signal = { signal: number; rank: number; of: number; category: string };

/** Every scored product's signal, its place in its category and how many products there have a signal. */
export function signals(products: SignalInput[]): Map<string, Signal> {
  const groups = new Map<string, { id: string; liked: number; judged: number; ceiling: number }[]>();
  for (const p of products) {
    if (p.judged < MIN_SIGNAL_REVIEWS) continue;
    const liked = likedScore((p.positive + p.mixed / 2) / p.judged, p.judged);
    const g = groups.get(p.category) ?? []; groups.set(p.category, g);
    g.push({ id: p.id, liked, judged: p.judged, ceiling: signalCeiling(p.positive, p.mixed, p.judged) });
  }
  const out = new Map<string, Signal>();
  for (const [category, g] of groups) {
    const best = Math.max(...g.map(x => x.liked));
    const scored = g.map(x => ({ ...x, signal: best > 0 ? Math.min(TOP_SIGNAL, Math.max(1, Math.round(x.ceiling * x.liked / best))) : 0 }));
    // The place follows the number shown, so "#1 of 45" is always the highest signal.
    scored.sort((a, b) => b.signal - a.signal || b.liked - a.liked || b.judged - a.judged || a.id.localeCompare(b.id));
    scored.forEach((x, i) => out.set(x.id, { signal: x.signal, rank: i + 1, of: g.length, category }));
  }
  return out;
}
