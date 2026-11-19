// The "Thread" redesign (owner 2026-11-19, Claude Design handoff thread-redesign-v1): a quiet, community-first PadelRecs.
// Padel only. proxy.ts serves each address from its Thread page (app/thread/…) by default (THREAD_DEFAULT); ?look=classic
// keeps the previous pages reachable for a few weeks. The two looks have different URLs, so the CDN never mixes them.
// Pure: proxy.ts and the pages share it.

/** THE go-live flag (owner 2026-11-19): true = Thread is padel's default look on the normal addresses and ?look=classic
 *  shows the current live pages; false = the live pages are the default and ?look=thread previews Thread. Roll back by
 *  setting it to false. */
export const THREAD_DEFAULT = true;
/** The query value that opens the Thread look (still accepted when Thread is the default). */
export const THREAD_LOOK = "thread";
/** The query value that shows the current live (pre-Thread) pages while Thread is the default. */
export const CLASSIC_LOOK = "classic";
/** Only PadelRecs previews it (the pilot before Tennis, Pickleball, SimRacing, DiscGolf and Skin). */
export const threadSite = (nicheId: string) => nicheId === "padel";
/** Thread addresses that moved (a 301 from the old one, next.config.ts redirects): the sore-arms ranking is named for tennis
 *  elbow (owner 2026-11-19). */
export const THREAD_MOVED: { from: string; to: string }[] = [
  { from: "/rankings/best-padel-rackets-for-sore-arms", to: "/rankings/best-padel-rackets-for-tennis-elbow" },
];

/** The five guides: key → live-style address (the racket guide keeps /guide, the others are new under /guides). */
export const GUIDE_PATHS = {
  racket: "/guide",
  beginner: "/guides/beginner-tips",
  shape: "/guides/racket-shapes",
  side: "/guides/court-side",
  elbow: "/guides/tennis-elbow",
} as const;
export type GuideKey = keyof typeof GUIDE_PATHS;
export const GUIDE_KEYS = Object.keys(GUIDE_PATHS) as GuideKey[];
export const guideKeyOf = (path: string): GuideKey | null => GUIDE_KEYS.find(k => GUIDE_PATHS[k] === path) ?? null;

/** The Thread page an address shows with ?look=thread, or null when the Thread look has no page for it (compare and
 *  add-review keep their live page). `catalog` is the niche's catalogue path ("/rackets" on padel). */
export function threadPath(pathname: string, catalog = "/rackets"): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (p === "/") return "/thread";
  if (p === catalog) return "/thread/rackets";
  if (p.startsWith(`${catalog}/`) && /^[a-z0-9-]+$/.test(p.slice(catalog.length + 1))) return `/thread/rackets/${p.slice(catalog.length + 1)}`;
  if (p === "/rankings") return "/thread/rankings";
  const ranking = /^\/rankings\/([a-z0-9-]+)$/.exec(p);
  if (ranking) return `/thread/rankings/${ranking[1]}`;
  const guide = guideKeyOf(p);
  if (guide) return `/thread/guides/${guide}`;
  if (p === "/about") return "/thread/about";
  if (p === "/how-we-make-these") return "/thread/score";
  if (p === "/affiliate-disclosure") return "/thread/affiliate";
  if (p === "/contact") return "/thread/contact";
  if (p === "/brands") return "/thread/brands";
  const brand = /^\/brands\/([a-z0-9-]+)$/.exec(p);
  if (brand) return `/thread/brands/${brand[1]}`;
  return null;
}

/** A Thread link. While Thread is the default it is the plain address; in preview mode it carries ?look=thread (kept ahead
 *  of any #hash) so the next page is a Thread page too. Unpreviewed addresses and outside links are left as they are. */
export function th(href: string, catalog = "/rackets", preview = !THREAD_DEFAULT): string {
  if (!preview) return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const [rest, hash = ""] = href.split("#", 2);
  const [path, query = ""] = rest.split("?", 2);
  if (!threadPath(path, catalog)) return href;
  const q = new URLSearchParams(query); q.set("look", THREAD_LOOK);
  return `${path}?${q.toString()}${hash ? `#${hash}` : ""}`;
}
