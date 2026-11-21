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
    BY_LOVED ? "Best overall is this season's rackets ordered by how many players loved them, the count on each row. A racket needs 10 or more reviews. The best of last season and the shape lists are ordered by player reviews."
      : "Best overall, the best of last season and the shape lists are ordered by player reviews. A racket needs enough reviews to be listed.",
  ] },
  { title: "Most picked for", body: ["A row says \"Most picked for control · 26 players\" when that answer to \"How does it play?\" leads, with 5 or more players behind it. Otherwise the row shows no pill."] },
  { title: "Opinions", body: ["Each row counts the opinions on a racket: loved it, mixed or not for me. Counts only, never a score."] },
  { title: "What is not used", body: ["Brand payments, affiliate commission and price. The order is the same for every visitor; your match picks only change the order on the home and catalogue pages."] },
  { title: "How often it updates", body: [BY_VOTES ? "Review counts, opinions, pills and the vote-ordered lists refresh every few hours. PadelRecs reviews its picks from time to time."
    : "Review counts, opinions and pills on each row refresh every few hours. PadelRecs reviews its picks from time to time."] },
];

/** SimRacingRecs' "How rankings work" (owner 2026-11-22: the score page retired): its lists as rankings-data.ts builds them.
 *  No score anywhere. */
export const SR_HOW: { title: string; body: string[] }[] = [
  { title: "What counts", body: ["Reviews and votes left on SimRacingRecs, plus summaries of Reddit threads, YouTube reviews and blogs. Summaries are labelled and kept apart from votes cast here."] },
  { title: "How the order is set", body: [
    "Best overall and the lists by gear type (wheelbases, wheels, pedals, cockpits, shifters and handbrakes) are ordered by racer reviews, from current gear with enough reviews to count.",
    "Best for beginners, on a budget, high-end and for console come from the SimRacingRecs match, the same one the home uses for those picks.",
  ] },
  { title: "The pill on each row", body: ["A row shows a pill when one answer to \"How does it drive?\" leads, with 5 or more racers behind it. Otherwise the row shows no pill."] },
  { title: "Opinions", body: ["Each row counts the opinions on a product: loved it, mixed or not for me. Counts only, never a score."] },
  { title: "What is not used", body: ["Brand payments, affiliate commission and price. The order is the same for every visitor; your match picks only change the order on the home and catalogue pages."] },
  { title: "How often it updates", body: ["Review counts, opinions and pills on each row refresh every few hours."] },
];

/** TennisRecs' "How rankings work" (on the v3 pages since #618): its live lists and the one match list. No score anywhere. */
export const TN_HOW: { title: string; body: string[] }[] = [
  { title: "What counts", body: ["Reviews and votes left on TennisRecs, plus summaries of Reddit threads, YouTube reviews and blogs. Summaries are labelled and kept apart from votes cast here."] },
  { title: "How the order is set", body: [
    "Best overall and the lists for power, control, spin and arm-friendly rackets are ordered by player reviews, from current rackets with enough reviews to count.",
    "Best for beginners comes from the TennisRecs match, the same one the home uses for that pick.",
  ] },
  { title: "The pill on each row", body: ["A row shows a pill when one answer to \"How does it play?\" leads, with 5 or more players behind it. Otherwise the row shows no pill."] },
  { title: "Opinions", body: ["Each row counts the opinions on a racket: loved it, mixed or not for me. Counts only, never a score."] },
  { title: "What is not used", body: ["Brand payments, affiliate commission and price. The order is the same for every visitor; your match picks only change the order on the home and catalogue pages."] },
  { title: "How often it updates", body: ["Review counts, opinions and pills on each row refresh every few hours."] },
];

/** PickleballRecs' "How rankings work" (on the v3 pages since #616): its live lists and the shape lists. No score anywhere. */
export const PB_HOW: { title: string; body: string[] }[] = [
  { title: "What counts", body: ["Reviews and votes left on PickleballRecs, plus summaries of Reddit threads, YouTube reviews and blogs. Summaries are labelled and kept apart from votes cast here."] },
  { title: "How the order is set", body: [
    "Best overall and the lists for power, control, spin, tennis elbow and beginners are ordered by player reviews, from current paddles with enough reviews to count.",
    "The shape lists (standard, elongated and hybrid) are ordered the same way, within each shape.",
  ] },
  { title: "The pill on each row", body: ["A row shows a pill when one answer to \"How does it play?\" leads, with 5 or more players behind it. Otherwise the row shows no pill."] },
  { title: "Opinions", body: ["Each row counts the opinions on a paddle: loved it, mixed or not for me. Counts only, never a score."] },
  { title: "What is not used", body: ["Brand payments, affiliate commission and price. The order is the same for every visitor; your match picks only change the order on the home and catalogue pages."] },
  { title: "How often it updates", body: ["Review counts, opinions and pills on each row refresh every few hours."] },
];

/** AudioRecs' "How rankings work" (V3-ROLLOUT-BRIEF): the same honesty rules for its lists. No score anywhere. */
export const AUDIO_HOW: { title: string; body: string[] }[] = [
  { title: "What counts", body: ["Reviews and votes left on AudioRecs, plus summaries of Reddit threads, YouTube reviews and blogs. Summaries are labelled and kept apart from votes cast here."] },
  { title: "How the order is set", body: [
    "Best headphones, Best IEMs, Best earbuds and Best noise cancelling are ordered by listener reviews: how many loved each pair, from pairs with enough reviews.",
    "Best overall and Best open-back go by how many listeners loved each pair. A pair needs 10 or more reviews.",
    "Best for commuting, the office, home listening and the gym come from the AudioRecs match, the same one the home uses for those picks. A pair with a catch for that use, such as an open-back on the commute, is left out.",
  ] },
  { title: "The pill on each row", body: ["A row says \"Great noise cancelling · 13 listeners\" when that answer to \"How does it sound?\" leads, with 5 or more listeners behind it. Otherwise the row shows no pill."] },
  { title: "Opinions", body: ["Each row counts the opinions on a pair: loved it, mixed or not for me. Counts only, never a score."] },
  { title: "What is not used", body: ["Brand payments, affiliate commission and price. The order is the same for every visitor; your match picks only change the order on the home and catalogue pages."] },
  { title: "How often it updates", body: ["Review counts, opinions and pills on each row refresh every few hours."] },
];

/** DiscGolfRecs' "How rankings work" (V3-ROLLOUT-BRIEF wave 2): its lists in the same honesty rules. No score anywhere. */
export const DISCGOLF_HOW: { title: string; body: string[] }[] = [
  { title: "What counts", body: ["Reviews and votes left on DiscGolfRecs, plus summaries of Reddit threads, YouTube reviews and blogs. Summaries are labelled and kept apart from votes cast here."] },
  { title: "How the order is set", body: [
    "Best overall goes by how many players loved each disc, from current discs with 10 or more reviews.",
    "The putter, midrange, fairway and distance driver lists are ordered by player reviews, from discs with enough reviews.",
    "Best for beginners and Best for slow arm speed come from the DiscGolfRecs match, the same one the home uses for those picks.",
  ] },
  { title: "The pill on each row", body: ["A row says \"Flies straight · 12 players\" when that answer to \"How does it fly?\" leads, with 5 or more players behind it. Otherwise the row shows no pill."] },
  { title: "Opinions", body: ["Each row counts the opinions on a disc: loved it, mixed or not for me. Counts only, never a score."] },
  { title: "What is not used", body: ["Brand payments, affiliate commission and price. The order is the same for every visitor; your match picks only change the order on the home and catalogue pages."] },
  { title: "How often it updates", body: ["Review counts, opinions and pills on each row refresh every few hours."] },
];
