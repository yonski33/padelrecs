// The product finder (/finder): a few one-tap questions, then the products whose reviews best match the answers.
// Pure functions over the public catalogue like lib/top-lists.ts, so tests can feed them plain objects. Every number shown
// is counted from published reviews; nothing is estimated.
import type { Finder, FinderOption } from "./niche/types";
import { MIN_LIST_REVIEWS, MIN_POSITIVE_SHARE, ratingVerdict, type ListInput, type Verdict } from "./top-lists";

/** How many products a finder shows. */
export const FINDER_RESULTS = 3;
/** A "must" answer only narrows the pool when at least this many products have that many mentions; otherwise it just counts extra. */
export const MUST_MENTIONS = 2;
/** Pulls a share toward zero when a product has few reviews, so 2 of 5 can't outrank 30 of 100. */
const SMOOTHING = 8;
/** How much each doubling of reviews adds to a match. */
const REVIEW_WEIGHT = 0.07;

export type FinderProduct = {
  id: string; reviews: number; positive: number; mixed: number; negative: number;
  /** Mentions in positive or mixed reviews for good tags; in any review for the rest. */
  tags: Record<string, number>;
  shape: string | null;
};
export type Reason = { tag: string; count: number };
export type FinderMatch<P> = { product: P; score: number; reasons: Reason[]; watch: Reason | null };

/** Products a finder may suggest: enough reviews, mostly positive, recent enough. Same bar as the rankings. */
export function finderPool(finder: Pick<Finder, "minReviews" | "maxAgeYears">, data: ListInput, goodTags: readonly string[], now = new Date()): FinderProduct[] {
  const min = Math.max(MIN_LIST_REVIEWS, finder.minReviews ?? MIN_LIST_REVIEWS);
  const oldest = finder.maxAgeYears === undefined ? -Infinity : now.getUTCFullYear() - finder.maxAgeYears;
  const notes = new Map<string, { verdict: Verdict; tags: string[] }[]>();
  const add = (id: string, n: { verdict: Verdict; tags: string[] }) => { const l = notes.get(id); if (l) l.push(n); else notes.set(id, [n]); };
  for (const r of data.reviews) add(r.racketId, { verdict: ratingVerdict(r.rating), tags: r.tags });
  for (const e of data.external) if (e.sentiment) add(e.racketId, { verdict: e.sentiment, tags: e.tags });
  const good = new Set(goodTags);
  return data.listed.flatMap(p => {
    const own = notes.get(p.id) ?? [], n = own.length;
    if (n < min || p.year < oldest) return [];
    const positive = own.filter(x => x.verdict === "positive").length, mixed = own.filter(x => x.verdict === "mixed").length;
    if ((positive + mixed / 2) / n < MIN_POSITIVE_SHARE) return [];
    const tags: Record<string, number> = {};
    // A negative review that calls a racket powerful doesn't make it a good racket for power.
    for (const x of own) for (const t of x.tags) if (!(good.has(t) && x.verdict === "negative")) tags[t] = (tags[t] ?? 0) + 1;
    return [{ id: p.id, reviews: n, positive, mixed, negative: n - positive - mixed, tags, shape: p.shape ?? null }];
  });
}

/** Shapes match from the start of the value, so "98" also takes "98 sq in (632 cm²)". */
export const fitsShape = (shape: string | null, shapes: string[]) => !!shape && shapes.some(s => shape.startsWith(s));
const share = (count: number, reviews: number) => count / (reviews + SMOOTHING);
const mentions = (p: FinderProduct, tags: string[] = []) => tags.reduce((a, t) => a + (p.tags[t] ?? 0), 0);

/** The best matches for the chosen options. Options without tags ("No preference") change nothing. */
export function matchFinder<P extends FinderProduct>(pool: P[], chosen: FinderOption[], negativeTags: readonly string[], count = FINDER_RESULTS): FinderMatch<P>[] {
  let candidates = pool;
  // A chosen shape comes first: it's a plain fact about the product, where tags are a matter of degree.
  for (const o of chosen) if (o.shapes) {
    const kept = candidates.filter(p => fitsShape(p.shape, o.shapes!));
    if (kept.length >= count) candidates = kept;
  }
  for (const o of chosen) if (o.must) {
    const kept = candidates.filter(p => mentions(p, o.want) >= MUST_MENTIONS);
    if (kept.length >= count) candidates = kept;
  }
  const scored = candidates.map(product => {
    const liked = (product.positive + product.mixed / 2) / product.reviews;
    const fit = chosen.reduce((a, o) => {
      const weight = o.weight ?? 1;
      return a + weight * (share(mentions(product, o.want), product.reviews) - share(mentions(product, o.avoid), product.reviews));
    }, 0);
    const wanted = [...new Set(chosen.flatMap(o => o.want ?? []))];
    const reasons = wanted.map(tag => ({ tag, count: product.tags[tag] ?? 0 })).filter(r => r.count > 1)
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)).slice(0, 3);
    const watch = negativeTags.map(tag => ({ tag, count: product.tags[tag] ?? 0 })).filter(r => r.count > 1)
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))[0] ?? null;
    // The answers lead; being liked and widely reviewed decides between close matches, so a well-reviewed product beats a
    // thinly reviewed one that fits about as well. Stronger than this and the same few products show up for everyone.
    return { product, score: fit + 0.2 * liked + REVIEW_WEIGHT * Math.log2(1 + product.reviews), reasons, watch };
  });
  return scored.sort((a, b) => b.score - a.score || b.product.reviews - a.product.reviews || a.product.id.localeCompare(b.product.id)).slice(0, count);
}

/** Answers as they appear in a shared link: one option index per question, "-" for unanswered. */
export const encodeAnswers = (answers: (number | null)[]) => answers.map(a => a ?? "-").join("");
export function decodeAnswers(value: string | null, finder: Pick<Finder, "questions">): (number | null)[] {
  const blank = finder.questions.map(() => null as number | null);
  if (!value || value.length !== finder.questions.length) return blank;
  return finder.questions.map((q, i) => { const n = Number(value[i]); return Number.isInteger(n) && q.options[n] ? n : null; });
}
