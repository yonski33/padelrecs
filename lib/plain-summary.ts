/** Summaries are written about "the reviewer"; on a review card that's implied, so the lead word goes:
 *  "Reviewer says Mooncat lasts" → "Mooncat lasts", "Reviewer loves" → "Loves". "Reviewer with long nails…" keeps it. */
export function plainSummary(text: string) {
  const said = text.match(/^(?:The )?[Rr]eviewer (?:says|said|notes|reports|writes|thinks|feels)(?: that)? (\S)/);
  if (said) return said[1].toUpperCase() + text.slice(said[0].length);
  const verb = text.match(/^(?:The )?[Rr]eviewer (?!with\b|who\b|whose\b|and\b|on\b|in\b|from\b)([a-z])/);
  return verb ? verb[1].toUpperCase() + text.slice(verb[0].length) : text;
}

