// The Player score (owner, 2026-11-12; meaning fixed 2026-11-17): one 0–99 number per product that says how happy its owners
// are overall, and the order every ranking follows. Pure, so tests can feed it plain objects.
//
// score = 100 − NEGATIVE_WEIGHT points per % of negative reviews − MIXED_WEIGHT points per % mixed (13% negative and 25% mixed
// is about 86). With few reviews those shares are pulled toward the site's average by PRIOR imaginary reviews, so 16 out of
// 16 positive doesn't read as "no flaws" (owner, 2026-11-12, RunningRecs).
// Review count and popularity never raise or lower the number (owner 2026-11-17: "how happy owners are overall, never review
// volume"; until then a volume term and per-category scaling made the score track review counts, r ≈ 0.9). The count only
// breaks ties, and the pages say when a score rests on few reviews (lib/score-view.ts: "new" under 10, "early" under 20).
// Nothing is estimated: a product needs MIN_SIGNAL_REVIEWS reviews with a verdict, or it has no score. A score the owner set
// by hand (override) wins.
import { MIN_LIST_REVIEWS } from "./top-lists";

/** Below this many reviews with a verdict a product shows no signal: the rankings' floor, so every ranked product has one. */
export const MIN_SIGNAL_REVIEWS = MIN_LIST_REVIEWS;
export const TOP_SIGNAL = 99;
// Owner 2026-11-15 ("lets go with A"): a mixed review costs a bit more, 0.1 → 0.25 of a point per % of mixed reviews, so a
// racket most players are lukewarm about no longer scores like a well-liked one (Nox AT10 18k 2025: 31 / 40 / 23).
export const NEGATIVE_WEIGHT = 0.55, MIXED_WEIGHT = 0.25;
/** How many imaginary average reviews pull a small sample's negative and mixed shares toward the site average. */
export const PRIOR = 10;

/** The highest score a product's own reviews allow: its liked share (positive, plus half of mixed) in points, plus
 *  CAP_ROOM, or only CAP_ROOM_NEGATIVE when more than half its reviews are negative. It only binds for products whose
 *  reviews are mostly unhappy: 70% liked caps at 100, 30% liked at 60, 17% liked and mostly negative at 32. */
export const CAP_ROOM = 30, CAP_ROOM_NEGATIVE = 15;
export const sentimentCap = (p: { positive: number; mixed: number; judged: number }) => {
  if (!p.judged) return TOP_SIGNAL;
  const liked = (p.positive + 0.5 * p.mixed) / p.judged, negative = (p.judged - p.positive - p.mixed) / p.judged;
  return 100 * liked + (negative > 0.5 ? CAP_ROOM_NEGATIVE : CAP_ROOM);
};

/** The most a product can score: 100 less points for its negative and mixed shares (0–1). */
export const signalCeiling = (negativeShare: number, mixedShare: number) =>
  100 - NEGATIVE_WEIGHT * 100 * negativeShare - MIXED_WEIGHT * 100 * mixedShare;

export type SignalInput = { id: string; category: string; positive: number; mixed: number; judged: number; override?: number | null };
/** set: the owner set this score by hand in the admin area. */
export type Signal = { signal: number; rank: number; of: number; category: string; set?: boolean };

/** Every scored product's signal, its place in its category and how many products there have a signal. */
export function signals(products: SignalInput[]): Map<string, Signal> {
  const scored = products.filter(p => p.judged >= MIN_SIGNAL_REVIEWS);
  // Site averages, over every review of a scored product: what a small sample is pulled toward.
  const totals = scored.reduce((t, p) => ({ n: t.n + p.judged, neg: t.neg + (p.judged - p.positive - p.mixed), mix: t.mix + p.mixed }), { n: 0, neg: 0, mix: 0 });
  const avgNeg = totals.n ? totals.neg / totals.n : 0, avgMix = totals.n ? totals.mix / totals.n : 0;
  const happiness = (p: SignalInput) => {
    const negative = p.judged - p.positive - p.mixed;
    return signalCeiling((negative + PRIOR * avgNeg) / (p.judged + PRIOR), (p.mixed + PRIOR * avgMix) / (p.judged + PRIOR));
  };
  const groups = new Map<string, { id: string; judged: number; signal: number; exact: number; set: boolean }[]>();
  for (const p of products) {
    // A score set by hand shows whatever the review count; otherwise a product needs enough reviews.
    if (p.judged < MIN_SIGNAL_REVIEWS && !p.override) continue;
    // A mostly negative product gets a failing number (owner, 2026-11-14: TurboTax Online, 81% negative).
    const exact = p.override ? p.override : Math.min(happiness(p), sentimentCap(p));
    const signal = Math.min(TOP_SIGNAL, Math.max(1, Math.round(exact)));
    const g = groups.get(p.category) ?? []; groups.set(p.category, g);
    g.push({ id: p.id, judged: p.judged, signal, exact, set: !!p.override });
  }
  const out = new Map<string, Signal>();
  for (const [category, g] of groups) {
    // The place follows the number shown, so "#1 of 45" is always the highest signal; on a tie, more reviews go first.
    g.sort((a, b) => b.signal - a.signal || b.judged - a.judged || b.exact - a.exact || a.id.localeCompare(b.id));
    g.forEach((x, i) => out.set(x.id, { signal: x.signal, rank: i + 1, of: g.length, category, ...(x.set ? { set: true } : {}) }));
  }
  return out;
}
