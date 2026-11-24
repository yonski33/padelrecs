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
/** TennisRecs' nine (owner 2026-11-21, v3 wave 2): padel's set with Spin and Stability for court side and trampoline, which
 *  mean nothing in tennis. Its own schema. */
export const TENNIS_TRAIT_GROUPS: TraitGroup[] = [
  { key: "plays_like", title: "Plays like", options: [["control", "Control"], ["all_round", "All-round"], ["power", "Power"]] },
  { key: "level", title: "Best for", options: [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] },
  { key: "sweet_spot", title: "Sweet spot", options: [["big", "Big"], ["medium", "Medium"], ["small", "Small"]] },
  { key: "arm", title: "Arm friendly", options: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]] },
  { key: "feel", title: "Feel", options: [["soft", "Soft"], ["medium", "Medium"], ["hard", "Crisp"]] },
  { key: "spin", title: "Spin", options: [["lots", "Lots"], ["some", "Some"], ["little", "Little"]] },
  { key: "maneuver", title: "Maneuverable", options: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]] },
  { key: "stability", title: "Stable", options: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]] },
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
/** LaptopRecs' nine ("How does it hold up?", owner 2026-11-24: battery, screen, keyboard, thermals, build and performance,
 *  plus what it suits, portability and value). Its own schema (needs drizzle/0024 there). */
export const LAPTOP_TRAIT_GROUPS: TraitGroup[] = [
  { key: "best_for", title: "Best for", options: [["gaming", "Gaming"], ["work", "Work and school"], ["creative", "Creative work"]] },
  { key: "performance", title: "Performance", options: [["fast", "Fast"], ["fine", "Fine"], ["slow", "Slow"]] },
  { key: "battery", title: "Battery life", options: [["all_day", "All day"], ["most_of_day", "Most of a day"], ["short", "Short"]] },
  { key: "thermals", title: "Heat and fans", options: [["cool", "Cool and quiet"], ["warm", "Warm"], ["hot", "Hot or loud"]] },
  { key: "screen", title: "Screen", options: [["great", "Great"], ["good", "Good"], ["meh", "Meh"]] },
  { key: "keyboard", title: "Keyboard", options: [["great", "Great"], ["fine", "Fine"], ["poor", "Poor"]] },
  { key: "build", title: "Build", options: [["solid", "Solid"], ["average", "Average"], ["flimsy", "Flimsy"]] },
  { key: "portability", title: "Easy to carry", options: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]] },
  { key: "value", title: "Value", options: [["worth_it", "Worth it"], ["ok", "OK"], ["overpriced", "Overpriced"]] },
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
/** SimRacingRecs' groups per gear type (owner 2026-11-20). Wheelbases: its product mock ("How does it play?" there, Heat in
 *  place of the mock's stray Pop, as its README lists). Pedals, wheels, cockpits and shifters: the same idea in their terms. */
const SR_LEVEL: TraitGroup = { key: "level", title: "Best for", options: [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] };
const SR_DURABLE: TraitGroup = { key: "durability", title: "Durability", options: [["holds_up", "Holds up well"], ["average", "Average"], ["wears_fast", "Wears fast"]] };
const SR_SOFTWARE: TraitGroup = { key: "software", title: "Software", options: [["easy", "Easy"], ["fiddly", "Fiddly"], ["frustrating", "Frustrating"]] };
const SR_BEST_IN: TraitGroup = { key: "best_in", title: "Best in", options: [["gt", "GT and touring"], ["formula", "Formula"], ["rally", "Rally and drift"]] };
const SR_ADJUST: TraitGroup = { key: "adjust", title: "Adjustability", options: [["lots", "A lot"], ["some", "Some"], ["little", "Little"]] };
export const SIMRACING_TRAIT_GROUPS: Record<string, TraitGroup[]> = {
  Wheelbase: [SR_BEST_IN,
    { key: "torque", title: "Torque", options: [["just_enough", "Just enough"], ["plenty", "Plenty"], ["too_light", "Too light"]] },
    { key: "detail", title: "Detail", options: [["sharp", "Sharp"], ["average", "Average"], ["vague", "Vague"]] },
    SR_LEVEL,
    { key: "desk", title: "Desk friendly", options: [["very", "Very"], ["somewhat", "Somewhat"], ["not_really", "Not really"]] },
    SR_DURABLE,
    { key: "heat", title: "Heat", options: [["cool", "Stays cool"], ["warm", "Runs warm"], ["hot", "Runs hot"]] },
    { key: "noise", title: "Noise", options: [["quiet", "Quiet"], ["hum", "Some hum"], ["loud", "Loud"]] },
    SR_SOFTWARE],
  Pedals: [
    { key: "brake_feel", title: "Brake feel", options: [["realistic", "Realistic"], ["ok", "OK"], ["vague", "Vague"]] },
    { key: "throttle", title: "Throttle", options: [["smooth", "Smooth"], ["ok", "OK"], ["cheap", "Feels cheap"]] },
    SR_LEVEL, SR_ADJUST,
    { key: "needs_rig", title: "Needs a rig", options: [["no", "No"], ["better", "Better on one"], ["yes", "Yes"]] },
    SR_DURABLE, SR_SOFTWARE],
  Wheel: [SR_BEST_IN,
    { key: "grip", title: "Grip", options: [["great", "Great"], ["ok", "OK"], ["slippery", "Slippery"]] },
    { key: "buttons", title: "Buttons and paddles", options: [["great", "Great"], ["ok", "OK"], ["poor", "Poor"]] },
    { key: "size", title: "Size", options: [["small", "Small"], ["right", "Just right"], ["large", "Large"]] },
    SR_LEVEL, SR_DURABLE],
  Cockpit: [
    { key: "flex", title: "Flex", options: [["none", "None"], ["little", "A little"], ["lots", "A lot"]] },
    { key: "build", title: "Build time", options: [["quick", "Quick"], ["afternoon", "An afternoon"], ["weekend", "A weekend"]] },
    SR_ADJUST,
    { key: "space", title: "Space", options: [["small", "Fits a small room"], ["medium", "Medium"], ["large", "Needs a big room"]] },
    SR_LEVEL, SR_DURABLE],
  "Shifter / handbrake": [
    { key: "shift_feel", title: "Feel", options: [["crisp", "Crisp"], ["ok", "OK"], ["vague", "Vague"]] },
    SR_LEVEL, SR_DURABLE, SR_SOFTWARE],
};
/** Every sim racing group once (the API and admin accept any type's votes; a product page shows its own type's). */
const SIMRACING_ALL: TraitGroup[] = [...new Map(Object.values(SIMRACING_TRAIT_GROUPS).flat().map(g => [g.key, g])).values()];
/** A product's groups by its type (SimRacingRecs); other sites have one set. */
/** Vote groups a product hides although its type has them (owner 2026-11-21, Grok audit checked by the PM): the stored votes
 *  stay, the page, pills, boards and lists just skip them. "Best in" is the discipline (GT, formula, rally), so a button box
 *  keeps it. Keyed by product id, per site. */
export const HIDDEN_TRAITS: Record<string, Record<string, string[]>> = {
  simracing: {
    // No force feedback (a bungee return; Thrustmaster's support page): nothing to vote on torque, detail, heat or noise.
    "thrustmaster-t80-ferrari-488-gtb-edition": ["torque", "detail", "heat", "noise"],
    // A GT button box, rims sold separately (Asetek): no grip or size of its own.
    "asetek-forte-gt": ["grip", "size"],
  },
};
export const hiddenTraits = (nicheId: string, id: string): string[] => HIDDEN_TRAITS[nicheId]?.[id] ?? [];
/** A product's groups by its type (SimRacingRecs); other sites have one set. `id` drops the product's hidden groups. */
export const traitGroupsForType = (nicheId: string, shape: string | null | undefined, id?: string): TraitGroup[] => {
  const all = nicheId === "simracing" ? SIMRACING_TRAIT_GROUPS[shape ?? ""] ?? SIMRACING_TRAIT_GROUPS.Wheelbase : traitGroupsFor(nicheId);
  const hide = id ? hiddenTraits(nicheId, id) : [];
  return hide.length ? all.filter(g => !hide.includes(g.key)) : all;
};
/** The vote groups a site's pages, API and admin use. */
export function traitGroupsFor(nicheId: string): TraitGroup[] {
  if (nicheId === "simracing") return SIMRACING_ALL;
  if (nicheId === "discgolf") return DISCGOLF_TRAIT_GROUPS;
  if (nicheId === "pickleball") return PICKLEBALL_TRAIT_GROUPS;
  if (nicheId === "tennis") return TENNIS_TRAIT_GROUPS;
  if (nicheId === "stackrecs") return STACK_TRAIT_GROUPS;
  if (nicheId === "skin") return SKIN_TRAIT_GROUPS;
  if (nicheId === "audio") return AUDIO_TRAIT_GROUPS;
  if (nicheId === "laptop") return LAPTOP_TRAIT_GROUPS;
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
const TENNIS_BOARDS: VoteBoard[] = [
  { title: "Biggest sweet spot", trait: "sweet_spot", choice: "big" }, { title: "Most arm friendly", trait: "arm", choice: "very" },
  { title: "Best for beginners", trait: "level", choice: "beginner" }, { title: "Most power", trait: "plays_like", choice: "power" },
  { title: "Most spin", trait: "spin", choice: "lots" }, { title: "Most control", trait: "plays_like", choice: "control" },
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
/** SimRacingRecs' (its home mock, "How racers vote them": a mixed set across gear types). */
const SIMRACING_BOARDS: VoteBoard[] = [
  { title: "Most detailed feedback", trait: "detail", choice: "sharp" }, { title: "Most torque", trait: "torque", choice: "plenty" },
  { title: "Best brake feel", trait: "brake_feel", choice: "realistic" }, { title: "Least flex", trait: "flex", choice: "none" },
  { title: "Best for beginners", trait: "level", choice: "beginner" }, { title: "Quietest", trait: "noise", choice: "quiet" },
];
/** LaptopRecs' ("How owners vote them"). */
const LAPTOP_BOARDS: VoteBoard[] = [
  { title: "Best battery life", trait: "battery", choice: "all_day" }, { title: "Coolest and quietest", trait: "thermals", choice: "cool" },
  { title: "Best screen", trait: "screen", choice: "great" }, { title: "Best keyboard", trait: "keyboard", choice: "great" },
  { title: "Easiest to carry", trait: "portability", choice: "very" }, { title: "Best value", trait: "value", choice: "worth_it" },
];
export const voteBoardsFor = (nicheId: string) => nicheId === "laptop" ? LAPTOP_BOARDS : nicheId === "pickleball" ? PICKLEBALL_BOARDS : nicheId === "skin" ? SKIN_BOARDS
  : nicheId === "discgolf" ? DISCGOLF_BOARDS : nicheId === "audio" ? AUDIO_BOARDS : nicheId === "simracing" ? SIMRACING_BOARDS : nicheId === "tennis" ? TENNIS_BOARDS : PADEL_BOARDS;
export const VOTE_BOARDS = voteBoardsFor(niche.id);
