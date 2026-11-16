// What a disc page tells newer players and slower arms (DiscGolfRecs match audit 2026-11-16, item 1): "Beginners should skip
// it", "Newer players … should skip it", "Not a first disc", "Slow arms … should skip it". The page content
// (db/racket-page/discgolf.json) is read here, on the server only, and the flags go into the match payload, so the ranking
// honours the page's own advice. Pure over the page text, so tests feed plain strings.
import pages from "../db/racket-page/discgolf.json";

const BEGINNER = /\b(beginners?|newer players|new players|newer arms|new throwers|newer throwers)\b[^.]*\bshould skip it\b|\bnot a first disc\b/i;
const SLOW_ARM = /\bslow(er)? arms?\b[^.]*\bshould skip it\b/i;
/** The page's skip flags for a text (the page's tagline and bottom line). */
export function skipsIn(text: string): { beginner: boolean; arm: boolean } {
  return { beginner: BEGINNER.test(text), arm: SLOW_ARM.test(text) };
}
const PAGES = pages as Record<string, { tagline?: string; bottom?: string }>;
/** The skip flags on a disc's page, by slug (none without a page). */
export function pageSkips(slug: string): { beginner: boolean; arm: boolean } {
  const p = PAGES[slug];
  return p ? skipsIn(`${p.tagline ?? ""} ${p.bottom ?? ""}`) : { beginner: false, arm: false };
}
