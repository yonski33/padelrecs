// "Top 10" rankings for the /rankings pages. Pure functions over the public catalogue, so tests can feed them plain objects.
// Every number they return is counted from published reviews; nothing is estimated or filled in.
import type { SpecColumn, SpecFilter, Tag, TopList } from "./niche/types";

/** No list ever ranks a product on fewer reviews than this, whatever the niche config says. */
export const MIN_LIST_REVIEWS = 5;
export const LIST_SIZE = 10;
/** A "best" list never includes a product most reviewers aren't happy with: positive share (mixed = half) of at least this. */
export const MIN_POSITIVE_SHARE = 0.6;
/** Where the lists live: /rankings is the index, /rankings/<slug> one list. Slugs carry the full phrase ("best-padel-rackets"). */
export const RANKINGS_PATH = "/rankings";
export const rankingHref = (slug: string) => `${RANKINGS_PATH}/${slug}`;
/** Quotes shown on a list are the source's exact words, so they are picked, never shortened. */
const QUOTE_MIN = 40, QUOTE_MAX = 220;

export type Verdict = "positive" | "mixed" | "negative";
type Product = { id: string; slug: string; name: string; brandId: string } & Record<SpecColumn, string | null>;
type PlayerReview = { racketId: string; rating: number; tags: string[]; createdAt: string };
type WebReview = { id: string; racketId: string; sentiment: Verdict | null; tags: string[]; excerpt: string | null; sourceUrl: string; sourcePlatform: string; sourceName: string; createdAt: string; helpful?: number };
export type ListInput = { listed: Product[]; reviews: PlayerReview[]; external: WebReview[] };

/** A player review's star rating read as a verdict: 4–5 positive, 3 mixed, 1–2 negative. Web reviews carry their own. */
export const ratingVerdict = (rating: number): Verdict => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";

/** How many average reviews every product is assumed to start with. A product's positive share is pulled towards the
 *  site-wide average by this much, so a handful of glowing reviews can't outrank dozens of mostly glowing ones. */
export const PRIOR_REVIEWS = 20;

/** Positive share after adding PRIOR_REVIEWS reviews at the site-wide average (a Bayesian average). */
export const adjustedShare = (score: number, n: number, average: number, prior = PRIOR_REVIEWS) => (score + prior * average) / (n + prior);

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
  /** (positive + mixed / 2) / reviews, 0–1: what the page shows. */
  positiveShare: number;
  /** positiveShare pulled towards the site average (adjustedShare). */
  adjusted: number;
  /** What the list is ordered by: `adjusted`, or on trait lists half `adjusted` and half the adjusted trait share. Not shown. */
  rankScore: number;
  /** Reviews carrying at least one of the list's trait tags (0 on lists without a trait). */
  traitReviews: number;
  pros: TagCount[];
  con: TagCount | null;
  quote: Quote | null;
  latest: string;
};

type Note = { verdict: Verdict; tags: string[]; createdAt: string };
const credit = (v: Verdict) => v === "positive" ? 1 : v === "mixed" ? 0.5 : 0;

function pickQuote(web: WebReview[], prefer: string[]): Quote | null {
  const usable = web.filter(e => e.sentiment === "positive" && e.excerpt && /^https?:\/\//.test(e.sourceUrl) && e.excerpt.trim().length >= QUOTE_MIN && e.excerpt.trim().length <= QUOTE_MAX);
  const fit = (e: WebReview) => Number(e.tags.some(t => prefer.includes(t)));
  const best = usable.sort((a, b) => fit(b) - fit(a) || (b.helpful ?? 0) - (a.helpful ?? 0) || Math.abs(a.excerpt!.length - 120) - Math.abs(b.excerpt!.length - 120) || a.id.localeCompare(b.id))[0];
  return best ? { id: best.id, text: best.excerpt!.trim(), url: best.sourceUrl, platform: best.sourcePlatform, source: best.sourceName } : null;
}

/** Ranks one list. Returns at most LIST_SIZE entries and never pads: products below the minimums are simply left out. */
export function rankList(list: TopList, data: ListInput, tags: readonly Tag[]): ListEntry[] {
  const trait = list.trait;
  const minReviews = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const tone = new Map(tags.map(t => [t.label, t.tone]));

  const notes = new Map<string, Note[]>();
  const add = (id: string, n: Note) => { const l = notes.get(id); if (l) l.push(n); else notes.set(id, [n]); };
  for (const r of data.reviews) add(r.racketId, { verdict: ratingVerdict(r.rating), tags: r.tags, createdAt: r.createdAt });
  // Web reviews nobody judged have no verdict, so they don't count.
  for (const e of data.external) if (e.sentiment) add(e.racketId, { verdict: e.sentiment, tags: e.tags, createdAt: e.createdAt });
  const everything = [...notes.values()].flat();
  const average = everything.length ? everything.reduce((a, x) => a + credit(x.verdict), 0) / everything.length : 0;
  const carrying = (own: Note[], list: string[]) => own.filter(x => x.tags.some(t => list.includes(t))).length;
  // How often reviews mention the trait across the whole site: the starting point for each product's trait share.
  const traitAverage = trait && everything.length ? carrying(everything, trait.tags) / everything.length : 0;

  const scored = data.listed.filter(p => matchesFilters(p, list.filters)).flatMap(product => {
    const own = notes.get(product.id) ?? [];
    const n = own.length;
    if (n < minReviews) return [];
    const traitReviews = trait ? carrying(own, trait.tags) : 0;
    // A trait list only takes products enough reviewers describe that way, and more of them for it than against it.
    if (trait && (traitReviews / n < trait.minShare || (trait.against && carrying(own, trait.against) >= traitReviews))) return [];
    const positive = own.filter(x => x.verdict === "positive").length, mixed = own.filter(x => x.verdict === "mixed").length;
    if ((positive + mixed / 2) / n < MIN_POSITIVE_SHARE) return [];
    const tagCounts = new Map<string, number>();
    for (const t of own.flatMap(x => x.tags)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const ranked = (want: Tag["tone"]) => [...tagCounts].filter(([t]) => tone.get(t) === want)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }));
    return [{
      product, reviews: n, positive, mixed, negative: n - positive - mixed, positiveShare: (positive + mixed / 2) / n,
      adjusted: adjustedShare(positive + mixed / 2, n, average), traitReviews,
      rankScore: trait ? (adjustedShare(positive + mixed / 2, n, average) + adjustedShare(traitReviews, n, traitAverage)) / 2 : adjustedShare(positive + mixed / 2, n, average),
      pros: ranked("pos").slice(0, 3), con: ranked("neg")[0] ?? null,
      quote: pickQuote(data.external.filter(e => e.racketId === product.id), trait?.tags ?? []),
      latest: own.reduce((a, x) => x.createdAt > a ? x.createdAt : a, ""),
    }];
  });
  return scored.sort((a, b) => b.rankScore - a.rankScore || b.reviews - a.reviews || a.product.name.localeCompare(b.product.name))
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
