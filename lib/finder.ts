// The product finder (/finder): a few one-tap questions, then the products whose reviews best match the answers.
// Pure functions over the public catalogue like lib/top-lists.ts, so tests can feed them plain objects. Every number shown
// is counted from published reviews; nothing is estimated.
import type { Finder, FinderOption, Tag, TopList } from "./niche/types";
import { likedScore, MIN_LIST_REVIEWS, MIN_POSITIVE_SHARE, rankList, ratingVerdict, type ListInput, type Verdict } from "./top-lists";

/** How many products a finder shows. */
export const FINDER_RESULTS = 3;
/** Mentions a product needs to pass a "must" answer. Without enough such products, the answer just counts extra. */
export const MUST_MENTIONS = 2;
/** Pulls a share toward zero when a product has few reviews, so 2 of 5 can't outrank 30 of 100. */
const SMOOTHING = 8;
/** How much the rankings' score (lib/top-lists.ts likedScore) adds to a match. */
const RANK_WEIGHT = 0.12;
/** What first place on the ranking an answer stands for adds to a match; each place down takes a tenth off. */
const LIST_WEIGHT = 0.6;

export type FinderProduct = {
  id: string; reviews: number; positive: number; mixed: number; negative: number;
  /** Mentions in positive or mixed reviews for good tags; in any review for the rest. */
  tags: Record<string, number>;
  shape: string | null;
  /** Place on each ranking an answer can stand for (see FinderOption.list). */
  lists?: Record<string, number>;
};
export type Reason = { tag: string; count: number };
export type FinderMatch<P> = { product: P; score: number; reasons: Reason[]; watch: Reason | null };

/** Products a finder may suggest: enough reviews, mostly positive, recent enough. Same bar as the rankings. */
export function finderPool(finder: Pick<Finder, "minReviews" | "minPositive" | "maxAgeYears">, data: ListInput, goodTags: readonly string[], now = new Date()): FinderProduct[] {
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
    if ((positive + mixed / 2) / n < (finder.minPositive ?? MIN_POSITIVE_SHARE)) return [];
    const tags: Record<string, number> = {};
    // A negative review that calls a racket powerful doesn't make it a good racket for power.
    for (const x of own) for (const t of x.tags) if (!(good.has(t) && x.verdict === "negative")) tags[t] = (tags[t] ?? 0) + 1;
    return [{ id: p.id, reviews: n, positive, mixed, negative: n - positive - mixed, tags, shape: p.shape ?? null }];
  });
}

/** Adds each product's place on the rankings the answers stand for. */
export function withRankings<P extends FinderProduct>(pool: P[], finder: Pick<Finder, "questions">, lists: readonly TopList[], data: ListInput, tags: readonly Tag[], now = new Date()): P[] {
  const places = new Map<string, Record<string, number>>();
  for (const slug of new Set(finder.questions.flatMap(q => q.options.flatMap(o => o.list ?? [])))) {
    const list = lists.find(l => l.slug === slug);
    if (!list) throw new Error(`Finder answer points at unknown ranking ${slug}`);
    rankList(list, data, tags, now).forEach((entry, i) => places.set(entry.product.id, { ...places.get(entry.product.id), [slug]: i + 1 }));
  }
  return pool.map(p => ({ ...p, lists: places.get(p.id) ?? {} }));
}

/** Shapes match from the start of the value, so "98" also takes "98 sq in (632 cm²)". */
export const fitsShape = (shape: string | null, shapes: string[]) => !!shape && shapes.some(s => shape.startsWith(s));
const share = (count: number, reviews: number) => count / (reviews + SMOOTHING);
const mentions = (p: FinderProduct, tags: string[] = []) => tags.reduce((a, t) => a + (p.tags[t] ?? 0), 0);

/** The best matches for the chosen options. Options without tags ("No preference") change nothing. */
export function matchFinder<P extends FinderProduct>(pool: P[], chosen: FinderOption[], negativeTags: readonly string[], count = FINDER_RESULTS, rankWeight = RANK_WEIGHT): FinderMatch<P>[] {
  let candidates = pool;
  // An answer that stands for a ranking sorts products into a group, and everything outside it is out for good: someone asking
  // for power never gets a control racket, even if that leaves fewer than `count`. Later answers narrow inside the group.
  for (const o of chosen) if (o.list) {
    const kept = candidates.filter(p => p.lists?.[o.list!]);
    if (kept.length) candidates = kept;
  }
  const enough = chosen.some(o => o.list) ? 1 : count;
  // A chosen shape comes next: it's a plain fact about the product, where tags are a matter of degree.
  for (const o of chosen) if (o.shapes) {
    const kept = candidates.filter(p => fitsShape(p.shape, o.shapes!));
    if (kept.length >= enough) candidates = kept;
  }
  for (const o of chosen) if (o.must) {
    const kept = candidates.filter(p => mentions(p, o.want) >= MUST_MENTIONS);
    if (kept.length >= enough) candidates = kept;
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
    // The answers lead; the score the rankings use (liked and widely reviewed) decides between close matches, so a product
    // that ranks higher beats one that fits about as well. Stronger than this and the same few products show up for everyone.
    // A product nobody describes the way you asked gets no such help, however well it ranks.
    const relevant = !wanted.length || wanted.some(tag => (product.tags[tag] ?? 0) > 0);
    const placed = chosen.reduce((a, o) => {
      const place = o.list ? product.lists?.[o.list] : undefined;
      return a + (place ? LIST_WEIGHT * Math.max(0, 1 - (place - 1) / 10) : 0);
    }, 0);
    return { product, score: fit + placed + (relevant ? rankWeight * likedScore(liked, product.reviews) : 0), reasons, watch };
  });
  return scored.sort((a, b) => b.score - a.score || b.product.reviews - a.product.reviews || a.product.id.localeCompare(b.product.id)).slice(0, count);
}

/** The questions to ask given the answers so far, as indexes into finder.questions. */
export function visibleQuestions(finder: Pick<Finder, "questions">, answers: (number | null)[]) {
  return finder.questions.flatMap((q, i) => {
    if (!q.onlyIf) return [i];
    const parent = finder.questions.findIndex(x => x.id === q.onlyIf!.question), answer = answers[parent];
    return answer !== null && answer !== undefined && q.onlyIf.labels.includes(finder.questions[parent].options[answer].label) ? [i] : [];
  });
}

/** Answers as they appear in a shared link: one option index per question, "-" for unanswered. */
export const encodeAnswers = (answers: (number | null)[]) => answers.map(a => a ?? "-").join("");
export function decodeAnswers(value: string | null, finder: Pick<Finder, "questions">): (number | null)[] {
  const blank = finder.questions.map(() => null as number | null);
  if (!value || value.length !== finder.questions.length) return blank;
  return finder.questions.map((q, i) => { const n = Number(value[i]); return Number.isInteger(n) && q.options[n] ? n : null; });
}
