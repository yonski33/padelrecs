// The Thread pages' data, all from what the live site already reads (no new tables): the match context (catalogue, Player
// scores, fit facts, trait scores), the ranked lists (curated top 10s first) and the web reports. Built once per instance copy.
import { cache } from "react";
import creatorTldrs from "../../db/creators/tldrs.json";
import { tennisFeel } from "../../lib/thread/tennis-notes";
import { matchContext } from "../match-context";
import { rankedLists } from "../rankings/lists";
import { displayName } from "../../lib/brand-name";
import { rowLine } from "../../lib/row-line";
import { bestFor, levelBand, levelRange, SUITS_OK, MIN_FIT_REPORTS } from "../../lib/fit-verdict";
import { familyRowIds, modelFamily, rowOfFamily } from "../../lib/compare-pairs";
import { topPicks, PICK_CATS, type PickList, type PickRacket } from "../../lib/thread/top-picks";
import { traitSeed } from "../../lib/thread/trait-seed";
import { tallyWith } from "../../lib/thread/trait-view";
import { traitVotes, traitOverrides, comments, productVotes } from "../../db/schema";
import { and, count, desc, eq, gte, like } from "drizzle-orm";
import { sideItems, addCounts, BUSY_DAYS, SIDE_SIZE, type SideItem } from "../../lib/thread/home-side";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { productHref, niche, hasYears } from "../../lib/niche";
import { playersWord } from "../../lib/thread/web-sources";
import { flightOf } from "../../lib/discgolf-profile";
import { score } from "../../db/data";
import { sentimentOverrides } from "../../db/sentiment-tally";
import { LEVELS } from "../../lib/quick-match";
import { platformName } from "../../lib/source-label";
import { listYear } from "../../lib/top-lists";
import { plainSummary } from "../../lib/plain-summary";
import { database } from "../../db/data";
import { boardCounts } from "../../db/thread-votes";
import { VOTE_BOARDS, hiddenTraits } from "../../lib/thread/traits";
import type { ThreadRow } from "./ui";
import { reviewerInfo, typedName } from "../../lib/thread/display-name";
import { missingTable } from "../../lib/thread/member-marks";

type Ctx = Awaited<ReturnType<typeof matchContext>>;
const FEEL = { soft: "Soft", medium: "Medium", firm: "Hard" } as const;

/** A build without a database (CI) renders the Thread pages empty, as the live pages skip their reads there; Vercel builds and
 *  serves them with data. These pages serve padel, pickleball and disc golf (the shared match engine) and SkinRecs (its own
 *  engine, skinRows below). StackRecs has its own pages (app/thread/stack): there they read nothing and build empty, and
 *  proxy.ts never serves them. */
export const hasDb = () => !!process.env.DATABASE_URL && (niche.id === "padel" || niche.id === "pickleball" || niche.id === "skin"
  || niche.id === "discgolf" || niche.id === "audio" || niche.id === "simracing" || niche.id === "tennis" || niche.id === "laptop" || niche.id === "coffee");
/** The Thread home's top rows: the classic home's default order (app/home-payload.ts defaultHomeIds), as Thread rows. */
export const homeTop = (rows: Map<string, ThreadRow>, ids: string[], size = 10) => ids.flatMap(id => rows.get(id) ?? []).slice(0, size);
type Rows = { ctx: Ctx; rows: Map<string, ThreadRow>; all: ThreadRow[]; bySlug: Map<string, ThreadRow> };
export const threadRows = cache(async (): Promise<Rows> => {
  if (!hasDb()) return { ctx: null as unknown as Ctx, rows: new Map(), all: [], bySlug: new Map() };
  const [base, tallies] = await Promise.all([niche.id === "skin" ? skinRows() : niche.id === "audio" ? audioRows() : niche.id === "laptop" ? laptopRows() : niche.id === "coffee" ? coffeeRows() : countedRows(), sentimentOverrides()]);
  // TennisRecs: Feel from the stiffness, unless the votes clearly disagree (lib/thread/tennis-notes.ts, owner OK 2026-11-22).
  const tc = niche.id === "tennis" ? await traitCounts() : null, ra = tc ? new Map(base.ctx.data.rackets.map(x => [x.id, x.surface])) : null;
  const felt = (r: ThreadRow): ThreadRow => tc ? { ...r, feel: tennisFeel(ra!.get(r.id), traitGroup(tc, r.id, "feel") as Record<string, number> | null) as ThreadRow["feel"] } : r;
  if (!tallies.size && !tc) return base;
  const rows = new Map([...base.rows].map(([id, r]) => [id, felt({ ...r, ...tallyWith(r, tallies.get(id)) })]));
  return { ...base, rows, all: [...rows.values()], bySlug: new Map([...rows.values()].map(x => [x.slug, x])) };
});
async function countedRows(): Promise<Rows> {
  const ctx = await matchContext();
  const { data, sigs, takes } = ctx;
  const brand = new Map(data.brands.map(b => [b.id, b.name]));
  const reports = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
  const rows = new Map<string, ThreadRow>();
  // PickleballRecs (Grok audit 2026-11-24): a live creator page counts as enough to show, so a new model that came in with
  // creator reviews only (Loco 2 Elongated) is the current one, not hidden as if it were the older model.
  const creator = new Set(niche.id === "pickleball" ? (data as { creatorIds?: string[] }).creatorIds ?? [] : []);
  const enough = (x: { id: string }) => (reports.get(x.id) ?? 0) >= MIN_FIT_REPORTS || creator.has(x.id);
  const current = familyRowIds(data.listed, enough);
  for (const r of data.listed) rows.set(r.id, { ...rowOf(ctx, r, brand.get(r.brandId) ?? "", reports.get(r.id) ?? 0, takes.get(r.id)?.hook), current: current.has(r.id) });
  // A previous model names the model that replaced it (its page says so, with a link).
  if (niche.id === "pickleball") for (const r of data.listed) { if (current.has(r.id)) continue;
    const shown = rowOfFamily(r, data.listed, enough).shown, x = rows.get(shown.id), me = rows.get(r.id);
    if (x && me && shown.id !== r.id) me.newer = { name: x.name, href: x.href }; }
  return { ctx, rows, all: [...rows.values()], bySlug: new Map([...rows.values()].map(x => [x.slug, x])) };
}

/** DiscGolfRecs keeps a disc's flight numbers in the weight column ("5 / 4 / -1 / 1"); other sites have none. */
const flightRow = (w: string | null | undefined): Pick<ThreadRow, "flight"> => {
  if (niche.id !== "discgolf") return {};
  const f = flightOf(w);
  return f ? { flight: [f.speed, f.glide, f.turn, f.fade] } : {};
};
/** A creator page's written TL;DR (db/creators/tldrs.json), its first sentence, as a card line. */
const tldrLine = (slug: string) => { const t = (creatorTldrs as Record<string, Record<string, string>>)[niche.id]?.[slug];
  const first = t?.split(/(?<=[.!?])\s+/)[0]?.trim(); return first && first.length <= 140 ? first : null; };
function rowOf(ctx: Ctx, r: Ctx["data"]["listed"][number], brand: string, n: number, hook?: string | null): ThreadRow {
  const f = ctx.facts(r.id), c = score(ctx.data, r.id);
  let best = bestFor(f);
  let levels = f.suits ? LEVELS.filter(l => f.suits![l] >= SUITS_OK) : [];
  // DiscGolfRecs (audit 2026-11-20): the card's "Best for", the page's level tag and "Best for", and the level filter all
  // read one band (levelBand, which keeps a hard "not for beginners" disc out of beginner) in one formatter (levelRange).
  if (niche.id === "discgolf") {
    const band = levelBand(f);
    levels = band ? LEVELS.slice(band.from, band.to + 1) : [];
    if (band) best = [levelRange(levels)!, ...best.slice(1)];
  }
  const feel = f.fine?.feel ? FEEL[f.fine.feel as keyof typeof FEEL] ?? null : null;
  return { id: r.id, slug: r.slug, name: displayName(r.name, brand), href: productHref(r), pic: photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null,
    shape: r.shape, line: rowLine(r, hook), best: best.join(", ") || null, n, pos: c.positive, mix: c.mixed, neg: c.negative,
    score: ctx.sigs.get(r.id)?.signal ?? null, brand, year: r.year, levels, feel, arm: best.some(b => /sore arms|slower arms/.test(b)), ...flightRow(r.weight),
    // SimRacingRecs: its drive kind, and its row line in racer words (V3-ROLLOUT-BRIEF: never "owners").
    ...(niche.id === "simracing" ? { drive: r.balance, line: ((l: string | null) => l && playersWord(l, "racer"))(rowLine(r, hook)) } : {}),
    // PickleballRecs (v3 wave 2): its row line says players, never owners.
    // Without a stored line, its creator page's TL;DR, first sentence (Grok audit 2026-11-24: cards were blank beside a full page).
    ...(niche.id === "pickleball" ? { line: ((l: string | null) => l && playersWord(l))(rowLine(r, hook) ?? tldrLine(r.slug)) } : {}),
    // DiscGolfRecs: "owners" in a stored line read as "players" (V3-ROLLOUT-BRIEF).
    ...(niche.id === "discgolf" ? { line: ((l: string | null) => l && playersWord(l))(rowLine(r, hook)) } : {}) };
}

/** "How players vote them" until trait votes exist (migration 0024, waiting for the owner): the top 3 per trait from what
 *  players mention in their reviews (lib/trait-score.ts, the same scores as the racket pages' bars), only rackets with a
 *  Player score, and only counts of 5 or more. */
const BOARDS: [string, string][] = niche.id === "audio" || niche.id === "laptop" || niche.id === "coffee" ? [] // AudioRecs and LaptopRecs have no review trait scores: their boards come from votes only
  : niche.id === "simracing"
  ? [["ffb_detail", "Most detailed feedback"], ["ffb_strength", "Most torque"], ["brake_feel", "Best brake feel"], ["rigidity", "Least flex"], ["quiet", "Quietest"], ["setup", "Easiest to set up"]]
  : niche.id === "discgolf"
  ? [["accuracy", "Straightest flight"], ["arm", "Best for slow arms"], ["distance", "Most distance"], ["wind", "Best in the wind"], ["grip", "Most grip"], ["glide", "Most glide"]]
  : niche.id === "tennis"
  ? [["forgiveness", "Biggest sweet spot"], ["arm", "Most arm friendly"], ["control", "Most control"], ["power", "Most power"], ["spin", "Most spin"], ["stability", "Most stable"]]
  : niche.id === "pickleball"
  ? [["forgiveness", "Biggest sweet spot"], ["arm", "Most arm friendly"], ["control", "Most control"], ["power", "Most power"], ["speed", "Best at the kitchen"], ["spin", "Most spin"]]
  : [["forgiveness", "Biggest sweet spot"], ["arm", "Most arm friendly"], ["control", "Most control"], ["power", "Most power"], ["speed", "Best at the net"], ["defence", "Best in defence"]];
export type Board = { title: string; source: "votes" | "reviews"; rows: { id: string; name: string; href: string; pic: string | null; n: number }[] };
export const threadBoards = cache(async (only?: Set<string>): Promise<Board[]> => {
  if (!hasDb()) return [];
  const { ctx, rows } = await threadRows();
  // From votes once 3 or more boards have 3 rackets with 5+ votes each (trait_votes, drizzle/0024); else from reviews.
  try {
    const db = await database();
    const voted = (await Promise.all(VOTE_BOARDS.map(async b => ({ b, top: (await boardCounts(db, b.trait, b.choice))
      .filter(x => x.n >= 5 && rows.get(x.racketId)?.current && (!only || only.has(x.racketId))).slice(0, 3) }))))
      .filter(x => x.top.length === 3).map(({ b, top }) => ({ title: b.title, source: "votes" as const,
        rows: top.map(x => { const r = rows.get(x.racketId)!; return { id: r.id, name: shortName(r.name, r.brand), href: r.href, pic: r.pic, n: x.n }; }) }));
    if (voted.length >= 3) return voted;
  } catch (error) { console.error("[thread] vote boards failed", error); }
  return BOARDS.map(([key, title]) => {
    const scored = [...rows.values()].filter(r => r.score != null && r.current && (!only || only.has(r.id))).flatMap(r => {
      const t = ctx.traits(r.id).scores?.[key];
      const n = t?.people ? t.people.players.plus + t.people.reviewers.plus : t?.plus ?? 0;
      return t && t.basis === "players" && n >= 5 ? [{ r, s: t.score, n }] : [];
    }).sort((a, b) => b.n - a.n || b.s - a.s).slice(0, 3);
    return { title, source: "reviews" as const, rows: scored.map(({ r, n }) => ({ id: r.id, name: shortName(r.name, r.brand), href: r.href, pic: r.pic, n })) };
  }).filter(b => b.rows.length === 3);
});
// A site without model years (TennisRecs) keeps the generation in the name ("Head Speed MP 2022").
const shortName = (name: string, brand: string) => { const s = brand && name.startsWith(`${brand} `) ? name.slice(brand.length + 1) : name; return hasYears ? s.replace(/\s+\(?20\d\d\)?$/, "") : s; };

/** The ranking lists for the header menu, the hub and the sidebars: slug, label, title, top entries (curated first). */
export const threadLists = cache(async () => {
  if (!hasDb()) return [];
  const [{ lists }, { rows }] = await Promise.all([rankedLists(), threadRows()]);
  const seen = new Set<string>();
  return lists.filter(l => !seen.has(l.list.slug) && seen.add(l.list.slug)).map(l => ({
    slug: l.list.slug, href: `/rankings/${l.list.slug}`, label: l.list.label, title: `${l.list.title} ${listYear(l.list)}`.replace(/(\b20\d\d)\s+\1$/, "$1"),
    description: l.list.intro,
    ids: l.entries.map(e => e.product.id).filter(id => rows.has(id)),
    reviews: l.entries.reduce((s, e) => s + (rows.get(e.product.id)?.n ?? 0), 0),
  }));
});

/** Review summaries from around the web (Reddit, YouTube, blogs) and own reviews, newest first, for the home feed. */
export type FeedItem = { id: string; racketId: string; kind: "player" | "youtube" | "blog" | "reddit"; who: string; /** An unnamed review's level and side. */ info?: string | null; text: string; date: string; verdict: "positive" | "mixed" | "negative" | null; url: string | null; title?: string | null };
const ASCII = /^[\x00-\x7F’‘“”–…é]+$/;
/** The home sidebar's "Latest from the comments", with "Busy this week" filling it to 3 (lib/thread/home-side.ts). Read
 *  with the rest of the home (its 6-hour ISR), so the block is cached like the page. Empty without a database or on a read
 *  error: the block then hides. */
export const threadHomeSide = cache(async (): Promise<SideItem[]> => {
  if (!hasDb()) return [];
  const { ctx, rows } = await threadRows();
  try {
    const db = await database(), since = new Date(Date.now() - BUSY_DAYS * 86_400_000).toISOString();
    const latest = await db.select({ id: comments.id, page: comments.page, alias: comments.alias, body: comments.body, at: comments.createdAt }).from(comments)
      .where(and(eq(comments.status, "approved"), like(comments.page, "racket:%"))).orderBy(desc(comments.createdAt)).limit(20);
    const busy = new Map<string, number>();
    if (latest.filter(c => rows.has(c.page.slice("racket:".length))).length < SIDE_SIZE) {
      // New this week: approved player reviews (already loaded), quick votes and "How does it play?" votes.
      addCounts(busy, ctx.data.reviews.filter(r => r.createdAt >= since).map(r => ({ racketId: r.racketId, n: 1 })));
      addCounts(busy, await db.select({ racketId: productVotes.racketId, n: count() }).from(productVotes).where(gte(productVotes.createdAt, since)).groupBy(productVotes.racketId));
      addCounts(busy, await db.select({ racketId: traitVotes.racketId, n: count() }).from(traitVotes).where(gte(traitVotes.createdAt, since)).groupBy(traitVotes.racketId));
    }
    // Comments on any listed racket's page; the busy list only for current models (one row per model).
    return sideItems(latest, busy, (id, kind) => kind === "comment" ? rows.has(id) : !!rows.get(id)?.current);
  } catch (error) { console.error("[thread] home sidebar comments failed", error); return []; }
});

export const threadFeed = cache(async (): Promise<FeedItem[]> => {
  if (!hasDb()) return [];
  const { ctx } = await threadRows();
  const verdict = (rating: number) => rating >= 4 ? "positive" as const : rating === 3 ? "mixed" as const : "negative" as const;
  const own = ctx.data.reviews.filter(r => r.reviewText && r.reviewText.length >= 40 && ASCII.test(r.reviewText)).map(r => ({ id: `p-${r.id}`, racketId: r.racketId, kind: "player" as const,
    who: typedName(r.alias) ?? "", info: typedName(r.alias) ? null : reviewerInfo({ level: r.playerLevel, side: r.playingSide }), text: r.reviewText, date: r.createdAt, verdict: verdict(r.rating), url: null }));
  const web = ctx.data.external.filter(e => e.summary && ["YouTube", "Reddit", "Blog"].includes(platformName(e.sourcePlatform))).map(e => {
    const p = platformName(e.sourcePlatform);
    return { id: `w-${e.id}`, racketId: e.racketId, kind: (p === "YouTube" ? "youtube" : p === "Reddit" ? "reddit" : "blog") as FeedItem["kind"],
      who: p === "Reddit" ? (e.sourceUrl.match(/reddit\.com\/(r\/[A-Za-z0-9_]+)/)?.[1] ?? e.sourceName) : e.sourceName, text: plainSummary(e.summary!), date: e.sourceDate || e.createdAt, verdict: e.sentiment ?? null, url: e.sourceUrl };
  }).filter(x => x.text && ASCII.test(x.text));
  return [...own, ...web].sort((a, b) => b.date.localeCompare(a.date));
});

/** Live "How does it play?" counts: votes per option and per group, and the owner's typed group overrides, by
 *  "racketId|trait(|choice)". Empty on any error, so the pages keep the review prefill. */
export const traitCounts = cache(async () => {
  const votes = new Map<string, number>(), groupVotes = new Map<string, number>(), overrides = new Map<string, Record<string, number>>();
  let voteTotal = 0;
  try {
    const db = await database();
    for (const v of await db.select({ racketId: traitVotes.racketId, trait: traitVotes.trait, choice: traitVotes.choice, n: count() }).from(traitVotes).groupBy(traitVotes.racketId, traitVotes.trait, traitVotes.choice)) {
      votes.set(`${v.racketId}|${v.trait}|${v.choice}`, Number(v.n)); voteTotal += Number(v.n);
      groupVotes.set(`${v.racketId}|${v.trait}`, (groupVotes.get(`${v.racketId}|${v.trait}`) ?? 0) + Number(v.n));
    }
    for (const o of await db.select({ racketId: traitOverrides.racketId, trait: traitOverrides.trait, counts: traitOverrides.reviewCounts }).from(traitOverrides))
      if (o.counts) overrides.set(`${o.racketId}|${o.trait}`, o.counts);
  } catch (error) { console.error("[thread] top picks votes failed", error); }
  return { votes, groupVotes, overrides, voteTotal };
});
/** One racket's group as the racket page shows it: the owner's override or the review prefill, plus votes per option. */
export function traitGroup(t: Awaited<ReturnType<typeof traitCounts>>, id: string, trait: string): Record<string, number> {
  // A product's hidden groups (lib/thread/traits.ts HIDDEN_TRAITS) count as empty everywhere; the votes stay stored.
  if (hiddenTraits(niche.id, id).includes(trait)) return {};
  const base = t.overrides.get(`${id}|${trait}`) ?? traitSeed(niche.id, id)?.groups[trait] ?? {}, out = { ...base };
  for (const [k, n] of t.votes) { const [r, tr, c] = k.split("|"); if (r === id && tr === trait) out[c] = (out[c] ?? 0) + n; }
  return out;
}

/** "Top picks by players" (home, owner mock 2026-11-19): six lists of three, from the same per-racket counts as the racket
 *  pages' "How does it play?" (review prefill or the owner's override, plus real votes). Ranking rules: lib/thread/top-picks.ts. */
export const threadTopPicks = cache(async (): Promise<{ lists: PickList[]; total: number }> => {
  if (!hasDb()) return { lists: [], total: 0 };
  const { ctx, rows } = await threadRows();
  const { votes, groupVotes, overrides, voteTotal } = await traitCounts();
  const byId = new Map(ctx.data.listed.map(r => [r.id, r]));
  const rackets: PickRacket[] = [...rows.values()].filter(r => r.current).flatMap(r => {
    const seed = traitSeed(niche.id, r.id), raw = byId.get(r.id);
    if (!raw) return [];
    // Each list's backers and its group's total from the same sources (owner 2026-11-19): the review prefill (or the owner's
    // override) plus votes, the backers for one option and the total over all of that group's options.
    const both = PICK_CATS.map(c => {
      if (c.score) { // players behind the review trait score, as the old live board counted them; the total adds those against
        const t = ctx.traits(r.id).scores?.[c.score as keyof NonNullable<ReturnType<typeof ctx.traits>["scores"]>];
        if (!t || t.basis !== "players") return [c.key, 0, 0] as const;
        const plus = t.people ? t.people.players.plus + t.people.reviewers.plus : t.plus ?? 0;
        return [c.key, plus, plus + (t.people ? t.people.players.minus + t.people.reviewers.minus : t.minus ?? 0)] as const;
      }
      const group = overrides.get(`${r.id}|${c.trait}`) ?? seed?.groups[c.trait] ?? {};
      return [c.key, (group[c.choice] ?? 0) + (votes.get(`${r.id}|${c.trait}|${c.choice}`) ?? 0),
        Object.values(group).reduce((a, b) => a + b, 0) + (groupVotes.get(`${r.id}|${c.trait}`) ?? 0)] as const;
    });
    return [{ id: r.id, name: r.name.replace(/\s+\(?20\d\d\)?$/, ""), family: modelFamily(raw),
      counts: Object.fromEntries(both.map(([k, n]) => [k, n])), totals: Object.fromEntries(both.map(([k, , t]) => [k, t])) }];
  });
  return { lists: topPicks(rackets), total: ctx.data.reviews.length + ctx.data.external.length + voteTotal };
});

/** SkinRecs (owner 2026-11-20): its own engine (app/skin/context.ts: attribute scores, lib/attr-profile.ts), not the racket
 *  match context. The rows and a context with the same fields the Thread pages read: the catalogue, scores, review counts and
 *  quick-take hooks; the racket-only parts (fit facts, trait scores, expert lines) are empty, and the skin pages use the
 *  attribute scores instead (\`skin\` on the context). */
/** A skin row's filter facets, from the same scores as "Best for" (lib/skin-best.ts: 65+ from enough people) and the texture
 *  axis (62+ rich, 38 or less light, from 3+ reports). */
function skinFacets(a: SkinThreadCtx["attrs"] extends Map<string, infer V> ? V | undefined : never) {
  const good = (k: string) => (a?.scores[k]?.score ?? 0) >= 65 && (a?.scores[k]?.n ?? 0) >= 3;
  const t = a?.scores.texture;
  return { skin: [["suits_dry", "Dry"], ["suits_oily", "Oily"], ["suits_combination", "Combination"], ["suits_normal", "Normal"]].filter(([k]) => good(k)).map(([, l]) => l),
    texture: t && t.n >= 3 ? (t.score >= 62 ? "Rich" : t.score <= 38 ? "Light" : "Medium") : null, sensitive: good("suits_sensitive") || good("gentle") };
}
export type SkinThreadCtx = Awaited<ReturnType<typeof import("../skin/context").skinContext>>;
export const skinOf = (ctx: Ctx) => (ctx as unknown as { skin?: SkinThreadCtx }).skin ?? null;
async function skinRows(): Promise<Rows> {
  const [{ skinContext }, { quickTakeHooks }, { skinBestFor }] = await Promise.all([import("../skin/context"), import("../../db/quick-take"), import("../../lib/skin-best")]);
  const [skin, takes] = await Promise.all([skinContext(), quickTakeHooks()]);
  const { data } = skin;
  const sigs = new Map(data.listed.map(r => [r.id, { signal: skin.signal(r.id) }]));
  const ctx = { data, sigs, takes, skin, facts: () => ({ reports: 0, tags: {} }), traits: () => ({}), expertLine: () => null } as unknown as Ctx;
  const brand = new Map(data.brands.map(b => [b.id, b.name]));
  const reports = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
  const current = familyRowIds(data.listed, x => (reports.get(x.id) ?? 0) >= MIN_FIT_REPORTS);
  const rows = new Map<string, ThreadRow>();
  for (const r of data.listed) {
    const c = score(data, r.id), b = brand.get(r.brandId) ?? "";
    rows.set(r.id, { id: r.id, slug: r.slug, name: displayName(r.name, b), href: productHref(r), pic: photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null,
      // "Owners say…" reads "Reviewers say…" (V3-ROLLOUT-BRIEF: never "owners").
      shape: r.shape, line: ((l: string | null) => l && playersWord(l, "reviewer"))(rowLine(r, takes.get(r.id)?.hook)), best: skinBestFor(skin.profile, skin.attrs.get(r.id)), n: reports.get(r.id) ?? 0,
      pos: c.positive, mix: c.mixed, neg: c.negative, score: skin.signal(r.id), brand: b, year: r.year, levels: [], feel: null, arm: false, current: current.has(r.id),
      facets: skinFacets(skin.attrs.get(r.id)) });
  }
  return { ctx, rows, all: [...rows.values()], bySlug: new Map([...rows.values()].map(x => [x.slug, x])) };
}

/** AudioRecs (owner design handoff 2026-11-21): its own scores (app/audio/context.ts: listener scores and attribute scores
 *  from the reviews' quick tags), not the racket match context, the SkinRecs way: rows and a context with the fields the
 *  Thread pages read; the racket-only parts are empty, and the audio pages use the match inputs instead (`audio`). */
export type AudioThreadCtx = Awaited<ReturnType<typeof import("../audio/context").audioContext>>;
export const audioOf = (ctx: Ctx) => (ctx as unknown as { audio?: AudioThreadCtx }).audio ?? null;
/** LaptopRecs (owner 2026-11-24): it has no padel-style fit engine (lib/fit-config.ts), so its rows come straight from the
 *  catalogue, the owner scores (app/signals.ts) and the quick-take hooks, as AudioRecs' do; its quick match runs on its own
 *  inputs (lib/laptop-wire.ts). Current: the newest generation of each model with enough reviews. */
async function laptopRows(): Promise<Rows> {
  const [{ catalog }, { productSignals }, { quickTakeHooks }, { laptopLines }, { laptopReadiness }] = await Promise.all([import("../../db/data"), import("../signals"),
    import("../../db/quick-take"), import("../../lib/thread/laptop-lines"), import("../../lib/thread/laptop-ready")]);
  const [data, sigs, takes] = await Promise.all([catalog(), productSignals(), quickTakeHooks()]);
  const brand = new Map(data.brands.map(b => [b.id, b.name])), reports = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
  // Current = its line's 2026 model, or its 2025 model while the line has no 2026 successor; 2024 and older never list
  // (owner 2026-11-24, lib/thread/laptop-lines.ts). Older models keep their pages and link to the newest.
  // Every visible laptop, not only the reviewed ones (`listed`); only READY pages take a line's slot or get linked
  // (lib/thread/laptop-lines.ts LAPTOP_READY: creator reviews or a TL;DR, plus owner votes).
  const votes = (id: string) => { const c = score(data, id); return c.positive + c.mixed + c.negative; };
  const { ready } = await laptopReadiness(data.rackets, votes);
  const lines = laptopLines(data.rackets.map(r => ({ id: r.id, slug: r.slug, ready: ready.has(r.id) })));
  const current = lines.current;
  const ctx = { data, sigs, takes, laptop: { newer: lines.newer, standIns: lines.standIns, ready }, facts: () => ({ reports: 0, tags: {} }), traits: () => ({}), expertLine: () => null } as unknown as Ctx;
  const rows = new Map<string, ThreadRow>();
  for (const r of data.rackets) {
    const c = score(data, r.id), b = brand.get(r.brandId) ?? "";
    rows.set(r.id, { id: r.id, slug: r.slug, name: displayName(r.name, b), href: productHref(r), pic: photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null,
      shape: r.shape, line: rowLine(r, takes.get(r.id)?.hook), best: null, n: reports.get(r.id) ?? 0, pos: c.positive, mix: c.mixed, neg: c.negative,
      score: sigs.get(r.id)?.signal ?? null, brand: b, year: r.year, levels: [], feel: null, arm: false, current: current.has(r.id) });
  }
  return { ctx, rows, all: [...rows.values()], bySlug: new Map([...rows.values()].map(x => [x.slug, x])) };
}
/** CoffeeRecs (2026-11-28, the v3 port): like LaptopRecs, no padel-style fit engine on these pages, so its rows come straight
 *  from the listed catalogue (thin products already off, db/data.ts THIN_HIDE), the owner scores and the quick-take hooks; its
 *  quick match runs on its own inputs (lib/coffee-wire.ts). Current: not marked replaced or pre-release in its maker specs
 *  (db/specs/coffee.json `gone` / `preRelease`), so a discontinued model keeps its page but leaves the "best" lists. */
async function coffeeRows(): Promise<Rows> {
  const [{ catalog }, { productSignals }, { quickTakeHooks }, { coffeeSpec }] = await Promise.all([import("../../db/data"), import("../signals"),
    import("../../db/quick-take"), import("../../lib/coffee-specs")]);
  const [data, sigs, takes] = await Promise.all([catalog(), productSignals(), quickTakeHooks()]);
  const ctx = { data, sigs, takes, facts: () => ({ reports: 0, tags: {} }), traits: () => ({}), expertLine: () => null } as unknown as Ctx;
  const brand = new Map(data.brands.map(b => [b.id, b.name])), reports = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
  const rows = new Map<string, ThreadRow>();
  for (const r of data.listed) {
    const c = score(data, r.id), b = brand.get(r.brandId) ?? "", spec = coffeeSpec(r);
    rows.set(r.id, { id: r.id, slug: r.slug, name: displayName(r.name, b), href: productHref(r), pic: photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null,
      shape: r.shape, line: rowLine(r, takes.get(r.id)?.hook), best: null, n: reports.get(r.id) ?? 0, pos: c.positive, mix: c.mixed, neg: c.negative,
      score: sigs.get(r.id)?.signal ?? null, brand: b, year: r.year, levels: [], feel: null, arm: false, current: !spec?.gone && !spec?.preRelease });
  }
  return { ctx, rows, all: [...rows.values()], bySlug: new Map([...rows.values()].map(x => [x.slug, x])) };
}
/** LaptopRecs' line data on the rows' context (laptopRows): each older model's newest version (slug -> slug) and the lines a
 *  2025 model stands in for (no 2026 successor yet). */
export type LaptopThreadCtx = { newer: Map<string, string>; standIns: { line: string; slug: string }[];
  /** The ids whose pages are ready to list and link (lib/thread/laptop-ready.ts). */ ready: Set<string> };
export const laptopOf = (ctx: Ctx) => (ctx as unknown as { laptop?: LaptopThreadCtx }).laptop ?? null;
/** "Owners mostly rate…" → "Listeners mostly rate…" (V3-ROLLOUT-BRIEF: never "owners"). */
const listenerLine = (t: string | null) => t ? t.replace(/(?<![\w-])([Oo])wner(s?)\b/g, (_, o: string, x: string) => `${o === "O" ? "L" : "l"}istener${x}`) : t;
async function audioRows(): Promise<Rows> {
  const [{ audioContext }, { quickTakeHooks }, { bestUses, USE_WORDS }] = await Promise.all([import("../audio/context"), import("../../db/quick-take"), import("../../lib/audio-match")]);
  const [audio, takes] = await Promise.all([audioContext(), quickTakeHooks()]);
  const { data } = audio;
  const sigs = new Map(data.listed.map(r => [r.id, { signal: audio.signal(r.id) }]));
  const ctx = { data, sigs, takes, audio, facts: () => ({ reports: 0, tags: {} }), traits: () => ({}), expertLine: () => null } as unknown as Ctx;
  const brand = new Map(data.brands.map(b => [b.id, b.name]));
  const current = familyRowIds(data.listed, x => (audio.counts.get(x.id)?.n ?? 0) >= MIN_FIT_REPORTS);
  const rows = new Map<string, ThreadRow>();
  for (const r of data.listed) {
    const c = score(data, r.id), b = brand.get(r.brandId) ?? "", w = audio.wire.get(r.id)!;
    const best = bestUses(w).map(u => USE_WORDS[u]);
    rows.set(r.id, { id: r.id, slug: r.slug, name: displayName(r.name, b), href: productHref(r), pic: photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null,
      shape: r.shape, line: listenerLine(rowLine(r, takes.get(r.id)?.hook)), best: best.length ? best.join(" and ") : null, n: audio.counts.get(r.id)?.n ?? 0,
      pos: c.positive, mix: c.mixed, neg: c.negative, score: audio.signal(r.id), brand: b, year: r.year, levels: [], feel: null, arm: false, current: current.has(r.id),
      audio: { kind: w.kind, anc: w.anc, wireless: w.wireless, sound: audioSounds(w.s) } });
  }
  return { ctx, rows, all: [...rows.values()], bySlug: new Map([...rows.values()].map(x => [x.slug, x])) };
}
/** The catalogue's Sound filter (its mock: Warm, Balanced, Bright): where 3+ listeners put the tuning, as the product
 *  page's sound tag (38 or less warm, 62 or more bright). */
export function audioSounds(s: Record<string, [number, number]>): string[] {
  const t = s.tuning;
  return !t || t[1] < 3 ? [] : [t[0] <= 38 ? "Warm" : t[0] >= 62 ? "Bright" : "Balanced"];
}
