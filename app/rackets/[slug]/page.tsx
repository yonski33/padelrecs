export const dynamic = "force-dynamic";
import { cache } from "react";
import { helpfulnessScore, nicheTerms } from "../../../lib/review-order";
import type { Metadata } from "next";
import { catalog as loadCatalog, score } from "../../../db/data";
import { notFound, permanentRedirect } from "next/navigation";
import { redirectedSlug } from "../../../db/racket-slugs";
import { database } from "../../../db/data";
import { displayName } from "../../../lib/brand-name";
import { Review, External, WebSplit, racketParts, webReviewsLine } from "../../components";
import { Score, PlusIcon, ProductIcon, SourceIcon } from "../../icons";
import ReviewList, { PAGE, type ListItem } from "./review-list";
import { tagTone } from "../../../lib/tags";
import { niche, catalogPath, catalogLabel, productHref, hasYears, typePageFor } from "../../../lib/niche";
import { amazonButton } from "../../../lib/amazon-offer";
import { websiteButton } from "../../../lib/product-links";
import { ratingVerdict, listYear } from "../../../lib/top-lists";
import { rankedLists, listHref } from "../../rankings/lists";

const categories = niche.categories.map(c => [c.label, c.column] as const);
const { playerLevel, playingSide } = niche.profile;
// "2026-10-29T12:00:00Z" → "October 29, 2026", for niche.specsNote.
const checkedDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const pct = (n: number, total: number) => total ? `${Math.round(n / total * 100)}%` : "0%";
// One catalog read per request, shared by the page and its metadata.
const catalog = cache(() => loadCatalog());

type Data = Awaited<ReturnType<typeof loadCatalog>>;
/** Counts behind the page's verdict, title and description: every review, the sentiment split, and tags by how often
 *  reviewers mention them. One place, so the header, the tags and the search snippet never disagree. */
function summary(data: Data, id: string) {
  const reviews = data.reviews.filter(x => x.racketId === id), external = data.external.filter(e => e.racketId === id);
  const tagCounts = new Map<string, number>();
  for (const t of [...reviews, ...external].flatMap(x => x.tags)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const byCount = [...tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  const judged = [...reviews.map(x => ratingVerdict(x.rating)), ...external.map(e => e.sentiment)].filter(Boolean);
  const positive = judged.length >= 3 ? Math.round(judged.filter(v => v === "positive").length / judged.length * 100) : null;
  return { total: reviews.length + external.length, tagCounts, positive,
    loved: byCount.filter(t => tagTone(t) === "pos"), complaints: byCount.filter(t => tagTone(t) === "neg"), other: byCount.filter(t => tagTone(t) === "neutral") };
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const [{slug}, data] = await Promise.all([params, catalog()]);
  const r = data.rackets.find(x => x.slug === slug);
  if (!r) return { title: { absolute: niche.seo.productNotFound }, robots: { index: false } };
  const name = displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name);
  const base = niche.seo.product(name), sum = summary(data, r.id);
  // With enough reviews, the search snippet says what the page knows: how many, how positive, what people praise and
  // complain about. Below that, the niche's generic wording.
  const rich = sum.total >= 5 && sum.positive !== null;
  const title = rich ? base.title.replace(" Reviews |", ` Reviews ${new Date().getUTCFullYear()}: ${sum.total.toLocaleString("en-US")} Real Reviews |`) : base.title;
  const description = rich
    ? [`${sum.total.toLocaleString("en-US")} real reviews of ${name}, ${sum.positive}% positive.`,
       sum.loved.length ? `Loved for: ${sum.loved.slice(0, 3).join(", ")}.` : "",
       sum.complaints.length ? `Most common complaint: ${sum.complaints[0]}.` : ""].filter(Boolean).join(" ")
    : base.description;
  return { title: { absolute: title }, description, alternates: { canonical: productHref(r) }, openGraph: { title, description, url: productHref(r), type: "website" } };
}

export default async function RacketPage({params, searchParams}: {params: Promise<{slug: string}>; searchParams: Promise<{sort?: string | string[]; tag?: string | string[]; show?: string | string[]}>}) {
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
  // Web reviews are dated by their source. Niches with recentMonths (software, hosting, money) change fast, so the web
  // picture counts only that window; older web reviews stay listed, after the recent ones, marked as older.
  const webDate = (e: {sourceDate: string | null; createdAt: string}) => e.sourceDate || e.createdAt;
  const since = new Date(); if (niche.recentMonths !== undefined) since.setUTCMonth(since.getUTCMonth() - niche.recentMonths);
  const older = (e: {sourceDate: string | null; createdAt: string}) => niche.recentMonths !== undefined && Date.parse(webDate(e)) < since.getTime();
  const recentWeb = external.filter(e => !older(e));
  // The sentiment bar counts user reviews too, by their stars (4–5 positive, 3 mixed, 1–2 negative), like the rankings.
  const verdicts = [...reviews.filter(x => !older({ sourceDate: null, createdAt: x.createdAt })).map(x => ({ sentiment: ratingVerdict(x.rating) })), ...recentWeb];
  // "Most helpful" (our helpfulness score, plus votes) is the default; "Newest" on request.
  const sort = query.sort === "newest" ? "newest" : "helpful";
  const sum = summary(data, r.id);
  const tag = typeof query.tag === "string" && sum.tagCounts.has(query.tag) ? query.tag : undefined;
  const show = Math.min(Math.max(PAGE, Math.ceil((Number(query.show) || PAGE) / PAGE) * PAGE), 2000);

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
  // Only the reviews ReviewList shows get rendered (node is called for the shown slice).
  const items: ListItem[] = [
    ...reviews.map(x => ({ kind: "players" as const, date: x.createdAt, helpful: x.helpful, key: `p-${x.id}`, tags: x.tags, node: () => <Review review={x} data={data} showRacket={false}/>,
      score: helpfulnessScore({ text: x.reviewText, tags: x.tags, ratings: categories.filter(([, key]) => x[key] != null).length, profile: [x.playerLevel, x.playingSide, x.playingStyle, x.timeWithRacket].filter(Boolean).length }, terms) })),
    ...external.map(e => ({ kind: "web" as const, date: webDate(e), older: older(e), helpful: e.helpful, key: `w-${e.id}`, tags: e.tags, node: () => <External entry={e} data={data} showRacket={false}/>,
      score: helpfulnessScore({ text: [e.summary, e.excerptTranslation ?? e.excerpt].filter(Boolean).join(" "), tags: e.tags, sentiment: e.sentiment }, terms) })),
  ];
  // Specs we don't know yet are left out rather than shown as "—".
  const specs = ([...(hasYears ? [["Year", r.year] as [string, number]] : []), ...niche.specs.map(spec => [spec.label, r[spec.column]] as [string, string | null])] as [string, string | number | null][]).filter(([, v]) => v);
  const addHref = `/add-review?racket=${r.id}`;
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const url = `${base}${productHref(r)}`;
  const typePage = typePageFor(r.shape);
  // Where it ranks: every list it's on, best placing first (shown under the name, and in the FAQ).
  const placings = (await rankedLists()).lists.flatMap(l => {
    const e = l.entries.find(x => x.product.id === r.id);
    return e ? [{ rank: e.rank, title: `${l.list.title} ${listYear(l.list)}`, href: listHref(l.list.slug) }] : [];
  }).sort((a, b) => a.rank - b.rank);

  // Common questions, answered only from the counts and summaries on this page. Shown at the foot of the reviews and
  // given to Google as FAQPage data.
  const name = displayName(r.name, brand?.name);
  const judged = verdicts.filter(v => v.sentiment).length;
  const share = (k: "positive" | "mixed" | "negative") => judged ? Math.round(verdicts.filter(v => v.sentiment === k).length / judged * 100) : 0;
  const mention = (t: string) => `${t} (${sum.tagCounts.get(t)} ${sum.tagCounts.get(t) === 1 ? "review" : "reviews"})`;
  const example = (t: string, want: "positive" | "negative") => external
    .filter(e => e.summary && e.tags.includes(t) && e.sentiment === want)
    .sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0) || Math.abs(a.summary!.length - 110) - Math.abs(b.summary!.length - 110))[0]?.summary ?? null;
  const list = (ts: readonly string[]) => ts.length > 1 ? `${ts.slice(0, -1).join(", ")} and ${ts[ts.length - 1]}` : ts[0];
  const faq: { q: string; a: string }[] = [];
  if (judged >= 5) faq.push({ q: `Is ${name} worth it?`, a: [`Of the ${judged.toLocaleString("en-US")} reviews with a clear verdict, ${share("positive")}% are positive, ${share("mixed")}% mixed and ${share("negative")}% negative.`,
    sum.loved[0] ? `The praise mentioned most is ${sum.loved[0]}.` : "", sum.complaints[0] ? `The most common complaint is ${sum.complaints[0]}.` : ""].filter(Boolean).join(" ") });
  if (sum.loved.length) { const ex = example(sum.loved[0], "positive"); faq.push({ q: `What do people like about ${name}?`, a: `The praise reviewers mention most: ${list(sum.loved.slice(0, 3).map(mention))}.${ex ? ` For example: ${ex}` : ""}` }); }
  if (sum.complaints.length) { const ex = example(sum.complaints[0], "negative"); faq.push({ q: `What are the most common complaints about ${name}?`, a: `The complaints reviewers mention most: ${list(sum.complaints.slice(0, 3).map(mention))}.${ex ? ` For example: ${ex}` : ""}` }); }
  if (placings.length) faq.push({ q: `How does ${name} rank?`, a: `${placings.slice(0, 3).map(p => `#${p.rank} in ${p.title}`).join(", ")}, ranked by real ${niche.people.one} reviews.` });
  // Structured data for Google: the product on every page (name, brand, category), its user ratings once there are
  // MIN_RATINGS of them (web quotes never count), and breadcrumbs.
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    {
      "@type": "Product", name: displayName(r.name, brand?.name), url, image: `${url}/opengraph-image`, category: typePage?.label ?? niche.seo.productCategory,
      description: r.description || `${niche.people.One} reviews and ratings of the ${displayName(r.name, brand?.name)}.`,
      ...(brand ? { brand: { "@type": "Brand", name: brand.name } } : {}),
      ...(s.average ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: s.average, ratingCount: s.count, reviewCount: s.count, bestRating: 5, worstRating: 1 },
      review: reviews.slice(0, 10).map(x => ({
        "@type": "Review", author: { "@type": "Person", name: x.alias || `Anonymous ${niche.people.one}` }, datePublished: x.createdAt.slice(0, 10), reviewBody: x.reviewText,
        reviewRating: { "@type": "Rating", ratingValue: x.rating, bestRating: 5, worstRating: 1 },
      })),
      } : {}),
    },
    ...(faq.length >= 2 ? [{ "@type": "FAQPage", mainEntity: faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }] : []),
    { "@type": "BreadcrumbList", itemListElement: [
      ...[
        { name: catalogLabel, item: `${base}${catalogPath}` },
        ...(typePage ? [{ name: typePage.label, item: `${base}/${typePage.slug}` }] : []),
        ...(brand ? [{ name: brand.name, item: `${base}/brands/${brand.slug}` }] : []),
        { name: r.name, item: url },
      ].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })),
    ] },
  ] };
  // What reviewers praise and complain about, most mentioned first: a summary under the specs, above the verdict.
  const tagRows = [["Loved for", sum.loved.slice(0, 6)], ["Complaints", sum.complaints.slice(0, 4)], ["Also mentioned", sum.other.slice(0, 3)]] as const;
  const tagChip = (t: string) => <span key={t} className={`tag ${tagTone(t)}`}>{t}<span className="c">{sum.tagCounts.get(t)}</span></span>;
  const says = sum.tagCounts.size > 0 && <div className="says">
    <h2>{`What ${niche.people.many} keep saying`}</h2>
    {tagRows.filter(([, ts]) => ts.length).map(([label, ts]) => <div key={label} className="says-row"><span className="says-label">{label}</span><div className="tags">{ts.map(tagChip)}</div></div>)}
  </div>;
  const affiliate = !!(amazon || site?.affiliate);


  return <main>
    {/* One quiet line at the top (owner choice, 2026-11-05): the buy button stays free of nearby text. */}
    {affiliate && <p className="affiliate-note compact">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you). Keeps the lights on!</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <section className="profile">
      <div className="profile-art">
        <ProductIcon shape={r.shape} brand={brand?.name}/>
        {r.shape && <small>{r.shape.toLowerCase()}</small>}
      </div>

      <div className="profile-info">
        <div className="titleblock">
          <div className="crumbs"><a href={catalogPath}>{catalogLabel}</a><span>/</span>{typePage && <><a href={`/${typePage.slug}`}>{typePage.label}</a><span>/</span></>}{brand && <a href={`/brands/${brand.slug}`}>{brand.name}</a>}</div>
          <h1>{displayName(r.name, brand?.name)}</h1>
          {placings.length > 0 && <p className="placings">{placings.slice(0, 2).map(p => <a key={p.href} href={p.href} className="placing"><b>#{p.rank}</b> in {p.title}</a>)}</p>}
          {r.description && <p className="description">{r.description}</p>}
        </div>
        <dl className="spec-strip">
          {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className={v ? undefined : "unknown"}>{v || "—"}</dd></div>)}
        </dl>
        {niche.specsNote && <p className="specs-note">{niche.specsNote.replace("{checked}", checkedDate(r.createdAt))}</p>}
        {says}
      </div>

      <aside className="scorecard">
        {s.average ? <>
          <div className="big">{s.average}<small>/ 5</small></div>
          <Score rating={Number(s.average)} size="lg"/>
          <p><b>{s.count}</b>{` ${niche.people.one} `}{s.count === 1 ? "rating" : "ratings"} · <b>{reviews.length + external.length}</b> reviews</p>
          <WebSplit entries={verdicts} label="What reviewers say" noun=""/>
        </> : <>
          {reviews.length + external.length ? <>
            <div className="no-score">{reviews.length + external.length} {reviews.length + external.length === 1 ? "review" : "reviews"}</div>
          </> : <>
            <div className="no-score">Be the first to review it</div>
            <p>{`${niche.copy.ui.triedIt} Tell others how it went.`}</p>
          </>}
          <WebSplit entries={verdicts} label="What reviewers say" noun=""/>
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

        <ReviewList href={productHref(r)} addHref={addHref} addButton={shopButton ? <a className="button ghost add-review" href={addHref}><PlusIcon/>Add your review</a> : undefined} items={items} sort={sort} tag={tag} show={show}/>
        {faq.length >= 2 && <section className="faq" id="faq">
          <h2>{`Common questions about ${name}`}</h2>
          {faq.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>}
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
    {/* Phones: the shop button stays in reach at the bottom of the screen. */}
    {shopButton && <div className="buy-bar">
      <span className="buy-name">{displayName(r.name, brand?.name)}</span>
      <a className={`button ${amazon ? "amazon" : "visit-site"}`} href={shopButton.url} target="_blank" rel={amazon || site?.affiliate ? "sponsored nofollow noopener" : "noopener"}>{amazon ? "View on Amazon" : site!.label}</a>
    </div>}
  </main>;
}
