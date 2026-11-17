// Level tiers set by the owner (2026-11-17), in code rather than as expert values. "Intermediate+" rackets suit intermediate
// players but aren't their first pick ("more like intermediate+ … we can recommend it to intermediate, but not the first
// ones"); the owner then widened it: "basically most of the rackets should be like that". So on padel every racket rated
// advanced-only becomes intermediate → advanced, except the truly advanced list below.
// An intermediate+ racket: intermediate 66 (passes the level gate, so no "for advanced players" hold-back, but ranks a few
// points under core intermediate rackets through the engine's level share), advanced at least 85, beginner unchanged.
// A truly advanced racket keeps intermediate under the gate (at most 45). Pages read "Generally best for intermediate →
// advanced" or "advanced".
import { SUITS_OK } from "./fit-verdict";

type Rule = { /** Always intermediate+. */ plus: RegExp[]; /** Every other advanced-only racket becomes intermediate+. */ widen: boolean;
  /** Advanced only, whatever the scores say. */ advancedOnly: RegExp[] };
export const LEVEL_TIERS: Record<string, Rule> = {
  padel: {
    plus: [/\bsiux electra pro st4\b/i, /\bhead coello motion\b/i, /\bkuikma hybrid pro\b/i],
    widen: true,
    advancedOnly: [/\bsiux fenix pro 6\b/i, /\bbullpadel hack\b/i, /\bmetalbone hrd\+? 3\.[45]\b/i, /\bhead coello pro\b/i, /\bviper juan lebr[oó]n\b/i, /\btechnical viper\b/i],
  },
};
export const INTERMEDIATE_PLUS_SUITS = { intermediate: 66, advanced: 85 } as const, ADVANCED_ONLY_INTERMEDIATE = 45;

type S = { beginner: number; intermediate: number; advanced: number; basis: string[] };
/** Advanced-only by its scores: suits advanced, not intermediate or beginner (the "Generally best for advanced" rackets). */
const advancedOnlyScores = (su: S) => su.advanced >= SUITS_OK && su.intermediate < SUITS_OK && su.beginner < SUITS_OK;
export function levelTier(site: string, name: string, su: S): "plus" | "advanced" | null {
  const rule = LEVEL_TIERS[site]; if (!rule) return null;
  if (rule.advancedOnly.some(re => re.test(name))) return "advanced";
  if (rule.plus.some(re => re.test(name))) return "plus";
  return rule.widen && advancedOnlyScores(su) ? "plus" : null;
}
/** The tier's scores over the calculated ones (beginner never changes). */
export function applyTier<T extends S>(tier: "plus" | "advanced", su: T): T {
  if (tier === "advanced") return { ...su, intermediate: Math.min(su.intermediate, ADVANCED_ONLY_INTERMEDIATE), advanced: Math.max(su.advanced, SUITS_OK), basis: [...su.basis, "advanced only"] };
  return { ...su, intermediate: INTERMEDIATE_PLUS_SUITS.intermediate, advanced: Math.max(su.advanced, INTERMEDIATE_PLUS_SUITS.advanced),
    basis: [...su.basis.filter(b => b !== "the specs"), "our level call"] };
}
