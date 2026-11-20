// Written TL;DRs (DiscGolfRecs and PadelRecs pilot, 2026-11-20; shape from the padel v7b page, owner): an "In short" summary
// (rackets.review_summary, db/summaries/<niche>.json, npm run db:set-summaries) written as
//   a 1-2 sentence summary on the first line, then
//   2-4 bullets, one per line, each starting with its dot: "+ " green (praise), "~ " orange (mixed), "- " red (complaint).
// Bullets carry no counts ("Players love…", "Some players…", "A common complaint is…"); the counts and review ids behind
// each one live in the drafts file, not on the page. Such a summary is the product page's TL;DR, ahead of the page
// content and the tag-count lines. A one-paragraph summary (every summary before this pilot) is left alone.

export const TLDR_LINE_MAX = 105;

export type TldrTone = "pos" | "mix" | "neg";
export type WrittenTldr = { lead: string; bullets: { tone: TldrTone; text: string }[] };

const TONE: Record<string, TldrTone> = { "+": "pos", "~": "mix", "-": "neg" };

/** The summary as a TL;DR when it is written that way, else null. Each sentence of the lead and each bullet is at most
 *  105 characters. */
export function writtenTldr(summary: string | null | undefined): WrittenTldr | null {
  if (!summary || !summary.includes("\n")) return null;
  const [lead, ...rest] = summary.split("\n").map(l => l.trim()).filter(Boolean);
  if (!lead || TONE[lead[0]] && lead[1] === " " || rest.length < 2 || rest.length > 4) return null;
  if (lead.split(/(?<=[.!?])\s+/).some(s => s.length > TLDR_LINE_MAX)) return null;
  const bullets = rest.map(l => ({ tone: TONE[l[0]], text: l.slice(2).trim() }));
  if (rest.some(l => !TONE[l[0]] || l[1] !== " ") || bullets.some(b => !b.text || b.text.length > TLDR_LINE_MAX)) return null;
  return { lead, bullets };
}
