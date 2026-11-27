// CoffeeRecs' quick match inputs (lib/coffee-match.ts CoffeeWire), worked out on the server from what the site already has:
// each product's category, what its maker says it can do (db/specs/coffee.json), the tags on owner reviews and web summaries
// and, once creator reviews are imported (drizzle/0039-0040), each reviewer's word per part and their overall take. Pure: plain
// inputs in, so tests feed plain objects. Shaped like LaptopRecs' (lib/laptop-wire.ts).
import type { CoffeeCan, CoffeePart, CoffeeWire } from "./coffee-match";
import type { CoffeeSpec } from "./coffee-specs";

/** The tags that speak for or against each part (lib/niche/coffee.ts tags). */
export const PART_TAGS: Record<CoffeePart, { pos: string[]; neg: string[] }> = {
  taste: { pos: ["great espresso", "great taste"], neg: [] },
  consistency: { pos: ["consistent"], neg: ["inconsistent"] },
  ease: { pos: ["easy to use", "fast heat-up", "low retention"], neg: ["learning curve", "messy", "static"] },
  steam: { pos: ["great steam"], neg: [] },
  build: { pos: ["well built"], neg: ["durability issues"] },
  noise: { pos: ["quiet"], neg: ["loud"] },
  value: { pos: ["great value"], neg: ["overpriced"] },
};
const PARTS = Object.keys(PART_TAGS) as CoffeePart[];
/** A reviewer's word as a 0-100 score (lib/thread/creators.ts WORDS). */
const WORD_SCORE: Record<string, number> = { Excellent: 100, Great: 85, Good: 65, Okay: 40, Weak: 10 };
/** Smoothing: every part starts as if one voice said "fine" (50), so one tag never decides it. */
const PRIOR = 1;
/** How loved starts as if 3 people were mixed, so 3 happy owners don't outrank 40 mostly happy ones. */
const LOVED_PRIOR = 3;

/** What the maker says it can do, from its spec entry; unknown stays null. */
export function canOf(spec: CoffeeSpec | undefined): CoffeeCan {
  if (!spec) return { espresso: null, filter: null, steam: null, hand: false };
  // A grinder's `filter` is a yes/no (filter-capable) in the spec file; a brewer's is its filter type (paper or metal).
  const f = (spec as { filter?: unknown }).filter;
  return { espresso: spec.cat === "grinder" ? spec.espresso ?? null : null, filter: spec.cat === "grinder" && typeof f === "boolean" ? f : null,
    steam: spec.cat === "espresso" && spec.steam ? spec.steam !== "none" : null, hand: spec.power === "hand" };
}

export type WireInput = {
  id: string; category: string | null; spec: CoffeeSpec | undefined;
  /** Owner reviews and web summaries: their tags and overall sentiment. */ opinions: { tags: string[]; sentiment: "positive" | "mixed" | "negative" | null }[];
  /** Creator reviews: their words per part and their take. */ creators: { attrs: Partial<Record<string, string>>; stance: "pos" | "mix" | "neg" }[];
};
export function coffeeWire(x: WireInput): CoffeeWire {
  const acc = Object.fromEntries(PARTS.map(k => [k, { sum: 0, n: 0 }])) as Record<CoffeePart, { sum: number; n: number }>;
  for (const o of x.opinions) for (const k of PARTS) {
    const t = PART_TAGS[k], pos = o.tags.some(g => t.pos.includes(g)), neg = o.tags.some(g => t.neg.includes(g));
    if (pos !== neg) { acc[k].sum += pos ? 100 : 0; acc[k].n += 1; }
  }
  for (const c of x.creators) for (const k of PARTS) { const w = c.attrs[k]; if (w && WORD_SCORE[w] != null) { acc[k].sum += WORD_SCORE[w]; acc[k].n += 1; } }
  const s: CoffeeWire["s"] = {};
  for (const k of PARTS) if (acc[k].n) s[k] = [Math.round((acc[k].sum + 50 * PRIOR) / (acc[k].n + PRIOR)), acc[k].n];
  // How loved: loved counts fully, mixed half, from opinions and creator takes, smoothed (LOVED_PRIOR); none under 2 voices.
  let pos = 0, mix = 0, n = 0;
  for (const o of x.opinions) if (o.sentiment) { n++; if (o.sentiment === "positive") pos++; else if (o.sentiment === "mixed") mix++; }
  for (const c of x.creators) { n++; if (c.stance === "pos") pos++; else if (c.stance === "mix") mix++; }
  const loved = n >= 2 ? Math.round(100 * (pos + mix / 2 + 0.5 * LOVED_PRIOR) / (n + LOVED_PRIOR)) : null;
  return { id: x.id, category: x.category, can: canOf(x.spec), loved, n, s };
}
