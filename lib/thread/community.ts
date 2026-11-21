// PadelRecs racket page sidebar (owner OK 2026-11-21, "yeah this is better"): community cards, not a shop. Pure, so tests feed
// plain counts. The data comes from app/thread/community-data.ts.
import { PILL_MIN, PILL_LEAD } from "./vote-pill";

/** "3 new opinions · 2 posts this week": real counts from the last 7 days. Posts are top-level Ask the community posts;
 *  nothing marks a post as a question, so the line never says "questions". A part at 0 is left out; both 0 → null. */
export function weekLine(opinions: number, posts: number): string | null {
  const parts = [opinions > 0 ? `${opinions} new ${opinions === 1 ? "opinion" : "opinions"}` : null, posts > 0 ? `${posts} ${posts === 1 ? "post" : "posts"}` : null].filter(Boolean);
  return parts.length ? `${parts.join(" · ")} this week` : null;
}

/** "Who plays it": the groups it reads, in row order, with the words the rows and headline use. Only real vote options. */
const WHO: { key: string; title: string; words: Record<string, string> }[] = [
  { key: "level", title: "Level", words: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } },
  { key: "plays_like", title: "Style", words: { power: "Power", control: "Control", all_round: "All-round" } },
  { key: "side", title: "Side", words: { right: "Right side", left: "Left side", both: "Both sides" } },
];
export type WhoRow = { title: string; label: string; n: number; share: number };
/** The leading answer per group, kept only with 5+ behind it and 1.5x the runner-up (the vote pill's rule). The headline
 *  is the style and side leaders (owner 2026-11-21: "Control, right side"); style alone without a side, side alone without a
 *  style, and "Mostly advanced" when only the level has a leader; no rows → null. */
export function whoPlays(groups: Record<string, Record<string, number> | null | undefined>): { headline: string; rows: WhoRow[] } | null {
  const rows: (WhoRow & { key: string })[] = [];
  for (const g of WHO) {
    const opts = Object.entries(groups[g.key] ?? {}).filter(([k, n]) => n > 0 && g.words[k]).sort((a, b) => b[1] - a[1]);
    if (!opts.length) continue;
    const [top, n] = opts[0], second = opts[1]?.[1] ?? 0, total = opts.reduce((s, [, x]) => s + x, 0);
    if (n < PILL_MIN || n < PILL_LEAD * second) continue;
    rows.push({ key: g.key, title: g.title, label: g.words[top], n, share: n / total });
  }
  if (!rows.length) return null;
  const of = (k: string) => rows.find(r => r.key === k)?.label, style = of("plays_like"), side = of("side");
  const headline = style || side ? [style, side && (style ? side.toLowerCase() : side)].filter(Boolean).join(", ") : `Mostly ${of("level")!.toLowerCase()}`;
  return { headline, rows: rows.map(r => ({ title: r.title, label: r.label, n: r.n, share: r.share })) };
}
