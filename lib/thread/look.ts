// The "Thread" redesign (owner 2026-11-19, Claude Design handoff thread-redesign-v1): a quiet, community-first PadelRecs, in
// preview behind ?look=thread until the owner flips it. Padel only. The live pages stay as they are: proxy.ts rewrites an
// address with ?look=thread to its Thread page (app/thread/…), and every Thread link carries ?look=thread, so the CDN keys
// the two looks apart by their own URLs and a live address never gets a Thread page. Pure: proxy.ts and the pages share it.

/** The query value that opens the Thread look. */
export const THREAD_LOOK = "thread";
/** Only PadelRecs previews it (the pilot before Tennis, Pickleball, SimRacing, DiscGolf and Skin). */
export const threadSite = (nicheId: string) => nicheId === "padel";

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

/** The Thread page an address shows with ?look=thread, or null when the Thread look has no page for it (brands, compare,
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
  return null;
}

/** A Thread link: the live address with ?look=thread (kept ahead of any #hash), so the next page is a Thread page too.
 *  Addresses the Thread look has no page for, and outside links, are left as they are. */
export function th(href: string, catalog = "/rackets"): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const [rest, hash = ""] = href.split("#", 2);
  const [path, query = ""] = rest.split("?", 2);
  if (!threadPath(path, catalog)) return href;
  const q = new URLSearchParams(query); q.set("look", THREAD_LOOK);
  return `${path}?${q.toString()}${hash ? `#${hash}` : ""}`;
}
