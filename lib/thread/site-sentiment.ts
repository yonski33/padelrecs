// Site sentiment for creator-page sites (owner 2026-11-22, after #649 went live): the Loved it / Mixed / Not for me bar and its
// counts come from the site's own players (their reviews and quick votes, the thread rows' pos/mix/neg, the same data the
// rankings use since PR #600), never from the creator reviews, which are few and almost all positive. Creator reviews keep
// their own place: their cards, and a praise line that never looks like a score. Pure and word-driven, so SkinRecs can use it
// with its own words ("people", "community") when it gets a creator page.
export type Sentiment = { pos: number; mix: number; neg: number; total: number };
export const siteSentiment = (row: { pos: number; mix: number; neg: number } | null | undefined): Sentiment => {
  const pos = row?.pos ?? 0, mix = row?.mix ?? 0, neg = row?.neg ?? 0;
  return { pos, mix, neg, total: pos + mix + neg };
};
/** "155 loved · 64 mixed · 65 not for me". */
export const countsLine = (s: Sentiment) => `${s.pos} loved · ${s.mix} mixed · ${s.neg} not for me`;
/** "284 player opinions" (`person`: the site's word, lib/thread/words.ts). */
export const opinionsLabel = (n: number, person: string) => `${n.toLocaleString("en-US")} ${person} opinion${n === 1 ? "" : "s"}`;
/** The head's one line: "155 of 284 players loved it, 64 were mixed and 65 found it not for them." Null with no votes. */
export function sentimentSentence(s: Sentiment, people: string): string | null {
  if (!s.total) return null;
  return `${s.pos.toLocaleString("en-US")} of ${s.total.toLocaleString("en-US")} ${people} loved it${s.mix ? `, ${s.mix} were mixed` : ""}${s.neg ? ` and ${s.neg} found it not for them` : ""}.`;
}
/** A stance card's share: "55% of players". */
export const shareLine = (n: number, s: Sentiment, people: string) => s.total ? `${Math.round(n / s.total * 100)}% of ${people}` : `No ${people} yet`;
