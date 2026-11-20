// StackRecs vote groups (plan PR #517, owner sign-off 2026-11-19: "as written"). Same mechanics as padel's "How does it
// play?" (lib/thread/traits.ts): one vote per group per device, changeable, a second tap clears. Keys fit the trait_votes
// check (^[a-z_]{2,20}$). Pure: the API checks votes against it and the pages render it.
import type { TraitGroup } from "../thread/traits";
import type { Side } from "./catalog";

const g = (key: string, title: string, options: [string, string][]): TraitGroup => ({ key, title, options });

export const BUILD_GROUPS: TraitGroup[] = [
  g("limits", "Usage limits", [["rarely", "Rarely hit"], ["sometimes", "Hit them sometimes"], ["often", "Hit them often"]]),
  g("cost", "Cost predictability", [["predictable", "Predictable"], ["some_surprises", "Some surprises"], ["bill_shock", "Bill shock"]]),
  g("code_quality", "Code quality", [["clean", "Clean"], ["needs_review", "Needs review"], ["messy", "Messy"]]),
  g("autonomy", "Autonomy", [["own", "Runs on its own"], ["nudges", "Needs nudges"], ["hand_holding", "Needs hand-holding"]]),
  g("scope", "Scope discipline", [["on_task", "Stays on task"], ["drifts", "Drifts a bit"], ["too_much", "Changes too much"]]),
  g("consistency", "Consistency", [["steady", "Steady"], ["varies", "Varies day to day"], ["hit_or_miss", "Hit or miss"]]),
  g("big_codebase", "Big codebases", [["handles", "Handles them"], ["gets_lost", "Gets lost sometimes"], ["small_only", "Small projects only"]]),
  g("lock_in", "Lock-in and export", [["easy", "Easy to leave"], ["some", "Some lock-in"], ["hard", "Hard to leave"]]),
  g("best_for", "Best for", [["non_coder", "Non-coder"], ["hobby_dev", "Hobby dev"], ["pro_team", "Pro team"]]),
];

export const GROW_GROUPS: TraitGroup[] = [
  g("data_accuracy", "Data accuracy", [["trust", "Trust it"], ["directional", "Directional only"], ["often_off", "Often off"]]),
  g("value", "Value for money", [["worth_it", "Worth it"], ["fair", "Fair"], ["overpriced", "Overpriced"]]),
  g("learning", "Learning curve", [["easy", "Easy"], ["a_week", "Takes a week"], ["steep", "Steep"]]),
  g("ai_quality", "AI features", [["useful", "Useful"], ["hit_and_miss", "Hit and miss"], ["gimmick", "Gimmick"]]),
  g("reporting", "Reporting", [["client_ready", "Client-ready"], ["basic", "Basic"], ["weak", "Weak"]]),
  g("results", "Speed of results", [["quick", "Quick wins"], ["slow_steady", "Slow but steady"], ["no_move", "Didn't move rankings"]]),
  g("support", "Support", [["helpful", "Helpful"], ["slow", "Slow"], ["hard_to_reach", "Hard to reach"]]),
  g("integrations", "Integrations", [["plugs_in", "Plugs in well"], ["some_gaps", "Some gaps"], ["stands_alone", "Stands alone"]]),
  g("best_for", "Best for", [["solo", "Solo"], ["agency", "Agency"], ["in_house", "In-house team"]]),
];

export const GROUPS: Record<Side, TraitGroup[]> = { build: BUILD_GROUPS, grow: GROW_GROUPS };
/** The section heading on a tool page. */
export const SECTION_TITLE: Record<Side, string> = { build: "How does it build?", grow: "How does it grow?" };

/** A vote is valid when its group and choice exist on the tool's side (null clears). Without a side, either side's. */
export function validStackVote(trait: string, choice: string | null, side?: Side | null) {
  const sets = side ? [GROUPS[side]] : [BUILD_GROUPS, GROW_GROUPS];
  return sets.some(s => { const x = s.find(y => y.key === trait); return !!x && (choice === null || x.options.some(([k]) => k === choice)); });
}

/** Home and ranking boards from votes, 3 per side (plan section 3). */
export const STACK_BOARDS: { side: Side; slug: string; title: string; trait: string; choice: string }[] = [
  { side: "build", slug: "rarely-hits-limits", title: "Rarely hits limits", trait: "limits", choice: "rarely" },
  { side: "build", slug: "best-for-non-coders", title: "Best for non-coders", trait: "best_for", choice: "non_coder" },
  { side: "build", slug: "stays-on-task", title: "Stays on task", trait: "scope", choice: "on_task" },
  { side: "grow", slug: "most-trusted-data", title: "Most trusted data", trait: "data_accuracy", choice: "trust" },
  { side: "grow", slug: "best-value", title: "Best value", trait: "value", choice: "worth_it" },
  { side: "grow", slug: "easiest-to-learn", title: "Easiest to learn", trait: "learning", choice: "easy" },
];
