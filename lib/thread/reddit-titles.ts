// Reddit thread titles for the v2 web section's link line (PM 2026-11-22: titles made from the URL slug read cut off,
// "Best padel racket for someone struggling with", because Reddit cuts slugs at 50 characters). The real titles come from
// Reddit's /api/info (scripts/reddit-titles-fetch.mjs → scripts/reddit-titles-build.mts → db/reddit-titles/<site>.json).
// Pure, so the tests see exactly what the page shows.

/** Reddit cuts a post's URL slug at about 50 characters, at a word boundary, so a slug this long may have lost its end. */
export const SLUG_CUT = 40;
export const THREAD_LINK = "View the thread on Reddit";
/** With " ↗" the link line stays within the 105-character rule. */
const MAX = 103;

/** A thread's title as the page may show it, or null: no emoji, em dashes as " - " (site copy rule), spaces tidied. Null
 *  when it names a price (no prices on the site), is longer than MAX or was removed. */
export function cleanTitle(title?: string | null): string | null {
  if (!title || /^\[(deleted|removed)/i.test(title)) return null;
  const t = title.replace(/\p{Extended_Pictographic}|️|‍/gu, "").replace(/\s*—\s*/g, " - ").replace(/\s+/g, " ").trim();
  if (t.length < 4 || t.length > MAX) return null;
  if (/[$€£]\s?\d|\d\s?(€|£|\$|eur|euros?|usd|dollars?|pounds?|gbp)\b/i.test(t)) return null;
  return t;
}

/** The post id in a Reddit link ("…/comments/1vk5zp9/…" → "1vk5zp9"). */
export const postIdOf = (url: string | null) => url?.match(/\/comments\/([a-z0-9]+)/i)?.[1]?.toLowerCase() ?? null;

/** The link line for one Reddit card: the stored real title; else the slug's words when the slug is short enough to be
 *  whole (`slugTitle`, lib/thread/web-sources.ts threadTitle); else the plain "View the thread on Reddit". */
export function threadLinkText(url: string | null, titles: Record<string, string>, slugTitle: (u: string | null) => string | null): string {
  const id = postIdOf(url), stored = id ? titles[id] : undefined;
  if (stored) return stored;
  const slug = url?.match(/\/comments\/[a-z0-9]+\/([^/?#]+)/i)?.[1] ?? "";
  return (slug.length < SLUG_CUT && slugTitle(url)) || THREAD_LINK;
}
