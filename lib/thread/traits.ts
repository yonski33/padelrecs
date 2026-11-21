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
/** SkinRecs' nine (its product mock, "How does it work for you?"). Its own schema. */
export const SKIN_TRAIT_GROUPS: TraitGroup[] = [
  { key: "skin_type", title: "Skin type", options: [["dry", "Dry"], ["combination", "Combination"], ["oily", "Oily"]] },
  { key: "texture", title: "Texture", options: [["rich", "Rich"], ["medium", "Medium"], ["light", "Light"]] },
  { key: "finish", title: "Finish", options: [["dewy", "Dewy"], ["natural", "Natural"], ["matte", "Matte"]] },
  { key: "irritation", title: "Irritation", options: [["none", "None"], ["a_little", "A little"], ["a_lot", "A lot"]] },
  { key: "makeup", title: "Under makeup", options: [["fine", "Fine"], ["pills_bit", "Pills a bit"], ["pills", "Pills"]] },
  { key: "results", title: "Results in", options: [["days", "Days"], ["weeks", "Weeks"], ["months", "Months"]] },
  { key: "scent", title: "Scent", options: [["none", "None"], ["faint", "Faint"], ["strong", "Strong"]] },
  { key: "value", title: "Value", options: [["worth_it", "Worth it"], ["ok", "OK"], ["overpriced", "Overpriced"]] },
  { key: "best_used", title: "Best used", options: [["night", "Night"], ["both", "Morning and night"], ["morning", "Morning"]] },
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
/** DiscGolfRecs' nine (its disc mock, "How does it fly?"). Its own schema. */
export const DISCGOLF_TRAIT_GROUPS: TraitGroup[] = [
  { key: "level", title: "Best for", options: [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] },
  { key: "stability", title: "Stability", options: [["understable", "Understable"], ["stable", "Stable"], ["overstable", "Overstable"]] },
  { key: "glide", title: "Glide", options: [["lots", "A lot"], ["medium", "Medium"], ["little", "Little"]] },
  { key: "grip", title: "Grip", options: [["great", "Great"], ["ok", "OK"], ["slippery", "Slippery"]] },
  { key: "wind", title: "In the wind", options: [["holds", "Holds"], ["turns", "Turns a bit"], ["flips", "Flips"]] },
  { key: "arm_speed", title: "Arm speed", options: [["any", "Any"], ["medium", "Medium"], ["fast", "Fast"]] },
  { key: "fade", title: "Fade", options: [["gentle", "Gentle"], ["medium", "Medium"], ["hard", "Hard"]] },
  { key: "durability", title: "Durability", options: [["holds_up", "Holds up well"], ["average", "Average"], ["beats_fast", "Beats in fast"]] },
  { key: "throw", title: "Best throw", options: [["backhand", "Backhand"], ["both", "Both"], ["forehand", "Forehand"]] },
];
/** AudioRecs' groups (its product mock, "How does it sound?"). The mock's nine are a wireless noise cancelling pair's; each
 *  kind of headphone shows its own nine (audioGroupsFor), so a wired IEM never asks about battery or noise cancelling. The
 *  API and admin accept all of them. Its own schema. */
const A = {
  sound: { key: "sound", title: "Sound", options: [["warm", "Warm"], ["balanced", "Balanced"], ["bright", "Bright"]] },
  anc: { key: "anc", title: "Noise cancelling", options: [["excellent", "Excellent"], ["good", "Good"], ["weak", "Weak"]] },
  comfort: { key: "comfort", title: "Comfort", options: [["all_day", "All day"], ["few_hours", "A few hours"], ["tight", "Tight"]] },
  calls: { key: "calls", title: "Call quality", options: [["clear", "Clear"], ["okay", "Okay"], ["poor", "Poor"]] },
  battery: { key: "battery", title: "Battery", options: [["lasts_days", "Lasts days"], ["daily", "Daily charge"], ["short", "Short"]] },
  build: { key: "build", title: "Build", options: [["solid", "Solid"], ["average", "Average"], ["fragile", "Fragile"]] },
  best_for: { key: "best_for", title: "Best for", options: [["commute", "Commute"], ["travel", "Travel"], ["office", "Office"]] },
  glasses: { key: "glasses", title: "With glasses", options: [["fine", "Fine"], ["some_pressure", "Some pressure"], ["painful", "Painful"]] },
  value: { key: "value", title: "Value", options: [["worth_it", "Worth it"], ["fair", "Fair"], ["overpriced", "Overpriced"]] },
  detail: { key: "detail", title: "Detail", options: [["lots", "Lots"], ["some", "Some"], ["little", "Little"]] },
  soundstage: { key: "soundstage", title: "Soundstage", options: [["wide", "Wide"], ["medium", "Medium"], ["intimate", "Intimate"]] },
  fit: { key: "fit", title: "Fit", options: [["secure", "Secure"], ["tips", "Needs other tips"], ["loose", "Falls out"]] },
  amp: { key: "amp", title: "Needs an amp", options: [["no", "No"], ["helps", "It helps"], ["yes", "Yes"]] },
  use: { key: "use", title: "Best for", options: [["home", "Home"], ["studio", "Studio"], ["on_the_go", "On the go"]] },
  connection: { key: "connection", title: "Connection", options: [["solid", "Solid"], ["drops_sometimes", "Drops sometimes"], ["drops_often", "Drops often"]] },
} satisfies Record<string, TraitGroup>;
export const AUDIO_TRAIT_GROUPS: TraitGroup[] = Object.values(A);
/** One product's nine, by kind: wireless headphones (the mock's, with Detail for a pair without noise cancelling), wired
 *  headphones, IEMs and earbuds. Two groups say "Best for" with different options (wireless: Commute/Travel/Office, wired:
 *  Home/Studio/On the go); a product shows one of them. */
export function audioGroupsFor(p: { kind: string | null; wireless: boolean; anc: boolean }): TraitGroup[] {
  if (p.kind === "Earbuds") return [A.sound, p.anc ? A.anc : A.detail, A.fit, A.calls, A.battery, A.connection, A.best_for, A.build, A.value];
  if (p.kind === "IEM") return [A.sound, A.detail, A.soundstage, A.fit, A.comfort, A.build, A.use, A.amp, A.value];
  if (p.wireless) return [A.sound, p.anc ? A.anc : A.detail, A.comfort, A.calls, A.battery, A.build, A.best_for, A.glasses, A.value];
  return [A.sound, A.detail, A.soundstage, A.comfort, A.build, A.use, A.glasses, A.amp, A.value];
}
/** The vote groups a site's pages, API and admin use. */
export function traitGroupsFor(nicheId: string): TraitGroup[] {
  if (nicheId === "discgolf") return DISCGOLF_TRAIT_GROUPS;
  if (nicheId === "pickleball") return PICKLEBALL_TRAIT_GROUPS;
  if (nicheId === "stackrecs") return STACK_TRAIT_GROUPS;
  if (nicheId === "skin") return SKIN_TRAIT_GROUPS;
  if (nicheId === "audio") return AUDIO_TRAIT_GROUPS;
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
const SKIN_BOARDS: VoteBoard[] = [
  { title: "Gentlest", trait: "irritation", choice: "none" }, { title: "Best for dry skin", trait: "skin_type", choice: "dry" },
  { title: "Best for oily skin", trait: "skin_type", choice: "oily" }, { title: "Best under makeup", trait: "makeup", choice: "fine" },
  { title: "Fastest results", trait: "results", choice: "days" }, { title: "Best value", trait: "value", choice: "worth_it" },
];
/** DiscGolfRecs' (its home mock, "How throwers vote them"). */
const DISCGOLF_BOARDS: VoteBoard[] = [
  { title: "Straightest flight", trait: "stability", choice: "stable" }, { title: "Best for slow arms", trait: "arm_speed", choice: "any" },
  { title: "Best for beginners", trait: "level", choice: "beginner" }, { title: "Most glide", trait: "glide", choice: "lots" },
  { title: "Best in the wind", trait: "wind", choice: "holds" }, { title: "Most grip", trait: "grip", choice: "great" },
];
/** AudioRecs' (its home mock, "How listeners vote them"). */
const AUDIO_BOARDS: VoteBoard[] = [
  { title: "Best noise cancelling", trait: "anc", choice: "excellent" }, { title: "Most comfortable", trait: "comfort", choice: "all_day" },
  { title: "Most detailed", trait: "detail", choice: "lots" }, { title: "Best value", trait: "value", choice: "worth_it" },
  { title: "Best for calls", trait: "calls", choice: "clear" }, { title: "Best for the commute", trait: "best_for", choice: "commute" },
];
export const voteBoardsFor = (nicheId: string) => nicheId === "pickleball" ? PICKLEBALL_BOARDS : nicheId === "skin" ? SKIN_BOARDS
  : nicheId === "discgolf" ? DISCGOLF_BOARDS : nicheId === "audio" ? AUDIO_BOARDS : PADEL_BOARDS;
export const VOTE_BOARDS = voteBoardsFor(niche.id);
