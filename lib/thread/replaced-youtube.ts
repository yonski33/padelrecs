// PadelRecs (owner 2026-11-26, the YouTube redo): once a racket has its creator page, an old YouTube summary from the
// earlier lane whose video now has a checked creator review on the same racket is replaced. It drops out of the catalogue's
// web reviews, so the home "latest YouTube" box, the counts and the match evidence never show or count the same video
// twice. Rackets still on the usual page keep their old summaries: that page shows no creator reviews.
// The rows stay in the database; this only filters them. Pure, so tests feed plain rows.
import { videoOf } from "../youtube-pick";

export type CreatorVideo = { racketId: string; videoId: string | null; url?: string | null };
/** A page address without protocol, www, query, hash or trailing slash, to match a blog card with its old row. */
export const pageKey = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[?#].*$/, "").replace(/\/+$/, "");

/** The web reviews without the YouTube rows a creator review on a creator-page racket replaces. */
export function dropReplacedYouTube<E extends { racketId: string; sourcePlatform: string | null; sourceUrl: string }>(
  external: E[], cards: CreatorVideo[], pageIds: Set<string>): E[] {
  const replaced = new Set(cards.filter(c => c.videoId && pageIds.has(c.racketId)).map(c => `${c.racketId}|${c.videoId}`));
  // DiscGolfRecs and SkinRecs (2026-11-27): a blog card replaces the old row for the same page address too.
  const pages = new Set(cards.filter(c => !c.videoId && c.url && pageIds.has(c.racketId)).map(c => `${c.racketId}|${pageKey(c.url!)}`));
  if (!replaced.size && !pages.size) return external;
  return external.filter(e => {
    if (e.sourcePlatform === "Blog") return !pages.has(`${e.racketId}|${pageKey(e.sourceUrl)}`);
    // Viewer comments under the video (an "lc=" link) are other people's words and stay.
    if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) return true;
    const v = videoOf(e.sourceUrl);
    return !v || !replaced.has(`${e.racketId}|${v}`);
  });
}
