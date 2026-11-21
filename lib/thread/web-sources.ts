// PadelRecs racket page (owner mock 2026-11-21): player reviews and outside sources in two sections. "Player reviews (N)"
// holds only reviews written on the site; "From around the web" holds the Reddit, YouTube and blog summaries, grouped by
// source, two of each until "Show more from around the web". Display only: the poll and the score read the same rows as
// before (lib/score.ts, the trait votes), never these groups. Pure, so the tests see exactly what the page shows.

type Card = { kind: string; url: string | null };
export type WebGroups<T> = { threads: T[]; videos: T[]; comments: T[]; blogs: T[] };

/** A Reddit link to one comment: /comments/<post>/<slug>/<comment>. A link to the post itself is a thread. */
const COMMENT = /\/comments\/[a-z0-9]+\/[^/?#]*\/[a-z0-9]+/i;

/** The page's cards split the mock's way: the site's own reviews, then each outside source's group. */
export function splitSources<T extends Card>(cards: T[]): { players: T[]; web: WebGroups<T> } {
  const reddit = cards.filter(c => c.kind === "reddit");
  return { players: cards.filter(c => c.kind === "player"), web: {
    threads: reddit.filter(c => !c.url || !COMMENT.test(c.url)),
    videos: cards.filter(c => c.kind === "youtube"),
    comments: reddit.filter(c => !!c.url && COMMENT.test(c.url)),
    blogs: cards.filter(c => c.kind === "blog" || c.kind === "forum"),
  } };
}

/** A Reddit thread's title from its link ("…/comments/1vk5zp9/metalbone_ctrl_for_a_left_side_player/" →
 *  "Metalbone ctrl for a left side player"); null when the link carries none worth showing. */
export function threadTitle(url: string | null): string | null {
  const slug = url?.match(/\/comments\/[a-z0-9]+\/([^/?#]+)/i)?.[1];
  if (!slug) return null;
  let t: string;
  try { t = decodeURIComponent(slug); } catch { t = slug; }
  t = t.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  return t.split(" ").length >= 3 ? t[0]!.toUpperCase() + t.slice(1) : null;
}

/** The video's id from a YouTube link (watch?v=, youtu.be/, shorts/, embed/), else null. */
export function videoId(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url), host = u.hostname.replace(/^www\.|^m\./, "");
    const id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null;
    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch { return null; }
}

/** The video's real thumbnail (YouTube's own image host), 320×180. */
export const thumbOf = (url: string | null) => { const id = videoId(url); return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null; };

/** Owner 2026-11-21: summaries say "players", never "owners". */
export const playersWord = (t: string) => t
  .replace(/(?<![\w-])([Aa])n owner\b/g, (_, a: string) => `${a} player`)
  .replace(/(?<![\w-])([Oo])wner(s?)\b/g, (_, o: string, s: string) => `${o === "O" ? "P" : "p"}layer${s}`);
