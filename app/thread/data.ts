// The Thread pages' data, all from what the live site already reads (no new tables): the match context (catalogue, Player
// scores, fit facts, trait scores), the ranked lists (curated top 10s first) and the web reports. Built once per instance copy.
import { cache } from "react";
import { matchContext } from "../match-context";
import { rankedLists } from "../rankings/lists";
import { displayName } from "../../lib/brand-name";
import { rowLine } from "../../lib/row-line";
import { bestFor, SUITS_OK, MIN_FIT_REPORTS } from "../../lib/fit-verdict";
import { familyRowIds, modelFamily } from "../../lib/compare-pairs";
import { topPicks, PICK_CATS, type PickList, type PickRacket } from "../../lib/thread/top-picks";
import { traitSeed } from "../../lib/thread/trait-seed";
import { traitVotes, traitOverrides } from "../../db/schema";
import { count } from "drizzle-orm";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { productHref } from "../../lib/niche";
import { score } from "../../db/data";
import { LEVELS } from "../../lib/quick-match";
import { platformName } from "../../lib/source-label";
import { listYear } from "../../lib/top-lists";
import { plainSummary } from "../../lib/plain-summary";
import { database } from "../../db/data";
import { boardCounts } from "../../db/thread-votes";
import { VOTE_BOARDS } from "../../lib/thread/traits";
import type { ThreadRow } from "./ui";
import { reviewerName } from "../../lib/thread/display-name";

type Ctx = Awaited<ReturnType<typeof matchContext>>;
const FEEL = { soft: "Soft", medium: "Medium", firm: "Hard" } as const;

/** A build without a database (CI) renders the Thread pages empty, as the live pages skip their reads there; Vercel builds and
 *  serves them with data. */
export const hasDb = () => !!process.env.DATABASE_URL;
/** The Thread home's top rows: the classic home's default order (app/home-payload.ts defaultHomeIds), as Thread rows. */
export const homeTop = (rows: Map<string, ThreadRow>, ids: string[], size = 10) => ids.flatMap(id => rows.get(id) ?? []).slice(0, size);
type Rows = { ctx: Ctx; rows: Map<string, ThreadRow>; all: ThreadRow[]; bySlug: Map<string, ThreadRow> };
export const threadRows = cache(async (): Promise<Rows> => {
  if (!hasDb()) return { ctx: null as unknown as Ctx, rows: new Map(), all: [], bySlug: new Map() };
  const ctx = await matchContext();
  const { data, sigs, takes } = ctx;
  const brand = new Map(data.brands.map(b => [b.id, b.name]));
  const reports = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
  const rows = new Map<string, ThreadRow>();
  const current = familyRowIds(data.listed, x => (reports.get(x.id) ?? 0) >= MIN_FIT_REPORTS);
  for (const r of data.listed) rows.set(r.id, { ...rowOf(ctx, r, brand.get(r.brandId) ?? "", reports.get(r.id) ?? 0, takes.get(r.id)?.hook), current: current.has(r.id) });
  return { ctx, rows, all: [...rows.values()], bySlug: new Map([...rows.values()].map(x => [x.slug, x])) };
});

function rowOf(ctx: Ctx, r: Ctx["data"]["listed"][number], brand: string, n: number, hook?: string | null): ThreadRow {
  const f = ctx.facts(r.id), c = score(ctx.data, r.id), best = bestFor(f);
  const levels = f.suits ? LEVELS.filter(l => f.suits![l] >= SUITS_OK) : [];
  const feel = f.fine?.feel ? FEEL[f.fine.feel as keyof typeof FEEL] ?? null : null;
  return { id: r.id, slug: r.slug, name: displayName(r.name, brand), href: productHref(r), pic: photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null,
    shape: r.shape, line: rowLine(r, hook), best: best.join(", ") || null, n, pos: c.positive, mix: c.mixed, neg: c.negative,
    score: ctx.sigs.get(r.id)?.signal ?? null, brand, year: r.year, levels, feel, arm: best.some(b => /sore arms/.test(b)) };
}

/** "How players vote them" until trait votes exist (migration 0024, waiting for the owner): the top 3 per trait from what
 *  players mention in their reviews (lib/trait-score.ts, the same scores as the racket pages' bars), only rackets with a
 *  Player score, and only counts of 5 or more. */
const BOARDS: [string, string][] = [["forgiveness", "Biggest sweet spot"], ["arm", "Most arm friendly"], ["control", "Most control"], ["power", "Most power"], ["speed", "Best at the net"], ["defence", "Best in defence"]];
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
const shortName = (name: string, brand: string) => (brand && name.startsWith(`${brand} `) ? name.slice(brand.length + 1) : name).replace(/\s+\(?20\d\d\)?$/, "");

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
export type FeedItem = { id: string; racketId: string; kind: "player" | "youtube" | "blog" | "reddit"; who: string; text: string; date: string; verdict: "positive" | "mixed" | "negative" | null; url: string | null; title?: string | null };
const ASCII = /^[\x00-\x7F’‘“”–…é]+$/;
export const threadFeed = cache(async (): Promise<FeedItem[]> => {
  if (!hasDb()) return [];
  const { ctx } = await threadRows();
  const verdict = (rating: number) => rating >= 4 ? "positive" as const : rating === 3 ? "mixed" as const : "negative" as const;
  const own = ctx.data.reviews.filter(r => r.reviewText && r.reviewText.length >= 40 && ASCII.test(r.reviewText)).map(r => ({ id: `p-${r.id}`, racketId: r.racketId, kind: "player" as const,
    who: reviewerName({ alias: r.alias, level: r.playerLevel, side: r.playingSide }), text: r.reviewText, date: r.createdAt, verdict: verdict(r.rating), url: null }));
  const web = ctx.data.external.filter(e => e.summary && ["YouTube", "Reddit", "Blog"].includes(platformName(e.sourcePlatform))).map(e => {
    const p = platformName(e.sourcePlatform);
    return { id: `w-${e.id}`, racketId: e.racketId, kind: (p === "YouTube" ? "youtube" : p === "Reddit" ? "reddit" : "blog") as FeedItem["kind"],
      who: p === "Reddit" ? (e.sourceUrl.match(/reddit\.com\/(r\/[A-Za-z0-9_]+)/)?.[1] ?? e.sourceName) : e.sourceName, text: plainSummary(e.summary!), date: e.sourceDate || e.createdAt, verdict: e.sentiment ?? null, url: e.sourceUrl };
  }).filter(x => x.text && ASCII.test(x.text));
  return [...own, ...web].sort((a, b) => b.date.localeCompare(a.date));
});

/** "Top picks by players" (home, owner mock 2026-11-19): six lists of three, from the same per-racket counts as the racket
 *  pages' "How does it play?" (review prefill or the owner's override, plus real votes). Ranking rules: lib/thread/top-picks.ts. */
export const threadTopPicks = cache(async (): Promise<{ lists: PickList[]; total: number }> => {
  if (!hasDb()) return { lists: [], total: 0 };
  const { ctx, rows } = await threadRows();
  const votes = new Map<string, number>(), overrides = new Map<string, Record<string, number>>();
  let voteTotal = 0;
  try {
    const db = await database();
    for (const v of await db.select({ racketId: traitVotes.racketId, trait: traitVotes.trait, choice: traitVotes.choice, n: count() }).from(traitVotes).groupBy(traitVotes.racketId, traitVotes.trait, traitVotes.choice)) {
      votes.set(`${v.racketId}|${v.trait}|${v.choice}`, Number(v.n)); voteTotal += Number(v.n);
    }
    for (const o of await db.select({ racketId: traitOverrides.racketId, trait: traitOverrides.trait, counts: traitOverrides.reviewCounts }).from(traitOverrides))
      if (o.counts) overrides.set(`${o.racketId}|${o.trait}`, o.counts);
  } catch (error) { console.error("[thread] top picks votes failed", error); }
  const byId = new Map(ctx.data.listed.map(r => [r.id, r]));
  const rackets: PickRacket[] = [...rows.values()].filter(r => r.current).flatMap(r => {
    const seed = traitSeed("padel", r.id), raw = byId.get(r.id);
    if (!raw) return [];
    const counts = Object.fromEntries(PICK_CATS.map(c => {
      if (c.score) { // players behind the review trait score, as the old live board counted them
        const t = ctx.traits(r.id).scores?.[c.score as keyof NonNullable<ReturnType<typeof ctx.traits>["scores"]>];
        return [c.key, t && t.basis === "players" ? (t.people ? t.people.players.plus + t.people.reviewers.plus : t.plus ?? 0) : 0];
      }
      const reviews = (overrides.get(`${r.id}|${c.trait}`) ?? seed?.groups[c.trait])?.[c.choice] ?? 0;
      return [c.key, reviews + (votes.get(`${r.id}|${c.trait}|${c.choice}`) ?? 0)];
    }));
    return [{ id: r.id, name: r.name.replace(/\s+\(?20\d\d\)?$/, ""), family: modelFamily(raw), opinions: r.n, counts }];
  });
  return { lists: topPicks(rackets), total: ctx.data.reviews.length + ctx.data.external.length + voteTotal };
});
