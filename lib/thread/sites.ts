// Which sites run the Thread look, their go-live flags and the Thread addresses that moved. No imports, so next.config.ts can
// load it (lib/niche resolves through the "@/lib/niche/selected" alias, which the config loader doesn't know). lib/thread/look.ts
// re-exports all of it for the pages and proxy.ts.

/** THE go-live flags, per site (owner 2026-11-19): true = Thread is the default look on the normal addresses and
 *  ?look=classic shows the current live pages; false = the live pages are the default and ?look=thread previews Thread.
 *  Roll a site back by setting it to false. */
export const THREAD_DEFAULTS: Record<string, boolean> = { padel: true, pickleball: true, stackrecs: true, skin: true, discgolf: true, audio: true, simracing: true, tennis: true, laptop: true };
export const threadDefaultFor = (nicheId: string) => THREAD_DEFAULTS[nicheId] ?? false;
/** PadelRecs (the pilot), PickleballRecs (owner 2026-11-19: next after padel), StackRecs (Build + Grow pilot, owner
 *  2026-11-19), which is built on the Thread pages from the start, SkinRecs and DiscGolfRecs (owner 2026-11-20), AudioRecs
 *  (owner design handoff 2026-11-21). */
export const threadSite = (nicheId: string) => nicheId === "padel" || nicheId === "pickleball" || nicheId === "stackrecs" || nicheId === "skin"
  || nicheId === "discgolf" || nicheId === "audio" || nicheId === "simracing" || nicheId === "tennis" || nicheId === "laptop";
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
/** The racket page's fit check as the page's core (owner OK 2026-11-22, lib/thread/fit-core.ts): picks, a fit label, three
 *  lines with source chips, better picks and a two-tap box. Rollback: take a site out and it shows the earlier "Is this
 *  racket right for me?" card again; ?fit=classic shows that card on any page for a side-by-side look. */
export const FIT_CORE_SITES: string[] = [];
/** Owner 2026-11-22: padel back on the classic card (the fit check above was "too overwhelming"); on a poor or cautious
 *  fit it names 1 or 2 better rackets as plain links (lib/thread/fit-core.ts betterPicks), in place of "Better for you". */
export const EASIER_PICKS_SITES = ["padel"];
export const easierPicksSite = (nicheId: string) => EASIER_PICKS_SITES.includes(nicheId);
export const fitCoreSite = (nicheId: string) => FIT_CORE_SITES.includes(nicheId);
export const accountSite = (nicheId: string) => ACCOUNT_SITES.includes(nicheId);
/** Each Thread site's quick match, as its home shows it: "engine" = level · style · arm (app/thread/live/lists.tsx MatchBox,
 *  with the site's own styles and arm words), "skin" = skin type · goal · sensitive (live/skin-match.tsx). A site not listed
 *  has none, so its ranking pages show no "See how you match" card (owner report 2026-11-21: SkinRecs showed padel's). */
/** "laptop" = what you use it for · what you want · quiet fans (lib/laptop-match.ts, app/thread/live/laptop-match.tsx). */
export const QUICK_MATCH: Record<string, "engine" | "skin" | "laptop"> = { padel: "engine", pickleball: "engine", discgolf: "engine", skin: "skin", tennis: "engine", laptop: "laptop" };
export const quickMatchFor = (nicheId: string) => QUICK_MATCH[nicheId] ?? null;
/** The PadelRecs v3 pages (home, catalogue, product page, compare, rankings; owner 2026-11-21) and the sites rolled onto them
 *  (V3-ROLLOUT-BRIEF: AudioRecs first). No score anywhere on these. */
// LaptopRecs (owner 2026-11-24: "change laptop ... to the new design", PickleballRecs as the default copy).
export const V3_SITES = ["padel", "audio", "simracing", "tennis", "pickleball", "discgolf", "skin", "laptop"];
export const v3Site = (nicheId: string) => V3_SITES.includes(nicheId);

/** The v3 home's two community sections, per site (owner 2026-11-22). "Just in" only where model years are real (padel,
 *  pickleball, tennis): being added to the catalogue doesn't make a product new, so sim racing and audio don't get it.
 *  "Latest questions" and /questions on every v3 site. */
// TennisRecs waits (PM 2026-11-22): its year column is a placeholder (2026 on all 211 rackets) until the tennis year fix
// (#633 and the tennis audit sheet, owner OK pending) lands. Flip TENNIS_YEARS_READY to true then.
const TENNIS_YEARS_READY = true; // years filled 2026-11-22 (owner OK); unknown ones are skipped (lib/thread/tennis-notes.ts)
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
  skin: { one: "product", many: "skincare", page: "product" },
  laptop: { one: "laptop", many: "laptops", page: "laptop" },
};
export const questionWords = (nicheId: string) => QUESTION_WORDS[nicheId] ?? QUESTION_WORDS.padel!;

/** The sites whose schema has comments.post_type (drizzle/0035): they save a post's Question or Tip and show it as its flair
 *  (owner OK 2026-11-22). Add a site here once 0035 has run on its schema; until then it keeps the words rule (sim racing,
 *  skin and audio for now). */
const POST_TYPE_SITES = ["padel", "pickleball", "tennis", "discgolf", "skin"];
export const postTypeSite = (nicheId: string) => POST_TYPE_SITES.includes(nicheId);

/** "From around the web" v2 on the racket page (owner mock 2026-11-22, app/thread/live/web-v2.tsx): source tabs, video
 *  thumbnails, Reddit and blog tiles with a real short quote, the sentiment on the right, Show N more. Rollback: take a site
 *  out and it shows the earlier two-column box (live/racket-v7b.tsx WebSources) again; ?web=classic shows that box on any
 *  page for a side-by-side look. */
export const WEB_V2_SITES = ["padel"];
export const webV2Site = (nicheId: string) => WEB_V2_SITES.includes(nicheId);

/** The creator-centred product page (owner direction 2026-11-22, iemranking-style: what YouTube and blog creators said, as
 *  words), a preview for now: on these sites ?view=creators on a product page with creator data (CREATOR_PAGE_SLUGS, the
 *  demo fixture db/creators/<site>.json) shows app/thread/creators/[slug]; the live product pages are unchanged. */
export const CREATOR_PAGE_SITES = ["pickleball", "padel", "discgolf"];
export const CREATOR_PAGE_SLUGS: Record<string, string[]> = { pickleball: ["11six24-vapor-power-2", "six-zero-black-opal-14mm", "six-zero-coral-pro-16mm"],
  // PadelRecs: the 20 most-researched rackets (preview only: CREATOR_PAGE stays off for padel).
  padel: ["bullpadel-vertex-05-2026", "nox-at10-genius-18k-2026", "wilson-endure-pro-v1-2026", "bullpadel-vertex-05-geo-2026", "nox-at10-genius-12k-alum-xtrem-2026", "bullpadel-neuron-02-edge-2026", "siux-electra-pro-st5-2026", "adidas-metalbone-3-5-2026", "head-coello-pro-2026", "bullpadel-xplo-2026", "bullpadel-neuron-02-2026", "adidas-metalbone-hrd-plus-3-5-2026", "wilson-defy-pro-v1-2025", "babolat-viper-soft-juan-lebron-3-0-2026", "babolat-viper-juan-lebron-3-0-2026", "nox-ea10-ventus-hybrid-12k-2026", "wilson-endure-v1-2026", "head-coello-motion-2026", "bullpadel-hack-04-2025", "wilson-bela-pro-v3-2025"] };
export const CREATOR_VIEW = "creators";
export const creatorPageFor = (nicheId: string, slug: string) => CREATOR_PAGE_SITES.includes(nicheId)
  && (CREATOR_PAGE_SLUGS[nicheId] ?? []).includes(slug);

/** THE creator page switch (owner "yes" 2026-11-22, first live wave): on these sites a product with CREATOR_MIN_REVIEWS or
 *  more creator reviews (one per reviewer, TikTok channels once) gets the creator page (app/thread/creator-page.tsx) at its
 *  normal address, and "/" gets the creators home (app/thread/creators-home-body.tsx). Every other product keeps today's
 *  page. Set a site to false to switch it all off at once. */
// DiscGolfRecs (2026-11-24, #695): the 20 discs with creator reviews switch on once the cards are in discgolfrecs.creator_reviews.
export const CREATOR_PAGE: Record<string, boolean> = { pickleball: true, skin: true, padel: true, laptop: true, discgolf: true };
export const creatorPageOn = (nicheId: string) => CREATOR_PAGE[nicheId] ?? false;
/** The creators home at "/" (app/thread/creators-home-body.tsx), apart from the product page switch: SkinRecs (owner "Yes,
 *  Skin next" 2026-11-23) moves its product pages first and keeps its own home for now. PadelRecs (owner 2026-11-24: "we can
 *  use pickleball from now on as the default copy for the sites"): false brings back padel's v3 home. */
export const CREATOR_HOME: Record<string, boolean> = { pickleball: true, padel: true, laptop: true };
export const creatorHomeOn = (nicheId: string) => creatorPageOn(nicheId) && (CREATOR_HOME[nicheId] ?? false);
export const CREATOR_MIN_REVIEWS = 3;
/** Creator pages on a site that is not a Thread site (LaptopRecs, 2026-11-24): proxy.ts serves its product addresses for the
 *  products in db/creators/<site>-pages.json from app/thread/creator-product/[slug], which shows the creator page when the
 *  product has CREATOR_MIN_REVIEWS or more reviews in the database (drizzle/0039-0041) and today's product page otherwise.
 *  Thread links (lib/thread/look.ts th) stay plain addresses there, and the page leaves out the Thread-only parts (the fit
 *  check, the vote boxes, the discussion). Set CREATOR_PAGE to false for the site to switch it off. */
// LaptopRecs moved onto the Thread pages (2026-11-24), so its creator pages come from the Thread product page like
// PickleballRecs'. The list stays for a future non-Thread site.
export const CREATOR_PLAIN_SITES: string[] = [];
export const creatorPlainSite = (nicheId: string) => CREATOR_PLAIN_SITES.includes(nicheId);
