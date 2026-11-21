// PadelRecs v3 rankings hub and "How rankings work" (owner handoff design_handoff_padelrecs_v3, 2026-11-21): the words and the
// one rule the two pages share. Pure, so tests feed plain inputs.
// Honesty rules (owner, over the mock's words):
//   - The power and control lists are PadelRecs picks, or (lib/thread/vote-order.ts "votes", owner test 2026-11-21) ordered by
//     how many players pick each racket for power or control; copy says which. Never "rankings change as new reviews come in".
//   - No rating or score on the lists (owner 2026-11-21: the "Most picked for" pill carries each row); no 0-100 score anywhere.
//   - Sentiment as counts only: "52 loved · 18 mixed · 14 not for me".

import { votesOrdered, lovedOrdered } from "./vote-order";
const BY_VOTES = votesOrdered("padel", "best-power-padel-rackets") && votesOrdered("padel", "best-control-padel-rackets");
const BY_LOVED = lovedOrdered("padel", "best-padel-rackets");

/** The hub's lead (owner honesty rules 2026-11-21): says what orders the lists, never that rankings change with each review. */
export const HUB_LEAD = BY_VOTES ? "Pick a list. Power and control follow player votes, Best overall the most loved rackets of the season."
  : "PadelRecs picks and lists ordered by player reviews, checked against player votes. Pick a list.";

/** The hub's groups (owner mock "Rankings hub", 2026-11-21): a title, a short line, and its lists in the mock's order. A list
 *  that matches no group goes in the last one; a group with no lists is left out. */
export const HUB_GROUPS: { title: string; sub: string; lists: RegExp[] }[] = [
  { title: "By how it plays", sub: "Power, control, or a bit of everything",
    lists: [/^best-padel-rackets$/, /^best-power-padel-rackets$/, /^best-control-padel-rackets$/] },
  { title: "By who you are", sub: "Your level and your arm",
    lists: [/^best-padel-rackets-for-beginners$/, /^best-padel-rackets-for-tennis-elbow$/, /^best-padel-rackets-20\d\d$/] },
  { title: "By shape", sub: "Round, teardrop or diamond", lists: [/^best-round-padel-rackets$/, /^best-teardrop-padel-rackets$/, /^best-diamond-padel-rackets$/] },
];
/** A list's place in its group (the mock's order), or -1 when no group names it. */
export const hubPlace = (g: (typeof HUB_GROUPS)[number], slug: string) => g.lists.findIndex(re => re.test(slug));

/** The mock's card lines, where they fit today's rules (Best overall: most loved, not "best-reviewed"). */
export const HUB_BLURB: Record<string, string> = {
  "best-padel-rackets": "The most loved rackets of the season.", "best-power-padel-rackets": "For smashes that reach the fence.",
  "best-control-padel-rackets": "Steady from the back, precise at the net.", "best-padel-rackets-for-beginners": "Forgiving while you learn.",
  "best-padel-rackets-for-tennis-elbow": "Soft, light and kind to your arm.", "best-round-padel-rackets": "Biggest sweet spots, easiest to play.",
  "best-teardrop-padel-rackets": "The all-rounder shape.", "best-diamond-padel-rackets": "Power first, for clean technique.",
};
/** "Best of 2025": last season's list. */
export const hubBlurb = (slug: string) => HUB_BLURB[slug] ?? (/^best-padel-rackets-20\d\d$/.test(slug) ? "Last season, often cheaper now." : null);
/** The card's title, as the mock writes it: "Best teardrop", not "Best teardrop rackets". */
export const hubTitle = (label: string) => label.replace(/\s+(padel\s+)?rackets$/i, "");
/** Each card's tile colour, in card order (the mock's pastels). */
export const HUB_TILES = ["#DDF4A6", "#FBE37A", "#DCE6F7", "#E4F2C9", "#DDEFE3", "#F6EEC6", "#EEE9DF", "#E3DFF5", "#F7E0D6"];

/** A curated rating (60-97) on the 0 to 10 scale the v3 pages show: 97 → "9.7". */
export const ratingTen = (n: number) => (Math.round(n) / 10).toFixed(1);

/** "How rankings work" (the mock's sections, rewritten to the honesty rules). */
export const HOW_INTRO = "What goes into each list, and what does not.";
export const HOW: { title: string; body: string[] }[] = [
  { title: "What counts", body: ["Reviews and votes left on PadelRecs, plus summaries of Reddit threads and YouTube reviews. Summaries are labelled and kept apart from votes cast here."] },
  { title: "How the order is set", body: [
    BY_VOTES ? "Best for power and Best for control are ordered by how many players pick each racket for power or control, the number on its \"Most picked for\" line. A racket needs 12 or more reviews, 10 or more players behind that answer, and that answer has to lead."
      : "Best for power and Best for control are PadelRecs picks: a top 10 chosen by PadelRecs, then checked against player reviews and votes.",
    "Best for beginners and Best for tennis elbow come from the PadelRecs match, the same one the home uses for those picks.",
    BY_LOVED ? "Best overall is this season's rackets ordered by how many players loved them, the count on each row. A racket needs 10 or more reviews. The best of last season and the shape lists are ordered by player reviews."
      : "Best overall, the best of last season and the shape lists are ordered by player reviews. A racket needs enough reviews to be listed.",
  ] },
  { title: "Most picked for", body: ["A row says \"Most picked for control · 26 players\" when that answer to \"How does it play?\" leads, with 5 or more players behind it. Otherwise the row shows no pill.", "Answers about the racket itself read quality first, such as \"Big sweet spot · 29 players\" or \"Easy on the arm · 18 players\"."] },
  { title: "Opinions", body: ["Each row counts the opinions on a racket: loved it, mixed or not for me. Counts only, never a score."] },
  { title: "What is not used", body: ["Brand payments, affiliate commission and price. The order is the same for every visitor; your match picks only change the order on the home and catalogue pages."] },
  { title: "How often it updates", body: [BY_VOTES ? "Review counts, opinions, pills and the vote-ordered lists refresh every few hours. PadelRecs reviews its picks from time to time."
    : "Review counts, opinions and pills on each row refresh every few hours. PadelRecs reviews its picks from time to time."] },
];
