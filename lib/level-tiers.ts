// Level tiers set by the owner (2026-11-17), in code rather than as expert values: "intermediate+" rackets suit
// intermediate players but aren't their first pick ("more like intermediate+ … we can recommend it to intermediate, but not the
// first ones"). Their level scores become: beginner 30 (not a fit), intermediate 66 (passes the level gate, so no "for
// advanced players" hold-back, but ranks a few points under core intermediate rackets through the engine's level share),
// advanced at least 85 (a full fit). The page then reads "Generally best for intermediate → advanced".

/** Owner-set intermediate+ models per site; every year of the model matches. */
export const INTERMEDIATE_PLUS: Record<string, RegExp[]> = {
  padel: [/\bsiux electra pro st4\b/i, /\bhead coello motion\b/i, /\bkuikma hybrid pro\b/i],
};
export const INTERMEDIATE_PLUS_SUITS = { beginner: 30, intermediate: 66, advanced: 85 } as const;

export const isIntermediatePlus = (site: string, name: string) => (INTERMEDIATE_PLUS[site] ?? []).some(re => re.test(name));
/** The tier's scores over the calculated ones: beginner and intermediate set, advanced never lowered. */
export function intermediatePlus<S extends { beginner: number; intermediate: number; advanced: number; basis: string[] }>(su: S): S {
  return { ...su, beginner: INTERMEDIATE_PLUS_SUITS.beginner, intermediate: INTERMEDIATE_PLUS_SUITS.intermediate,
    advanced: Math.max(su.advanced, INTERMEDIATE_PLUS_SUITS.advanced), basis: [...su.basis.filter(b => b !== "the specs"), "our level call"] };
}
