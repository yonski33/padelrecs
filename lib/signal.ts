// The signal score (owner, 2026-11-12): one 0–99 number per product that says how well reviewed it is, and the order
// every ranking follows. Pure, so tests can feed it plain objects.
//
// signal = ceiling × √volume
// - ceiling: 100 minus NEGATIVE_WEIGHT points per % of negative reviews and MIXED_WEIGHT per % mixed (owner: 13% negative
//   and 25% mixed is about 88, not 99). With few reviews those shares are pulled toward the site's average by PRIOR
//   imaginary reviews, so 16 out of 16 positive doesn't read as "no flaws" (owner, 2026-11-12, RunningRecs).
// - volume: log2(1 + reviews) against log2(1 + the site's well-reviewed count, its VOLUME_PERCENTILE), capped at 1. It is
//   measured across the whole site, not within a category, so a thinly reviewed product can't top a list that mixes
//   categories (a trail shoe with 16 reviews above road shoes with 160). The square root keeps the steps gradual.
// Nothing is estimated: a product needs MIN_SIGNAL_REVIEWS reviews with a verdict, or it has no score. A score the owner
// set by hand (override) wins.
import { MIN_LIST_REVIEWS } from "./top-lists";

/** Below this many reviews with a verdict a product shows no signal: the rankings' floor, so every ranked product has one. */
export const MIN_SIGNAL_REVIEWS = MIN_LIST_REVIEWS;
export const TOP_SIGNAL = 99;
export const NEGATIVE_WEIGHT = 0.55, MIXED_WEIGHT = 0.2;
/** How many imaginary average reviews pull a small sample's negative and mixed shares toward the site average. */
export const PRIOR = 10;
/** The review count that counts as fully reviewed: this share of the site's scored products have fewer. */
export const VOLUME_PERCENTILE = 0.9;

/** The most a product can score: 100 less points for its negative and mixed shares (0–1). */
export const signalCeiling = (negativeShare: number, mixedShare: number) =>
  100 - NEGATIVE_WEIGHT * 100 * negativeShare - MIXED_WEIGHT * 100 * mixedShare;

export type SignalInput = { id: string; category: string; positive: number; mixed: number; judged: number; override?: number | null };
/** set: the owner set this score by hand in the admin area. */
export type Signal = { signal: number; rank: number; of: number; category: string; set?: boolean };

const percentile = (sorted: number[], p: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))] : 0;

/** Every scored product's signal, its place in its category and how many products there have a signal. */
export function signals(products: SignalInput[]): Map<string, Signal> {
  const scored = products.filter(p => p.judged >= MIN_SIGNAL_REVIEWS);
  // Site averages, over every review of a scored product: what a small sample is pulled toward.
  const totals = scored.reduce((t, p) => ({ n: t.n + p.judged, neg: t.neg + (p.judged - p.positive - p.mixed), mix: t.mix + p.mixed }), { n: 0, neg: 0, mix: 0 });
  const avgNeg = totals.n ? totals.neg / totals.n : 0, avgMix = totals.n ? totals.mix / totals.n : 0;
  const reference = Math.max(MIN_SIGNAL_REVIEWS, percentile(scored.map(p => p.judged).sort((a, b) => a - b), VOLUME_PERCENTILE));
  const computed = (p: SignalInput) => {
    const negative = p.judged - p.positive - p.mixed;
    const neg = (negative + PRIOR * avgNeg) / (p.judged + PRIOR), mix = (p.mixed + PRIOR * avgMix) / (p.judged + PRIOR);
    const volume = Math.min(1, Math.log2(1 + p.judged) / Math.log2(1 + reference));
    return Math.round(signalCeiling(neg, mix) * Math.sqrt(volume));
  };
  const groups = new Map<string, { id: string; judged: number; signal: number; set: boolean }[]>();
  for (const p of products) {
    // A score set by hand shows whatever the review count; otherwise a product needs enough reviews.
    if (p.judged < MIN_SIGNAL_REVIEWS && !p.override) continue;
    const signal = Math.min(TOP_SIGNAL, Math.max(1, p.override ? Math.round(p.override) : computed(p)));
    const g = groups.get(p.category) ?? []; groups.set(p.category, g);
    g.push({ id: p.id, judged: p.judged, signal, set: !!p.override });
  }
  const out = new Map<string, Signal>();
  for (const [category, g] of groups) {
    // The place follows the number shown, so "#1 of 45" is always the highest signal.
    g.sort((a, b) => b.signal - a.signal || b.judged - a.judged || a.id.localeCompare(b.id));
    g.forEach((x, i) => out.set(x.id, { signal: x.signal, rank: i + 1, of: g.length, category, ...(x.set ? { set: true } : {}) }));
  }
  return out;
}
