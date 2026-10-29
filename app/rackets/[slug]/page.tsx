export const dynamic = "force-dynamic";
import { cache } from "react";
import { helpfulnessScore, nicheTerms } from "../../../lib/review-order";
import type { Metadata } from "next";
import { catalog as loadCatalog, score } from "../../../db/data";
import { notFound, permanentRedirect } from "next/navigation";
import { redirectedSlug } from "../../../db/racket-slugs";
import { database } from "../../../db/data";
import { Review, External, WebSplit, racketParts, webReviewsLine } from "../../components";
import { Score, PlusIcon, ProductIcon, SourceIcon } from "../../icons";
import { TagList } from "../../tags";
import ReviewList, { type ListItem } from "./review-list";
import { niche, catalogPath, productHref, hasYears, typePageFor } from "../../../lib/niche";
import { amazonButton } from "../../../lib/amazon-offer";
import { websiteButton } from "../../../lib/product-links";

const categories = niche.categories.map(c => [c.label, c.column] as const);
const { playerLevel, playingSide } = niche.profile;
// "2026-10-29T12:00:00Z" → "October 29, 2026", for niche.specsNote.
const checkedDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const pct = (n: number, total: number) => total ? `${Math.round(n / total * 100)}%` : "0%";
// One catalog read per request, shared by the page and its metadata.
const catalog = cache(() => loadCatalog());

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const [{slug}, data] = await Promise.all([params, catalog()]);
  const r = data.rackets.find(x => x.slug === slug);
  if (!r) return { title: { absolute: niche.seo.productNotFound }, robots: { index: false } };
  const { title, description } = niche.seo.product(r.name);
  return { title: { absolute: title }, description, alternates: { canonical: productHref(r) }, openGraph: { title, description, url: productHref(r), type: "website" } };
}

export default async function RacketPage({params, searchParams}: {params: Promise<{slug: string}>; searchParams: Promise<{source?: string | string[]; sort?: string | string[]}>}) {
  const [{slug}, query, data] = await Promise.all([params, searchParams, catalog()]);
  const r = data.rackets.find(r => r.slug === slug);
  if (!r) {
    // Renamed rackets: old addresses redirect permanently so links and search rankings carry over.
    const moved = await redirectedSlug(await database(), slug);
    if (moved) permanentRedirect(productHref(data.rackets.find(x => x.slug === moved) ?? { slug: moved }));
    notFound();
  }
  const brand = data.brands.find(b => b.id === r.brandId);
  // Only niches with Amazon links (SkinRecs, SimRacingRecs) have one: the product on Amazon, or an Amazon search for it. Prices are not shown.
  const amazon = await amazonButton({ name: r.name, brand: brand?.name });
  // Niches with `website` links (SoftwareRecs) link to the product's own site instead; an affiliate link only when the data has one.
  const site = websiteButton(r);
  const shopButton = amazon || site;
  const { model } = racketParts(r, data);
  const s = score(data, r.id);
  const reviews = data.reviews.filter(x => x.racketId === r.id);
  const external = data.external.filter(e => e.racketId === r.id);
  const source = query.source === "players" || query.source === "web" ? query.source : "all";
  const sort = query.sort === "helpful" ? "helpful" : "newest";

  const cats = categories.map(([label, key]) => {
    const vals = reviews.flatMap(x => x[key] == null ? [] : [x[key]!]);
    return { label, key, count: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  });
  const catPlayers = reviews.filter(x => categories.some(([, key]) => x[key] != null)).length;
  const tally = (values: (string | null)[], options: string[]) => options.map(o => ({ o, n: values.filter(v => v === o).length })).filter(x => x.n > 0);
  const sides = tally(reviews.map(x => x.playingSide), playingSide.options.map(o => o.value));
  // Highest level first.
  const levels = tally(reviews.map(x => x.playerLevel), playerLevel.options.map(o => o.value).reverse());
  const sideTotal = sides.reduce((a, x) => a + x.n, 0), levelTotal = levels.reduce((a, x) => a + x.n, 0);
  const colors = niche.chartColors;
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, count: reviews.filter(x => x.rating === n).length }));
  const distMax = Math.max(1, ...dist.map(d => d.count));

  const firstWord = model.split(" ")[0]?.toLowerCase();
  const siblings = data.rackets.filter(x => x.brandId === r.brandId && x.id !== r.id)
    .sort((a, b) => Number(racketParts(b, data).model.toLowerCase().startsWith(firstWord)) - Number(racketParts(a, data).model.toLowerCase().startsWith(firstWord)) || b.year - a.year)
    .slice(0, 5);
  const platforms = [...external.reduce((m, e) => m.set(e.sourcePlatform, (m.get(e.sourcePlatform) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);

  const terms = nicheTerms(niche);
  // Every review is rendered once on the server; filtering by source and sorting happen instantly in ReviewList.
  const items: ListItem[] = [
    ...reviews.map(x => ({ kind: "players" as const, date: x.createdAt, helpful: x.helpful, key: `p-${x.id}`, node: <Review review={x} data={data} showRacket={false}/>,
      score: helpfulnessScore({ text: x.reviewText, tags: x.tags, ratings: categories.filter(([, key]) => x[key] != null).length, profile: [x.playerLevel, x.playingSide, x.playingStyle, x.timeWithRacket].filter(Boolean).length }, terms) })),
    ...external.map(e => ({ kind: "web" as const, date: e.createdAt, helpful: e.helpful, key: `w-${e.id}`, node: <External entry={e} data={data} showRacket={false}/>,
      score: helpfulnessScore({ text: [e.summary, e.excerptTranslation ?? e.excerpt].filter(Boolean).join(" "), tags: e.tags, sentiment: e.sentiment }, terms) })),
  ];
  const specs: [string, string | number | null][] = [...(hasYears ? [["Year", r.year] as [string, number]] : []), ...niche.specs.map(spec => [spec.label, r[spec.column]] as [string, string | null])];
  const addHref = `/add-review?racket=${r.id}`;
  const tagged = [...reviews, ...external].filter(x => x.tags.length);
  const tagCounts = new Map<string, number>();
  for (const t of tagged.flatMap(x => x.tags)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const url = `${base}${productHref(r)}`;
  const typePage = typePageFor(r.shape);
  // Structured data for Google: product + player ratings (web quotes never count), and breadcrumbs.
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    ...(s.average ? [{
      "@type": "Product", name: r.name, url, image: `${url}/opengraph-image`, category: niche.seo.productCategory,
      description: r.description || `${niche.people.One} reviews and ratings of the ${r.name}.`,
      ...(brand ? { brand: { "@type": "Brand", name: brand.name } } : {}),
      aggregateRating: { "@type": "AggregateRating", ratingValue: s.average, ratingCount: s.count, reviewCount: s.count, bestRating: 5, worstRating: 1 },
      review: reviews.slice(0, 10).map(x => ({
        "@type": "Review", author: { "@type": "Person", name: x.alias || `Anonymous ${niche.people.one}` }, datePublished: x.createdAt.slice(0, 10), reviewBody: x.reviewText,
        reviewRating: { "@type": "Rating", ratingValue: x.rating, bestRating: 5, worstRating: 1 },
      })),
    }] : []),
    { "@type": "BreadcrumbList", itemListElement: [
      ...[
        { name: niche.words.Many, item: `${base}${catalogPath}` },
        ...(typePage ? [{ name: typePage.label, item: `${base}/${typePage.slug}` }] : []),
        ...(brand ? [{ name: brand.name, item: `${base}/brands/${brand.slug}` }] : []),
        { name: r.name, item: url },
      ].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })),
    ] },
  ] };
  const topTags = [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([t]) => t);

  return <main>
    {(amazon || site?.affiliate) && <p className="affiliate-note">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you). Keeps the lights on!</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <section className="profile">
      <div className="profile-art">
        <ProductIcon shape={r.shape} brand={brand?.name}/>
        {r.shape && <small>{r.shape.toLowerCase()}</small>}
      </div>

      <div className="profile-info">
        <div className="titleblock">
          <div className="crumbs"><a href={catalogPath}>{niche.words.Many}</a><span>/</span>{typePage && <><a href={`/${typePage.slug}`}>{typePage.label}</a><span>/</span></>}{brand && <a href={`/brands/${brand.slug}`}>{brand.name}</a>}</div>
          {brand && <span className="brandline">{brand.name}</span>}
          <h1>{model}</h1>
          {r.description && <p className="description">{r.description}</p>}
        </div>
        <dl className="spec-strip">
          {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className={v ? undefined : "unknown"}>{v || "—"}</dd></div>)}
        </dl>
        {niche.specsNote && <p className="specs-note">{niche.specsNote.replace("{checked}", checkedDate(r.createdAt))}</p>}
        {tagged.length >= 2 && <div className="says">
          <h3>{`What ${niche.people.many} keep saying `}<span>· from {tagged.length} reviews</span></h3>
          <TagList tags={topTags} counts={tagCounts}/>
        </div>}
      </div>

      <aside className="scorecard">
        {s.average ? <>
          <div className="big">{s.average}<small>/ 5</small></div>
          <Score rating={Number(s.average)} size="lg"/>
          <p><b>{s.count}</b>{` ${niche.people.one} `}{s.count === 1 ? "rating" : "ratings"} · <b>{reviews.length + external.length}</b> reviews</p>
          <WebSplit entries={external}/>
        </> : <>
          {external.length ? <>
            <div className="no-score">{external.length} {external.length === 1 ? "review" : "reviews"}</div>
            <p>Quoted from around the web</p>
          </> : <>
            <div className="no-score">Be the first to review it</div>
            <p>{`${niche.copy.ui.triedIt} Tell others how it went.`}</p>
          </>}
          <WebSplit entries={external}/>
        </>}
        {/* Niches with Amazon or website links put that button here; adding a review moves to the Reviews heading. */}
        {amazon
          ? <a className="button amazon" href={amazon.url} target="_blank" rel="sponsored nofollow noopener">View price on Amazon</a>
          : site
          ? <a className="button visit-site" href={site.url} target="_blank" rel={site.affiliate ? "sponsored nofollow noopener" : "noopener"}>{site.label}</a>
          : <a className="button" href={addHref}><PlusIcon/>Add your review</a>}
        <p className="hint">{`${niche.copy.ui.triedIt} No account needed.`}</p>
      </aside>
    </section>

    <div className="columns">
      <div>
        {reviews.length > 0 && <div className="panels">
          <section className="panel">
            <h2>{niche.copy.ui.howItPerforms}<small>{catPlayers} {catPlayers === 1 ? niche.people.one : niche.people.many}</small></h2>
            {catPlayers ? <ul className="cats">{cats.map(c => <li key={c.key}>
              <span>{c.label}</span><span className="track"><i style={{width: c.avg ? `${c.avg / 5 * 100}%` : 0}}/></span>
              <b className={c.avg ? undefined : "na"}>{c.avg ? c.avg.toFixed(1) : "—"}</b>
            </li>)}</ul> : <p className="empty">No category scores yet. They're optional when adding a review.</p>}
          </section>

          <section className="panel">
            <h2>{niche.copy.ui.whoUsesIt}</h2>
            {sideTotal > 0 && <div className="split">
              <div className="lbl">{playingSide.label}</div>
              <div className="stack">{sides.map((x, i) => <i key={x.o} style={{width: pct(x.n, sideTotal), background: colors[i]}}/>)}</div>
              <div className="legend">{sides.map((x, i) => <span key={x.o} style={{"--c": colors[i]} as React.CSSProperties}>{x.o} {pct(x.n, sideTotal)}</span>)}</div>
            </div>}
            {levelTotal > 0 && <div className="split">
              <div className="lbl">{playerLevel.label}</div>
              <div className="stack">{levels.map((x, i) => <i key={x.o} style={{width: pct(x.n, levelTotal), background: colors[i]}}/>)}</div>
              <div className="legend">{levels.map((x, i) => <span key={x.o} style={{"--c": colors[i]} as React.CSSProperties}>{x.o} {x.n}</span>)}</div>
            </div>}
            <div className="split">
              <div className="lbl">Ratings</div>
              <ul className="dist">{dist.map(d => <li key={d.n}><span>{d.n}</span><span className="track"><i style={{width: `${d.count / distMax * 100}%`}}/></span><b>{d.count}</b></li>)}</ul>
            </div>
          </section>
        </div>}

        <ReviewList href={productHref(r)} addHref={addHref} addButton={shopButton ? <a className="button ghost add-review" href={addHref}><PlusIcon/>Add your review</a> : undefined} items={items} initialSource={source} initialSort={sort}/>
      </div>

      <aside className="database-sidebar">
        {siblings.length > 0 && <section>
          <h2>More from {brand?.name}</h2>
          <ul className="mini">{siblings.map(x => { const sc = score(data, x.id); return <li key={x.id}><a href={productHref(x)}>
            <ProductIcon shape={x.shape} brand={brand?.name}/><span className="nm">{x.name}<span className="mt">{sc.count ? `${sc.count} ${sc.count === 1 ? "rating" : "ratings"}` : webReviewsLine(sc.web)}</span></span>
            {sc.average && <span className="end"><Score rating={Number(sc.average)} size="sm"/></span>}
          </a></li>; })}</ul>
        </section>}

        {platforms.length > 0 && <section>
          <h2>Quotes come from</h2>
          <ul className="mini">{platforms.map(([p, n]) => <li key={p}><span className="row"><span className="src"><SourceIcon platform={p}/></span><span className="nm">{p}</span><span className="end">{n}</span></span></li>)}</ul>
          <p className="side-note" style={{marginTop: 8}}>{`Quoted opinions never count toward the ${niche.people.one} rating.`}</p>
        </section>}

        <section>
          <h2>About these ratings</h2>
          <p className="side-note">{`Only approved ${niche.people.one} reviews count toward the average. Every ${niche.people.one} review is checked for spam before it appears.`}</p>
        </section>
      </aside>
    </div>
  </main>;
}
