export const dynamic = "force-dynamic";
import { Fragment } from "react";
import { spreadByProduct } from "../lib/review-order";
import type { Metadata } from "next";
import { catalog } from "../db/data";
import { displayName } from "../lib/brand-name";
import { activity, racketParts } from "./components";
import { topTags } from "../db/data";
import { ProductArt, SentimentBar, FeedCard, browseTiles, BrowseTile, Arrow } from "./visual";
import { homeHeadline } from "../lib/home-lines";
import { platformName } from "../lib/source-label";
import { LoadMore } from "./load-more";
import { ChipRow } from "./chip-row";
import { niche, catalogPath, productHref } from "../lib/niche";
import { rankedLists, listHref } from "./rankings/lists";
import { listYear } from "../lib/top-lists";

const DAY = 86_400_000;
/** Separator for "users, Reddit, YouTube and forums": commas, the last item already carries "and". */
const a2 = (n: number) => n >= 2 ? ", " : " ";
const PAGE = 12;

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
    ...reviews.map(r => ({ date: r.createdAt, product: r.racketId, key: `player-${r.id}`, node: <FeedCard review={r} data={data}/> })),
    ...external.map(e => ({ date: e.createdAt, product: e.racketId, key: `web-${e.id}`, node: <FeedCard entry={e} data={data}/> })),
  ]);


  // Most discussed: most new reviews this month, or the last 90 days when the month is quiet.
  const month = activity(data, now.getTime() - 30 * DAY), quarter = activity(data, now.getTime() - 90 * DAY);
  const [popular, popularLabel] = month.length >= 3 ? [month.slice(0, 4), "this month"] : [quarter.slice(0, 4), "lately"];
  const tags = topTags(data);
  // Intro: what the site is, for a first-time visitor (and Google), above everything else.
  const total = all.reviews.length + all.external.length;
  const platforms = [...all.external.reduce((m, e) => m.set(e.sourcePlatform, (m.get(e.sourcePlatform) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).map(([p]) => platformName(p)).map(p => p === "Blog" ? "blogs" : p === "Forum" ? "forums" : p).filter((p, i, a) => a.indexOf(p) === i).slice(0, 3);
  const fromWhere = [`${niche.people.many}`, ...platforms].map((x, i, a) => i === a.length - 1 && a.length > 1 ? `and ${x}` : x).join(a2(platforms.length));
  // Top picks: each ranking list with its top three, the most useful thing on the site for someone deciding what to buy.
  const picks = type ? [] : (await rankedLists()).lists.slice(0, 6);
  const brandName = (id: string) => all.brands.find(b => b.id === id)?.name;
  const base = (process.env.SITE_URL || `https://www.${niche.site.domain}`).replace(/\/$/, "");
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", name: niche.site.name, url: `${base}/`, potentialAction: { "@type": "SearchAction", target: `${base}${catalogPath}?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    { "@type": "Organization", name: niche.site.name, url: `${base}/`, logo: `${base}/niches/${niche.id}/apple-icon.png` },
  ] };

  const listedCount = all.listed.length;
  const newThisMonth = [...data.reviews, ...data.external].filter(x => Date.parse(x.createdAt) >= now.getTime() - 30 * DAY).length;
  const lead = picks[0];
  const top = lead?.entries.slice(0, 5) ?? [];
  const tiles = type ? [] : browseTiles(all, picks, id => all.reviews.filter(r => r.racketId === id).length + all.external.filter(e => e.racketId === id).length);
  const updated = [...all.reviews, ...all.external].reduce((m, x) => x.createdAt > m ? x.createdAt : m, "");
  const nameOf = (r: { name: string; brandId: string }) => displayName(r.name, brandName(r.brandId));

  const feed = <section className="feed" id="latest">
    <div className="section-head">
      {type ? <h1 className="feed-title">{`Latest ${type.label.toLowerCase()} reviews`}</h1> : <h2>Latest reviews</h2>}
      <span className="section-note">Every review links to where it was said</span>
    </div>
    {niche.typePages && <ChipRow className="type-filter" label={`Filter reviews by ${niche.words.one} type`}>
      <a href={query({})} aria-current={!type ? "page" : undefined}>All</a>
      {niche.typePages.map(t => <a key={t.slug} href={query({ type: t.slug })} aria-current={type?.slug === t.slug ? "page" : undefined}>{t.label}</a>)}
    </ChipRow>}
    <div className="feed-grid">{items.slice(0, show).map(item => <Fragment key={item.key}>{item.node}</Fragment>)}</div>
    {items.length === 0 && <p className="empty-feed">{type ? `No ${type.label.toLowerCase()} reviews here yet.` : "No reviews here yet. Somebody has to go first."} <a href="/add-review">Add a review →</a></p>}
    {items.length > show && <LoadMore href={query({ type: type?.slug, show: show + PAGE })}/>}
    {items.length > 0 && items.length <= show && <p className="end-note">{`You've reached the end. ${niche.copy.ui.triedOneOfThese} `}<a href="/add-review">Add your own review →</a></p>}
  </section>;

  const [lead1, topic] = homeHeadline();
  // The #1 of each other ranking ("Best for power", "Best cleanser"): always tied to a category, unlike site-wide tags.
  // Yearly lists can repeat a title; each title shows once.
  // A product that tops two lists shows once, under the first.
  const shownWinners = new Set(top.map(e => e.product.id));
  const winners = picks.slice(1).filter((l, i, a) => l.entries.length && a.findIndex(x => x.list.title === l.list.title) === i)
    .filter(l => !shownWinners.has(l.entries[0].product.id) && !!shownWinners.add(l.entries[0].product.id)).slice(0, 4)
    .map(l => ({ list: l.list, product: all.rackets.find(r => r.id === l.entries[0].product.id) })).filter(w => w.product);
  return <main className="home v2">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    {!type && <>
      <section className="hero">
        <h1>{lead1}<span className="swash">{topic}</span></h1>
        <div className="hero-row">
          <p className="hero-sub">{`${total.toLocaleString("en-US")} real experiences from ${fromWhere}.`}</p>
          <p className="hero-links"><a href={catalogPath}>{`Explore all ${listedCount.toLocaleString("en-US")} ${niche.words.many}`}<Arrow/></a>{lead && <a className="quiet" href={`${listHref(lead.list.slug)}#how-we-rank`}>How top picks work</a>}</p>
        </div>
      </section>

      {top.length >= 3 && <section className="top5" aria-labelledby="top5-title">
        <div className="section-head"><h2 id="top5-title">{`${lead.list.title} ${listYear(lead.list)}`}</h2><a className="section-link" href={listHref(lead.list.slug)}>{`See the top ${lead.entries.length}`}<Arrow/></a></div>
        <ol className="top5-row">{top.map(e => { return <li key={e.product.id}><a className="pcard" href={productHref(e.product)}>
          <span className="rank-badge">{String(e.rank).padStart(2, "0")}</span>
          <ProductArt product={all.rackets.find(r => r.id === e.product.id) ?? (e.product as never)} brand={brandName(e.product.brandId)} eager/>
          <span className="pcard-body">
            <span className="pcard-name">{nameOf(e.product)}</span>
            {/* Owner, 2026-11-12: just the name; the product page has the detail. */}
          </span>
        </a></li>; })}</ol>
      </section>}

      <div className="home-split">
        {popular.length > 0 && <section aria-labelledby="discussed-title">
          <div className="section-head"><h2 id="discussed-title">{`What ${niche.people.many} are discussing`}</h2><span className="section-note">{`Most new reviews ${popularLabel}`}</span></div>
          <ul className="discussed">{popular.map(({ racket, count }) => { const t = tags.get(racket.id), { brand } = racketParts(racket, data); return <li key={racket.id}><a href={productHref(racket)}>
            <ProductArt product={racket} brand={brand}/>
            <span className="d-body"><span className="d-name">{displayName(racket.name, brand)}</span>
              {(t?.loved || t?.complaint) && <span className="d-said">{t.loved && <span>Loved: <b>{t.loved}</b></span>}{t.complaint && <span>Concern: <b>{t.complaint}</b></span>}</span>}</span>
            <span className="d-count"><b>{`+${count}`}</b>{count === 1 ? "review" : "reviews"}</span>
          </a></li>; })}</ul>
        </section>}
        <section aria-labelledby="new-title">
          <div className="section-head"><h2 id="new-title">Top of each ranking</h2><a className="section-link" href="/rankings">All rankings<Arrow/></a></div>
          <ul className="winners">{winners.map(({ list, product: r }) => { const b = brandName(r!.brandId); return <li key={list.slug}>
            <a href={listHref(list.slug)}><ProductArt product={r!} brand={b}/><span className="w-body"><span className="w-list">{list.label}</span><span className="w-name">{displayName(r!.name, b)}</span></span><span className="w-badge" aria-hidden="true">#1</span></a>
          </li>; })}</ul>
          <dl className="stat-tiles">
            <div><dt>reviews</dt><dd><ChatGlyph/>{total.toLocaleString("en-US")}</dd></div>
            <div><dt>{niche.words.many}</dt><dd><BoxGlyph/>{listedCount.toLocaleString("en-US")}</dd></div>
            <div><dt>{`+${newThisMonth.toLocaleString("en-US")} this month`}</dt><dd><LinkGlyph/><span className="stat-word">Source linked</span></dd></div>
          </dl>
        </section>
      </div>

      {tiles.length >= 2 && <section className="browse-tiles" aria-labelledby="browse-title">
        <div className="section-head"><div><h2 id="browse-title">{niche.typePages?.length ? `Explore what you need` : `Find by playing style`}</h2><p className="section-sub">{niche.typePages?.length ? `Find ${niche.words.many} and reviews by type.` : `Rankings for how you like to play.`}</p></div><a className="section-link" href={niche.typePages?.length ? catalogPath : "/rankings"}>{niche.typePages?.length ? `All ${niche.words.many}` : "All rankings"}<Arrow/></a></div>
        <div className="btile-row">{tiles.slice(0, 4).map(t => <BrowseTile key={t.key} tile={t} data={all}/>)}</div>
        {tiles.length > 4 && <p className="more-types">{tiles.slice(4).map(t => <a key={t.key} href={t.href}>{t.label}</a>)}</p>}
      </section>}

      {/* Where "In their words" was (it repeated the feed): a way in for visitors still deciding. */}
      {niche.finder ? <a className="cta-band" href="/finder">
        <span className="cta-text"><b>{niche.finder.heading}</b><span>{niche.finder.invite}</span></span>
        <span className="cta-button">{`${niche.finder.navLabel}`}<Arrow/></span>
      </a> : lead && <a className="cta-band" href="/rankings">
        <span className="cta-text"><b>{`Not sure where to start?`}</b><span>{`See the ${niche.words.many} ${niche.people.many} are most consistently happy with.`}</span></span>
        <span className="cta-button">See the rankings<Arrow/></span>
      </a>}
    </>}
    {feed}
    {!type && <a className="index-bar" href={catalogPath}>{`Browse the full ${niche.words.one} index`}<Arrow/></a>}
  </main>;
}

const glyph = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function ChatGlyph() { return <svg className="glyph" viewBox="0 0 20 20" aria-hidden="true"><path {...glyph} d="M3 4.5h14v9H9l-4 3v-3H3z"/></svg>; }
function BoxGlyph() { return <svg className="glyph" viewBox="0 0 20 20" aria-hidden="true"><path {...glyph} d="M7.5 2.5h5v3l1.5 2v10h-8v-10l1.5-2z"/></svg>; }
function LinkGlyph() { return <svg className="glyph" viewBox="0 0 20 20" aria-hidden="true"><g {...glyph}><path d="M8.5 11.5l3-3"/><path d="M9.5 6l1.3-1.3a3.2 3.2 0 0 1 4.5 4.5L14 10.5M6 9.5l-1.3 1.3a3.2 3.2 0 0 0 4.5 4.5L10.5 14"/></g></svg>; }
