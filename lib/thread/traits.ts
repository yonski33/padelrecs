// "How does it play?" vote groups (Metalbone CTRL Thread v7): one vote per group per device, changeable, a second tap clears.
// Pure: the API (app/api/trait-votes) checks votes against it and the page renders it. Keys are stored (db trait_votes).
export type TraitGroup = { key: string; title: string; options: [string, string][] };
export const TRAIT_GROUPS: TraitGroup[] = [
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
export const validTraitVote = (trait: string, choice: string | null) => {
  const g = TRAIT_GROUPS.find(x => x.key === trait);
  return !!g && (choice === null || g.options.some(([k]) => k === choice));
};
/** Counts: trait → choice → voters. */
export type TraitCounts = Record<string, Record<string, number>>;
/** Home and ranking boards from votes ("How players vote them"): a board's trait and choice. */
export const VOTE_BOARDS: { title: string; trait: string; choice: string }[] = [
  { title: "Biggest sweet spot", trait: "sweet_spot", choice: "big" }, { title: "Most arm friendly", trait: "arm", choice: "very" },
  { title: "Best for beginners", trait: "level", choice: "beginner" }, { title: "Most power", trait: "plays_like", choice: "power" },
  { title: "Most control", trait: "plays_like", choice: "control" }, { title: "Softest feel", trait: "feel", choice: "soft" },
];
