// "Top 10" rankings for the /best pages. Pure functions over the public catalogue, so tests can feed them plain objects.
// Every number they return is counted from published reviews; nothing is estimated or filled in.
import type { SpecColumn, SpecFilter, Tag, TopList } from "./niche/types";

/** No list ever ranks a product on fewer reviews than this, whatever the niche config says. */
export const MIN_LIST_REVIEWS = 5;
export const LIST_SIZE = 10;
/** Quotes shown on a list are the source's exact words, so they are picked, never shortened. */
const QUOTE_MIN = 40, QUOTE_MAX = 220;

export type Verdict = "positive" | "mixed" | "negative";
type Product = { id: string; slug: string; name: string; brandId: string } & Record<SpecColumn, string | null>;
type PlayerReview = { racketId: string; rating: number; tags: string[]; createdAt: string };
type WebReview = { id: string; racketId: string; sentiment: Verdict | null; tags: string[]; excerpt: string | null; sourceUrl: string; sourcePlatform: string; sourceName: string; createdAt: string; helpful?: number };
export type ListInput = { listed: Product[]; reviews: PlayerReview[]; external: WebReview[] };

/** A player review's star rating read as a verdict: 4–5 positive, 3 mixed, 1–2 negative. Web reviews carry their own. */
export const ratingVerdict = (rating: number): Verdict => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";

/** Lower bound of the 95% Wilson interval for `score` successes out of `n` (mixed reviews count as half a success). */
export function wilsonLower(score: number, n: number, z = 1.96) {
  if (n <= 0) return 0;
  const p = score / n;
  return (p + z * z / (2 * n) - z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / (1 + z * z / n);
}

const firstWord = (v: string) => v.trim().toLowerCase().split(/[^a-z]+/)[0] ?? "";
export function matchesFilters(product: Product, filters: SpecFilter[] = []) {
  return filters.every(f => {
    const value = product[f.column];
    const word = value ? firstWord(value) : null;
    if (f.include && (!word || !f.include.some(x => firstWord(x) === word))) return false;
    if (f.exclude && word && f.exclude.some(x => firstWord(x) === word)) return false;
    return true;
  });
}

export type TagCount = { label: string; count: number };
export type Quote = { id: string; text: string; url: string; platform: string; source: string };
export type ListEntry = {
  rank: number;
  product: Product;
  /** Published reviews with a verdict. */
  reviews: number;
  positive: number; mixed: number; negative: number;
  /** (positive + mixed / 2) / reviews, 0–1. */
  positiveShare: number;
  /** Rank score, 0–1: the Wilson lower bound of the positive share, blended with the list's tag part. */
  score: number;
  /** Share of reviews carrying each weighted tag. */
  tagShares: Record<string, number>;
  pros: TagCount[];
  con: TagCount | null;
  quote: Quote | null;
  latest: string;
};

type Note = { verdict: Verdict; tags: string[]; createdAt: string };

/** The tag part of a list score, 0–1: the weighted tag shares, divided by the positive weights so a product that every
 *  reviewer tags with every rewarded term would score 1. */
export function tagPart(shares: Record<string, number>, weights: Record<string, number>) {
  const max = Object.values(weights).filter(w => w > 0).reduce((a, b) => a + b, 0);
  if (!max) return 0;
  const sum = Object.entries(weights).reduce((a, [t, w]) => a + w * (shares[t] ?? 0), 0);
  return Math.min(1, Math.max(0, sum / max));
}

function pickQuote(web: WebReview[], prefer: string[]): Quote | null {
  const usable = web.filter(e => e.sentiment === "positive" && e.excerpt && /^https?:\/\//.test(e.sourceUrl) && e.excerpt.trim().length >= QUOTE_MIN && e.excerpt.trim().length <= QUOTE_MAX);
  const fit = (e: WebReview) => Number(e.tags.some(t => prefer.includes(t)));
  const best = usable.sort((a, b) => fit(b) - fit(a) || (b.helpful ?? 0) - (a.helpful ?? 0) || Math.abs(a.excerpt!.length - 120) - Math.abs(b.excerpt!.length - 120) || a.id.localeCompare(b.id))[0];
  return best ? { id: best.id, text: best.excerpt!.trim(), url: best.sourceUrl, platform: best.sourcePlatform, source: best.sourceName } : null;
}

/** Ranks one list. Returns at most LIST_SIZE entries and never pads: products below the minimums are simply left out. */
export function rankList(list: TopList, data: ListInput, tags: readonly Tag[]): ListEntry[] {
  const weights = list.tagWeights ?? {};
  const rewarded = Object.keys(weights).filter(t => weights[t] > 0);
  const blend = rewarded.length ? Math.min(1, Math.max(0, list.tagBlend ?? 0.5)) : 0;
  const minReviews = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const tone = new Map(tags.map(t => [t.label, t.tone]));

  const notes = new Map<string, Note[]>();
  const add = (id: string, n: Note) => { const l = notes.get(id); if (l) l.push(n); else notes.set(id, [n]); };
  for (const r of data.reviews) add(r.racketId, { verdict: ratingVerdict(r.rating), tags: r.tags, createdAt: r.createdAt });
  // Web reviews nobody judged have no verdict, so they don't count.
  for (const e of data.external) if (e.sentiment) add(e.racketId, { verdict: e.sentiment, tags: e.tags, createdAt: e.createdAt });

  const scored = data.listed.filter(p => matchesFilters(p, list.filters)).flatMap(product => {
    const own = notes.get(product.id) ?? [];
    const n = own.length;
    if (n < minReviews) return [];
    if (rewarded.length && own.filter(x => x.tags.some(t => rewarded.includes(t))).length < (list.minTagged ?? 1)) return [];
    const positive = own.filter(x => x.verdict === "positive").length, mixed = own.filter(x => x.verdict === "mixed").length;
    const tagCounts = new Map<string, number>();
    for (const t of own.flatMap(x => x.tags)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const tagShares = Object.fromEntries(Object.keys(weights).map(t => [t, (tagCounts.get(t) ?? 0) / n]));
    const confidence = wilsonLower(positive + mixed / 2, n);
    const score = (1 - blend) * confidence + blend * tagPart(tagShares, weights);
    const ranked = (want: Tag["tone"]) => [...tagCounts].filter(([t]) => tone.get(t) === want)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }));
    return [{
      product, reviews: n, positive, mixed, negative: n - positive - mixed, positiveShare: (positive + mixed / 2) / n, score, tagShares,
      pros: ranked("pos").slice(0, 3), con: ranked("neg")[0] ?? null,
      quote: pickQuote(data.external.filter(e => e.racketId === product.id), rewarded),
      latest: own.reduce((a, x) => x.createdAt > a ? x.createdAt : a, ""),
    }];
  });
  return scored.sort((a, b) => b.score - a.score || b.reviews - a.reviews || a.product.name.localeCompare(b.product.name))
    .slice(0, LIST_SIZE).map((e, i) => ({ rank: i + 1, ...e }));
}

/** Totals shown with a list: reviews behind the ranked entries and the newest of them. */
export function listTotals(entries: ListEntry[]) {
  return {
    reviews: entries.reduce((a, e) => a + e.reviews, 0),
    updated: entries.reduce((a, e) => e.latest > a ? e.latest : a, ""),
  };
}

/** "Best Padel Rackets for Power 2026, Ranked by 412 Real Player Reviews". */
export const listTitle = (list: Pick<TopList, "title">, year: number, reviews: number, person = "Player") =>
  `${list.title} ${year}, Ranked by ${reviews.toLocaleString("en-US")} Real ${person} Reviews`;
