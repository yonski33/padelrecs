// The creator page's play-style tag (Grok audit 2026-11-24: about 20 paddles were tagged "Control" while their TL;DR said
// "Strong power", or "Power" while most reviewers rated power Okay). The tag comes from the How it plays bars (lab and
// reviewer data, lib/fit-verdict.ts styleOf). Data only, never a guess: when the creator reviews on the same page clearly
// lean the other way, the tag follows them only if the players' "Plays like" vote agrees with them; otherwise no style tag.
import { WORDS, type Word } from "./creators";

export type Style = "control" | "power" | "balance";
type Attr = { counts: number[]; n: number } | null;

/** The middle word of an attribute's ratings (as How it plays shows it), as a rank: 0 = Excellent … 4 = Weak. */
const middle = (a: Attr) => {
  if (!a || a.n < 2) return null;
  const words = WORDS.flatMap((w, i) => Array<Word>(a.counts[i] ?? 0).fill(w));
  return WORDS.indexOf(words[Math.floor(words.length / 2)]!);
};
/** The creator reviews' lean: power when they rate power a word higher than control, control the other way round. */
export function reviewerLean(power: Attr, control: Attr): "power" | "control" | null {
  const p = middle(power), c = middle(control);
  if (p == null || c == null || p === c) return null;
  return p < c ? "power" : "control";
}
/** The players' "Plays like" vote (imported review counts plus real votes): power or control when it leads the other 1.5 to 1. */
export function voteLean(plays: Record<string, number> | null | undefined): "power" | "control" | null {
  const p = plays?.power ?? 0, c = plays?.control ?? 0;
  if (p + c < 5) return null;
  return p >= 1.5 * c ? "power" : c >= 1.5 * p ? "control" : null;
}
/** The tag to show: the bars' style unless the reviewers clearly disagree; then theirs if the vote backs it, else none. */
export function styleTag(bars: Style | null, reviewers: "power" | "control" | null, votes: "power" | "control" | null): Style | null {
  if (!reviewers || !bars || bars === "balance" || bars === reviewers) return bars;
  return votes === reviewers ? reviewers : null;
}
/** The level part of the catalogue's "best for" line only ("intermediate → advanced" as "Intermediate to advanced"); a style
 *  ("control players") is not a level, so it is not shown as one. */
export function levelTag(best: string | null | undefined): string | null {
  const first = best?.split(",")[0]?.replace(/\s*(→|->)\s*/g, " to ").trim();
  if (!first || !/\b(beginner|intermediate|advanced)s?\b/i.test(first)) return null;
  return `${first[0]!.toUpperCase()}${first.slice(1)}`;
}
