// Rankings for the /rankings pages (up to 10 products per list). Pure functions over the public catalogue, so tests can feed them plain objects.
// Every number they return is counted from published reviews; nothing is estimated or filled in.
import { englishQuote, languageName } from "./languages";
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
type Product = { id: string; slug: string; name: string; brandId: string; year: number } & Record<SpecColumn, string | null>;
type PlayerReview = { racketId: string; rating: number; tags: string[]; createdAt: string };
type WebReview = { id: string; racketId: string; sentiment: Verdict | null; tags: string[]; excerpt: string | null; excerptTranslation?: string | null; sourceLanguage?: string | null; sourceUrl: string; sourcePlatform: string; sourceName: string; sourceDate?: string | null; createdAt: string; helpful?: number };
export type ListInput = { listed: Product[]; reviews: PlayerReview[]; external: WebReview[] };

/** A player review's star rating read as a verdict: 4–5 positive, 3 mixed, 1–2 negative. Web reviews carry their own. */
export const ratingVerdict = (rating: number): Verdict => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";

/** On trait lists ("best for power"), how much being liked more than average adds next to trait mentions, which count
 *  fully. A bonus only: being liked less than average takes nothing away. */
export const TRAIT_LIST_LIKED_WEIGHT = 0.5;

/** By default only reviews written in the last this many years count, so lists follow what people say about products now.
 *  A web review is dated by its source; a player review by when it was submitted. Lists can set their own (reviewYears). */
export const REVIEW_YEARS = 3;

/** How many months of reviews a list counts: its own reviewMonths or reviewYears, else REVIEW_YEARS. */
export const reviewWindowMonths = (list: Pick<TopList, "reviewMonths" | "reviewYears">) =>
  list.reviewMonths ?? (list.reviewYears ?? REVIEW_YEARS) * 12;

/** A niche's lists with its recentMonths window filled in where a list doesn't set its own. */
export const withNicheWindow = <L extends TopList>(lists: readonly L[], months?: number): L[] =>
  lists.map(l => months === undefined || l.reviewMonths !== undefined || l.reviewYears !== undefined ? l : { ...l, reviewMonths: months });

/** "12 months", "2 years", "30 months". */
export const windowLabel = (months: number) => months % 12 === 0 && months > 12 ? `${months / 12} years` : `${months} months`;

/** How many more positive reviews (mixed = half) a product has than an average product with as many reviews would have.
 *  It is a count, so it grows with both how liked and how much discussed a product is: 33 of 43 beats 15 of 17. */
export const aboveAverage = (score: number, n: number, average: number) => score - average * n;

/** What lists without a trait are ordered by: positive share (mixed = half) × log2(1 + reviews). Being liked counts most,
 *  and every doubling of reviews adds one share's worth, so 51 positive of 59 (5.36) ranks above 31 of 32 (4.96). */
export const likedScore = (positiveShare: number, n: number) => n > 0 ? positiveShare * Math.log2(1 + n) : 0;

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
/** translatedFrom: the source's language when `text` is our translation of it (shown as "translated from …"). */
export type Quote = { id: string; text: string; url: string; platform: string; source: string; translatedFrom?: string };
export type ListEntry = {
  rank: number;
  product: Product;
  /** Published reviews with a verdict. */
  reviews: number;
  positive: number; mixed: number; negative: number;
  /** (positive + mixed / 2) / reviews, 0–1: what the page shows. */
  positiveShare: number;
  /** Positive reviews above what an average product with this many reviews would have (aboveAverage). */
  aboveAverage: number;
  /** What the list is ordered by: `likedScore`; on trait lists, trait mentions above average plus
   *  TRAIT_LIST_LIKED_WEIGHT × `aboveAverage` when that is positive. Not shown. */
  rankScore: number;
  /** Positive or mixed reviews carrying at least one of the list's trait tags (0 on lists without a trait). A negative
   *  review that calls a racket powerful doesn't make it a good racket for power. */
  traitReviews: number;
  pros: TagCount[];
  con: TagCount | null;
  quote: Quote | null;
  latest: string;
};

type Note = { verdict: Verdict; tags: string[]; createdAt: string };
const credit = (v: Verdict) => v === "positive" ? 1 : v === "mixed" ? 0.5 : 0;

function pickQuote(web: WebReview[], prefer: string[]): Quote | null {
  // The quote readers see is English: a foreign source's translation, never its original words unlabelled.
  const text = (e: WebReview) => englishQuote(e)?.trim() ?? "";
  const usable = web.filter(e => e.sentiment === "positive" && text(e) && /^https?:\/\//.test(e.sourceUrl) && text(e).length >= QUOTE_MIN && text(e).length <= QUOTE_MAX);
  const fit = (e: WebReview) => Number(e.tags.some(t => prefer.includes(t)));
  const best = usable.sort((a, b) => fit(b) - fit(a) || (b.helpful ?? 0) - (a.helpful ?? 0) || Math.abs(text(a).length - 120) - Math.abs(text(b).length - 120) || a.id.localeCompare(b.id))[0];
  const from = best?.sourceLanguage && best.sourceLanguage !== "en" ? languageName(best.sourceLanguage) ?? undefined : undefined;
  return best ? { id: best.id, text: text(best), url: best.sourceUrl, platform: best.sourcePlatform, source: best.sourceName, ...(from ? { translatedFrom: from } : {}) } : null;
}

/** Ranks one list. Returns at most LIST_SIZE entries and never pads: products below the minimums are simply left out. */
export function rankList(list: TopList, data: ListInput, tags: readonly Tag[], now = new Date()): ListEntry[] {
  const trait = list.trait;
  const minReviews = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const tone = new Map(tags.map(t => [t.label, t.tone]));

  const notes = new Map<string, Note[]>();
  const add = (id: string, n: Note) => { const l = notes.get(id); if (l) l.push(n); else notes.set(id, [n]); };
  const since = new Date(now); since.setUTCMonth(since.getUTCMonth() - reviewWindowMonths(list));
  const recent = (date: string) => Date.parse(date) >= since.getTime();
  for (const r of data.reviews) if (recent(r.createdAt)) add(r.racketId, { verdict: ratingVerdict(r.rating), tags: r.tags, createdAt: r.createdAt });
  // Web reviews nobody judged have no verdict, so they don't count.
  for (const e of data.external) if (e.sentiment && recent(e.sourceDate || e.createdAt)) add(e.racketId, { verdict: e.sentiment, tags: e.tags, createdAt: e.createdAt });
  // Model years: with maxAgeYears 2 in 2026, only 2024–2026 models are listed.
  const oldest = list.maxAgeYears === undefined ? -Infinity : now.getUTCFullYear() - list.maxAgeYears;
  const everything = [...notes.values()].flat();
  const average = everything.length ? everything.reduce((a, x) => a + credit(x.verdict), 0) / everything.length : 0;
  const carrying = (own: Note[], list: string[]) => own.filter(x => x.tags.some(t => list.includes(t))).length;
  const liking = (own: Note[], list: string[]) => carrying(own.filter(x => x.verdict !== "negative"), list);
  // How often reviews mention the trait across the whole site: the starting point for each product's trait share.
  const traitAverage = trait && everything.length ? liking(everything, trait.tags) / everything.length : 0;

  const scored = data.listed.filter(p => p.year >= oldest && matchesFilters(p, list.filters)).flatMap(product => {
    const own = notes.get(product.id) ?? [];
    const n = own.length;
    if (n < minReviews) return [];
    const traitReviews = trait ? liking(own, trait.tags) : 0;
    // A trait list only takes products enough reviewers describe that way, and more of them for it than against it.
    if (trait && (traitReviews / n < trait.minShare || (trait.against && carrying(own, trait.against) >= traitReviews))) return [];
    const positive = own.filter(x => x.verdict === "positive").length, mixed = own.filter(x => x.verdict === "mixed").length;
    if ((positive + mixed / 2) / n < MIN_POSITIVE_SHARE) return [];
    const liked = aboveAverage(positive + mixed / 2, n, average);
    const tagCounts = new Map<string, number>();
    for (const t of own.flatMap(x => x.tags)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const ranked = (want: Tag["tone"]) => [...tagCounts].filter(([t]) => tone.get(t) === want)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }));
    return [{
      product, reviews: n, positive, mixed, negative: n - positive - mixed, positiveShare: (positive + mixed / 2) / n,
      aboveAverage: liked, traitReviews,
      // Trait lists are about the trait: mentions lead, and being liked more than average adds TRAIT_LIST_LIKED_WEIGHT of it.
      // Being liked less never subtracts: the MIN_POSITIVE_SHARE floor already keeps disliked products out.
      rankScore: trait ? aboveAverage(traitReviews, n, traitAverage) + TRAIT_LIST_LIKED_WEIGHT * Math.max(0, liked) : likedScore((positive + mixed / 2) / n, n),
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
