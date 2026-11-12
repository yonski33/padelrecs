// How a web review credits its source. A YouTube link with an lc= parameter points at one viewer's comment, so the channel
// name on it is where the comment was left, not who wrote it. Worked out from the link so every site and past review gets it.
type Source = { sourcePlatform: string; sourceName?: string | null; sourceUrl?: string | null };

/** Blogs and other websites were filed as "Other" until 2026-11-12; they show, import and edit as "Blog". */
export const platformName = (platform: string) => platform === "Other" ? "Blog" : platform;

export const isYouTubeComment = ({ sourcePlatform, sourceUrl }: Source) => sourcePlatform === "YouTube" && !!sourceUrl && /[?&]lc=/.test(sourceUrl);

export function sourceLabel(source: Source) {
  const name = source.sourceName && source.sourceName !== source.sourcePlatform ? source.sourceName : null;
  return isYouTubeComment(source)
    ? { platform: "YouTube comment", name: name && `on ${name}` }
    : { platform: platformName(source.sourcePlatform), name };
}

/** A Reddit link to one comment carries the comment's id after the thread's: /r/x/comments/<post>/<slug>/<comment>/
 *  (or ?comment=…). A link that stops at the slug is the post itself. */
export const isRedditComment = ({ sourcePlatform, sourceUrl }: Source) => sourcePlatform === "Reddit" && !!sourceUrl
  && (/\/comments\/[a-z0-9]+\/[^/?#]*\/[a-z0-9]+/i.test(sourceUrl) || /\/comment\/[a-z0-9]+/i.test(sourceUrl) || /[?&]comment=/.test(sourceUrl));

/** What a summary is a summary of (owner, 2026-11-13): "Reddit comment", "Reddit post", "YouTube video", "blog post". */
export function summaryKind(source: Source) {
  if (isYouTubeComment(source)) return "YouTube comment";
  const p = platformName(source.sourcePlatform);
  if (p === "Reddit") return isRedditComment(source) ? "Reddit comment" : "Reddit post";
  if (p === "YouTube") return "YouTube video";
  if (p === "Blog") return "blog post";
  return `${p} post`;
}
