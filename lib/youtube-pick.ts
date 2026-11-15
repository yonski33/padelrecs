// One YouTube card per channel on a product page (owner 2026-11-15: "we can use the info back stage, but when we show it … only
// show 1 per channel, just pick the main one that he is talking just about the racket (if that exist)"). Every row still feeds
// the scores; only the Reviews section's cards are picked here. Pure, so tests feed plain rows.

export type YtRow = { id: string; sourceName: string; sourceUrl: string; sourceDate: string | null; summary: string | null };
const isComment = (url: string) => /[?&]lc=/.test(url);
/** The video's id ("v=" or youtu.be/<id>), the same for a video and the comments under it. */
export function videoOf(url: string): string | null {
  try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; }
}

/** Per channel, the one row to show: the channel's own video about this product alone (one product in that video), else its
 *  video covering the fewest products, else (no video of its own) its newest viewer comment. Ties: a summary, then the newest.
 *  `productsInVideo` counts the products each video id is filed under (comparisons and round-ups count more than one). */
export function onePerChannel<T extends YtRow>(rows: T[], productsInVideo: (video: string) => number): T[] {
  const by = new Map<string, T[]>();
  for (const r of rows) { const k = r.sourceName.trim().toLowerCase(); by.set(k, [...by.get(k) ?? [], r]); }
  return [...by.values()].map(rs => [...rs].sort((a, b) =>
    Number(isComment(a.sourceUrl)) - Number(isComment(b.sourceUrl))
    || (isComment(a.sourceUrl) ? 0 : productsInVideo(videoOf(a.sourceUrl) ?? "") - productsInVideo(videoOf(b.sourceUrl) ?? ""))
    || Number(!a.summary) - Number(!b.summary)
    || (b.sourceDate ?? "").localeCompare(a.sourceDate ?? ""))[0]);
}
