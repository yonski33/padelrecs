// "How does it play?" vote groups (Metalbone CTRL Thread v7): one vote per group per device, changeable, a second tap clears.
// Pure: the API (app/api/trait-votes) checks votes against it and the page renders it. Keys are stored (db trait_votes).
import { niche } from "../niche";
import { BUILD_GROUPS, GROW_GROUPS } from "../stack/traits";
export type TraitGroup = { key: string; title: string; options: [string, string][] };
export const PADEL_TRAIT_GROUPS: TraitGroup[] = [
  { key: "plays_like", title: "Plays like", options: [["control", "Control"], ["all_round", "All-round"], ["power", "Power"]] },
  { key: "level", title: "Best for", options: [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] },
  { key: "sweet_spot", title: "Sweet spot", options: [["big", "Big"], ["medium", "Medium"], ["small", "Small"]] },
  { key: "arm", title: "Arm friendly", options: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]] },
  { key: "feel", title: "Feel", options: [["soft", "Soft"], ["medium", "Medium"], ["hard", "Hard"]] },
  { key: "side", title: "Best on", options: [["right", "Right side"], ["left", "Left side"], ["both", "Both sides"]] },
  { key: "maneuver", title: "Maneuverable", options: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]] },
  { key: "trampoline", title: "Trampoline", options: [["low", "Low"], ["medium", "Medium"], ["high", "High"]] },
  { key: "durability", title: "Durability", options: [["holds_up", "Holds up well"], ["average", "Average"], ["wears_fast", "Wears fast"]] },
];
/** PickleballRecs' nine (owner's paddle mock, plans/PICKLEBALL-THREAD-PLAN.md Q1): Game type for padel's court side, Pop for
 *  trampoline, and Spin in place of Maneuverable (owner 2026-11-19: the site rates spin and has a spin list). Its own schema. */
export const PICKLEBALL_TRAIT_GROUPS: TraitGroup[] = [
  { key: "game_type", title: "Game type", options: [["doubles", "Doubles"], ["singles", "Singles"], ["both", "Both"]] },
  { key: "plays_like", title: "Plays like", options: [["control", "Control"], ["all_round", "All-round"], ["power", "Power"]] },
  { key: "level", title: "Best for", options: [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] },
  { key: "sweet_spot", title: "Sweet spot", options: [["big", "Big"], ["medium", "Medium"], ["small", "Small"]] },
  { key: "arm", title: "Arm friendly", options: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]] },
  { key: "feel", title: "Feel", options: [["soft", "Soft"], ["medium", "Medium"], ["hard", "Hard"]] },
  { key: "spin", title: "Spin", options: [["lots", "Lots"], ["some", "Some"], ["little", "Little"]] },
  { key: "pop", title: "Pop", options: [["low", "Low"], ["medium", "Medium"], ["high", "High"]] },
  { key: "durability", title: "Durability", options: [["holds_up", "Holds up well"], ["average", "Average"], ["wears_fast", "Wears fast"]] },
];
/** StackRecs' Build and Grow sets together, as its API and admin accept them (one "Best for" key with both sides' options;
 *  a tool page shows only its own side, lib/stack/traits.ts). */
const STACK_TRAIT_GROUPS: TraitGroup[] = (() => {
  const out = new Map<string, TraitGroup>();
  for (const g of [...BUILD_GROUPS, ...GROW_GROUPS]) {
    const had = out.get(g.key);
    out.set(g.key, had ? { ...had, options: [...had.options, ...g.options.filter(([k]) => !had.options.some(([h]) => h === k))] } : g);
  }
  return [...out.values()];
})();
/** The vote groups a site's pages, API and admin use. */
export function traitGroupsFor(nicheId: string): TraitGroup[] {
  if (nicheId === "pickleball") return PICKLEBALL_TRAIT_GROUPS;
  if (nicheId === "stackrecs") return STACK_TRAIT_GROUPS;
  return PADEL_TRAIT_GROUPS;
}
/** The running site's groups. */
export const TRAIT_GROUPS = traitGroupsFor(niche.id);
export const validTraitVote = (trait: string, choice: string | null, groups: TraitGroup[] = TRAIT_GROUPS) => {
  const g = groups.find(x => x.key === trait);
  return !!g && (choice === null || g.options.some(([k]) => k === choice));
};
/** Counts: trait → choice → voters. */
export type TraitCounts = Record<string, Record<string, number>>;
/** Home and ranking boards from votes ("How players vote them"): a board's trait and choice. */
export type VoteBoard = { title: string; trait: string; choice: string };
const PADEL_BOARDS: VoteBoard[] = [
  { title: "Biggest sweet spot", trait: "sweet_spot", choice: "big" }, { title: "Most arm friendly", trait: "arm", choice: "very" },
  { title: "Best for beginners", trait: "level", choice: "beginner" }, { title: "Most power", trait: "plays_like", choice: "power" },
  { title: "Most control", trait: "plays_like", choice: "control" }, { title: "Softest feel", trait: "feel", choice: "soft" },
];
const PICKLEBALL_BOARDS: VoteBoard[] = [
  { title: "Biggest sweet spot", trait: "sweet_spot", choice: "big" }, { title: "Most arm friendly", trait: "arm", choice: "very" },
  { title: "Best for beginners", trait: "level", choice: "beginner" }, { title: "Most power", trait: "plays_like", choice: "power" },
  { title: "Most spin", trait: "spin", choice: "lots" }, { title: "Softest feel", trait: "feel", choice: "soft" },
];
export const voteBoardsFor = (nicheId: string) => nicheId === "pickleball" ? PICKLEBALL_BOARDS : PADEL_BOARDS;
export const VOTE_BOARDS = voteBoardsFor(niche.id);
