// SkinRecs' safety facts for the match (owner OK 2026-11-17, match tuning pass from the audit, skinrecs-match-audit.md):
// how strong a product's actives are, whether it is a leave-on acid, what it is mostly used on, and our own product page's
// "too strong" verdicts. Owner rows in the evidence store win (facts `strength`, `acid`, `use`; lib/attr-profile.ts). Until
// `strength` and `acid` are filled from ingredient lists (site-jobs/skin-strength/), a name rule stands in. Pure.
import type { ProductAttrs } from "./attr-score";

/** TEMPORARY stand-in until the `strength` fact is filled: the audit's rule (retinoids, 7%+ glycolic, AHA 30%, 2% BHA
 *  liquids, 15–23% vitamin C, alcohol/camphor spot lotions, essential-oil acne oils, lactic-acid nights, every Exfoliant). */
const STRONG_NAME = /\b(retinol|retinal|retinaldehyde|retinoid|retinyl|tretinoin|adapalene|granactive)\b|aha\s*30|peeling solution|glycolic acid (7|8|9|1\d)\b|2% bha|bha liquid|liquid exfoliant|(vitamin c|vita c|ascorbic)\D{0,6}(1[5-9]|2\d)\b|\b(1[5-9]|2\d)\s?% (vitamin c|l-ascorbic|ascorbic)|c\s?(1[5-9]|2\d)\b|drying lotion|u\.?\s?f\.?\s?o\b|good genes/i;
/** TEMPORARY stand-in until the `acid` fact is filled: a leave-on AHA, BHA or PHA named on the product. */
const ACID_NAME = /\b(glycolic|lactic|salicylic|mandelic|aha|bha|pha|gluconolactone)\b/i;
const RINSE_OFF = new Set(["Cleanser", "Mask"]);

export type Strength = "strong" | "moderate" | "gentle";
export type NegTag = "strong_for_sensitive" | "too_strong_for_faces";

/** Our own page's "Why not" titles that mean the product is too strong (not scent: fragrance has its own fact). */
export function negTagOf(noTitles: string[]): NegTag | null {
  if (noTitles.some(t => /too strong for (many )?faces/i.test(t))) return "too_strong_for_faces";
  if (noTitles.some(t => /strong for sensitive|too strong|too harsh|strong at \d+%|^strong, stings/i.test(t))) return "strong_for_sensitive";
  return null;
}

/** The product's facts with `strength`, `acid` and `neg` filled in: owner facts first, then the stand-ins. */
export function withSafety(a: ProductAttrs, name: string, shape: string | null, noTitles: string[]): ProductAttrs {
  const f = { ...a.facts };
  if (!f.strength) { f.strength = STRONG_NAME.test(name) || shape === "Exfoliant" ? "strong" : null; if (f.strength) f.strength_src = "name"; }
  if (!f.acid && !RINSE_OFF.has(shape ?? "") && ACID_NAME.test(name)) { f.acid = "yes"; f.acid_src = "name"; }
  const neg = negTagOf(noTitles);
  if (neg) f.neg = neg;
  for (const k of Object.keys(f)) if (f[k] === null || f[k] === undefined) delete f[k];
  return { scores: a.scores, facts: f };
}
