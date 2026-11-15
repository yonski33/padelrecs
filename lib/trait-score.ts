// Trait scores (owner 2026-11-15: "we should have power/control etc score for each racket"): Forgiveness, Power, Control,
// Defence, Arm comfort and Speed, each a 0–99 number per racket and 1–5 dots, worked out from the tags on stored player
// reports, the way the signal score (lib/signal.ts) is. Pure, so tests can feed it plain objects.
//
// net share = (weighted positive mentions − weighted negative mentions) / tagged reports
// smoothed toward the catalog average by PRIOR imaginary average reports, so a racket with few reports can't jump to the ends;
// score = its percentile among the rackets with enough data (0 lowest … 99 highest); dots = 1 + score / 20.
// Thin data gets no score: fewer than MIN_TAGGED tagged reports, or fewer than MIN_MENTIONS positive mentions of the trait.
// A score the owner set by hand (override) wins.

export const TRAITS = ["forgiveness", "power", "control", "defence", "arm", "speed"] as const;
export type Trait = typeof TRAITS[number];
export const TRAIT_LABEL: Record<Trait, string> = { forgiveness: "Forgiveness", power: "Power", control: "Control", defence: "Defence", arm: "Arm comfort", speed: "Speed" };
/** Which tags count for and against each trait, and how much (owner 2026-11-15). */
export const TRAIT_TAGS: Record<Trait, { plus: [string, number][]; minus: [string, number][] }> = {
  forgiveness: { plus: [["forgiving", 1]], minus: [["small sweet spot", 1], ["demanding", 1]] },
  power: { plus: [["easy power", 1], ["great on smashes", 1]], minus: [] },
  control: { plus: [["good control", 1]], minus: [["head-heavy", 0.5]] },
  defence: { plus: [["great in defence", 1], ["good control", 0.5]], minus: [] },
  arm: { plus: [["arm-friendly", 1]], minus: [["vibrates on mishits", 1]] },
  speed: { plus: [["fast at the net", 1]], minus: [["head-heavy", 1], ["tiring in long matches", 1]] },
};
export const MIN_TAGGED = 8, MIN_MENTIONS = 2, PRIOR = 10;

export type TraitInput = { id: string; /** Reports with at least one tag. */ tagged: number; tags: Record<string, number>; override?: Partial<Record<Trait, number>> | null };
export type TraitScore = { score: number; dots: number; plus: number; minus: number; set?: boolean };

export const dotsFor = (score: number) => Math.min(5, 1 + Math.floor(score / 20));
const weighted = (tags: Record<string, number>, list: [string, number][]) => list.reduce((a, [t, w]) => a + w * (tags[t] ?? 0), 0);
/** Positive mentions counted as people (unweighted), for the "at least 2 mentions" bar. */
const mentions = (tags: Record<string, number>, list: [string, number][]) => list.filter(([, w]) => w >= 1).reduce((a, [t]) => a + (tags[t] ?? 0), 0);

/** Every racket's six trait scores; null where the data is too thin (and no override). */
export function traitScores(products: TraitInput[]): Map<string, Record<Trait, TraitScore | null>> {
  const out = new Map<string, Record<Trait, TraitScore | null>>();
  for (const p of products) out.set(p.id, Object.fromEntries(TRAITS.map(t => [t, null])) as Record<Trait, TraitScore | null>);
  for (const t of TRAITS) {
    const { plus, minus } = TRAIT_TAGS[t];
    const net = (p: TraitInput) => weighted(p.tags, plus) - weighted(p.tags, minus);
    const enough = products.filter(p => p.tagged >= MIN_TAGGED && mentions(p.tags, plus) >= MIN_MENTIONS);
    const pool = products.filter(p => p.tagged >= MIN_TAGGED);
    const tagged = pool.reduce((a, p) => a + p.tagged, 0);
    const avg = tagged ? pool.reduce((a, p) => a + net(p), 0) / tagged : 0;
    const smooth = (p: TraitInput) => (net(p) + PRIOR * avg) / (p.tagged + PRIOR);
    const sorted = enough.map(p => smooth(p)).sort((a, b) => a - b);
    for (const p of enough) {
      const s = smooth(p);
      // Percentile with ties sharing the middle place: below + half of the equal ones, over the rest.
      const below = sorted.filter(x => x < s).length, equal = sorted.filter(x => x === s).length;
      const score = sorted.length > 1 ? Math.round(99 * (below + (equal - 1) / 2) / (sorted.length - 1)) : 50;
      out.get(p.id)![t] = { score, dots: dotsFor(score), plus: mentions(p.tags, plus), minus: minus.reduce((a, [tag]) => a + (p.tags[tag] ?? 0), 0) };
    }
    for (const p of products) {
      const o = p.override?.[t];
      if (typeof o === "number" && o >= 0 && o <= 99) {
        const cur = out.get(p.id)![t];
        out.get(p.id)![t] = { score: o, dots: dotsFor(o), plus: cur?.plus ?? mentions(p.tags, plus), minus: cur?.minus ?? minus.reduce((a, [tag]) => a + (p.tags[tag] ?? 0), 0), set: true };
      }
    }
  }
  return out;
}
