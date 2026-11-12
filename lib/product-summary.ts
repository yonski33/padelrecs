// A product's review counts as its page shows them, shared by the product page and the compare page so the two never disagree.
import type { Catalog } from "../db/data";
import { isRecent, webDate, MIN_RECENT } from "./recent";
import { ratingVerdict } from "./top-lists";
import { tagTone } from "./tags";

/** Counts behind the page's verdict, title and description: every review, the sentiment split, and tags by how often
 *  reviewers mention them. One place, so the header, the tags and the search snippet never disagree. With `variant`
 *  (niche.variants), the same counts for the player and web reviews of that one variant: the "By plastic" table. */
export function summary(data: Catalog, id: string, variant?: string) {
  const allReviews = data.reviews.filter(x => x.racketId === id && (!variant || x.variant === variant)), allExternal = data.external.filter(e => e.racketId === id && (!variant || e.variant === variant));
  // Tags and "% positive" count the niche's recent window (lib/recent.ts), or every review when too few are recent;
  // the total is always every review.
  const recentReviews = allReviews.filter(x => isRecent(x.createdAt)), recentExternal = allExternal.filter(e => isRecent(webDate(e)));
  const useRecent = recentReviews.length + recentExternal.filter(e => e.sentiment).length >= MIN_RECENT;
  const reviews = useRecent ? recentReviews : allReviews, external = useRecent ? recentExternal : allExternal;
  const tagCounts = new Map<string, number>();
  for (const t of [...reviews, ...external].flatMap(x => x.tags)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const byCount = [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  const judged = [...reviews.map(x => ratingVerdict(x.rating)), ...external.map(e => e.sentiment)].filter(Boolean);
  const positive = judged.length >= 3 ? Math.round(judged.filter(v => v === "positive").length / judged.length * 100) : null;
  return { total: allReviews.length + allExternal.length, tagCounts, positive,
    loved: byCount.filter(t => tagTone(t) === "pos"), complaints: byCount.filter(t => tagTone(t) === "neg"), other: byCount.filter(t => tagTone(t) === "neutral") };
}

