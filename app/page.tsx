export const dynamic = "force-dynamic";
import { Fragment } from "react";
import { spreadByProduct } from "../lib/review-order";
import type { Metadata } from "next";
import { catalog } from "../db/data";
import { Review, External, Sidebar, activity, racketParts } from "./components";
import { ProductIcon } from "./icons";
import { LoadMore } from "./load-more";
import { ChipRow } from "./chip-row";
import { niche, catalogPath, productHref } from "../lib/niche";

const DAY = 86_400_000;
const PAGE = 24;

const homeTitle = niche.seo.homeTitle;
const homeDescription = niche.seo.homeDescription;
export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: { title: homeTitle, description: homeDescription, url: "/", type: "website" },
};

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
  const source = params.source === "players" || params.source === "web" ? params.source : "all";
  // How many notes to show: 24 at first, 24 more per "Load more" click (kept in the URL so it's linkable and crawlable).
  const requested = Number(Array.isArray(params.show) ? params.show[0] : params.show);
  const show = Number.isFinite(requested) ? Math.min(2400, Math.max(PAGE, Math.ceil(requested / PAGE) * PAGE)) : PAGE;
  // Product-type filter (SkinRecs: ?type=cleansers). Unknown values are ignored.
  const typeSlug = Array.isArray(params.type) ? params.type[0] : params.type;
  const type = niche.typePages?.find(t => t.slug === typeSlug);
  const shapeOf = new Map(data.rackets.map(r => [r.id, r.shape?.toLowerCase()]));
  const ofType = <T extends { racketId: string }>(list: T[]) => type ? list.filter(x => shapeOf.get(x.racketId) === type.shape.toLowerCase()) : list;
  const reviews = ofType(data.reviews), external = ofType(data.external);
  const query = (next: { source?: string; type?: string; show?: number }) => {
    const q = new URLSearchParams();
    if (next.source && next.source !== "all") q.set("source", next.source);
    if (next.type) q.set("type", next.type);
    if (next.show) q.set("show", String(next.show));
    return q.size ? `/?${q}` : "/";
  };
  const sources = [
    { value: "all", label: "All", count: reviews.length + external.length, href: query({ type: type?.slug }) },
    { value: "players", label: `From ${niche.people.many}`, count: reviews.length, href: query({ source: "players", type: type?.slug }) },
    { value: "web", label: "From around the web", count: external.length, href: query({ source: "web", type: type?.slug }) },
  ];
  const items = spreadByProduct([
    ...(source !== "web" ? reviews.map(r => ({ date: r.createdAt, product: r.racketId, key: `player-${r.id}`, node: <Review review={r} data={data} showCategory={!type}/> })) : []),
    ...(source !== "players" ? external.map(e => ({ date: e.createdAt, product: e.racketId, key: `web-${e.id}`, node: <External entry={e} data={data} showCategory={!type}/> })) : []),
  ]);


  // Popular strip: most notes this week, or this month when the week is quiet. Hidden if there's nothing to rank.
  const week = activity(data, now.getTime() - 7 * DAY);
  const month = activity(data, now.getTime() - 30 * DAY);
  const popular = (week.length >= 2 ? week : month).slice(0, 4);
  const popularLabel = week.length >= 2 ? "this week" : "this month";
  const strip = popular.length >= 2 && <section className="strip" aria-label={`Popular ${popularLabel}`}>
    <div className="strip-head"><h2>Popular <em>{popularLabel}</em></h2><span>most new reviews</span></div>
    <ol>{popular.map(({racket, count}) => { const {brand, model} = racketParts(racket, data); return <li key={racket.id}><a href={productHref(racket)}>
      <ProductIcon shape={racket.shape} brand={brand}/><span className="nm">{model}</span><span className="br">{brand}</span><span className="ct">+{count} {count === 1 ? "review" : "reviews"}</span>
    </a></li>; })}</ol>
  </section>;

  return <main className="home"><div className="columns"><div>
    <div className="feed-heading">
      <div>
        <h1 className="feed-title">{`Latest ${niche.people.one} reviews`}</h1>
        <p className="feed-sub">{`From ${niche.people.many}, and from around the web with the source linked.`}</p>
      </div>
      <nav className="source-nav" aria-label="Review sources">
        {sources.map(item => <a key={item.value} href={item.href} aria-current={source === item.value ? "page" : undefined}>
          {item.label}{item.value !== "all" && <span className="source-count">{item.count.toLocaleString("en-US")}</span>}
        </a>)}
      </nav>
    </div>
    {niche.typePages && <ChipRow className="type-filter" label={`Filter reviews by ${niche.words.one} type`}>
      <a href={query({ source })} aria-current={!type ? "page" : undefined}>All</a>
      {niche.typePages.map(t => <a key={t.slug} href={query({ source, type: t.slug })} aria-current={type?.slug === t.slug ? "page" : undefined}>{t.label}</a>)}
    </ChipRow>}
    {items.slice(0, show).map((item, index) => <Fragment key={item.key}>
      {item.node}
      {index === 3 && strip}
    </Fragment>)}
    {items.length > 0 && items.length < 4 && strip}
    {items.length === 0 && <p className="empty-feed">{type ? `No ${type.label.toLowerCase()} reviews here yet.` : source === "web" ? "Nothing quoted from around the web yet." : "No reviews here yet. Somebody has to go first."} <a href="/add-review">Add a review →</a></p>}
    {items.length > show && <LoadMore href={query({ source, type: type?.slug, show: show + PAGE })}/>}
    {items.length > 0 && items.length <= show && <p className="end-note">{`You've reached the end. ${niche.copy.ui.triedOneOfThese} `}<a href="/add-review">Add your own review →</a></p>}
  </div><Sidebar data={data} all={all} minYear={oldest}/></div></main>;
}
