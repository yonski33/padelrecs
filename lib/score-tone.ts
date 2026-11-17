import { MAYBE, STRONG } from "./verdict-scale";
/** Score and match colours (owner rule): green 85+, yellow 70–84, white below. Shared by server and browser parts. */
export const scoreTone = (n: number | null | undefined) => n == null ? "" : n >= 85 ? "g" : n >= 70 ? "y" : "w";
/** The same rule as class names "hi" / "mid" / "" (white), for the score boxes and match pills that use them. */
export const scoreBox = (n: number | null | undefined) => n == null ? "" : n >= 85 ? "hi" : n >= 70 ? "mid" : "";
/** Match pills follow their own word (owner 2026-11-17), not the score bands: Strong fit green, Worth a look yellow,
 *  Probably not white (lib/verdict-scale.ts cut-offs). */
export const matchTone = (pct: number | null | undefined) => pct == null ? "" : pct >= STRONG ? "g" : pct >= MAYBE ? "y" : "w";
export const matchBox = (pct: number | null | undefined) => pct == null ? "" : pct >= STRONG ? "hi" : pct >= MAYBE ? "mid" : "";
