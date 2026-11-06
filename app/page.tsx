export const dynamic = "force-dynamic";
import { Fragment } from "react";
import { spreadByProduct } from "../lib/review-order";
import type { Metadata } from "next";
import { catalog } from "../db/data";
import { displayName } from "../lib/brand-name";
import { Review, External, Sidebar, activity, racketParts } from "./components";
import { ProductIcon } from "./icons";
import { LoadMore } from "./load-more";
import { ChipRow } from "./chip-row";
import { niche, catalogPath, productHref } from "../lib/niche";
import { rankedLists, listHref } from "./rankings/lists";
import { listYear } from "../lib/top-lists";
import { FinderInvite } from "./finder/invite";

const DAY = 86_400_000;
/** Separator for "users, Reddit, YouTube and forums": commas, the last item already carries "and". */
const a2 = (n: number) => n >= 2 ? ", " : " ";
const PAGE = 24;

const homeTitle = niche.seo.homeTitle;
/** "Real Reviews of Nail Polish, Gel Polish, Top Coats and Press-On Nails": the title without the site name, the page's H1. */
const headline = homeTitle.split(" – ").slice(1).join(" – ") || homeTitle;
// The search snippet: what the site covers and how big it is, short enough that Google shows it whole (~155 characters).
export async function generateMetadata(): Promise<Metadata> {
  const data = await catalog();
  const total = data.reviews.length + data.external.length;
  const short = `${headline}: ${total.toLocaleString("en-US")} reviews, ranked by what people actually say.`;
  const description = short.length <= 160 ? short : niche.seo.homeDescription;
  return { title: { absolute: homeTitle }, description, alternates: { canonical: "/" }, openGraph: { title: homeTitle, description, url: "/", type: "website" } };
}

export default async function Home({ searchParams }: {
  searchParams: Promise<{ source?: string | string[]; show?: string | string[]; type?: string | string[] }>;
}) {
  const [all, params] = await Promise.all([catalog(), searchParams]);
  const now = new Date();
  // Niches with feedMaxAgeYears (padel) keep older models off the front page: feed, popular strip and sidebar.
  const oldest = niche.feedMaxAgeYears === undefined ? -Infinity : now.getUTCFullYear() - niche.feedMaxAgeYears;
  const yearOf = new Map(all.rackets.map(r => [r.id, r.year]));
  const current = <T extends { racketId: string }>(list: T[]) => list.filter(x => (yearOf.get(x.racketId) ?? Infinity) >= oldest);
  // Web reviews are dated by their source (an old Reddit thread quoted today is old), and niches with recentMonths only
  // show reviews from that window on the front page; older ones stay on product and brand pages.
  const since = new Date(now); if (niche.recentMonths !== undefined) since.setUTCMonth(since.getUTCMonth() - niche.recentMonths);
  const fresh = (date: string) => niche.recentMonths === undefined || Date.parse(date) >= since.getTime();
  const webIn = all.external.map(e => ({ ...e, createdAt: e.sourceDate || e.createdAt })).filter(e => fresh(e.createdAt));
  const reviewsIn = all.reviews.filter(r => fresh(r.createdAt));
  const data = { ...all, reviews: current(reviewsIn), external: current(webIn) };
  // How many notes to show: 24 at first, 24 more per "Load more" click (kept in the URL so it's linkable and crawlable).
  const requested = Number(Array.isArray(params.show) ? params.show[0] : params.show);
  const show = Number.isFinite(requested) ? Math.min(2400, Math.max(PAGE, Math.ceil(requested / PAGE) * PAGE)) : PAGE;
  // Product-type filter (SkinRecs: ?type=cleansers). Unknown values are ignored.
  const typeSlug = Array.isArray(params.type) ? params.type[0] : params.type;
  const type = niche.typePages?.find(t => t.slug === typeSlug);
  const shapeOf = new Map(data.rackets.map(r => [r.id, r.shape?.toLowerCase()]));
  const ofType = <T extends { racketId: string }>(list: T[]) => type ? list.filter(x => shapeOf.get(x.racketId) === type.shape.toLowerCase()) : list;
  const reviews = ofType(data.reviews), external = ofType(data.external);
  const query = (next: { type?: string; show?: number }) => {
    const q = new URLSearchParams();
    if (next.type) q.set("type", next.type);
    if (next.show) q.set("show", String(next.show));
    return q.size ? `/?${q}` : "/";
  };
  const items = spreadByProduct([
    ...reviews.map(r => ({ date: r.createdAt, product: r.racketId, key: `player-${r.id}`, node: <Review review={r} data={data} showCategory={!type}/> })),
    ...external.map(e => ({ date: e.createdAt, product: e.racketId, key: `web-${e.id}`, node: <External entry={e} data={data} showCategory={!type}/> })),
  ]);


  // Popular strip: most notes this week, or this month when the week is quiet. Hidden if there's nothing to rank.
  const week = activity(data, now.getTime() - 7 * DAY);
  const month = activity(data, now.getTime() - 30 * DAY);
  const popular = (week.length >= 2 ? week : month).slice(0, 4);
  const popularLabel = week.length >= 2 ? "this week" : "this month";
  const strip = popular.length >= 2 && <section className="strip" aria-label={`Popular ${popularLabel}`}>
    <div className="strip-head"><h2>Popular <em>{popularLabel}</em></h2><span>most new reviews</span></div>
    <ol>{popular.map(({racket, count}) => { const {brand} = racketParts(racket, data); return <li key={racket.id}><a href={productHref(racket)}>
      <ProductIcon shape={racket.shape} brand={brand}/><span className="nm">{displayName(racket.name, brand)}</span><span className="ct">+{count} {count === 1 ? "review" : "reviews"}</span>
    </a></li>; })}</ol>
  </section>;

  // Intro: what the site is, for a first-time visitor (and Google), above everything else.
  const total = all.reviews.length + all.external.length;
  const platforms = [...all.external.reduce((m, e) => m.set(e.sourcePlatform, (m.get(e.sourcePlatform) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).map(([p]) => p).slice(0, 3);
  const fromWhere = [`${niche.people.many}`, ...platforms].map((x, i, a) => i === a.length - 1 && a.length > 1 ? `and ${x}` : x).join(a2(platforms.length));
  // Top picks: each ranking list with its top three, the most useful thing on the site for someone deciding what to buy.
  const picks = type ? [] : (await rankedLists()).lists.slice(0, 6);
  const brandName = (id: string) => all.brands.find(b => b.id === id)?.name;
  const base = (process.env.SITE_URL || `https://www.${niche.site.domain}`).replace(/\/$/, "");
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", name: niche.site.name, url: `${base}/`, potentialAction: { "@type": "SearchAction", target: `${base}${catalogPath}?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    { "@type": "Organization", name: niche.site.name, url: `${base}/`, logo: `${base}/niches/${niche.id}/apple-icon.png` },
  ] };

  return <main className="home"><div className="columns"><div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    {!type && <section className="intro">
      <h1>{headline}</h1>
      <p>{`${total.toLocaleString("en-US")} reviews from ${fromWhere}, ranked by what people actually say.`}</p>
    </section>}
    {!type && <FinderInvite/>}
    {picks.length > 0 && <section className="picks" aria-label="Top picks">
      <h2>Top picks</h2>
      {/* The rankings page's row style, two columns. No product names (owner choice): the ranking is what the click shows. */}
      <div className="picks-grid">{picks.map(({ list, entries, reviews }) => { const lead = entries[0], b = brandName(lead.product.brandId);
        return <a key={list.slug} className="top-card" href={listHref(list.slug)}>
          <span className="thumb" aria-hidden="true"><ProductIcon shape={lead.product.shape} brand={b}/></span>
          <span className="top-card-text">
            <span className="pick-title">{`${list.title} ${listYear(list)}`}</span>
            <span className="top-card-meta">{`Based on ${reviews.toLocaleString("en-US")} reviews · ${entries.length} ranked`}</span>
          </span>
        </a>; })}</div>
    </section>}
    <div className="feed-heading">
      <div>
        {type ? <h1 className="feed-title">{`Latest ${type.label.toLowerCase()} reviews`}</h1> : <h2 className="feed-title">Latest reviews</h2>}
        <p className="feed-sub">{`From ${niche.people.many}, and from around the web with the source linked.`}</p>
      </div>
    </div>
    {niche.typePages && <ChipRow className="type-filter" label={`Filter reviews by ${niche.words.one} type`}>
      <a href={query({})} aria-current={!type ? "page" : undefined}>All</a>
      {niche.typePages.map(t => <a key={t.slug} href={query({ type: t.slug })} aria-current={type?.slug === t.slug ? "page" : undefined}>{t.label}</a>)}
    </ChipRow>}
    {items.slice(0, show).map((item, index) => <Fragment key={item.key}>
      {item.node}
      {index === 3 && strip}
    </Fragment>)}
    {items.length > 0 && items.length < 4 && strip}
    {items.length === 0 && <p className="empty-feed">{type ? `No ${type.label.toLowerCase()} reviews here yet.` : "No reviews here yet. Somebody has to go first."} <a href="/add-review">Add a review →</a></p>}
    {items.length > show && <LoadMore href={query({ type: type?.slug, show: show + PAGE })}/>}
    {items.length > 0 && items.length <= show && <p className="end-note">{`You've reached the end. ${niche.copy.ui.triedOneOfThese} `}<a href="/add-review">Add your own review →</a></p>}
  </div><Sidebar data={data} all={all} minYear={oldest}/></div></main>;
}
