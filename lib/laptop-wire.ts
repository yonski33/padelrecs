// LaptopRecs' quick match inputs (lib/laptop-match.ts LaptopWire), worked out on the server from what the site already
// has: each laptop's category and spec weight, the tags on owner reviews and web summaries, and, once the creator reviews are
// imported (drizzle/0039-0041), each reviewer's word per part and their overall take. Pure: plain inputs in, so tests feed
// plain objects.
import type { LaptopPart, LaptopWire } from "./laptop-match";

/** The tags that speak for or against each part (lib/niche/laptop.ts tags). */
export const PART_TAGS: Record<LaptopPart, { pos: string[]; neg: string[] }> = {
  performance: { pos: ["fast"], neg: ["throttling"] },
  thermals: { pos: ["cool and quiet"], neg: ["runs hot", "loud fans", "throttling", "coil whine"] },
  battery: { pos: ["great battery life"], neg: ["short battery life", "battery swelling"] },
  display: { pos: ["great display"], neg: ["screen issues", "PWM flicker"] },
  keyboard: { pos: ["great keyboard", "great trackpad"], neg: ["keyboard issues", "trackpad issues"] },
  build: { pos: ["solid build"], neg: ["build quality issues", "hinge issues", "died early"] },
  portability: { pos: ["light and portable"], neg: ["heavy"] },
  value: { pos: ["great value"], neg: ["overpriced"] },
};
const PARTS = Object.keys(PART_TAGS) as LaptopPart[];
/** A reviewer's word as a 0-100 score (lib/thread/creators.ts WORDS). */
const WORD_SCORE: Record<string, number> = { Excellent: 100, Great: 85, Good: 65, Okay: 40, Weak: 10 };
/** Smoothing: every part starts as if one voice said "fine" (50), so one tag never decides it. */
const PRIOR = 1;
/** How loved starts as if 3 people were mixed, so 3 happy owners don't outrank 40 mostly happy ones. */
const LOVED_PRIOR = 3;

/** "3.31 lb", "1.24 kg", "from 1.2 kg (2.65 lb)": the first weight, in kg. */
export function kgOf(weight: string | null | undefined): number | null {
  if (!weight) return null;
  const m = /(\d+(?:\.\d+)?)\s*(kg|lbs?|pounds?|g)\b/i.exec(weight);
  if (!m) return null;
  const v = Number(m[1]), u = m[2].toLowerCase();
  const kg = u === "kg" ? v : u === "g" ? v / 1000 : v * 0.4536;
  return kg > 0.5 && kg < 6 ? Math.round(kg * 100) / 100 : null;
}

export type WireInput = {
  id: string; category: string | null; weight: string | null;
  /** Owner reviews and web summaries: their tags and overall sentiment. */ opinions: { tags: string[]; sentiment: "positive" | "mixed" | "negative" | null }[];
  /** Creator reviews: their words per part and their take. */ creators: { attrs: Partial<Record<string, string>>; stance: "pos" | "mix" | "neg" }[];
};
export function laptopWire(x: WireInput): LaptopWire {
  const acc = Object.fromEntries(PARTS.map(k => [k, { sum: 0, n: 0 }])) as Record<LaptopPart, { sum: number; n: number }>;
  for (const o of x.opinions) for (const k of PARTS) {
    const t = PART_TAGS[k], pos = o.tags.some(g => t.pos.includes(g)), neg = o.tags.some(g => t.neg.includes(g));
    if (pos !== neg) { acc[k].sum += pos ? 100 : 0; acc[k].n += 1; }
  }
  for (const c of x.creators) for (const k of PARTS) { const w = c.attrs[k]; if (w && WORD_SCORE[w] != null) { acc[k].sum += WORD_SCORE[w]; acc[k].n += 1; } }
  const s: LaptopWire["s"] = {};
  for (const k of PARTS) if (acc[k].n) s[k] = [Math.round((acc[k].sum + 50 * PRIOR) / (acc[k].n + PRIOR)), acc[k].n];
  // How loved: loved counts fully, mixed half, from opinions and creator takes, smoothed (LOVED_PRIOR); none under 2 voices.
  let pos = 0, mix = 0, n = 0;
  for (const o of x.opinions) if (o.sentiment) { n++; if (o.sentiment === "positive") pos++; else if (o.sentiment === "mixed") mix++; }
  for (const c of x.creators) { n++; if (c.stance === "pos") pos++; else if (c.stance === "mix") mix++; }
  const loved = n >= 2 ? Math.round(100 * (pos + mix / 2 + 0.5 * LOVED_PRIOR) / (n + LOVED_PRIOR)) : null;
  return { id: x.id, category: x.category, kg: kgOf(x.weight), loved, n, s };
}
