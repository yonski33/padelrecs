import { Fragment } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { niche } from "../../../lib/niche";
import { helpfulRank } from "../../../lib/review-order";
import { ChipRow } from "../../chip-row";

export type Sort = "newest" | "helpful";
export type ListItem = { key: string; kind: "players" | "web"; date: string; older?: boolean; helpful: number; score: number; tags: string[]; variant?: string | null; verdict?: Verdict | null; node: () => ReactNode };
export type Verdict = "positive" | "mixed" | "negative";
export const VERDICT_FILTERS: Verdict[] = ["positive", "mixed", "negative"];
/** Reviews shown at first, and added by each "Show more". The page stays short; the rest are a click away. */
export const PAGE = 10;
/** Reviews in the page's HTML on first load: PAGE visible, the rest behind a no-JS "Show more" toggle, so search engines
 *  index more review text without the page growing with every review (owner choice, 2026-11-05). */
export const IN_HTML = 30;

/** Query parameter for the variant filter on niches with variants: "plastic" on DiscGolfRecs. */
export const variantParam = niche.variants?.label.toLowerCase() ?? "variant";
/** Product variants with their review counts, most first, for the filter chips (niche.variants). */
export type Variants = { label: string; plural: string; counts: [string, number][] };

/** The product page's review address for a sort, tag filter, variant and length. "Most helpful" is the default, so it has no parameter.
 *  These addresses all share the product page's canonical URL (generateMetadata), so filtered views add no pages to the index. */
export function reviewsHref(href: string, { sort, tag, variant, verdict, show }: { sort: Sort; tag?: string; variant?: string; verdict?: Verdict; show?: number }) {
  const q = new URLSearchParams();
  if (sort !== "helpful") q.set("sort", sort);
  if (verdict) q.set("verdict", verdict);
  if (tag) q.set("tag", tag);
  if (variant) q.set(variantParam, variant);
  if (show && show > PAGE) q.set("show", String(show));
  const qs = q.toString();
  return `${href}${qs ? `?${qs}` : ""}`;
}

/**
 * Product-page review list, rendered on the server: only the first IN_HTML reviews reach the page (a product with 500
 * reviews used to send all of them). Sort, tag filter and "Show more" are real links, so they work without JavaScript and keep
 * the scroll position.
 */
export default function ReviewList({ title = "Reviews", subtitle, href, addHref, addButton, items, sort, tag, show, intro, variants, variant, verdict }: { verdict?: Verdict; title?: ReactNode; subtitle?: string; href: string; addHref: string; addButton?: ReactNode; items: ListItem[]; sort: Sort; tag?: string; show: number; intro?: ReactNode; variants?: Variants; variant?: string }) {
  // Filters run over every review before paging, so "Show more" pages through the filtered list, not the loaded page.
  const matching = items.filter(i => (!tag || i.tags.includes(tag)) && (!variant || i.variant === variant) && (!verdict || i.verdict === verdict));
  // Positive / mixed / negative chips (owner, 2026-11-12), counted within the current tag and variant filters.
  const inScope = items.filter(i => (!tag || i.tags.includes(tag)) && (!variant || i.variant === variant));
  const verdictCount = (v: Verdict) => inScope.filter(i => i.verdict === v).length;
  // Older web reviews (outside the niche's recentMonths window) always come after the recent ones, under a note.
  const ordered = [...matching].sort((a, b) => Number(!!a.older) - Number(!!b.older) || (sort === "helpful" ? helpfulRank(b) - helpfulRank(a) : 0) || b.date.localeCompare(a.date));
  const shown = ordered.slice(0, show);
  // On the first page, the next reviews up to IN_HTML are already in the HTML, hidden until "Show more" is clicked.
  const hidden = show < IN_HTML ? ordered.slice(show, IN_HTML) : [];
  const firstOlder = [...shown, ...hidden].findIndex(i => i.older);
  const left = ordered.length - shown.length - hidden.length;
  const card = (i: ListItem, n: number) => <Fragment key={i.key}>
    {n === firstOlder && <p className="older-note">{`Older than ${niche.recentMonths} months. These may describe an earlier version.`}</p>}
    <div>{i.node()}</div>
  </Fragment>;
  const moreLink = left > 0 && <div className="load-more"><Link className="button ghost" href={reviewsHref(href, { sort, tag, variant, verdict, show: Math.max(show, IN_HTML) + PAGE })} scroll={false}>Show more reviews</Link></div>;

  return <section id="reviews" className="review-list">
    {/* The page's "what people say" tags sit here, right above the reviews they filter. */}
    {intro}
    <div className="feed-heading">
      <div className="feed-title-row">
        <h2 className="feed-title">{title}{items.length > 0 && <span className="feed-count">{` (${items.length.toLocaleString("en-US")})`}</span>}</h2>
        {addButton}
      </div>
      {subtitle && items.length > 0 && <p className="feed-sub m-only">{subtitle}</p>}
    </div>
    {/* Niches with variants (DiscGolfRecs plastics), once a review on this product names one: one chip per variant. */}
    {variants && <ChipRow className="variant-filter" label={`Filter reviews by ${variants.label.toLowerCase()}`}>
      <Link href={reviewsHref(href, { sort })} scroll={false} aria-current={!variant ? "page" : undefined}>All <span className="c">{items.length}</span></Link>
      {variants.counts.map(([v, n]) => <Link key={v} href={reviewsHref(href, { sort, variant: v })} scroll={false} aria-current={variant === v ? "page" : undefined}>{v} <span className="c">{n}</span></Link>)}
    </ChipRow>}
    {tag && <p className="tag-filter">Showing <b>{matching.length}</b> {matching.length === 1 ? "review" : "reviews"} mentioning <span className="tag">{tag}</span>{variant && ` in ${variant}`} <Link href={reviewsHref(href, { sort, variant })} scroll={false}>Show all</Link></p>}
    {/* One quiet row (owner, 2026-11-12): verdict tabs on products with 20+ reviews, the sort as a small menu on the right. */}
    {matching.length + (verdict ? 1 : 0) > 1 && <div className="review-controls">
      {items.length >= 20 && inScope.some(i => i.verdict) ? <nav className="verdict-filter" aria-label="Filter by verdict">
        <Link href={reviewsHref(href, { sort, tag, variant })} scroll={false} aria-current={!verdict ? "page" : undefined}>All <span className="c">{inScope.length}</span></Link>
        {VERDICT_FILTERS.filter(v => verdictCount(v)).map(v => <Link key={v} href={reviewsHref(href, { sort, tag, variant, verdict: v })} scroll={false} aria-current={verdict === v ? "page" : undefined}>{v[0].toUpperCase() + v.slice(1)} <span className="c">{verdictCount(v)}</span></Link>)}
      </nav> : <span/>}
      <details className="sort-menu">
        <summary>{items.length >= 20 ? "Sort: " : "Sorted by: "}<b>{sort === "newest" ? "Newest" : "Most helpful"}</b></summary>
        <div>{(["helpful", "newest"] as const).map(v => <Link key={v} href={reviewsHref(href, { sort: v, tag, variant, verdict })} scroll={false} aria-current={sort === v ? "page" : undefined}>{v === "newest" ? "Newest" : "Most helpful"}</Link>)}</div>
      </details>
    </div>}
    {/* Phones show the first three, then "See all" opens the rest (no JavaScript). */}
    <input type="checkbox" id="all-voices" className="all-voices"/>
    <div className="voices">{shown.map(card)}</div>
    {matching.length > 3 && <label htmlFor="all-voices" className="see-all m-only">{`See all ${matching.length.toLocaleString("en-US")} opinions →`}</label>}
    {hidden.length > 0 ? <>
      <input type="checkbox" id="more-reviews" className="more-toggle"/>
      <div className="more-hidden"><div className="voices">{hidden.map((i, n) => card(i, shown.length + n))}</div>{moreLink}</div>
      <div className="load-more first"><label htmlFor="more-reviews" className="button ghost">Show more reviews</label></div>
    </> : moreLink}
    {items.length === 0 && <p className="empty-feed">{`No reviews yet. This ${niche.words.one} is waiting for its first one.`} <a href={addHref}>Write one →</a></p>}
  </section>;
}
