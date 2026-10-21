import type { Niche } from "./niche/types";

/**
 * Feed order: newest day first, but within one day reviews of the same product are spread out, so a publish
 * of ten reviews for one racket doesn't fill the screen with it. Each product keeps its own newest-first order;
 * products take turns, the one with the newest review going first.
 */
export function spreadByProduct<T extends { date: string; product: string }>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  const out: T[] = [];
  for (let i = 0; i < sorted.length;) {
    const day = sorted[i].date.slice(0, 10);
    let j = i;
    while (j < sorted.length && sorted[j].date.slice(0, 10) === day) j++;
    const groups = new Map<string, T[]>();
    for (const item of sorted.slice(i, j)) (groups.get(item.product) ?? groups.set(item.product, []).get(item.product)!).push(item);
    const queues = [...groups.values()];
    for (let round = 0; queues.some(q => q.length); round++) for (const q of queues) { const next = q.shift(); if (next) out.push(next); }
    i = j;
  }
  return out;
}

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+(?:[.'-][a-z0-9]+)*/g) ?? [];

/** Words that make a review useful for this niche: its rating categories, spec labels and quick tags. */
export function nicheTerms(niche: Niche): string[] {
  const phrases = [
    ...niche.categories.flatMap(c => [c.label, ...c.hint.split(/,\s*/)]),
    ...niche.specs.map(s => s.label),
    ...niche.tags.map(t => t.label),
  ].map(p => p.toLowerCase().replace(/[^a-z0-9 &+-]/g, "").trim()).filter(p => p.length > 2);
  return [...new Set(phrases)];
}

// First-hand detail that helps another buyer: how long, how often, what level, what it's compared with, the setup.
const DURATION = /\b\d+(?:\.\d+)?\s*(?:\+\s*)?(?:hours?|hrs?|days?|weeks?|months?|years?|sessions?|matches|games|km|miles?|mi)\b|\b(?:a|one|two|three|few|several|couple of)\s+(?:weeks?|months?|years?|sessions?)\b/i;
const COMPARISON = /\b(?:compared?(?: to| with)?|than (?:my|the)|switched (?:from|to)|coming from|came from|moved (?:from|to)|vs\.?|versus|previous(?:ly)?|before this|upgrade[d]? from)\b/i;
const LEVEL = /\b(?:beginner|intermediate|advanced|competitive|ntrp|utr|dupr|[1-6]\.[05]\b|left side|right side|oily|dry|combination|sensitive|acne[- ]prone|overpronat|neutral gait|high mileage|marathon)\b/i;
const SETUP = /\b(?:strings?|tension|lbs|kg|lead tape|weight(?:ed)?|grams?|overgrip|grip|half a size|size up|routine|morning|night|spf|moisturi[sz]er|insoles?)\b/i;
const BALANCE = /\b(?:but|however|although|though|downside|only (?:issue|complaint|con)|on the other hand)\b/i;

/**
 * How useful a review is likely to be to someone deciding, 1–10, until people vote. Rewards substance:
 * length, first-hand detail (time with it, level or skin type, comparisons, setup), the niche's own
 * vocabulary (power, sweet spot, cushioning…), tags, ratings and a balanced view. Not shown to visitors.
 */
export function helpfulnessScore(r: { text: string; tags?: string[]; sentiment?: string | null; ratings?: number; profile?: number }, terms: string[]): number {
  const text = r.text.replace(/\s+/g, " ").trim();
  const n = words(text).length;
  const lower = text.toLowerCase();
  let s = 0;
  s += n >= 120 ? 3 : n >= 70 ? 2.5 : n >= 40 ? 2 : n >= 20 ? 1.2 : n >= 10 ? 0.6 : 0;
  const hits = terms.filter(t => lower.includes(t)).length;
  s += Math.min(2.5, hits * 0.6);
  s += [DURATION, COMPARISON, LEVEL, SETUP].filter(re => re.test(text)).length * 0.6;
  if (BALANCE.test(text) || r.sentiment === "mixed") s += 0.6;
  s += Math.min(0.8, (r.tags?.length ?? 0) * 0.3);
  s += Math.min(0.8, (r.ratings ?? 0) * 0.16) + Math.min(0.6, (r.profile ?? 0) * 0.15);
  return Math.max(1, Math.min(10, Math.round(1 + s * 9 / 10.3)));
}

/** "Most helpful": people's votes count most; the score orders everything until votes arrive. */
export const helpfulRank = (x: { helpful: number; score: number }) => x.helpful * 3 + x.score;
