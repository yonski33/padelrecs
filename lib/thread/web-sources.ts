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
/** `person`: the site's word (AudioRecs: "listener", V3-ROLLOUT-BRIEF: never "owners"). */
export const playersWord = (t: string, person = "player") => t
  .replace(/(?<![\w-])([Aa])n owner\b/g, (_, a: string) => `${a} ${person}`)
  .replace(/(?<![\w-])([Oo])wner(s?)\b/g, (_, o: string, s: string) => `${o === "O" ? person[0].toUpperCase() : person[0]}${person.slice(1)}${s}`);

/** Under this many player reviews the page shows the compact strip and opens "From around the web" in full (owner
 *  2026-11-21: few-review pages look full but honest). One number, used by the page and the tests. */
export const THIN_REVIEWS = 3;
export const isThin = (players: number) => players < THIN_REVIEWS;
const n = (x: number) => x.toLocaleString("en-US");
/** The reviews header's count line: "1 player review · 13 from around the web" (the web part only when there is any). */
export const countLine = (players: number, web: number, person = "player") =>
  [`${n(players)} ${person} ${players === 1 ? "review" : "reviews"}`, web > 0 ? `${n(web)} from around the web` : ""].filter(Boolean).join(" · ");
export const webCount = <T>(w: WebGroups<T>) => w.threads.length + w.videos.length + w.comments.length + w.blogs.length;

/** One list (owner 2026-11-21, after #601): every outside card with its group, newest first across sources. */
export function webList<T extends { at?: string | null }>(w: WebGroups<T>): { c: T; kind: keyof WebGroups<T> }[] {
  return (["threads", "videos", "comments", "blogs"] as const).flatMap(kind => w[kind].map(c => ({ c, kind })))
    .sort((a, b) => (b.c.at ?? "").localeCompare(a.c.at ?? ""));
}
/** Cards shown before "Show more from around the web" on pages with THIN_REVIEWS+ player reviews (fewer: all open). */
export const WEB_FIRST = 6;
/** The box's count line, naming only the sources present: "18 summaries · Reddit, YouTube, blogs". */
export function webLine<T>(w: WebGroups<T>) {
  const total = webCount(w);
  const names = [w.threads.length + w.comments.length ? "Reddit" : "", w.videos.length ? "YouTube" : "", w.blogs.length ? "blogs" : ""].filter(Boolean);
  return `${n(total)} ${total === 1 ? "summary" : "summaries"}${names.length ? ` · ${names.join(", ")}` : ""}`;
}

// ── "From around the web" v2 (owner mock 2026-11-22, web-section-mock-owner.png): source tabs, one row per summary with a
// thumbnail or source tile, a bold headline and the sentiment on the right. lib/thread/sites.ts webV2Site switches it on.

/** The v2 tabs, in the mock's order. Reddit threads and comments share one tab. No counts on the tabs (owner choice). */
export type WebTab = "all" | "videos" | "reddit" | "blogs";
export const WEB_TABS: [WebTab, string][] = [["all", "All"], ["videos", "Videos"], ["reddit", "Reddit"], ["blogs", "Blogs"]];
export const tabOf = (kind: keyof WebGroups<unknown>): Exclude<WebTab, "all"> => kind === "videos" ? "videos" : kind === "blogs" ? "blogs" : "reddit";
/** The tabs to show: All plus each source that has a card. None at all when only one source is present (the tab would
 *  repeat All). */
export function webTabs<T>(w: WebGroups<T>): WebTab[] {
  const has = { videos: w.videos.length > 0, reddit: w.threads.length + w.comments.length > 0, blogs: w.blogs.length > 0 };
  const on = (["videos", "reddit", "blogs"] as const).filter(k => has[k]);
  return on.length > 1 ? ["all", ...on] : [];
}

/** The longest a headline quote may be (owner rule and the copyright rule: under 15 words). */
export const QUOTE_MAX_WORDS = 14;
const ENGLISH = /^[\x00-\x7F’‘–…é]+$/, STOP = /\b(the|it|is|was|and|i|my|for|but|this|with|very|really)\b/i;
/** A real short line from the source for the bold headline, or null. Only the stored excerpt counts, because it is the
 *  source's exact words (our summaries are paraphrase and never go in quote marks): the whole excerpt when it is short
 *  enough, else its first sentence, kept exactly (only a trailing comma or dash is dropped). Null when it is not English,
 *  starts mid-sentence, is a question, quotes someone, names a price or carries a link, so the row falls back to the
 *  summary without quote marks. */
export function shortQuote(excerpt?: string | null, lang?: string | null): string | null {
  if (!excerpt || (lang && lang !== "en")) return null;
  const t = excerpt.replace(/\s+/g, " ").trim();
  const words = (s: string) => s.split(" ").filter(Boolean).length;
  const first = t.match(/^.+?[.!](?=\s|$)/)?.[0] ?? t;
  const q = (words(t) <= QUOTE_MAX_WORDS ? t : first).replace(/[\s,;:–-]+$/, "");
  const n = words(q);
  if (n < 4 || n > QUOTE_MAX_WORDS) return null;
  if (!ENGLISH.test(q) || !STOP.test(q) || !/^[A-Z0-9]/.test(q) || /\?$/.test(q)) return null;
  if (/["“”]|—|https?:|www\.|\*|[$€£]\s?\d|\d\s?(€|eur|euros?|usd|dollars?|pounds?)\b/i.test(q)) return null;
  return q;
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** The row's date as the mock shows it: "Sep 21" this year, "Sep 21, 2024" before. From the stored YYYY-MM-DD, so it is the
 *  same on the server and in the browser. "" when there is no date. */
export function dayLabel(at: string | null | undefined, year = new Date().getUTCFullYear()): string {
  const m = at?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!MON[mo - 1] || !d) return "";
  return `${MON[mo - 1]} ${d}${y === year ? "" : `, ${y}`}`;
}
/** A YouTube link to a viewer comment (…&lc=…): a comment under that channel's video, not the channel's own review. */
export const isVideoComment = (url: string | null) => !!url && /[?&]lc=/.test(url);
/** Rows shown before "Show N more" (mock: 6). */
export const WEB_V2_FIRST = 6;
