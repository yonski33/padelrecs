// The Thread rankings: the site's own lists (app/rankings/lists.ts: the curated top 10s lead, the engine ranks the rest) and,
// for the hub's other cards, Thread-only lists from the same engine: the home's quick match for beginners and for sore arms
// (as the live "for a kind of player" lists do, lib/home-rank.ts rankHome) and the best-scored rackets of each shape.
import { cache } from "react";
import { threadLists, threadRows, hasDb, skinOf, audioOf, traitCounts, traitGroup } from "./data";
import { categoryRatings, priorShare, type RatingCategory } from "../../lib/category-rating";
import { SKIN_NEEDS, skinSplits } from "../../lib/skin-lists";
import { ELBOW_SLUG } from "../../lib/thread/look";
import { homePayload } from "../home-payload";
import { rankHome } from "../../lib/home-rank";
import { RANK_SETUP, NEGATIVE_TAGS } from "../../lib/rank-seed";
import type { QuickChoice } from "../../lib/quick-match";
import { niche } from "../../lib/niche";
import { listOrder, voteOrder, VOTE_ORDER, lovedOrder, LOVED_ORDER } from "../../lib/thread/vote-order";
import { modelFamily } from "../../lib/compare-pairs";
import { inShape } from "../../lib/thread/primary-shape";
import { LAPTOP_LINES } from "../../lib/thread/laptop-lines";

export type ThreadRanking = { slug: string; href: string; label: string; title: string; blurb: string; group: string; ids: string[]; own: boolean;
  /** The hub card's title inside its group ("Moisturizers" under "For sensitive skin"); else the label. */ short?: string;
  /** A skin need's hub page (owner 2026-11-21): the slugs of its per-type lists, shown instead of one mixed list. */ kids?: string[] };
const YEAR = () => new Date().getUTCFullYear();
const SIZE = 10, MIN_REVIEWS = 10, LT_MIN_REVIEWS = 5;

const PICKLEBALL = niche.id === "pickleball", SKIN = niche.id === "skin", DG = niche.id === "discgolf", AUDIO = niche.id === "audio", SR = niche.id === "simracing", TN = niche.id === "tennis";
/** LaptopRecs (owner 2026-11-24, PickleballRecs as the template): its live lists by category and by what matters, plus a
 *  Thread-only "Best laptops" by most loved, as disc golf's Best overall. */
const LT = niche.id === "laptop";
/** The hub's blurbs (Rankings Hub Thread copy), by list. */
const BLURB: Record<string, string> = LT ? {
  "best-laptops": "The most loved laptops right now.", "best-ultrabooks": "Thin, light and easy to live with.",
  "best-gaming-laptops": "Frame rates without the jet engine.", "best-business-laptops": "Keyboards, ports and support for work.",
  "best-creator-laptops": "Colour-accurate screens and power for big files.", "best-2-in-1-laptops": "Touch and pen without giving up the keyboard.",
  "best-chromebooks": "Simple, fast and cheap to own.", "best-macbooks": "Which MacBook owners are happiest with.",
  "best-battery-life-laptops": "All day away from the charger.", "best-budget-laptops": "The most laptop for the money.",
} : SR ? {
  // SimRacingRecs' Rankings Hub mock, on its live lists by gear type plus the Thread-only lists below.
  "best-sim-racing-gear": "The most loved gear this year.", "best-sim-racing-gear-for-beginners": "Easy to set up, great to learn on.",
  "best-force-feedback-sim-racing-wheelbases": "The most detail through long corners.", "best-sim-racing-wheelbases": "The best-reviewed wheelbases.",
  "best-sim-racing-wheels": "Rims racers keep on their base.", "best-sim-racing-pedals": "Consistent braking, lap after lap.",
  "best-sim-racing-cockpits": "Rigs that stay solid.", "best-sim-racing-shifters-handbrakes": "Crisp shifts and a solid pull.",
  "best-budget-sim-racing-gear": "Strong picks at the lower prices.", "best-high-end-sim-racing-gear": "Where racers spend the most.",
  "best-sim-racing-gear-for-console": "Works on PlayStation or Xbox.",
} : AUDIO ? {
  // AudioRecs' Rankings Hub mock, on its live lists plus the Thread-only lists below. The mock's "Best under $100" and "Best
  // for gaming" wait for prices and gaming headsets (neither is in the catalogue); "Best for beginners" has no data behind it.
  "best-headphones-overall": "The most loved by listeners right now.", "best-noise-cancelling-headphones": "For trains, planes and open offices.",
  "best-headphones-for-commuting": "Noise cancelling and comfort for the trip.", "best-headphones": "Over-ears and on-ears, open and closed.",
  "best-wireless-earbuds": "Pocketable, for the commute and the gym.", "best-iems": "Wired detail for the money.",
  "best-open-back-headphones": "Natural sound in a quiet room.", "best-headphones-for-home-listening": "For long sessions at home.",
  "best-headphones-for-the-office": "Comfort and a clear mic for the workday.", "best-headphones-for-the-gym": "Wireless pairs that stay put and hold up.",
} : DG ? {
  // DiscGolfRecs' Rankings Hub mock, on its live lists by disc type plus the Thread-only lists below.
  "best-disc-golf-discs": "The most loved by players right now.", "best-disc-golf-discs-for-beginners": "Straight, forgiving discs to learn with.",
  "best-disc-golf-discs-for-slow-arms": "Understable discs that still go far.", "best-disc-golf-putters": "Accurate discs for the short game.",
  "best-disc-golf-distance-drivers": "For the longest throws.", "best-disc-golf-fairway-drivers": "Control off the tee.",
  "best-disc-golf-midrange-discs": "Straight lines and upshots.",
} : SKIN ? {
  // SkinRecs' Rankings Hub mock, on its live lists.
  "best-face-moisturizers": "Daily creams people repurchase.", "best-face-cleansers": "Gentle, non-stripping washes.",
  "best-face-sunscreens": "Daily SPF people actually wear.", "best-skincare-treatments": "Retinoids, acids and spot treatments people stick with.",
  "best-balms-ointments": "Rich repair for dry, cracked skin.", "best-skincare-for-sensitive-skin": "Fragrance free and rarely stings.",
  dry: "Rich creams that repair a dry barrier.", oily: "Light, non-greasy picks for oily skin.", acne: "Clearer skin without the burn.",
} : TN ? {
  // TennisRecs' live lists plus the Thread-only beginners list below.
  "best-tennis-rackets": "The best-reviewed rackets right now.", "best-power-tennis-rackets": "Easy depth and pace from the baseline.",
  "best-control-tennis-rackets": "Swing out and keep it in.", "best-spin-tennis-rackets": "Heavy topspin and kick serves.",
  "best-arm-friendly-tennis-rackets": "Flexible frames, kind to your elbow.", beginners: "Forgiving rackets with a big sweet spot.",
} : PICKLEBALL ? {
  // PickleballRecs' Rankings Hub mock; the spin and tennis elbow lists are live lists the mock didn't have.
  "best-pickleball-paddles": "The best-reviewed paddles right now.", "best-power-pickleball-paddles": "For drives that land deep.",
  "best-control-pickleball-paddles": "Steady from the baseline, precise at the kitchen.", "best-spin-pickleball-paddles": "Grip on serves, rolls and drops.",
  "best-pickleball-paddles-for-tennis-elbow": "Soft, stable and kind to your elbow.", "best-pickleball-paddles-for-beginners": "Forgiving paddles with a big sweet spot.",
  standard: "The most forgiving shape.", elongated: "More reach and power.", hybrid: "Some reach, a forgiving face.",
} : {
  "best-padel-rackets": "The best-reviewed rackets right now.", "best-power-padel-rackets": "For smashes that reach the fence.",
  "best-control-padel-rackets": "Steady from the back, precise at the net.", beginners: "Forgiving rackets with a big sweet spot.",
  "sore-arms": "Soft, light and kind to your elbow.", round: "The most forgiving shape.", teardrop: "The all-rounder shape.", diamond: "Power first, for clean technique.",
};
// PickleballRecs has live lists for beginners and tennis elbow already, so no Thread-only copies there.
const PICKS: { key: string; slug: string; label: string; title: string; choice: QuickChoice; group?: string }[] = SR ? [
  // SimRacingRecs' hub mock: beginners in Most popular; budget, high-end and console from its engine's own filters.
  { key: "best-sim-racing-gear-for-beginners", slug: "best-sim-racing-gear-for-beginners", label: "Best for beginners", title: "Best sim racing gear for beginners", choice: { style: "any", level: "beginner", arm: false } },
  { key: "best-budget-sim-racing-gear", slug: "best-budget-sim-racing-gear", label: "Best on a budget", title: "Best budget sim racing gear", choice: { style: "any", arm: false, ff: { budget: "$" } }, group: "By budget and platform" },
  { key: "best-high-end-sim-racing-gear", slug: "best-high-end-sim-racing-gear", label: "Best high-end", title: "Best high-end sim racing gear", choice: { style: "any", arm: false, ff: { budget: "$$$" } }, group: "By budget and platform" },
  { key: "best-sim-racing-gear-for-console", slug: "best-sim-racing-gear-for-console", label: "Best for console", title: "Best sim racing gear for console", choice: { style: "any", arm: true }, group: "By budget and platform" },
] : DG ? [
  // DiscGolfRecs' live lists are one per disc type; the mock's beginner and slow arm lists are the home's quick match.
  { key: "best-disc-golf-discs-for-beginners", slug: "best-disc-golf-discs-for-beginners", label: "Best for beginners", title: "Best disc golf discs for beginners", choice: { style: "any", level: "beginner", arm: false } },
  { key: "best-disc-golf-discs-for-slow-arms", slug: "best-disc-golf-discs-for-slow-arms", label: "Best for slow arm speed", title: "Best disc golf discs for slow arm speed", choice: { style: "any", arm: true } },
] : TN ? [
  // TennisRecs has a live arm-friendly list already, so only beginners here.
  { key: "beginners", slug: "best-tennis-rackets-for-beginners", label: "Best for beginners", title: "Best tennis rackets for beginners", choice: { style: "any", level: "beginner", arm: false } },
] : PICKLEBALL || SKIN || AUDIO || LT ? [] : [
  { key: "beginners", slug: "best-padel-rackets-for-beginners", label: "Best for beginners", title: "Best padel rackets for beginners", choice: { style: "any", level: "beginner", arm: false } },
  // Named for tennis elbow (owner 2026-11-19); the old /rankings/best-padel-rackets-for-sore-arms 301s here (THREAD_MOVED).
  { key: "sore-arms", slug: ELBOW_SLUG, label: "Best for tennis elbow", title: "Best padel rackets for tennis elbow", choice: { style: "any", arm: true } },
];
const SHAPES: readonly (readonly [string, string])[] = SKIN || DG || AUDIO || SR || TN ? [] : PICKLEBALL ? [["standard", "Standard"], ["elongated", "Elongated"], ["hybrid", "Hybrid"]] as const
  : [["round", "Round"], ["teardrop", "Teardrop"], ["diamond", "Diamond"]] as const;
const LIST = `${niche.id}-${niche.words.many}`; // "padel-rackets", "pickleball-paddles"

export const threadRankings = cache(async (): Promise<ThreadRanking[]> => {
  if (!hasDb()) return [];
  // The racket engine's payload only where Thread-only pick lists use it (padel); skin ranks with its own engine below.
  const [lists, { all, ctx }, payload] = await Promise.all([threadLists(), threadRows(), PICKS.length ? homePayload() : null]);
  const byVotes = await votesFor(lists, all, ctx);
  // LaptopRecs' lists that keep the live order (battery life, budget): current models only (lib/thread/laptop-lines.ts).
  const isCur = new Set(all.filter(r => r.current).map(r => r.id));
  const own = lists.map(l => ({ slug: l.slug, href: l.href, label: AUDIO ? AUDIO_LABEL[l.slug] ?? l.label : l.label, title: l.title, blurb: BLURB[l.slug] ?? l.description ?? "", own: true, ids: byVotes.get(l.slug) ?? (LT ? l.ids.filter(id => isCur.has(id)) : l.ids).slice(0, SIZE),
    group: LT ? (/battery|budget/.test(l.slug) ? "By what matters" : "By type") : AUDIO ? (/noise-cancelling/.test(l.slug) ? "Most popular" : "By type") : SKIN ? (SKIN_NEEDS.some(n => n.hub === l.slug) ? HUBS : "By product type") : DG ? "By how you throw" : SR ? (/force-feedback/.test(l.slug) ? "Most popular" : "By gear") : /power|control|spin/.test(l.slug) ? "By how you play" : "Most popular" }));
  const picks = PICKS.map(p => ({ slug: p.slug, href: `/rankings/${p.slug}`, label: p.label, title: `${p.title} ${YEAR()}`, blurb: BLURB[p.key], own: false, group: p.group ?? "Most popular",
    ids: rankHome(payload!.items, RANK_SETUP, NEGATIVE_TAGS, p.choice, false, SIZE).rows.map(r => r.id) }));
  const shapes = SHAPES.map(([k]) => ({ slug: `best-${k}-${LIST}`, href: `/rankings/best-${k}-${LIST}`, label: `Best ${k} ${niche.words.many}`, title: `Best ${k} ${niche.id} ${niche.words.many} ${YEAR()}`,
    blurb: BLURB[k], own: false, group: "By shape",
    // A shape list set to "loved" (lib/thread/vote-order.ts, PickleballRecs) goes by the loved count within the shape.
    ids: all.filter(r => r.score != null && r.current && r.n >= MIN_REVIEWS && (PICKLEBALL ? inShape(niche.id, r.id, r.shape, k) : r.shape?.toLowerCase() === k))
      .sort(listOrder(niche.id, `best-${k}-${LIST}`)?.order === "loved" ? (a, b) => b.pos - a.pos || b.n - a.n : (a, b) => b.score! - a.score! || b.n - a.n).slice(0, SIZE).map(r => r.id) }));
  // The site's own lists keep their live rule (5+); a Thread-only list is a new page, so it needs a full 10 (owner 2026-11-19).
  const skin = SKIN ? await skinLists(ctx, new Set(all.filter(r => r.current).map(r => r.id))) : [];
  // DiscGolfRecs' "Best overall" (its hub mock): the highest thrower scores, current discs with 10+ reviews.
  const [oSlug, oTitle] = SR ? ["best-sim-racing-gear", "Best sim racing gear"] : LT ? ["best-laptops", "Best laptops"] : ["best-disc-golf-discs", "Best disc golf discs"];
  const overall = DG || SR || LT ? [{ slug: oSlug, href: `/rankings/${oSlug}`, label: "Best overall", title: `${oTitle} ${YEAR()}`,
    blurb: BLURB[oSlug], own: false, group: "Most popular",
    // DiscGolfRecs on v3 (no score): by how many players loved each disc, as padel's Best overall (#600).
    // LaptopRecs: the same, with its own lists' review floor (5; its reviews are spread over many generations).
    ids: all.filter(r => r.score != null && r.current && r.n >= (LT ? LT_MIN_REVIEWS : MIN_REVIEWS)).sort((a, b) => (DG || LT ? b.pos - a.pos : b.score! - a.score!) || b.n - a.n).slice(0, SIZE).map(r => r.id) }] : [];
  if (AUDIO) return audioLists(own, all, ctx);
  const out = (DG || SR || LT ? [...overall, ...picks, ...own] : [...own, ...picks, ...shapes, ...skin]).filter(l => l.ids.length >= (LT ? 1 : l.own ? 5 : 10));
  // A skin need's hub lists the per-type lists that made it (a full 10 each).
  if (!SKIN) return out;
  const shown = new Set(out.map(l => l.slug));
  return out.map(l => { const need = SKIN_NEEDS.find(n => n.hub === l.slug);
    return need ? { ...l, group: HUBS, kids: skinSplits().filter(x => x.need.key === need.key && shown.has(x.slug)).map(x => x.slug) } : l; });
});
/** The lists set to "votes" or "loved" in lib/thread/vote-order.ts (owner test 2026-11-21): "votes" by the "Most picked for"
 *  count, from the curated top 10 ("curated" pool) or every racket in the list's model-year window ("all"); "loved" by the
 *  loved count, this season's models. Other lists: none. */
async function votesFor(lists: Awaited<ReturnType<typeof threadLists>>, all: Awaited<ReturnType<typeof threadRows>>["all"], ctx: Awaited<ReturnType<typeof threadRows>>["ctx"]) {
  const out = new Map<string, string[]>(), listed = new Map(ctx.data.listed.map(p => [p.id, p]));
  // "loved" (Best overall): the row's loved count, this season's models only.
  for (const l of lists) { const lo = listOrder(niche.id, l.slug); if (lo?.order !== "loved") continue;
    const cfg = niche.topLists?.find(x => x.slug === l.slug), cur = lo.years === "current";
    // LaptopRecs: a category list ranks only its own category (the list's shape filter, lib/niche/laptop.ts topLists).
    const only = LT ? cfg?.filters?.find(f => f.column === "shape")?.include ?? null : null;
    const ids = lovedOrder(all.flatMap(r => { const p = listed.get(r.id); return p && (!cur || r.current !== false) && (!only || only.includes(r.shape ?? "")) ? [{ id: r.id, name: r.name, family: LT ? LAPTOP_LINES[r.slug]?.[0] ?? r.slug : modelFamily(p), year: r.year, reviews: r.n,
      loved: r.pos, mixed: r.mix, notForMe: r.neg }] : []; }), cur ? null : YEAR(), { ...LOVED_ORDER, minReviews: cfg?.minReviews ?? LOVED_ORDER.minReviews });
    // LaptopRecs keeps its loved order even when few current models qualify (older generations never list).
    if (ids.length >= (LT ? 1 : 5)) out.set(l.slug, ids); }
  const wanted = lists.flatMap(l => { const o = listOrder(niche.id, l.slug); return o?.order === "votes" && o.option ? [{ l, o }] : []; });
  if (!wanted.length) return out;
  const t = await traitCounts();
  for (const { l, o } of wanted) {
    const cfg = niche.topLists?.find(x => x.slug === l.slug), oldest = cfg?.maxAgeYears === undefined ? -Infinity : YEAR() - cfg.maxAgeYears;
    const pool = o.pool === "curated" ? l.ids.slice(0, SIZE).flatMap(id => all.filter(r => r.id === id)) : all.filter(r => r.year >= oldest);
    const ids = voteOrder(pool.flatMap(r => { const p = listed.get(r.id); return p ? [{ id: r.id, name: r.name, family: modelFamily(p), year: r.year, reviews: r.n,
      group: traitGroup(t, r.id, o.trait ?? VOTE_ORDER.trait) }] : []; }), o.option!, { ...VOTE_ORDER, minReviews: cfg?.minReviews ?? VOTE_ORDER.minReviews });
    if (ids.length >= 5) out.set(l.slug, ids);
  }
  return out;
}
/** SkinRecs' need hubs: pages of their own, not cards on the rankings hub (each need's heading links to its hub). */
export const HUBS = "Skin needs";
export const GROUPS = LT ? ["Most popular", "By type", "By what matters"] : AUDIO ? ["Most popular", "By type", "By use"] : SR ? ["Most popular", "By gear", "By budget and platform"] : SKIN ? [...SKIN_NEEDS.map(n => n.group), "By product type"] : DG ? ["Most popular", "By how you throw"] : ["Most popular", "By how you play", "By shape"];

/** SkinRecs' Thread-only lists (its Rankings Hub mock, split by product type owner 2026-11-21): the skin engine's own match for
 *  that pick (app/skin/rank.ts rankSkin, as the live home ranks it), current products with a match only, a full 10 needed.
 *  The dry, oily and acne hubs keep their old mixed top 10 as `ids` (the guides and Top picks read it); their pages show the
 *  per-type lists. Sensitive skin's hub is the site's own list. */
async function skinLists(ctx: unknown, current: Set<string>): Promise<ThreadRanking[]> {
  const sk = skinOf(ctx as Parameters<typeof skinOf>[0]);
  if (!sk) return [];
  const [{ rankSkin }, { readSkinChoice }] = await Promise.all([import("../skin/rank"), import("../../lib/skin-choice")]);
  const types = niche.typePages ?? [];
  const top = (q: Record<string, string>) => rankSkin(sk, readSkinChoice(q, types)).filter(x => x.pct !== null && current.has(x.r.id)).slice(0, SIZE).map(x => x.r.id);
  const hubs = SKIN_NEEDS.filter(n => n.key !== "sensitive").map(n => ({ slug: n.hub, href: `/rankings/${n.hub}`, label: n.group.replace(/^For/, "Best for"),
    title: `${n.group.replace(/^For/, "Best for")} ${YEAR()}`, blurb: BLURB[n.key], own: false, group: HUBS, ids: top(n.q) }));
  const label = (t: string) => types.find(x => x.slug === t)?.label ?? t;
  const splits = skinSplits(label).map(x => ({ slug: x.slug, href: `/rankings/${x.slug}`, label: x.label, short: x.short, title: `${x.title} ${YEAR()}`,
    blurb: x.need.blurb, own: false, group: x.need.group, ids: top({ ...x.need.q, type: x.type }) }));
  return [...hubs, ...splits];
}

/** A padel category list's curated ratings (lib/category-rating.ts), by id, in the list's order: the "How does it play?"
 *  group as the racket pages show it, the engine bar, and the shape; the prior is the share over every current racket. */
export async function ratingsFor(cat: RatingCategory, ids: string[]): Promise<Record<string, number>> {
  const [{ ctx, rows, all }, t] = await Promise.all([threadRows(), traitCounts()]);
  const prior = priorShare(cat, all.filter(r => r.current).map(r => traitGroup(t, r.id, cat.trait)));
  // SkinRecs: the attribute score's plus and minus reports are the group (its rows have no vote groups or bars).
  const sk = cat.attr ? skinOf(ctx) : null;
  const attrGroup = (id: string): Record<string, number> => { const a = sk?.attrs.get(id)?.scores[cat.attr!]; if (!a || !a.n) return {};
    return { plus: a.plus ?? (a.score / 100) * a.n, minus: a.minus ?? (1 - a.score / 100) * a.n }; };
  const groupOf = (id: string) => cat.attr ? attrGroup(id) : traitGroup(t, id, cat.trait);
  if (cat.attr) { const prior = priorShare(cat, all.filter(r => r.current).map(r => groupOf(r.id)));
    const out = categoryRatings(cat, ids.map(id => ({ group: groupOf(id) })), prior);
    return Object.fromEntries(ids.map((id, i) => [id, out[i]])); }
  const inputs = ids.map(id => { const f = ctx.facts(id);
    return { group: traitGroup(t, id, cat.trait), shape: rows.get(id)?.shape ?? null,
      dots: cat.dots === "arm" ? f.armDots ?? null : cat.dots ? f.styleDots?.[cat.dots] ?? null : null }; });
  const out = categoryRatings(cat, inputs, prior);
  return Object.fromEntries(ids.map((id, i) => [id, out[i]]));
}

/** AudioRecs' hub names for its live lists (its Rankings Hub mock). */
const AUDIO_LABEL: Record<string, string> = { "best-headphones": "Best headphones", "best-noise-cancelling-headphones": "Best noise cancelling",
  "best-iems": "Best IEMs", "best-wireless-earbuds": "Best earbuds" };
/** AudioRecs: its live lists, then the Thread-only ones its hub mock asks for, each a full 10 of current models with 10+
 *  reviews: the best listener scores overall and of the open-backs, and the audio match for each use (lib/audio-match.ts,
 *  as the home ranks it; no pair with a catch for that use). */
async function audioLists(own: ThreadRanking[], all: Awaited<ReturnType<typeof threadRows>>["all"], ctx: unknown): Promise<ThreadRanking[]> {
  const au = audioOf(ctx as Parameters<typeof audioOf>[0]);
  if (!au) return own.filter(l => l.ids.length >= 5);
  const { rankAudio } = await import("../../lib/audio-match");
  const ok = all.filter(r => r.score != null && r.current && r.n >= MIN_REVIEWS), okIds = new Set(ok.map(r => r.id));
  // No score on the v3 pages (V3-ROLLOUT-BRIEF): by most loved, as padel's Best overall (#600).
  const byScore = (keep: (r: (typeof ok)[number]) => boolean) => ok.filter(keep).sort((a, b) => b.pos - a.pos || b.n - a.n).slice(0, SIZE).map(r => r.id);
  const list = (slug: string, label: string, title: string, group: string, ids: string[]): ThreadRanking =>
    ({ slug, href: `/rankings/${slug}`, label, title: `${title} ${YEAR()}`, blurb: BLURB[slug] ?? "", own: false, group, ids });
  const wire = [...au.wire.values()].filter(w => okIds.has(w.id));
  const forUse = (use: "commute" | "office" | "home" | "gym") => rankAudio(wire, { use, sound: null, anc: false })
    .filter(x => x.m.pct !== null && !x.m.hard && !x.m.warn).slice(0, SIZE).map(x => x.w.id);
  const extra = [
    list("best-headphones-overall", "Best overall", "Best headphones overall", "Most popular", byScore(() => true)),
    list("best-headphones-for-commuting", "Best for commuting", "Best headphones for commuting", "Most popular", forUse("commute")),
    list("best-open-back-headphones", "Best open-back", "Best open-back headphones", "By type", byScore(r => r.audio?.kind === "Open-back")),
    list("best-headphones-for-home-listening", "Best for home listening", "Best headphones for home listening", "By use", forUse("home")),
    list("best-headphones-for-the-office", "Best for the office", "Best headphones for the office", "By use", forUse("office")),
    list("best-headphones-for-the-gym", "Best for the gym", "Best headphones for the gym", "By use", forUse("gym")),
  ];
  // The hub mock's order: Best overall leads Most popular.
  return [extra[0], ...own, ...extra.slice(1)].filter(l => l.ids.length >= (l.own ? 5 : 10));
}
