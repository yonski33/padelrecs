// StackRecs' Thread data (plan PR #517): the catalog the live site reads (db/data.ts), its own scores (lib/stack/score.ts,
// freshness-weighted and commission-blind), the "Best for" evidence for Find my match, and the review cards. Built once per
// instance copy; a build without a database (CI) renders empty pages, as the padel Thread pages do.
import { cache } from "react";
import { count } from "drizzle-orm";
import { catalog, database, type Catalog } from "../../../db/data";
import { productVotes, traitVotes } from "../../../db/schema";
import { productHref } from "../../../lib/niche";
import { typedName } from "../../../lib/thread/display-name";
import { onePerChannel } from "../../../lib/youtube-pick";
import { redditPick, subOf } from "../../../lib/reddit-cards";
import { plainSummary } from "../../../lib/plain-summary";
import { STACK_TOOLS, sideOf, toolBySlug, type Side, type StackTool } from "../../../lib/stack/catalog";
import { GROUPS } from "../../../lib/stack/traits";
import { monogram } from "../../../lib/stack/monogram";
// The tool's uploaded logo (admin, /product-photo/<slug>) where there is one; the monogram tile stays the fallback.
import { shopPhoto } from "../../../lib/shop-photos";
import { stackScores, weighOpinions, ageMonths, CUTOFF_MONTHS, type Opinion, type Verdict } from "../../../lib/stack/score";
import type { MatchInput } from "../../../lib/stack/match";
import { ago, type ThreadRow } from "../ui";
import type { RvCard } from "../racket-data";

export const hasDb = () => !!process.env.DATABASE_URL;
export type StackRow = ThreadRow & { side: Side; facts: StackTool | null; bestFor: Record<string, number>; newest: string | null };
type Tool = Catalog["rackets"][number];
type Data = { data: Catalog | null; rows: StackRow[]; bySlug: Map<string, StackRow>; byId: Map<string, StackRow>; opinions: Opinion[]; boards: Map<string, Map<string, number>> };

const verdictOf = (rating: number): Verdict => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";
/** A positive review's "You are" answer counts toward that "Best for" option (review mentions, next to the votes). */
const LEVEL_CHOICE: Record<string, string> = { "Non-coder": "non_coder", "Some code": "hobby_dev", "Developer": "pro_team",
  "Solo": "solo", "Agency": "agency", "In-house team": "in_house" };

/** Every opinion that can count: own reviews, quick votes and judged outside reviews, each with its date and version. */
function opinionsOf(data: Catalog, votes: { racketId: string; rating: number; createdAt: string }[]): Opinion[] {
  return [
    ...data.reviews.map(r => ({ toolId: r.racketId, verdict: verdictOf(r.rating), date: r.createdAt, version: r.variant })),
    ...votes.map(v => ({ toolId: v.racketId, verdict: verdictOf(v.rating), date: v.createdAt, version: null })),
    ...data.external.flatMap(e => e.sentiment ? [{ toolId: e.racketId, verdict: e.sentiment, date: e.sourceDate || e.createdAt, version: e.variant }] : []),
  ];
}

/** Without a database (CI, a local preview before the seed): the catalog file's tools, with no opinions at all, so the
 *  pages show every tool as New. Nothing is invented: no score, no review, no vote. */
function catalogOnly(): Data {
  const rows: StackRow[] = STACK_TOOLS.map(t => ({ id: t.slug, slug: t.slug, name: t.name, href: `/tools/${t.slug}`, pic: monogram(t.name, sideOf(t.category)!), shape: t.category, line: null,
    best: null, n: 0, pos: 0, mix: 0, neg: 0, score: null, brand: t.vendor, year: 2026, levels: [], feel: null, arm: false, current: true,
    side: sideOf(t.category)!, facts: t, bestFor: {}, newest: null }));
  return { data: null, rows, bySlug: new Map(rows.map(x => [x.slug, x])), byId: new Map(rows.map(x => [x.id, x])), opinions: [], boards: new Map() };
}

export const stackData = cache(async (): Promise<Data> => {
  if (!hasDb()) return catalogOnly();
  const db = await database();
  const [data, votes, traits] = await Promise.all([catalog(),
    db.select({ racketId: productVotes.racketId, rating: productVotes.rating, createdAt: productVotes.createdAt }).from(productVotes),
    db.select({ racketId: traitVotes.racketId, trait: traitVotes.trait, choice: traitVotes.choice, n: count() }).from(traitVotes)
      .groupBy(traitVotes.racketId, traitVotes.trait, traitVotes.choice)]);
  const now = Date.now(), opinions = opinionsOf(data, votes);
  // A quick vote from someone who also reviewed counts twice here; the poll's own counts dedupe (api/thread-poll). Small
  // for now; revisit when votes outnumber reviews.
  const tools = data.rackets.filter(r => sideOf(r.shape));
  const sigs = stackScores(tools.map(r => ({ id: r.id, category: r.shape! })), opinions, now);
  const boards = new Map<string, Map<string, number>>();
  for (const t of traits) { const k = `${t.trait}:${t.choice}`; (boards.get(k) ?? boards.set(k, new Map()).get(k)!).set(t.racketId, Number(t.n)); }
  const brand = new Map(data.brands.map(b => [b.id, b.name]));
  const rows = tools.map(r => rowOf(r, brand.get(r.brandId) ?? "", opinions.filter(o => o.toolId === r.id), sigs.get(r.id)?.signal ?? null, now, data, boards));
  return { data, rows, bySlug: new Map(rows.map(x => [x.slug, x])), byId: new Map(rows.map(x => [x.id, x])), opinions, boards };
});

function rowOf(r: Tool, vendor: string, ops: Opinion[], score: number | null, now: number, data: Catalog, boards: Map<string, Map<string, number>>): StackRow {
  const side = sideOf(r.shape)!, facts = toolBySlug.get(r.slug) ?? null, w = weighOpinions(ops, now);
  const counted = ops.filter(o => ageMonths(o.date, now) <= CUTOFF_MONTHS), n = (v: Verdict) => counted.filter(o => o.verdict === v).length;
  const bestFor: Record<string, number> = {};
  for (const [k] of GROUPS[side].find(g => g.key === "best_for")!.options) bestFor[k] = boards.get(`best_for:${k}`)?.get(r.id) ?? 0;
  for (const x of data.reviews) if (x.racketId === r.id && x.rating >= 4 && x.playerLevel && LEVEL_CHOICE[x.playerLevel] in bestFor) bestFor[LEVEL_CHOICE[x.playerLevel]]++;
  const top = Object.entries(bestFor).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])[0];
  const label = top ? GROUPS[side].find(g => g.key === "best_for")!.options.find(([k]) => k === top[0])![1] : null;
  const reviews = data.reviews.filter(x => x.racketId === r.id).length + data.external.filter(x => x.racketId === r.id).length;
  return { id: r.id, slug: r.slug, name: r.name, href: productHref(r), pic: shopPhoto(r) ?? monogram(r.name, side), shape: r.shape, line: r.reviewSummary?.split(/(?<=\.)\s/)[0] ?? null,
    best: label ? label.toLowerCase() : null, n: reviews, pos: n("positive"), mix: n("mixed"), neg: n("negative"), score, brand: vendor, year: r.year,
    levels: [], feel: null, arm: false, current: true, side, facts, bestFor, newest: w.newest };
}

/** The wire rows Find my match ranks in the browser (lib/stack/match.ts). */
export const matchInputs = (rows: StackRow[]): MatchInput[] => rows.map(r => ({ id: r.id, slug: r.slug, side: r.side, score: r.score, bestFor: r.bestFor }));

/** Boards from votes: the top 3 tools for a trait choice on one side. */
export function boardTop(d: Data, side: Side, trait: string, choice: string, size = 3) {
  const m = d.boards.get(`${trait}:${choice}`) ?? new Map<string, number>();
  return d.rows.filter(r => r.side === side && (m.get(r.id) ?? 0) > 0).map(r => ({ r, n: m.get(r.id)! })).sort((a, b) => b.n - a.n).slice(0, size);
}

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };

/** A tool's review cards: own reviews, one YouTube summary per channel, one blog per site, forum summaries and the Reddit
 *  summaries, newest first, each with its version tag. */
export function toolCards(data: Catalog, id: string, now = Date.now()): RvCard[] {
  const own = data.reviews.filter(x => x.racketId === id), ext = data.external.filter(e => e.racketId === id);
  const text = (e: (typeof ext)[number]) => (e.summary ? plainSummary(e.summary) : e.excerptTranslation || e.excerpt || "").trim();
  const web = (e: (typeof ext)[number], kind: RvCard["kind"], who = e.sourceName, t = text(e)): RvCard => ({ id: `w-${e.id}`, kind, who, meta: null,
    verdict: e.sentiment ?? null, at: e.sourceDate ?? "", when: ago(e.sourceDate, now), text: t, quote: !e.summary && !!e.excerpt, url: e.sourceUrl,
    video: kind === "youtube" ? vid(e.sourceUrl) : null, helpful: e.helpful, version: e.variant });
  const hosts = new Set<string>();
  return [
    ...own.map(x => ({ id: `p-${x.id}`, kind: "player" as const, who: typedName(x.alias) ?? "User", alias: typedName(x.alias) ?? "",
      meta: [x.playerLevel?.toLowerCase(), x.playingSide?.toLowerCase()].filter(Boolean).join(" · ") || null, verdict: verdictOf(x.rating),
      at: x.createdAt, when: ago(x.createdAt, now), text: x.reviewText, quote: false, url: null, video: null, helpful: x.helpful, version: x.variant })),
    ...onePerChannel(ext.filter(e => e.sourcePlatform === "YouTube"), () => 1).filter(e => text(e)).map(e => web(e, "youtube")),
    ...ext.filter(e => e.sourcePlatform === "Blog" && text(e)).sort((a, b) => (b.sourceDate ?? "").localeCompare(a.sourceDate ?? ""))
      .filter(e => { const k = host(e.sourceUrl) || e.sourceName.toLowerCase(); if (hosts.has(k)) return false; hosts.add(k); return true; }).map(e => web(e, "blog")),
    ...ext.filter(e => e.sourcePlatform === "Forum" && text(e)).map(e => web(e, "forum")),
    ...redditPick(data.external, id).map(({ row, text: t }) => web(row as (typeof ext)[number], "reddit", subOf(row.sourceUrl, row.sourceName), t)),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

/** The version chips for a tool: its catalog list (the `core` spec), else the tags its reviews carry. */
export function versionChips(tool: Pick<Tool, "core">, cards: RvCard[]) {
  const listed = (tool.core ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const used = [...new Set(cards.map(c => c.version).filter((x): x is string => !!x))];
  return (listed.length ? listed.filter(v => used.includes(v)) : used).sort().reverse();
}
