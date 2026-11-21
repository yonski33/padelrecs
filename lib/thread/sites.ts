// Which sites run the Thread look, their go-live flags and the Thread addresses that moved. No imports, so next.config.ts can
// load it (lib/niche resolves through the "@/lib/niche/selected" alias, which the config loader doesn't know). lib/thread/look.ts
// re-exports all of it for the pages and proxy.ts.

/** THE go-live flags, per site (owner 2026-11-19): true = Thread is the default look on the normal addresses and
 *  ?look=classic shows the current live pages; false = the live pages are the default and ?look=thread previews Thread.
 *  Roll a site back by setting it to false. */
export const THREAD_DEFAULTS: Record<string, boolean> = { padel: true, pickleball: true, stackrecs: true, skin: true, discgolf: true, audio: true, simracing: true, tennis: true };
export const threadDefaultFor = (nicheId: string) => THREAD_DEFAULTS[nicheId] ?? false;
/** PadelRecs (the pilot), PickleballRecs (owner 2026-11-19: next after padel), StackRecs (Build + Grow pilot, owner
 *  2026-11-19), which is built on the Thread pages from the start, SkinRecs and DiscGolfRecs (owner 2026-11-20), AudioRecs
 *  (owner design handoff 2026-11-21). */
export const threadSite = (nicheId: string) => nicheId === "padel" || nicheId === "pickleball" || nicheId === "stackrecs" || nicheId === "skin"
  || nicheId === "discgolf" || nicheId === "audio" || nicheId === "simracing" || nicheId === "tennis";
/** Thread addresses that moved (a 301 from the old one, next.config.ts redirects): the sore-arms ranking is named for tennis
 *  elbow (owner 2026-11-19). */
/** The tennis elbow ranking's slug: the ranking, the elbow guide's picks and links, and the home's Top picks all read it. */
export const ELBOW_SLUG = "best-padel-rackets-for-tennis-elbow";
export const THREAD_MOVED: { from: string; to: string }[] = [
  { from: "/rankings/best-padel-rackets-for-sore-arms", to: `/rankings/${ELBOW_SLUG}` },
];
/** Optional accounts (#516, drizzle/0028): PadelRecs, PickleballRecs and SkinRecs (owner 2026-11-20: the same as padel;
 *  on skin the level and side fields are the review form's Skin type and Main concern; DiscGolfRecs
 *  (owner 2026-11-20): Level and Throw, RHBH and the like). A site here
 *  needs 0028 (and 0030, trusted members) applied to its schema first. Elsewhere the account pages and APIs answer 404. */
export const ACCOUNT_SITES = ["padel", "pickleball", "skin", "discgolf"];
/** Member stories (owner 2026-11-20): a PadelRecs pilot. */
export const storiesSite = (nicheId: string) => nicheId === "padel";
/** Following a racket page with a daily email (drizzle/0034, owner 2026-11-21): PadelRecs first. Another site needs 0034 on
 *  its schema, then its id here. */
export const FOLLOW_SITES = ["padel"];
export const followSite = (nicheId: string) => FOLLOW_SITES.includes(nicheId);
export const accountSite = (nicheId: string) => ACCOUNT_SITES.includes(nicheId);
/** Each Thread site's quick match, as its home shows it: "engine" = level · style · arm (app/thread/live/lists.tsx MatchBox,
 *  with the site's own styles and arm words), "skin" = skin type · goal · sensitive (live/skin-match.tsx). A site not listed
 *  has none, so its ranking pages show no "See how you match" card (owner report 2026-11-21: SkinRecs showed padel's). */
export const QUICK_MATCH: Record<string, "engine" | "skin"> = { padel: "engine", pickleball: "engine", discgolf: "engine", skin: "skin", tennis: "engine" };
export const quickMatchFor = (nicheId: string) => QUICK_MATCH[nicheId] ?? null;
/** The PadelRecs v3 pages (home, catalogue, product page, compare, rankings; owner 2026-11-21) and the sites rolled onto them
 *  (V3-ROLLOUT-BRIEF: AudioRecs first). No score anywhere on these. */
export const V3_SITES = ["padel", "audio", "simracing", "tennis", "pickleball", "discgolf"];
export const v3Site = (nicheId: string) => V3_SITES.includes(nicheId);

/** The v3 home's two community sections, per site (owner 2026-11-22). "Just in" only where model years are real (padel,
 *  pickleball, tennis): being added to the catalogue doesn't make a product new, so sim racing and audio don't get it.
 *  "Latest questions" and /questions on every v3 site. */
// TennisRecs waits (PM 2026-11-22): its year column is a placeholder (2026 on all 211 rackets) until the tennis year fix
// (#633 and the tennis audit sheet, owner OK pending) lands. Flip TENNIS_YEARS_READY to true then.
const TENNIS_YEARS_READY = false;
const JUST_IN_SITES = ["padel", "pickleball", ...(TENNIS_YEARS_READY ? ["tennis"] : [])];
export const justInSite = (nicheId: string) => JUST_IN_SITES.includes(nicheId);
export const questionsSite = (nicheId: string) => v3Site(nicheId);
/** Each site's words for its questions: what a question is about ("any racket…"), the products in a sentence, and their
 *  page ("from every racket page"). */
const QUESTION_WORDS: Record<string, { one: string; many: string; page: string }> = {
  padel: { one: "racket", many: "padel rackets", page: "racket" },
  pickleball: { one: "paddle", many: "pickleball paddles", page: "paddle" },
  tennis: { one: "racket", many: "tennis rackets", page: "racket" },
  simracing: { one: "sim racing product", many: "sim racing gear", page: "product" },
  audio: { one: "headphone or IEM", many: "headphones and IEMs", page: "product" },
};
export const questionWords = (nicheId: string) => QUESTION_WORDS[nicheId] ?? QUESTION_WORDS.padel!;
