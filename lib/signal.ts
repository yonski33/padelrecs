// The signal score (owner, 2026-11-12): one 0–99 number per product that says how well reviewed it is next to the other
// products in its category, and the order every ranking follows. Pure, so tests can feed it plain objects.
//
// It is the ranking's own formula (likedScore: positive share, mixed counting half, × log2(1 + reviews)), shown against
// the best-reviewed product in the same category: that product scores 99, one with half its liked score about 50.
// Nothing is estimated: a product needs MIN_SIGNAL_REVIEWS reviews with a verdict, or it has no score.
import { likedScore } from "./top-lists";

/** Below this many reviews with a verdict a product shows no signal (the rankings' usual minimum). */
export const MIN_SIGNAL_REVIEWS = 10;
export const TOP_SIGNAL = 99;

export type SignalInput = { id: string; category: string; positive: number; mixed: number; judged: number };
export type Signal = { signal: number; rank: number; of: number; category: string };

/** Every scored product's signal, its place in its category and how many products there have a signal. */
export function signals(products: SignalInput[]): Map<string, Signal> {
  const groups = new Map<string, { id: string; liked: number; judged: number }[]>();
  for (const p of products) {
    if (p.judged < MIN_SIGNAL_REVIEWS) continue;
    const liked = likedScore((p.positive + p.mixed / 2) / p.judged, p.judged);
    const g = groups.get(p.category) ?? []; groups.set(p.category, g);
    g.push({ id: p.id, liked, judged: p.judged });
  }
  const out = new Map<string, Signal>();
  for (const [category, g] of groups) {
    g.sort((a, b) => b.liked - a.liked || b.judged - a.judged || a.id.localeCompare(b.id));
    const best = g[0].liked;
    g.forEach((x, i) => out.set(x.id, { signal: best > 0 ? Math.max(1, Math.round(TOP_SIGNAL * x.liked / best)) : 0, rank: i + 1, of: g.length, category }));
  }
  return out;
}
