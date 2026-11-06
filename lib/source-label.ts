// How a web review credits its source. A YouTube link with an lc= parameter points at one viewer's comment, so the channel
// name on it is where the comment was left, not who wrote it. Worked out from the link so every site and past review gets it.
type Source = { sourcePlatform: string; sourceName?: string | null; sourceUrl?: string | null };

export const isYouTubeComment = ({ sourcePlatform, sourceUrl }: Source) => sourcePlatform === "YouTube" && !!sourceUrl && /[?&]lc=/.test(sourceUrl);

export function sourceLabel(source: Source) {
  const name = source.sourceName && source.sourceName !== source.sourcePlatform ? source.sourceName : null;
  return isYouTubeComment(source)
    ? { platform: "YouTube comment", name: name && `on ${name}` }
    : { platform: source.sourcePlatform, name };
}
