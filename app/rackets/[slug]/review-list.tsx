import Link from "next/link";
import type { ReactNode } from "react";
import { niche } from "../../../lib/niche";
import { helpfulRank } from "../../../lib/review-order";

export type Sort = "newest" | "helpful";
export type ListItem = { key: string; kind: "players" | "web"; date: string; older?: boolean; helpful: number; score: number; tags: string[]; node: () => ReactNode };
/** Reviews shown at first, and added by each "Show more". The page stays short; the rest are a click away. */
export const PAGE = 20;

/** The product page's review address for a sort, tag filter and length. "Most helpful" is the default, so it has no parameter. */
export function reviewsHref(href: string, { sort, tag, show }: { sort: Sort; tag?: string; show?: number }) {
  const q = new URLSearchParams();
  if (sort !== "helpful") q.set("sort", sort);
  if (tag) q.set("tag", tag);
  if (show && show > PAGE) q.set("show", String(show));
  const qs = q.toString();
  return `${href}${qs ? `?${qs}` : ""}`;
}

/**
 * Product-page review list, rendered on the server: only the shown slice reaches the page (a product with 500 reviews
 * used to send all of them). Sort, tag filter and "Show more" are real links, so they work without JavaScript and keep
 * the scroll position.
 */
export default function ReviewList({ href, addHref, addButton, items, sort, tag, show }: { href: string; addHref: string; addButton?: ReactNode; items: ListItem[]; sort: Sort; tag?: string; show: number }) {
  const matching = tag ? items.filter(i => i.tags.includes(tag)) : items;
  // Older web reviews (outside the niche's recentMonths window) always come after the recent ones, under a note.
  const ordered = [...matching].sort((a, b) => Number(!!a.older) - Number(!!b.older) || (sort === "helpful" ? helpfulRank(b) - helpfulRank(a) : 0) || b.date.localeCompare(a.date));
  const shown = ordered.slice(0, show);
  const firstOlder = shown.findIndex(i => i.older);
  const left = ordered.length - shown.length;

  return <section id="reviews" className="review-list">
    <div className="feed-heading">
      <div className="feed-title-row">
        <h2 className="feed-title">Reviews</h2>
        {addButton}
      </div>
    </div>
    {tag && <p className="tag-filter">Showing <b>{matching.length}</b> {matching.length === 1 ? "review" : "reviews"} mentioning <span className="tag">{tag}</span> <Link href={`${reviewsHref(href, { sort })}#reviews`} scroll={false}>Show all</Link></p>}
    {matching.length > 1 && <p className="sort-links">Sort: {(["helpful", "newest"] as const).map(v =>
      <Link key={v} href={reviewsHref(href, { sort: v, tag })} scroll={false} aria-current={sort === v ? "page" : undefined}>{v === "newest" ? "Newest" : "Most helpful"}</Link>)}</p>}
    {shown.map((i, n) => <div key={i.key}>
      {n === firstOlder && <p className="older-note">{`Older than ${niche.recentMonths} months. These may describe an earlier version.`}</p>}
      {i.node()}
    </div>)}
    {left > 0 && <Link className="button ghost show-more" href={reviewsHref(href, { sort, tag, show: show + PAGE })} scroll={false}>{`Show more reviews (${left} left)`}</Link>}
    {items.length === 0 && <p className="empty-feed">{`No reviews yet. This ${niche.words.one} is waiting for its first one.`} <a href={addHref}>Write one →</a></p>}
  </section>;
}
