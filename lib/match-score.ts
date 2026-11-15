// The match % on the quick-match home (owner 2026-11-15: "i kind of liked the % of how it match with you … we can base it on
// our database"). How well a racket fits the visitor's picks, from player reports. It is NOT a % of happy players. Pure, so
// tests can feed it plain objects.
//
// fit (0–1) = weighted mean of the parts that apply:
//   style  0.40  control → the Control trait score, power → Power, balance → both high and close together (any: skipped)
//   level  0.30  the agreed level band (lib/fit-verdict.ts combinedBand): inside 1, next to it 0.5, further 0.1; plus up to
//                +0.2 when players at that level liked it (5+ of them = full)
//   arm    0.20  the Arm comfort trait score, only when "sore arm" is ticked
//   score  0.10  the Player score (lib/signal.ts)
// A part with no data counts as 0.5 (neither for nor against).
// Then it is placed inside its verdict's band, so the % always agrees with the word beside it:
//   Strong fit (good) 70–99 · Worth a look (maybe) 45–69 · Probably not (no) 15–44 · thin data: no % at all.
import type { FitVerdict, Band } from "./fit-verdict";
import type { QuickChoice } from "./quick-match";

export type MatchInputs = {
  verdict: FitVerdict;
  /** Trait scores 0–99 (lib/trait-score.ts), null when too thin. */
  control: number | null; power: number | null; arm: number | null;
  band?: Band;
  /** Players at the picked level who liked it. */
  likedAtLevel?: number;
  signal: number | null;
};
export const MATCH_BANDS = { good: [70, 99], maybe: [45, 69], no: [15, 44] } as const;
const LEVEL_INDEX = { beginner: 0, intermediate: 1, advanced: 2 } as const;
const W = { style: 0.4, level: 0.3, arm: 0.2, score: 0.1 };
const part = (v: number | null) => v === null ? 0.5 : v / 99;

/** 0–1: how well the data fits the picks, before it is placed in its verdict's band. */
export function matchFit(c: QuickChoice, m: Omit<MatchInputs, "verdict">): number {
  const parts: [number, number][] = [];
  if (c.style !== "any") {
    const v = c.style === "control" ? part(m.control) : c.style === "power" ? part(m.power)
      : m.control === null || m.power === null ? 0.5 : 0.5 * Math.min(m.control, m.power) / 99 + 0.5 * (1 - Math.abs(m.control - m.power) / 99);
    parts.push([W.style, v]);
  }
  const i = LEVEL_INDEX[c.level];
  const inBand = !m.band ? 0.5 : i >= m.band.from && i <= m.band.to ? 1 : Math.min(Math.abs(i - m.band.from), Math.abs(i - m.band.to)) === 1 ? 0.5 : 0.1;
  parts.push([W.level, Math.min(1, inBand + 0.2 * Math.min(1, (m.likedAtLevel ?? 0) / 5))]);
  if (c.arm) parts.push([W.arm, part(m.arm)]);
  parts.push([W.score, part(m.signal)]);
  const total = parts.reduce((a, [w]) => a + w, 0);
  return parts.reduce((a, [w, v]) => a + w * v, 0) / total;
}

/** The match % (0–99) for the picks, or null on thin data. */
export function matchScore(c: QuickChoice, m: MatchInputs): number | null {
  if (m.verdict.kind === "thin") return null;
  const [lo, hi] = MATCH_BANDS[m.verdict.kind];
  return Math.round(lo + (hi - lo) * matchFit(c, m));
}
