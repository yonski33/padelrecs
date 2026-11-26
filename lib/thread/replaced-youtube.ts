// PadelRecs (owner 2026-11-26, the YouTube redo): once a racket has its creator page, an old YouTube summary from the
// earlier lane whose video now has a checked creator review on the same racket is replaced. It drops out of the catalogue's
// web reviews, so the home "latest YouTube" box, the counts and the match evidence never show or count the same video
// twice. Rackets still on the usual page keep their old summaries: that page shows no creator reviews.
// The rows stay in the database; this only filters them. Pure, so tests feed plain rows.
import { videoOf } from "../youtube-pick";

export type CreatorVideo = { racketId: string; videoId: string | null };

/** The web reviews without the YouTube rows a creator review on a creator-page racket replaces. */
export function dropReplacedYouTube<E extends { racketId: string; sourcePlatform: string | null; sourceUrl: string }>(
  external: E[], cards: CreatorVideo[], pageIds: Set<string>): E[] {
  const replaced = new Set(cards.filter(c => c.videoId && pageIds.has(c.racketId)).map(c => `${c.racketId}|${c.videoId}`));
  if (!replaced.size) return external;
  return external.filter(e => {
    // Viewer comments under the video (an "lc=" link) are other people's words and stay.
    if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) return true;
    const v = videoOf(e.sourceUrl);
    return !v || !replaced.has(`${e.racketId}|${v}`);
  });
}
