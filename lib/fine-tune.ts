// Quick match's "Not sure yet? fine-tune" (owner 2026-11-15): optional picks after style + level, all from data we hold.
//   shape  round / hybrid (teardrop, hybrid, hexagonal, geometric) / diamond, from the specs. A hard filter: only rackets of
//          that shape show; an unknown shape is hidden only when a shape is picked.
//   weight light (≤355 g) / medium / heavy (≥370 g), the middle of the spec's range. A soft boost, never a cut.
//   feel   soft / medium / firm, from players' "soft" / "firm" tags and the core spec, split into catalog thirds (most rackets
//          are firm, so a fixed cut would leave "soft" nearly empty). A soft boost.
//   sweet  "bigger sweet spot": a boost by the Forgiveness trait score.
// Pure, so tests feed plain objects.

export const SHAPES = ["round", "hybrid", "diamond"] as const;
export const WEIGHTS = ["light", "medium", "heavy"] as const;
export const FEELS = ["soft", "medium", "firm"] as const;
export type Shape = typeof SHAPES[number]; export type Weight = typeof WEIGHTS[number]; export type Feel = typeof FEELS[number];
export type FineTune = { shape?: Shape; weight?: Weight; feel?: Feel; sweet?: boolean };
export const SHAPE_LABEL: Record<Shape, string> = { round: "round", hybrid: "teardrop / hybrid", diamond: "diamond" };

export function readFine(q: { shape?: string; weight?: string; feel?: string; sweet?: string }): FineTune {
  const f: FineTune = {};
  if (SHAPES.includes(q.shape as Shape)) f.shape = q.shape as Shape;
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
  const s = (spec ?? "").toLowerCase();
  return /diamond/.test(s) ? "diamond" : /round/.test(s) ? "round" : /tear|drop|hybrid|hexag|geometric/.test(s) ? "hybrid" : null;
}
/** The middle of the spec's weight range in grams ("360–375 g" → 367.5), or null. */
export function gramsOf(spec: string | null | undefined): number | null {
  const n = (spec ?? "").match(/\d{3}(\.\d)?/g)?.map(Number).filter(g => g >= 300 && g <= 420) ?? [];
  return n.length ? (Math.min(...n) + Math.max(...n)) / 2 : null;
}
export const weightOf = (g: number | null): Weight | null => g === null ? null : g <= 355 ? "light" : g >= 370 ? "heavy" : "medium";

/** Feel lean, + soft / − firm: players' soft vs firm tags (smoothed) and the core's own word. */
export function feelLean(tags: Record<string, number>, core: string | null | undefined): number {
  const soft = tags.soft ?? 0, firm = tags.firm ?? 0, c = (core ?? "").toLowerCase();
  return (soft - firm) / (soft + firm + 3) + (/soft/.test(c) ? 0.4 : /hard|firm/.test(c) ? -0.4 : 0);
}
/** Feel classes as catalog thirds of the lean. */
export function feelClasses(leans: Map<string, number>): Map<string, Feel> {
  const sorted = [...leans.values()].sort((a, b) => a - b), n = sorted.length;
  const lo = sorted[Math.floor(n / 3)] ?? 0, hi = sorted[Math.floor(2 * n / 3)] ?? 0;
  return new Map([...leans].map(([id, v]) => [id, v > hi ? "soft" : v <= lo ? "firm" : "medium"] as const));
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
