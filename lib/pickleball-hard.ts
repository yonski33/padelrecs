// PickleballRecs' hard rules for the match (Grok audit 2026-11-17 #1 #2 #6, owner-approved plan): a paddle whose own page tells
// beginners or sore arms to skip it is held under "Worth a look" for them everywhere the match shows (fit check, home, lists),
// the same way DiscGolfRecs reads its pages (lib/discgolf-hard.ts). The page's own words are the reason. Pure, for tests.
import pages from "../db/racket-page/pickleball.json";
import type { SiteRules } from "./discgolf-hard";

type Item = { title: string; t: string };
type Page = { bottom?: string; tagline?: string; no?: Item[] };
const PAGES = pages as Record<string, Page>;
const plain = (t: string) => t.replace(/==/g, "").replace(/\s+/g, " ").trim();

/** "Not a first paddle", "Not for beginners", or a bottom line telling beginners to skip it or go softer. */
const BEGINNER_ITEM = /\b(not a first paddle|not for (new players|beginners)|beginners? (should )?(skip|look elsewhere))\b/i;
const BEGINNER_BOTTOM = /\bbeginners?(:|,)?\s*(should\s+)?(skip|go softer|look elsewhere|start (with|on) something)/i;
/** "Can hurt sore arms", "Not for sore arms / elbows", "Rough on the elbow". */
const ARM_ITEM = /\b(sore (arms?|elbows?|wrists?)|tennis elbow|(hard|rough|harsh) on the (arm|elbow|wrist)s?|elbow pain)\b/i;

/** `noLevel`: the paddle has no level data (suits), so the bottom line's own "For intermediates…" counts. */
export function paddleRules(p: { slug: string }, noLevel = false, page: Page | undefined = PAGES[p.slug]): SiteRules {
  if (!page) return {};
  const hard: NonNullable<SiteRules["hard"]> = {};
  const beg = (page.no ?? []).find(i => BEGINNER_ITEM.test(i.title) || BEGINNER_ITEM.test(i.t));
  const bottomSays = page.bottom && BEGINNER_BOTTOM.test(plain(page.bottom)) ? page.bottom.split(/(?<=\.)\s+/).find(x => BEGINNER_BOTTOM.test(plain(x))) : undefined;
  // The bottom line's own level ("For intermediates who want calm power."): with no beginner in it, not a beginner's paddle.
  // Used only where the paddle has no level data (`noLevel`); where it has some, the shared level (suits) decides.
  const first = plain(page.bottom ?? "").split(/(?<=\.)\s+/)[0] ?? "";
  const forOthers = noLevel && /^for (intermediates?|advanced|experienced|strong|competitive|3\.5|4\.0)/i.test(first) && !/beginner|new player|any level/i.test(first);
  if (beg) hard.beginner = `${plain(beg.title)}: ${plain(beg.t)}`;
  else if (bottomSays) hard.beginner = plain(bottomSays);
  else if (forOthers) hard.beginner = first;
  const arm = (page.no ?? []).find(i => ARM_ITEM.test(i.title) || ARM_ITEM.test(i.t));
  if (arm) hard.arm = `${plain(arm.title)}: ${plain(arm.t)}`;
  return Object.keys(hard).length ? { hard } : {};
}
