// The Thread rankings: the site's own lists (app/rankings/lists.ts: the curated top 10s lead, the engine ranks the rest) and,
// for the hub's other cards, Thread-only lists from the same engine: the home's quick match for beginners and for sore arms
// (as the live "for a kind of player" lists do, lib/home-rank.ts rankHome) and the best-scored rackets of each shape.
import { cache } from "react";
import { threadLists, threadRows, hasDb } from "./data";
import { ELBOW_SLUG } from "../../lib/thread/look";
import { homePayload } from "../home-payload";
import { rankHome } from "../../lib/home-rank";
import { RANK_SETUP, NEGATIVE_TAGS } from "../../lib/rank-seed";
import type { QuickChoice } from "../../lib/quick-match";
import { niche } from "../../lib/niche";

export type ThreadRanking = { slug: string; href: string; label: string; title: string; blurb: string; group: string; ids: string[]; own: boolean };
const YEAR = () => new Date().getUTCFullYear();
const SIZE = 10, MIN_REVIEWS = 10;

const PICKLEBALL = niche.id === "pickleball";
/** The hub's blurbs (Rankings Hub Thread copy), by list. */
const BLURB: Record<string, string> = PICKLEBALL ? {
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
const PICKS: { key: string; slug: string; label: string; title: string; choice: QuickChoice }[] = PICKLEBALL ? [] : [
  { key: "beginners", slug: "best-padel-rackets-for-beginners", label: "Best for beginners", title: "Best padel rackets for beginners", choice: { style: "any", level: "beginner", arm: false } },
  // Named for tennis elbow (owner 2026-11-19); the old /rankings/best-padel-rackets-for-sore-arms 301s here (THREAD_MOVED).
  { key: "sore-arms", slug: ELBOW_SLUG, label: "Best for tennis elbow", title: "Best padel rackets for tennis elbow", choice: { style: "any", arm: true } },
];
const SHAPES: readonly (readonly [string, string])[] = PICKLEBALL ? [["standard", "Standard"], ["elongated", "Elongated"], ["hybrid", "Hybrid"]] as const
  : [["round", "Round"], ["teardrop", "Teardrop"], ["diamond", "Diamond"]] as const;
const LIST = `${niche.id}-${niche.words.many}`; // "padel-rackets", "pickleball-paddles"

export const threadRankings = cache(async (): Promise<ThreadRanking[]> => {
  if (!hasDb()) return [];
  const [lists, { all }, payload] = await Promise.all([threadLists(), threadRows(), homePayload()]);
  const own = lists.map(l => ({ slug: l.slug, href: l.href, label: l.label, title: l.title, blurb: BLURB[l.slug] ?? l.description ?? "", own: true, ids: l.ids.slice(0, SIZE),
    group: /power|control|spin/.test(l.slug) ? "By how you play" : "Most popular" }));
  const picks = PICKS.map(p => ({ slug: p.slug, href: `/rankings/${p.slug}`, label: p.label, title: `${p.title} ${YEAR()}`, blurb: BLURB[p.key], own: false, group: "Most popular",
    ids: rankHome(payload.items, RANK_SETUP, NEGATIVE_TAGS, p.choice, false, SIZE).rows.map(r => r.id) }));
  const shapes = SHAPES.map(([k]) => ({ slug: `best-${k}-${LIST}`, href: `/rankings/best-${k}-${LIST}`, label: `Best ${k} ${niche.words.many}`, title: `Best ${k} ${niche.id} ${niche.words.many} ${YEAR()}`,
    blurb: BLURB[k], own: false, group: "By shape",
    ids: all.filter(r => r.score != null && r.current && r.n >= MIN_REVIEWS && (PICKLEBALL ? !!r.shape && new RegExp(`\\b${k}\\b`, "i").test(r.shape) : r.shape?.toLowerCase() === k)).sort((a, b) => b.score! - a.score! || b.n - a.n).slice(0, SIZE).map(r => r.id) }));
  // The site's own lists keep their live rule (5+); a Thread-only list is a new page, so it needs a full 10 (owner 2026-11-19).
  return [...own, ...picks, ...shapes].filter(l => l.ids.length >= (l.own ? 5 : 10));
});
export const GROUPS = ["Most popular", "By how you play", "By shape"];
