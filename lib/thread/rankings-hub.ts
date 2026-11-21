// PadelRecs v3 rankings hub and "How rankings work" (owner handoff design_handoff_padelrecs_v3, 2026-11-21): the words and the
// one rule the two pages share. Pure, so tests feed plain inputs.
// Honesty rules (owner, over the mock's words):
//   - The power and control lists are PadelRecs picks, or (lib/thread/vote-order.ts "votes", owner test 2026-11-21) ordered by
//     how many players pick each racket for power or control; copy says which. Never "rankings change as new reviews come in".
//   - Category lists show their curated rating on a 0 to 10 scale ("Power rating 9.7"); no 0-100 score anywhere.
//   - Sentiment as counts only: "52 loved · 18 mixed · 14 not for me".

import { votesOrdered } from "./vote-order";
const BY_VOTES = votesOrdered("padel", "best-power-padel-rackets") && votesOrdered("padel", "best-control-padel-rackets");

/** The hub's lead (owner honesty rules 2026-11-21): says what orders the lists, never that rankings change with each review. */
export const HUB_LEAD = BY_VOTES ? "Lists ordered by player votes, PadelRecs picks and player reviews. Pick a list."
  : "PadelRecs picks and lists ordered by player reviews, checked against player votes. Pick a list.";

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
    "Best overall, the best of last season and the shape lists are ordered by player reviews. A racket needs enough reviews to be listed.",
  ] },
  { title: "Ratings", body: ["The category lists show a PadelRecs rating from 0 to 10, such as Power rating 9.7. It follows the list's order, and what players report about each racket nudges it within its place."] },
  { title: "Most picked for", body: ["A row says \"Most picked for control · 26 players\" when that answer to \"How does it play?\" leads, with 5 or more players behind it. Otherwise the row shows no pill."] },
  { title: "Opinions", body: ["Each row counts the opinions on a racket: loved it, mixed or not for me. Counts only, never a score."] },
  { title: "What is not used", body: ["Brand payments, affiliate commission and price. The order is the same for every visitor; your match picks only change the order on the home and catalogue pages."] },
  { title: "How often it updates", body: [BY_VOTES ? "Review counts, opinions, pills and the vote-ordered lists refresh every few hours. PadelRecs reviews its picks from time to time."
    : "Review counts, opinions and pills on each row refresh every few hours. PadelRecs reviews its picks from time to time."] },
];
