// StackRecs scores (plan PR #517 sections 6 and 7). Pure, so tests feed plain objects.
//
// Bias rule: a score comes only from opinions (own reviews, quick votes and outside reviews), never from a programme, a
// link, a hand-set number or the assistant's own view. This module takes nothing else, and tests/stackrecs.test.ts fails CI
// if it ever reads commission fields.
//
// Freshness (owner 2026-11-19): full weight for FULL_MONTHS, then the weight halves every HALF_LIFE_MONTHS, never below
// FLOOR; opinions older than CUTOFF_MONTHS leave the score (they stay readable). An opinion tagged two or more major
// versions behind the tool's newest tag counts OLD_VERSION_WEIGHT on top. The weights set the shares of positive, mixed and
// negative; the volume is the plain count of opinions inside the cutoff, so a quiet month doesn't wipe a tool's score.
import { signalCeiling, sentimentCap, MIN_SIGNAL_REVIEWS, PRIOR, TOP_SIGNAL, type Signal } from "../signal";

export const FULL_MONTHS = 3, HALF_LIFE_MONTHS = 3, FLOOR = 0.1, CUTOFF_MONTHS = 18, OLD_VERSION_WEIGHT = 0.5;
const MONTH = 30.44 * 86_400_000;

export type Verdict = "positive" | "mixed" | "negative";
export type Opinion = { toolId: string; verdict: Verdict; date: string | null; version?: string | null };
export type ToolRef = { id: string; category: string };

/** Months between an opinion's date and now; an undated one counts as a FULL_MONTHS-old opinion. */
export const ageMonths = (date: string | null, now: number) => {
  const t = date ? Date.parse(date) : NaN;
  return Number.isNaN(t) ? FULL_MONTHS : Math.max(0, (now - t) / MONTH);
};
/** The age weight: 1, then halving, floored; 0 past the cutoff. */
export function ageWeight(months: number) {
  if (months > CUTOFF_MONTHS) return 0;
  if (months <= FULL_MONTHS) return 1;
  return Math.max(FLOOR, 0.5 ** ((months - FULL_MONTHS) / HALF_LIFE_MONTHS));
}
/** The major version in a tag: "Cursor 3.x" → 3, "Semrush 2026" → 2026, "Claude Code" → null. */
export const majorOf = (tag: string | null | undefined) => { const m = tag ? /(\d+)/.exec(tag) : null; return m ? Number(m[1]) : null; };

export type Weighted = { judged: number; positive: number; mixed: number; negative: number; weight: number; newest: string | null };
/** One tool's counted opinions: raw count inside the cutoff, and positive / mixed / negative rescaled to it by weight. */
export function weighOpinions(ops: Opinion[], now = Date.now()): Weighted {
  const majors = ops.map(o => majorOf(o.version)).filter((x): x is number => x != null), top = majors.length ? Math.max(...majors) : null;
  let n = 0, w = 0, newest: string | null = null;
  const by: Record<Verdict, number> = { positive: 0, mixed: 0, negative: 0 };
  for (const o of ops) {
    let x = ageWeight(ageMonths(o.date, now));
    if (x === 0) continue;
    const m = majorOf(o.version);
    if (top != null && m != null && top - m >= 2) x *= OLD_VERSION_WEIGHT;
    n++; w += x; by[o.verdict] += x;
    if (o.date && (!newest || o.date > newest)) newest = o.date;
  }
  const k = w ? n / w : 0;
  return { judged: n, positive: by.positive * k, mixed: by.mixed * k, negative: by.negative * k, weight: w, newest };
}

/** Every tool's score, UNSCALED (owner 2026-11-19): padel's signal stretches each category so its leader scores near the
 *  top, which made a thin category leader read 96 with 55% mixed reviews. Here the score is the plain ceiling of the shared
 *  formula (lib/signal.ts signalCeiling): 100 less points for the negative and mixed shares, those shares pulled toward the
 *  site average by PRIOR imaginary opinions, capped by sentimentCap. No volume stretch, no category stretch, no overrides.
 *  `rank` and `of` are the place among the category's scored tools. */
export function stackScores(tools: ToolRef[], opinions: Opinion[], now = Date.now()): Map<string, Signal> {
  const per = new Map<string, Opinion[]>();
  for (const o of opinions) per.set(o.toolId, [...(per.get(o.toolId) ?? []), o]);
  const w = new Map(tools.map(t => [t.id, weighOpinions(per.get(t.id) ?? [], now)]));
  const scored = tools.filter(t => w.get(t.id)!.judged >= MIN_SIGNAL_REVIEWS);
  const tot = scored.reduce((a, t) => { const x = w.get(t.id)!; return { n: a.n + x.judged, neg: a.neg + x.negative, mix: a.mix + x.mixed }; }, { n: 0, neg: 0, mix: 0 });
  const avgNeg = tot.n ? tot.neg / tot.n : 0, avgMix = tot.n ? tot.mix / tot.n : 0;
  const raw = new Map(scored.map(t => { const x = w.get(t.id)!;
    const neg = (x.negative + PRIOR * avgNeg) / (x.judged + PRIOR), mix = (x.mixed + PRIOR * avgMix) / (x.judged + PRIOR);
    const cap = sentimentCap({ positive: x.positive, mixed: x.mixed, judged: x.judged });
    return [t.id, Math.max(0, Math.round(Math.min(TOP_SIGNAL, cap, signalCeiling(neg, mix))))]; }));
  const out = new Map<string, Signal>();
  for (const t of scored) {
    const same = scored.filter(x => x.category === t.category).sort((a, b) => raw.get(b.id)! - raw.get(a.id)! || w.get(b.id)!.judged - w.get(a.id)!.judged);
    out.set(t.id, { signal: raw.get(t.id)!, rank: same.findIndex(x => x.id === t.id) + 1, of: same.length, category: t.category });
  }
  return out;
}
