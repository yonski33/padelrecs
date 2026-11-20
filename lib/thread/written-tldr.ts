// Written TL;DRs (DiscGolfRecs pilot, 2026-11-20): an "In short" summary (rackets.review_summary, db/summaries/<niche>.json,
// npm run db:set-summaries) written as 2-3 short lines, one per line break: what the product is for, who it suits, and one
// thing to watch out for. Such a summary is the product page's TL;DR, ahead of the page content and the tag-count lines.
// A one-paragraph summary (every summary before this pilot) has no line breaks and is left alone.

export const TLDR_LINE_MAX = 105;

export type WrittenTldr = { lead: string; bullets: { tone: "pos" | "catch"; text: string }[] };

/** The summary as TL;DR lines when it is written that way (2-3 lines, each at most 105 characters), else null. The first line
 *  is the lead; a line starting "Watch out" is a catch, any other a plus. */
export function writtenTldr(summary: string | null | undefined): WrittenTldr | null {
  if (!summary || !summary.includes("\n")) return null;
  const lines = summary.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 3 || lines.some(l => l.length > TLDR_LINE_MAX)) return null;
  return { lead: lines[0], bullets: lines.slice(1).map(text => ({ tone: /^watch out\b/i.test(text) ? "catch" as const : "pos" as const, text })) };
}
