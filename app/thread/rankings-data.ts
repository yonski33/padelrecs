// The Thread rankings: the site's own lists (app/rankings/lists.ts: the curated top 10s lead, the engine ranks the rest) and,
// for the hub's other cards, Thread-only lists from the same engine: the home's quick match for beginners and for sore arms
// (as the live "for a kind of player" lists do, lib/home-rank.ts rankHome) and the best-scored rackets of each shape.
import { cache } from "react";
import { threadLists, threadRows, hasDb, skinOf, traitCounts, traitGroup } from "./data";
import { categoryRatings, priorShare, type RatingCategory } from "../../lib/category-rating";
import { ELBOW_SLUG } from "../../lib/thread/look";
import { homePayload } from "../home-payload";
import { rankHome } from "../../lib/home-rank";
import { RANK_SETUP, NEGATIVE_TAGS } from "../../lib/rank-seed";
import type { QuickChoice } from "../../lib/quick-match";
import { niche } from "../../lib/niche";

export type ThreadRanking = { slug: string; href: string; label: string; title: string; blurb: string; group: string; ids: string[]; own: boolean };
const YEAR = () => new Date().getUTCFullYear();
const SIZE = 10, MIN_REVIEWS = 10;

const PICKLEBALL = niche.id === "pickleball", SKIN = niche.id === "skin", DG = niche.id === "discgolf";
/** The hub's blurbs (Rankings Hub Thread copy), by list. */
const BLURB: Record<string, string> = DG ? {
  // DiscGolfRecs' Rankings Hub mock, on its live lists by disc type plus the Thread-only lists below.
  "best-disc-golf-discs": "The highest thrower scores this year.", "best-disc-golf-discs-for-beginners": "Straight, forgiving discs to learn with.",
  "best-disc-golf-discs-for-slow-arms": "Understable discs that still go far.", "best-disc-golf-putters": "Accurate discs for the short game.",
  "best-disc-golf-distance-drivers": "For the longest throws.", "best-disc-golf-fairway-drivers": "Control off the tee.",
  "best-disc-golf-midrange-discs": "Straight lines and upshots.",
} : SKIN ? {
  // SkinRecs' Rankings Hub mock, on its live lists.
  "best-face-moisturizers": "Daily creams people repurchase.", "best-face-cleansers": "Gentle, non-stripping washes.",
  "best-face-sunscreens": "Daily SPF people actually wear.", "best-skincare-treatments": "Retinoids, acids and spot treatments people stick with.",
  "best-balms-ointments": "Rich repair for dry, cracked skin.", "best-skincare-for-sensitive-skin": "Fragrance free and rarely stings.",
  dry: "Rich creams that repair a dry barrier.", oily: "Light, non-greasy picks for oily skin.", acne: "Clearer skin without the burn.",
} : PICKLEBALL ? {
  // PickleballRecs' Rankings Hub mock; the spin and tennis elbow lists are live lists the mock didn't have.
  "best-pickleball-paddles": "The highest player scores right now.", "best-power-pickleball-paddles": "For drives that land deep.",
  "best-control-pickleball-paddles": "Steady from the baseline, precise at the kitchen.", "best-spin-pickleball-paddles": "Grip on serves, rolls and drops.",
  "best-pickleball-paddles-for-tennis-elbow": "Soft, stable and kind to your elbow.", "best-pickleball-paddles-for-beginners": "Forgiving paddles with a big sweet spot.",
  standard: "The most forgiving shape.", elongated: "More reach and power.", hybrid: "Some reach, a forgiving face.",
} : {
  "best-padel-rackets": "The highest player scores right now.", "best-power-padel-rackets": "For smashes that reach the fence.",
  "best-control-padel-rackets": "Steady from the back, precise at the net.", beginners: "Forgiving rackets with a big sweet spot.",
  "sore-arms": "Soft, light and kind to your elbow.", round: "The most forgiving shape.", teardrop: "The all-rounder shape.", diamond: "Power first, for clean technique.",
};
// PickleballRecs has live lists for beginners and tennis elbow already, so no Thread-only copies there.
const PICKS: { key: string; slug: string; label: string; title: string; choice: QuickChoice }[] = DG ? [
  // DiscGolfRecs' live lists are one per disc type; the mock's beginner and slow arm lists are the home's quick match.
  { key: "best-disc-golf-discs-for-beginners", slug: "best-disc-golf-discs-for-beginners", label: "Best for beginners", title: "Best disc golf discs for beginners", choice: { style: "any", level: "beginner", arm: false } },
  { key: "best-disc-golf-discs-for-slow-arms", slug: "best-disc-golf-discs-for-slow-arms", label: "Best for slow arm speed", title: "Best disc golf discs for slow arm speed", choice: { style: "any", arm: true } },
] : PICKLEBALL || SKIN ? [] : [
  { key: "beginners", slug: "best-padel-rackets-for-beginners", label: "Best for beginners", title: "Best padel rackets for beginners", choice: { style: "any", level: "beginner", arm: false } },
  // Named for tennis elbow (owner 2026-11-19); the old /rankings/best-padel-rackets-for-sore-arms 301s here (THREAD_MOVED).
  { key: "sore-arms", slug: ELBOW_SLUG, label: "Best for tennis elbow", title: "Best padel rackets for tennis elbow", choice: { style: "any", arm: true } },
];
const SHAPES: readonly (readonly [string, string])[] = SKIN || DG ? [] : PICKLEBALL ? [["standard", "Standard"], ["elongated", "Elongated"], ["hybrid", "Hybrid"]] as const
  : [["round", "Round"], ["teardrop", "Teardrop"], ["diamond", "Diamond"]] as const;
const LIST = `${niche.id}-${niche.words.many}`; // "padel-rackets", "pickleball-paddles"

export const threadRankings = cache(async (): Promise<ThreadRanking[]> => {
  if (!hasDb()) return [];
  // The racket engine's payload only where Thread-only pick lists use it (padel); skin ranks with its own engine below.
  const [lists, { all, ctx }, payload] = await Promise.all([threadLists(), threadRows(), PICKS.length ? homePayload() : null]);
  const own = lists.map(l => ({ slug: l.slug, href: l.href, label: l.label, title: l.title, blurb: BLURB[l.slug] ?? l.description ?? "", own: true, ids: l.ids.slice(0, SIZE),
    group: SKIN ? (/sensitive/.test(l.slug) ? "Most popular" : "By product type") : DG ? "By how you throw" : /power|control|spin/.test(l.slug) ? "By how you play" : "Most popular" }));
  const picks = PICKS.map(p => ({ slug: p.slug, href: `/rankings/${p.slug}`, label: p.label, title: `${p.title} ${YEAR()}`, blurb: BLURB[p.key], own: false, group: "Most popular",
    ids: rankHome(payload!.items, RANK_SETUP, NEGATIVE_TAGS, p.choice, false, SIZE).rows.map(r => r.id) }));
  const shapes = SHAPES.map(([k]) => ({ slug: `best-${k}-${LIST}`, href: `/rankings/best-${k}-${LIST}`, label: `Best ${k} ${niche.words.many}`, title: `Best ${k} ${niche.id} ${niche.words.many} ${YEAR()}`,
    blurb: BLURB[k], own: false, group: "By shape",
    ids: all.filter(r => r.score != null && r.current && r.n >= MIN_REVIEWS && (PICKLEBALL ? !!r.shape && new RegExp(`\\b${k}\\b`, "i").test(r.shape) : r.shape?.toLowerCase() === k)).sort((a, b) => b.score! - a.score! || b.n - a.n).slice(0, SIZE).map(r => r.id) }));
  // The site's own lists keep their live rule (5+); a Thread-only list is a new page, so it needs a full 10 (owner 2026-11-19).
  const skin = SKIN ? await skinLists(ctx, new Set(all.filter(r => r.current).map(r => r.id))) : [];
  // DiscGolfRecs' "Best overall" (its hub mock): the highest thrower scores, current discs with 10+ reviews.
  const overall = DG ? [{ slug: "best-disc-golf-discs", href: "/rankings/best-disc-golf-discs", label: "Best overall", title: `Best disc golf discs ${YEAR()}`,
    blurb: BLURB["best-disc-golf-discs"], own: false, group: "Most popular",
    ids: all.filter(r => r.score != null && r.current && r.n >= MIN_REVIEWS).sort((a, b) => b.score! - a.score! || b.n - a.n).slice(0, SIZE).map(r => r.id) }] : [];
  return (DG ? [...overall, ...picks, ...own] : [...own, ...picks, ...shapes, ...skin]).filter(l => l.ids.length >= (l.own ? 5 : 10));
});
export const GROUPS = SKIN ? ["Most popular", "By skin", "By product type"] : DG ? ["Most popular", "By how you throw"] : ["Most popular", "By how you play", "By shape"];

/** SkinRecs' Thread-only lists by skin (its Rankings Hub mock): the skin engine's own match for that pick (app/skin/rank.ts
 *  rankSkin, as the live home ranks it), current products with a match only, a full 10 needed. */
async function skinLists(ctx: unknown, current: Set<string>): Promise<ThreadRanking[]> {
  const sk = skinOf(ctx as Parameters<typeof skinOf>[0]);
  if (!sk) return [];
  const [{ rankSkin }, { readSkinChoice }] = await Promise.all([import("../skin/rank"), import("../../lib/skin-choice")]);
  const types = niche.typePages ?? [];
  const picks = [["dry", "Best for dry skin", { skin: "dry" }], ["oily", "Best for oily skin", { skin: "oily" }], ["acne", "Best for acne", { acne: "1" }]] as const;
  return picks.map(([key, label, q]) => {
    const slug = `best-skincare-for-${key === "acne" ? "acne" : `${key}-skin`}`;
    const ids = rankSkin(sk, readSkinChoice(q, types)).filter(x => x.pct !== null && current.has(x.r.id)).slice(0, SIZE).map(x => x.r.id);
    return { slug, href: `/rankings/${slug}`, label, title: `${label} ${YEAR()}`, blurb: BLURB[key], own: false, group: key === "acne" ? "Most popular" : "By skin", ids };
  });
}

/** A padel category list's curated ratings (lib/category-rating.ts), by id, in the list's order: the "How does it play?"
 *  group as the racket pages show it, the engine bar, and the shape; the prior is the share over every current racket. */
export async function ratingsFor(cat: RatingCategory, ids: string[]): Promise<Record<string, number>> {
  const [{ ctx, rows, all }, t] = await Promise.all([threadRows(), traitCounts()]);
  const prior = priorShare(cat, all.filter(r => r.current).map(r => traitGroup(t, r.id, cat.trait)));
  const inputs = ids.map(id => { const f = ctx.facts(id);
    return { group: traitGroup(t, id, cat.trait), shape: rows.get(id)?.shape ?? null,
      dots: cat.dots === "arm" ? f.armDots ?? null : cat.dots ? f.styleDots?.[cat.dots] ?? null : null }; });
  const out = categoryRatings(cat, inputs, prior);
  return Object.fromEntries(ids.map((id, i) => [id, out[i]]));
}
