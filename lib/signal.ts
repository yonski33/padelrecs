// The signal score (owner, 2026-11-12): one 0–99 number per product that says how well reviewed it is, and the order
// every ranking follows. Pure, so tests can feed it plain objects.
//
// signal = ceiling × volume^VOLUME_POWER, then scaled within the category (below)
// - ceiling: 100 minus NEGATIVE_WEIGHT points per % of negative reviews and MIXED_WEIGHT per % mixed (owner: 13% negative
//   and 25% mixed is about 88, not 99). With few reviews those shares are pulled toward the site's average by PRIOR
//   imaginary reviews, so 16 out of 16 positive doesn't read as "no flaws" (owner, 2026-11-12, RunningRecs).
// - volume: log2(1 + liked) against log2(1 + the category's most-liked product), where liked = positive reviews plus
//   MIXED_CREDIT per mixed one, raised to VOLUME_POWER (owner, 2026-11-13: more positive reviews should usually rank
//   higher, and mixed reviews cost less; MIXED_WEIGHT went from 0.2 to 0.1).
// Nothing is estimated: a product needs MIN_SIGNAL_REVIEWS reviews with a verdict, or it has no score. A score the owner
// set by hand (override) wins.
//
// Scaled within each category (owner, 2026-11-13): the number says how a product stands against the others of its kind,
// so a category's best scores near the top (CATEGORY_TOP, a few points lower for a category whose best is weaker than the
// site's best) and the rest step down by how far behind they are (STRETCH points per point of the raw score above), plus
// RANK_STEP points per place over the first RANK_STEPS places so near-ties at the top still read 87, 86, 84.
import { MIN_LIST_REVIEWS } from "./top-lists";

/** Below this many reviews with a verdict a product shows no signal: the rankings' floor, so every ranked product has one. */
export const MIN_SIGNAL_REVIEWS = MIN_LIST_REVIEWS;
export const TOP_SIGNAL = 99;
export const NEGATIVE_WEIGHT = 0.55, MIXED_WEIGHT = 0.1;
/** How much a mixed review counts toward the liked count, and how strongly that count weighs (1 = in step with the ceiling). */
export const MIXED_CREDIT = 0.3, VOLUME_POWER = 0.9;
/** How many imaginary average reviews pull a small sample's negative and mixed shares toward the site average. */
export const PRIOR = 10;
/** The review count that counts as fully reviewed: this share of the site's scored products have fewer. */
export const VOLUME_PERCENTILE = 0.9;
/** A category's best product scores CATEGORY_TOP when it is the site's best, down to CATEGORY_TOP - CATEGORY_RANGE for the weakest category leader. */
export const CATEGORY_TOP = 96, CATEGORY_RANGE = 4;
/** Category leaders also step down by LEADER_STEP per place among the site's leaders, so the home list's top isn't a row of 95s. */
export const LEADER_STEP = 0.8;
export const STRETCH = 0.6, RANK_STEP = 0.5, RANK_STEPS = 15;

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

const percentile = (sorted: number[], p: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))] : 0;

/** Every scored product's signal, its place in its category and how many products there have a signal. */
export function signals(products: SignalInput[]): Map<string, Signal> {
  const scored = products.filter(p => p.judged >= MIN_SIGNAL_REVIEWS);
  // Site averages, over every review of a scored product: what a small sample is pulled toward.
  const totals = scored.reduce((t, p) => ({ n: t.n + p.judged, neg: t.neg + (p.judged - p.positive - p.mixed), mix: t.mix + p.mixed }), { n: 0, neg: 0, mix: 0 });
  const avgNeg = totals.n ? totals.neg / totals.n : 0, avgMix = totals.n ? totals.mix / totals.n : 0;
  const reference = Math.max(MIN_SIGNAL_REVIEWS, percentile(scored.map(p => p.judged).sort((a, b) => a - b), VOLUME_PERCENTILE));
  // Positive reviews carry the volume (owner, 2026-11-13): a product with more people who liked it usually ranks above one
  // with fewer, so the count is measured against the category's most-liked product, with no cap. Mixed reviews count for
  // MIXED_CREDIT of a positive one.
  const liked = (p: SignalInput) => p.positive + MIXED_CREDIT * p.mixed;
  const mostLiked = new Map<string, number>();
  for (const p of scored) if (!p.override) mostLiked.set(p.category, Math.max(mostLiked.get(p.category) ?? 0, liked(p)));
  const computed = (p: SignalInput) => {
    const negative = p.judged - p.positive - p.mixed;
    const neg = (negative + PRIOR * avgNeg) / (p.judged + PRIOR), mix = (p.mixed + PRIOR * avgMix) / (p.judged + PRIOR);
    const top = Math.max(reference / 2, mostLiked.get(p.category) ?? 0);
    const volume = Math.min(1, Math.log2(1 + liked(p)) / Math.log2(1 + top));
    return signalCeiling(neg, mix) * volume ** VOLUME_POWER;
  };
  // The raw score of every worked-out product, by category, best first.
  const raws = new Map<string, { id: string; judged: number; raw: number }[]>();
  for (const p of products) {
    if (p.override || p.judged < MIN_SIGNAL_REVIEWS) continue;
    const g = raws.get(p.category) ?? []; raws.set(p.category, g);
    g.push({ id: p.id, judged: p.judged, raw: computed(p) });
  }
  const leaders = [...raws.values()].map(g => Math.max(...g.map(x => x.raw)));
  const best = Math.max(...leaders), weakest = Math.min(...leaders);
  const scaled = new Map<string, number>();
  for (const g of raws.values()) g.sort((a, b) => b.raw - a.raw || b.judged - a.judged || a.id.localeCompare(b.id));
  const order = [...raws.values()].sort((a, b) => b[0].raw - a[0].raw || b[0].judged - a[0].judged);
  for (const g of raws.values()) {
    const top = g[0].raw, place = order.indexOf(g);
    const ceiling = CATEGORY_TOP - (best > weakest ? CATEGORY_RANGE * (best - top) / (best - weakest) : 0) - LEADER_STEP * place;
    g.forEach((x, i) => scaled.set(x.id, ceiling - STRETCH * (top - x.raw) - RANK_STEP * Math.min(i, RANK_STEPS)));
  }
  const groups = new Map<string, { id: string; judged: number; signal: number; exact: number; set: boolean }[]>();
  for (const p of products) {
    // A score set by hand shows whatever the review count; otherwise a product needs enough reviews.
    if (p.judged < MIN_SIGNAL_REVIEWS && !p.override) continue;
    const exact = p.override ? p.override : scaled.get(p.id)!;
    // However it compares with its category, a product's score stays within reach of its share of liked reviews
    // (owner, 2026-11-14: TurboTax Online, 81% negative, scored 60 and ranked #2). Mostly negative products get a failing number.
    const capped = p.override ? exact : Math.min(exact, sentimentCap(p));
    const signal = Math.min(TOP_SIGNAL, Math.max(1, Math.round(capped)));
    const g = groups.get(p.category) ?? []; groups.set(p.category, g);
    g.push({ id: p.id, judged: p.judged, signal, exact, set: !!p.override });
  }
  const out = new Map<string, Signal>();
  for (const [category, g] of groups) {
    // The place follows the number shown, so "#1 of 45" is always the highest signal.
    g.sort((a, b) => b.signal - a.signal || b.exact - a.exact || b.judged - a.judged || a.id.localeCompare(b.id));
    g.forEach((x, i) => out.set(x.id, { signal: x.signal, rank: i + 1, of: g.length, category, ...(x.set ? { set: true } : {}) }));
  }
  return out;
}
