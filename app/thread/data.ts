// The Thread pages' data, all from what the live site already reads (no new tables): the match context (catalogue, Player
// scores, fit facts, trait scores), the ranked lists (curated top 10s first) and the web reports. Built once per instance copy.
import { cache } from "react";
import { matchContext } from "../match-context";
import { rankedLists } from "../rankings/lists";
import { displayName } from "../../lib/brand-name";
import { rowLine } from "../../lib/row-line";
import { bestFor, SUITS_OK } from "../../lib/fit-verdict";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { productHref } from "../../lib/niche";
import { score } from "../../db/data";
import { LEVELS } from "../../lib/quick-match";
import { platformName } from "../../lib/source-label";
import { listYear } from "../../lib/top-lists";
import { plainSummary } from "../../lib/plain-summary";
import type { ThreadRow } from "./ui";

type Ctx = Awaited<ReturnType<typeof matchContext>>;
const FEEL = { soft: "Soft", medium: "Medium", firm: "Hard" } as const;

export const threadRows = cache(async () => {
  const ctx = await matchContext();
  const { data, sigs, takes } = ctx;
  const brand = new Map(data.brands.map(b => [b.id, b.name]));
  const reports = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
  const rows = new Map<string, ThreadRow>();
  for (const r of data.listed) rows.set(r.id, rowOf(ctx, r, brand.get(r.brandId) ?? "", reports.get(r.id) ?? 0, takes.get(r.id)?.hook));
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
export type Board = { title: string; rows: { id: string; name: string; href: string; pic: string | null; n: number }[] };
export const threadBoards = cache(async (only?: Set<string>): Promise<Board[]> => {
  const { ctx, rows } = await threadRows();
  return BOARDS.map(([key, title]) => {
    const scored = [...rows.values()].filter(r => r.score != null && (!only || only.has(r.id))).flatMap(r => {
      const t = ctx.traits(r.id).scores?.[key];
      const n = t?.people ? t.people.players.plus + t.people.reviewers.plus : t?.plus ?? 0;
      return t && t.basis === "players" && n >= 5 ? [{ r, s: t.score, n }] : [];
    }).sort((a, b) => b.n - a.n || b.s - a.s).slice(0, 3);
    return { title, rows: scored.map(({ r, n }) => ({ id: r.id, name: shortName(r.name, r.brand), href: r.href, pic: r.pic, n })) };
  }).filter(b => b.rows.length === 3);
});
const shortName = (name: string, brand: string) => (brand && name.startsWith(`${brand} `) ? name.slice(brand.length + 1) : name).replace(/\s+\(?20\d\d\)?$/, "");

/** The ranking lists for the header menu, the hub and the sidebars: slug, label, title, top entries (curated first). */
export const threadLists = cache(async () => {
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
  const { ctx } = await threadRows();
  const verdict = (rating: number) => rating >= 4 ? "positive" as const : rating === 3 ? "mixed" as const : "negative" as const;
  const own = ctx.data.reviews.filter(r => r.reviewText && r.reviewText.length >= 40 && ASCII.test(r.reviewText)).map(r => ({ id: `p-${r.id}`, racketId: r.racketId, kind: "player" as const,
    who: r.alias || "A PadelRecs player", text: r.reviewText, date: r.createdAt, verdict: verdict(r.rating), url: null }));
  const web = ctx.data.external.filter(e => e.summary && ["YouTube", "Reddit", "Blog"].includes(platformName(e.sourcePlatform))).map(e => {
    const p = platformName(e.sourcePlatform);
    return { id: `w-${e.id}`, racketId: e.racketId, kind: (p === "YouTube" ? "youtube" : p === "Reddit" ? "reddit" : "blog") as FeedItem["kind"],
      who: p === "Reddit" ? (e.sourceUrl.match(/reddit\.com\/(r\/[A-Za-z0-9_]+)/)?.[1] ?? e.sourceName) : e.sourceName, text: plainSummary(e.summary!), date: e.sourceDate || e.createdAt, verdict: e.sentiment ?? null, url: e.sourceUrl };
  }).filter(x => x.text && ASCII.test(x.text));
  return [...own, ...web].sort((a, b) => b.date.localeCompare(a.date));
});
