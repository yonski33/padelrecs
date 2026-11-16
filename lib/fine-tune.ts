// Quick match's "Not sure yet? fine-tune" (owner 2026-11-15): optional picks after style + level, all from data we hold.
//   shape  round / hybrid (teardrop, hybrid, hexagonal, geometric) / diamond, from the specs. A hard filter: only rackets of
//          that shape show; an unknown shape is hidden only when a shape is picked.
//   weight light (≤355 g) / medium / heavy (≥370 g), the middle of the spec's range. A soft boost, never a cut.
//   feel   soft / medium / firm, from players' "soft" / "firm" tags and the core spec, split into catalog thirds (most rackets
//          are firm, so a fixed cut would leave "soft" nearly empty). A soft boost.
//   sweet  "bigger sweet spot": a boost by the Forgiveness trait score.
// Pure, so tests feed plain objects.

export const WEIGHTS = ["light", "medium", "heavy"] as const;
export const FEELS = ["soft", "medium", "firm"] as const;
export type Shape = string; export type Weight = typeof WEIGHTS[number]; export type Feel = typeof FEELS[number];
export type FineTune = { shape?: Shape; weight?: Weight; feel?: Feel; sweet?: boolean };
/** Each site's shape picks and weight bands (grams; specs in ounces are converted). */
type FineSite = { shapes: readonly string[]; label: Record<string, string>; shapeOf: (s: string) => Shape | null; grams: [number, number]; light: number; heavy: number;
  /** The catalogue's shape filter, when it differs from the fine-tune's (padel lists teardrop apart). */ catalog?: { shapes: readonly string[]; of: (s: string) => string | null } };
const FINE: Record<string, FineSite> = {
  padel: { shapes: ["round", "hybrid", "diamond"], label: { round: "round", hybrid: "teardrop / hybrid", diamond: "diamond" },
    shapeOf: s => /diamond/.test(s) ? "diamond" : /round/.test(s) ? "round" : /tear|drop|hybrid|hexag|geometric/.test(s) ? "hybrid" : null,
    grams: [300, 420], light: 355, heavy: 370,
    catalog: { shapes: ["round", "teardrop", "hybrid", "diamond"], of: x => /diamond/.test(x) ? "diamond" : /round/.test(x) ? "round" : /tear|drop/.test(x) ? "teardrop" : x ? "hybrid" : null } },
  // Pickleball (owner 2026-11-16): elongated / standard (hybrid and flared count here) / wide (widebody, square). A paddle sold
  // in several shapes has no one shape. Light ≤ 7.8 oz, heavy ≥ 8.2 oz.
  pickleball: { shapes: ["elongated", "standard", "wide"], label: { elongated: "elongated", standard: "standard / hybrid", wide: "wide" },
    shapeOf: s => /,|\bor\b|\//.test(s) ? null : /elongated/.test(s) ? "elongated" : /wide|square/.test(s) ? "wide" : /standard|hybrid|flared/.test(s) ? "standard" : null,
    grams: [190, 260], light: 221.2, heavy: 232.5 },
};
// By NICHE, not lib/niche: the niche configs import this module (through lib/guide.ts), so lib/niche isn't loaded yet.
const SITE: FineSite = FINE[process.env.NICHE ?? "padel"] ?? FINE.padel;
export const SHAPES: readonly Shape[] = SITE.shapes;
export const SHAPE_LABEL: Record<Shape, string> = SITE.label;
/** The catalogue's shape filter: its options, and a product's option from its shape spec. */
export const CATALOG_SHAPE_LIST: readonly string[] = SITE.catalog?.shapes ?? SITE.shapes;
export const catalogShape = (spec: string | null | undefined): string | null => { const x = (spec ?? "").toLowerCase(); return SITE.catalog ? SITE.catalog.of(x) : SITE.shapeOf(x); };

export function readFine(q: { shape?: string; weight?: string; feel?: string; sweet?: string }): FineTune {
  const f: FineTune = {};
  if (q.shape && SHAPES.includes(q.shape)) f.shape = q.shape;
  if (WEIGHTS.includes(q.weight as Weight)) f.weight = q.weight as Weight;
  if (FEELS.includes(q.feel as Feel)) f.feel = q.feel as Feel;
  if (q.sweet === "1") f.sweet = true;
  return f;
}
export const fineEmpty = (f: FineTune | undefined) => !f || (!f.shape && !f.weight && !f.feel && !f.sweet);
/** URL params for a fine-tune, in a fixed order. */
export function fineParams(f: FineTune | undefined): [string, string][] {
  if (!f) return [];
  return [f.shape && ["shape", f.shape], f.weight && ["weight", f.weight], f.feel && ["feel", f.feel], f.sweet && ["sweet", "1"]].filter(Boolean) as [string, string][];
}
/** "diamond · light · soft · bigger sweet spot" for the "Your game" line. */
export const fineWords = (f: FineTune | undefined) => !f ? [] : [f.shape && SHAPE_LABEL[f.shape].split(" / ")[0], f.weight, f.feel, f.sweet && "bigger sweet spot"].filter((x): x is string => !!x);

export function shapeOf(spec: string | null | undefined): Shape | null {
  return SITE.shapeOf((spec ?? "").toLowerCase());
}
/** The middle of the spec's weight range in grams ("360–375 g" → 367.5; "8.0-8.3 oz" → 231), or null. */
export function gramsOf(spec: string | null | undefined): number | null {
  const s = spec ?? "", [lo, hi] = SITE.grams;
  let n = s.match(/\d{3}(\.\d)?/g)?.map(Number).filter(g => g >= lo && g <= hi) ?? [];
  if (!n.length && /\boz\b/i.test(s)) n = (s.match(/\d{1,2}\.\d+|\b\d{1,2}\b(?=\s*(?:-|–|oz))/g) ?? []).map(Number).filter(x => x >= 6 && x <= 10).map(x => x * 28.3495).filter(g => g >= lo && g <= hi);
  return n.length ? (Math.min(...n) + Math.max(...n)) / 2 : null;
}
export const weightOf = (g: number | null): Weight | null => g === null ? null : g <= SITE.light ? "light" : g >= SITE.heavy ? "heavy" : "medium";

/** Feel lean, + soft / − firm: players' soft vs firm tags (smoothed) and the core's own word. */
export function feelLean(tags: Record<string, number>, core: string | null | undefined): number {
  const soft = tags.soft ?? 0, firm = tags.firm ?? 0, c = (core ?? "").toLowerCase();
  return (soft - firm) / (soft + firm + 3) + (/soft/.test(c) ? 0.4 : /hard|firm/.test(c) ? -0.4 : 0);
}
/** Feel classes as catalog thirds of the lean. */
export function feelClasses(leans: Map<string, number>): Map<string, Feel> {
  const sorted = [...leans.values()].sort((a, b) => a - b), n = sorted.length;
  const lo = sorted[Math.floor(n / 3)] ?? 0, hi = sorted[Math.floor(2 * n / 3)] ?? 0;
  // When the bottom and top thirds tie (most products with no soft / firm word at all), the tie is the middle, not "firm".
  return new Map([...leans].map(([id, v]) => [id, v > hi ? "soft" : v < lo || (v === lo && lo < hi) ? "firm" : "medium"] as const));
}

export type FineFacts = { shape: Shape | null; grams: number | null; feel: Feel | null; forgiveness: number | null };
/** Hidden by the shape filter? */
export const fineHidden = (f: FineTune | undefined, x: FineFacts) => !!f?.shape && x.shape !== f.shape;
/** 0–1 soft boost for weight, feel and sweet spot: 1 a full match on everything picked, 0.5 neutral (nothing picked / unknown). */
export function fineFit(f: FineTune | undefined, x: FineFacts): number | null {
  if (!f) return null;
  const parts: number[] = [];
  if (f.weight) { const w = weightOf(x.grams); parts.push(w === null ? 0.5 : w === f.weight ? 1 : (w === "medium" || f.weight === "medium") ? 0.4 : 0); }
  if (f.feel) parts.push(x.feel === null ? 0.5 : x.feel === f.feel ? 1 : (x.feel === "medium" || f.feel === "medium") ? 0.4 : 0);
  if (f.sweet) parts.push(x.forgiveness === null ? 0.5 : x.forgiveness / 99);
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
}
/** Soft reasons for the fit check: "Heavier than you asked for (360–375 g)." */
export function fineMismatches(f: FineTune | undefined, x: FineFacts, weightSpec?: string | null): string[] {
  if (!f) return [];
  const out: string[] = [], w = weightOf(x.grams);
  if (f.shape && x.shape && x.shape !== f.shape) out.push(`A ${SHAPE_LABEL[x.shape]} shape, not the ${SHAPE_LABEL[f.shape]} you asked for.`);
  if (f.weight && w && w !== f.weight) {
    const heavier = WEIGHTS.indexOf(w) > WEIGHTS.indexOf(f.weight);
    out.push(`${heavier ? "Heavier" : "Lighter"} than you asked for${weightSpec ? ` (${weightSpec})` : ""}.`);
  }
  if (f.feel && x.feel && x.feel !== f.feel) out.push(`Players find it ${x.feel === "medium" ? "medium" : x.feel === "soft" ? "softer" : "firmer"} than the ${f.feel} feel you asked for.`);
  if (f.sweet && x.forgiveness !== null && x.forgiveness < 50) out.push("Not one of the bigger sweet spots.");
  return out;
}
