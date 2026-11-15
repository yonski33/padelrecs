// The quick-match picks the home list is checked on (scripts/home-rank-dump.mts, tests/home-rank.test.ts): all 31
// indexable combinations (style × no level or a level × sore arm) plus fine-tune and "show older models" samples.
import { INDEXABLE_CHOICES, type QuickChoice } from "../lib/quick-match";

export const RANK_CASES: { choice: QuickChoice; older: boolean }[] = [
  ...INDEXABLE_CHOICES.map(choice => ({ choice, older: false })),
  ...([
    { style: "power", level: "advanced", arm: false, fine: { shape: "hybrid" } },
    { style: "control", level: "intermediate", arm: false, fine: { shape: "round" } },
    { style: "power", level: "advanced", arm: true, fine: { shape: "diamond", weight: "heavy" } },
    { style: "balance", level: "beginner", arm: false, fine: { weight: "light", sweet: true } },
    { style: "any", level: "intermediate", arm: false, fine: { feel: "soft" } },
    { style: "control", level: "beginner", arm: true, fine: { shape: "round", feel: "medium", sweet: true } },
    { style: "any", level: "advanced", arm: false, fine: { shape: "diamond" } },
  ] as QuickChoice[]).map(choice => ({ choice, older: false })),
  { choice: { style: "any", level: "intermediate", arm: false }, older: true },
  { choice: { style: "power", level: "intermediate", arm: false }, older: true },
  { choice: { style: "control", level: "advanced", arm: true, fine: { shape: "hybrid" } }, older: true },
];
