// The "Thread" redesign (owner 2026-11-19, Claude Design handoff thread-redesign-v1): a quiet, community-first PadelRecs.
// Padel only. proxy.ts serves each address from its Thread page (app/thread/…) by default (THREAD_DEFAULT); ?look=classic
// keeps the previous pages reachable for a few weeks. The two looks have different URLs, so the CDN never mixes them.
// Pure apart from the running site's id and catalogue path: proxy.ts and the pages share it.
// PickleballRecs (plans/PICKLEBALL-THREAD-PLAN.md) runs the same pages, previewed with ?look=thread until its flag is on.
import { niche, catalogPath } from "../niche";

import { threadDefaultFor, ELBOW_SLUG, storiesSite, v3Site, questionsSite, creatorPlainSite } from "./sites";
export { THREAD_DEFAULTS, threadDefaultFor, threadSite, THREAD_MOVED, ELBOW_SLUG } from "./sites";
/** The running site's flag. */
export const THREAD_DEFAULT = threadDefaultFor(niche.id);
/** The query value that opens the Thread look (still accepted when Thread is the default). */
export const THREAD_LOOK = "thread";
/** The query value that shows the current live (pre-Thread) pages while Thread is the default. */
export const CLASSIC_LOOK = "classic";

/** StackRecs' Thread pages (app/thread/stack/…): the home, the tool catalogue and pages, the rankings and the score page.
 *  Other addresses (add a review, contact, compare) keep the shared live pages. */
export function stackPath(pathname: string, catalog = "/tools"): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (p === "/") return "/thread/stack";
  if (p === catalog) return "/thread/stack/tools";
  if (p.startsWith(`${catalog}/`) && /^[a-z0-9-]+$/.test(p.slice(catalog.length + 1))) return `/thread/stack/tools/${p.slice(catalog.length + 1)}`;
  if (p === "/rankings") return "/thread/stack/rankings";
  const ranking = /^\/rankings\/([a-z0-9-]+)$/.exec(p);
  if (ranking) return `/thread/stack/rankings/${ranking[1]}`;
  if (p === "/how-we-make-these" || p === "/about") return "/thread/stack/score";
  return null;
}

/** The rankings a guide lists, by guide, picked from the shown lists by exact slug (a partial match broke when the elbow
 *  ranking moved, #524). "beginner" is picked by the caller (the engine's own beginner picks). Pure, for tests. */
export function guideListPicks<R>(key: string, slugIds: (slug: string) => string[] | undefined, row: (id: string) => R | undefined): { title?: string; rows: R[] }[] | null {
  const top = (slug: string, n: number) => (slugIds(slug) ?? []).slice(0, n).map(row).filter((x): x is R => !!x);
  if (key === "elbow") return [{ rows: top(ELBOW_SLUG, 4) }];
  if (key === "side") return [{ title: "Right side", rows: top("best-control-padel-rackets", 3) }, { title: "Left side", rows: top("best-power-padel-rackets", 3) }];
  return null;
}

/** The five guides: key → live-style address (the product guide keeps /guide, the others are new under /guides). The keys
 *  are the same on every site ("racket" is the product guide, "side" padel's court side and pickleball's doubles or singles). */
export type GuideKey = "racket" | "beginner" | "shape" | "side" | "elbow";
const PADEL_GUIDES: Record<GuideKey, string> = {
  racket: "/guide",
  beginner: "/guides/beginner-tips",
  shape: "/guides/racket-shapes",
  side: "/guides/court-side",
  elbow: "/guides/tennis-elbow",
};
const PICKLEBALL_GUIDES: Record<GuideKey, string> = {
  racket: "/guide",
  beginner: "/guides/beginner-tips",
  shape: "/guides/paddle-shapes",
  side: "/guides/doubles-or-singles",
  elbow: "/guides/tennis-elbow",
};
/** SkinRecs (its handoff mock): choosing products, a beginner routine, textures, routine order and sensitive skin, in the
 *  same five slots ("shape" = textures, "side" = routine order, "elbow" = sensitive skin). */
const SKIN_GUIDES: Record<GuideKey, string> = {
  racket: "/guide",
  beginner: "/guides/beginner-routine",
  shape: "/guides/cream-vs-lotion-vs-gel",
  side: "/guides/morning-or-night",
  elbow: "/guides/sensitive-skin",
};
/** DiscGolfRecs (its handoff mock): choosing a disc, beginner tips, disc types, throwing and a sore arm, in the same slots
 *  ("shape" = disc types, "side" = backhand or forehand, "elbow" = a sore arm). */
const DISCGOLF_GUIDES: Record<GuideKey, string> = {
  racket: "/guide",
  beginner: "/guides/beginner-tips",
  shape: "/guides/disc-types",
  side: "/guides/backhand-or-forehand",
  elbow: "/guides/slow-arm-speed",
};
/** AudioRecs (its handoff mock): choosing headphones, listening tips, open or closed-back, earbuds or over-ear and noise
 *  cancelling ("shape" = open or closed-back, "side" = earbuds or over-ear, "elbow" = noise cancelling). */
const AUDIO_GUIDES: Record<GuideKey, string> = {
  racket: "/guide",
  beginner: "/guides/listening-tips",
  shape: "/guides/open-or-closed-back",
  side: "/guides/earbuds-or-over-ear",
  elbow: "/guides/noise-cancelling",
};
/** SimRacingRecs (its handoff mock): choosing a first setup, beginner tips, drive types, load cell pedals and desk or rig, in
 *  the same slots ("shape" = drive types, "side" = pedals, "elbow" = desk or rig). */
const SIMRACING_GUIDES: Record<GuideKey, string> = {
  racket: "/guide",
  beginner: "/guides/beginner-tips",
  shape: "/guides/direct-drive-belt-or-gear",
  side: "/guides/load-cell-pedals",
  elbow: "/guides/desk-or-rig",
};
/** TennisRecs: choosing a racket, beginner tips, head size, string pattern and tennis elbow ("shape" = head size, "side" =
 *  string pattern). */
const TENNIS_GUIDES: Record<GuideKey, string> = {
  racket: "/guide",
  beginner: "/guides/beginner-tips",
  shape: "/guides/head-size",
  side: "/guides/string-patterns",
  elbow: "/guides/tennis-elbow",
};
export const guidePathsFor = (nicheId: string): Record<GuideKey, string> => nicheId === "pickleball" ? PICKLEBALL_GUIDES : nicheId === "skin" ? SKIN_GUIDES
  : nicheId === "discgolf" ? DISCGOLF_GUIDES : nicheId === "audio" ? AUDIO_GUIDES : nicheId === "simracing" ? SIMRACING_GUIDES : nicheId === "tennis" ? TENNIS_GUIDES : PADEL_GUIDES;
/** The running site's guide addresses. */
export const GUIDE_PATHS = guidePathsFor(niche.id);
export const GUIDE_KEYS = Object.keys(PADEL_GUIDES) as GuideKey[];
export const guideKeyOf = (path: string, nicheId = niche.id): GuideKey | null => GUIDE_KEYS.find(k => guidePathsFor(nicheId)[k] === path) ?? null;

/** The sites whose add-review page is the design-v2 form, which has a Thread page (StackRecs keeps its own full form). */
export const ADD_REVIEW_SITES = new Set(["padel", "pickleball", "skin", "discgolf", "simracing", "tennis"]);
/** The Thread page an address shows with ?look=thread, or null when the Thread look has no page for it (compare and
 *  add-review keep their live page). `catalog` is the niche's catalogue path ("/rackets" on padel, "/paddles" on pickleball). */
export function threadPath(pathname: string, catalog = catalogPath, nicheId = niche.id): string | null {
  if (nicheId === "stackrecs") return stackPath(pathname, catalog);
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (p === "/") return "/thread";
  if (p === catalog) return "/thread/rackets";
  if (p.startsWith(`${catalog}/`) && /^[a-z0-9-]+$/.test(p.slice(catalog.length + 1))) return `/thread/rackets/${p.slice(catalog.length + 1)}`;
  if (p === "/rankings") return "/thread/rankings";
  const ranking = /^\/rankings\/([a-z0-9-]+)$/.exec(p);
  if (ranking) return `/thread/rankings/${ranking[1]}`;
  // PadelRecs Guides v3 (owner design 2026-11-21): an index of the guides, padel only.
  if (nicheId === "padel" && p === "/guides") return "/thread/guides";
  // PadelRecs Search v3 (owner design 2026-11-21): rackets, discussions and stories, padel only.
  if (nicheId === "padel" && p === "/search") return "/thread/search";
  // PadelRecs "Questions from the community" (owner OK 2026-11-21): every racket page's questions, padel only.
  if (questionsSite(nicheId) && p === "/questions") return "/thread/questions";
  const guide = guideKeyOf(p, nicheId);
  if (guide) return `/thread/guides/${guide}`;
  if (p === "/about") return "/thread/about";
  if (p === "/how-we-make-these") return "/thread/score";
  // PadelRecs v3 (owner handoff 2026-11-21): "How rankings work", a Thread-only page.
  if (p === "/how-rankings-work" && v3Site(nicheId)) return "/thread/how-rankings";
  if (p === "/affiliate-disclosure") return "/thread/affiliate";
  if (p === "/contact") return "/thread/contact";
  // The design-v2 form in the Thread look (owner 2026-11-20); proxy.ts keeps its query and leaves ?classic=1 on the live form.
  if (p === "/add-review" && ADD_REVIEW_SITES.has(nicheId)) return "/thread/add-review";
  if (p === "/privacy") return "/thread/privacy";
  // Member stories (PadelRecs pilot, owner 2026-11-20): the list, the composer and one page per story, Thread only.
  if (storiesSite(nicheId)) {
    if (p === "/stories") return "/thread/stories";
    const story = /^\/stories\/([a-z0-9-]{1,80})(\/edit)?$/.exec(p);
    if (story) return `/thread/stories/${story[1]}${story[2] ?? ""}`;
  }
  if (p === "/brands") return "/thread/brands";
  const brand = /^\/brands\/([a-z0-9-]+)$/.exec(p);
  if (brand) return `/thread/brands/${brand[1]}`;
  // DiscGolfRecs: each type page (/putters) is a catalogue of its own; its discs stay under /discs.
  if (nicheId === "discgolf" && nicheId === niche.id && (niche.typePages ?? []).some(t => t.slug === p.slice(1))) return `/thread/types${p}`;
  // SkinRecs, AudioRecs and SimRacingRecs: products live under their type page (/moisturizers/<slug>, /headphones/<slug>,
  // /wheelbases/<slug>), and each type page is a catalogue of its own.
  if ((nicheId === "skin" || nicheId === "audio" || nicheId === "simracing") && nicheId === niche.id && niche.categoryPaths) {
    const [, type, slug, extra] = p.split("/");
    if (type && !extra && (niche.typePages ?? []).some(t => t.slug === type) && (!slug || /^[a-z0-9-]+$/.test(slug))) return slug ? `/thread/rackets/${slug}` : `/thread/types/${type}`;
  }
  return null;
}

/** A Thread link. While Thread is the default it is the plain address; in preview mode it carries ?look=thread (kept ahead
 *  of any #hash) so the next page is a Thread page too. Unpreviewed addresses and outside links are left as they are. */
export function th(href: string, catalog = catalogPath, preview = !THREAD_DEFAULT): string {
  // LaptopRecs' creator pages sit on its own addresses (lib/thread/sites.ts CREATOR_PLAIN_SITES): plain links there.
  if (!preview || creatorPlainSite(niche.id)) return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const [rest, hash = ""] = href.split("#", 2);
  const [path, query = ""] = rest.split("?", 2);
  if (!threadPath(path, catalog)) return href;
  const q = new URLSearchParams(query); q.set("look", THREAD_LOOK);
  return `${path}?${q.toString()}${hash ? `#${hash}` : ""}`;
}
