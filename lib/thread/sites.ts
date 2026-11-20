// Which sites run the Thread look, their go-live flags and the Thread addresses that moved. No imports, so next.config.ts can
// load it (lib/niche resolves through the "@/lib/niche/selected" alias, which the config loader doesn't know). lib/thread/look.ts
// re-exports all of it for the pages and proxy.ts.

/** THE go-live flags, per site (owner 2026-11-19): true = Thread is the default look on the normal addresses and
 *  ?look=classic shows the current live pages; false = the live pages are the default and ?look=thread previews Thread.
 *  Roll a site back by setting it to false. */
export const THREAD_DEFAULTS: Record<string, boolean> = { padel: true, pickleball: true, stackrecs: true, skin: true, discgolf: true };
export const threadDefaultFor = (nicheId: string) => THREAD_DEFAULTS[nicheId] ?? false;
/** PadelRecs (the pilot), PickleballRecs (owner 2026-11-19: next after padel), StackRecs (Build + Grow pilot, owner
 *  2026-11-19), which is built on the Thread pages from the start, SkinRecs and DiscGolfRecs (owner 2026-11-20). */
export const threadSite = (nicheId: string) => nicheId === "padel" || nicheId === "pickleball" || nicheId === "stackrecs" || nicheId === "skin"
  || nicheId === "discgolf";
/** Thread addresses that moved (a 301 from the old one, next.config.ts redirects): the sore-arms ranking is named for tennis
 *  elbow (owner 2026-11-19). */
/** The tennis elbow ranking's slug: the ranking, the elbow guide's picks and links, and the home's Top picks all read it. */
export const ELBOW_SLUG = "best-padel-rackets-for-tennis-elbow";
export const THREAD_MOVED: { from: string; to: string }[] = [
  { from: "/rankings/best-padel-rackets-for-sore-arms", to: `/rankings/${ELBOW_SLUG}` },
];
/** Optional accounts (#516, drizzle/0028): PadelRecs only. PickleballRecs has no accounts table yet (owner 2026-11-19,
 *  plan Q7: accounts later), so its composers show no sign-in link and the account pages and APIs answer 404. */
export const accountSite = (nicheId: string) => nicheId === "padel";
