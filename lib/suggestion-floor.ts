/** The Player score a suggested product needs beside one scoring `score` (owner 2026-11-17): min(score − 10, 80); a product
 *  without a score yet asks 75. Pure, for tests. */
export const suggestionFloor = (score: number | null) => score !== null ? Math.min(score - 10, 80) : 75;
