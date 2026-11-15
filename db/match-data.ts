import type { LevelSources } from "../lib/fit-verdict";
import type { Trait } from "../lib/trait-score";
import padelKnownDots from "./known-dots/padel.json";
import padelLevels from "./level-sources/padel.json";
import padelYoutubeTraits from "./youtube-traits/padel.json";
import pickleballKnownDots from "./known-dots/pickleball.json";

// The match engine's hand-kept data per site (audit 2026-11-15: a per-niche map, so a sister site plugs in its own files
// instead of editing app/match-context.ts). A site without an entry runs on its reports alone.
//   knownDots      the owner's calls (db/known-dots/<niche>.json), applied like admin overrides
//   levelSources   maker and YouTube levels by product slug (db/level-sources/<niche>.json)
//   youtubeTraits  YouTube reviewers' trait mentions by product slug (db/youtube-traits/<niche>.json)
export type MatchData = {
  knownDots: Record<string, Record<string, { dots?: number }>>;
  levelSources: Record<string, LevelSources>;
  youtubeTraits: Record<string, Partial<Record<Trait, { plus: number; minus: number }>>>;
};
const EMPTY: MatchData = { knownDots: {}, levelSources: {}, youtubeTraits: {} };

const MATCH_DATA: Record<string, MatchData> = {
  padel: {
    knownDots: padelKnownDots as unknown as MatchData["knownDots"],
    levelSources: padelLevels as unknown as MatchData["levelSources"],
    youtubeTraits: padelYoutubeTraits as unknown as MatchData["youtubeTraits"],
  },
  // The pickleball expert's ratings (1–10 per trait, no dots): read by scripts/check-expert-ratings.mts, not applied here.
  pickleball: { knownDots: pickleballKnownDots as unknown as MatchData["knownDots"], levelSources: {}, youtubeTraits: {} },
};
export const matchData = (nicheId: string): MatchData => MATCH_DATA[nicheId] ?? EMPTY;
