export const dynamic = "force-dynamic";
import { amazonPhoto } from "../../../lib/amazon-photos";
import { photoHidden, shopPhoto } from "../../../lib/shop-photos";
import { cache } from "react";
import { helpfulnessScore, nicheTerms } from "../../../lib/review-order";
import type { Metadata } from "next";
import { catalog as loadCatalog, score } from "../../../db/data";
import { isRecent, webDate, MIN_RECENT } from "../../../lib/recent";
import { notFound, permanentRedirect } from "next/navigation";
import { redirectedSlug } from "../../../db/racket-slugs";
import { database } from "../../../db/data";
import { displayName } from "../../../lib/brand-name";
import { Review, External, WebSplit, racketParts, webReviewsLine } from "../../components";
import { Score, PlusIcon, ProductIcon } from "../../icons";
import ReviewList, { PAGE, variantParam, type ListItem } from "./review-list";
import { tagTone } from "../../../lib/tags";
import { niche, catalogPath, catalogLabel, productHref, hasYears, typePageFor } from "../../../lib/niche";
import { amazonButton } from "../../../lib/amazon-offer";
import { websiteButton } from "../../../lib/product-links";
import { ratingVerdict, listYear } from "../../../lib/top-lists";
import { rankedLists, listHref } from "../../rankings/lists";
import { similarProducts, tagProfiles } from "../../../lib/similar";
import { variantCounts } from "../../../lib/variants";

const categories = niche.categories.map(c => [c.label, c.column] as const);
const { playerLevel, playingSide } = niche.profile;
// "2026-10-29T12:00:00Z" → "October 29, 2026", for niche.specsNote.
const checkedDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const pct = (n: number, total: number) => total ? `${Math.round(n / total * 100)}%` : "0%";
// One catalog read per request, shared by the page and its metadata.
const catalog = cache(() => loadCatalog());

type Data = Awaited<ReturnType<typeof loadCatalog>>;
/** A sidebar row's photo, or the drawing when the product has none. */
function SideArt({ x, brand }: { x: Parameters<typeof shopPhoto>[0] & Parameters<typeof amazonPhoto>[0] & { shape: string | null }; brand?: string | null }) {
  const photo = shopPhoto(x) ?? amazonPhoto(x)?.image;
  return photo ? <img className="sug-photo" src={photo} alt="" loading="lazy"/> : <ProductIcon shape={x.shape} brand={brand}/>;
}

/** Counts behind the page's verdict, title and description: every review, the sentiment split, and tags by how often
 *  reviewers mention them. One place, so the header, the tags and the search snippet never disagree. With `variant`
 *  (niche.variants), the same counts for the player and web reviews of that one variant: the "By plastic" table. */
function summary(data: Data, id: string, variant?: string) {
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
  const description = r.reviewSummary && r.reviewSummary.length <= 170 ? r.reviewSummary : rich
    ? [`${sum.total.toLocaleString("en-US")} real reviews of ${name}, ${sum.positive}% positive.`,
       sum.loved.length ? `Loved for: ${sum.loved.slice(0, 3).join(", ")}.` : "",
       sum.complaints.length ? `Most common complaint: ${sum.complaints[0]}.` : ""].filter(Boolean).join(" ")
    : base.description;
  return { title: { absolute: title }, description, alternates: { canonical: productHref(r) }, openGraph: { title, description, url: productHref(r), type: "website" } };
}

export default async function RacketPage({params, searchParams}: {params: Promise<{slug: string}>; searchParams: Promise<{sort?: string | string[]; tag?: string | string[]; show?: string | string[]} & Record<string, string | string[] | undefined>>}) {
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
  // Niches with variants (DiscGolfRecs plastics): how many player and web reviews name each one, most first. Empty elsewhere, and on
  // products none of whose reviews name one, so nothing below shows.
  const variants = niche.variants ? variantCounts([...reviews, ...external]) : [];
  const asked = query[variantParam], wanted = typeof asked === "string" ? asked.toLowerCase() : undefined;
  const variant = wanted ? variants.find(([v]) => v.toLowerCase() === wanted)?.[0] : undefined;
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
  const siblings = data.listed.filter(x => x.brandId === r.brandId && x.id !== r.id)
    .sort((a, b) => Number(racketParts(b, data).model.toLowerCase().startsWith(firstWord)) - Number(racketParts(a, data).model.toLowerCase().startsWith(firstWord)) || b.year - a.year)
    .slice(0, 5);
  // Alternatives: what reviewers describe most like this one, with how positive their reviews are. Only products with a few judged reviews.
  const similar = similarProducts(r, data.listed.filter(x => score(data, x.id).judged >= 5), tagProfiles([...data.reviews, ...data.external]))
    .map(x => ({ x, sc: score(data, x.id) }));
  const platforms = [...external.reduce((m, e) => m.set(e.sourcePlatform, (m.get(e.sourcePlatform) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);

  const terms = nicheTerms(niche);
  // Only the reviews ReviewList shows get rendered (node is called for the shown slice).
  const items: ListItem[] = [
    ...reviews.map(x => ({ kind: "players" as const, date: x.createdAt, helpful: x.helpful, key: `p-${x.id}`, tags: x.tags, variant: x.variant, node: () => <Review review={x} data={data} showRacket={false}/>,
      score: helpfulnessScore({ text: x.reviewText, tags: x.tags, ratings: categories.filter(([, key]) => x[key] != null).length, profile: [x.playerLevel, x.playingSide, x.playingStyle, x.timeWithRacket].filter(Boolean).length }, terms) })),
    ...external.map(e => ({ kind: "web" as const, date: webDate(e), older: older(e), helpful: e.helpful, key: `w-${e.id}`, tags: e.tags, variant: e.variant, node: () => <External entry={e} data={data} showRacket={false}/>,
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
  // Where the reviews come from (this used to be two sidebar boxes): web quotes by platform, and how user reviews count.
  if (external.length || reviews.length) {
    const plats = platforms.map(([p]) => p), list2 = (ts: string[]) => ts.length > 1 ? `${ts.slice(0, -1).join(", ")} and ${ts[ts.length - 1]}` : ts[0];
    faq.push({ q: `Where do these ${name} reviews come from?`, a: [
      external.length ? `${external.length.toLocaleString("en-US")} are quotes from discussions on ${list2(plats)}, each linked to the original post.` : "",
      reviews.length ? `${reviews.length.toLocaleString("en-US")} ${reviews.length === 1 ? "was" : "were"} written by ${niche.people.many} here.` : "",
      `${niche.people.One} reviews are checked for spam before they appear, and only they count toward the star rating; quotes never do.`,
    ].filter(Boolean).join(" ") });
  }
  // Structured data for Google: the product once it has MIN_RATINGS user ratings, since Google rejects a Product with no
  // rating, review or offer, and web quotes can't fill in (its rules want ratings collected on this site). Plus breadcrumbs.
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    ...(s.average ? [{
      "@type": "Product", name: displayName(r.name, brand?.name), url, image: `${url}/opengraph-image`, category: typePage?.label ?? niche.seo.productCategory,
      description: r.description || `${niche.people.One} reviews and ratings of the ${displayName(r.name, brand?.name)}.`,
      ...(brand ? { brand: { "@type": "Brand", name: brand.name } } : {}),
      aggregateRating: { "@type": "AggregateRating", ratingValue: s.average, ratingCount: s.count, reviewCount: s.count, bestRating: 5, worstRating: 1 },
      review: reviews.slice(0, 10).map(x => ({
        "@type": "Review", author: { "@type": "Person", name: x.alias || `Anonymous ${niche.people.one}` }, datePublished: x.createdAt.slice(0, 10), reviewBody: x.reviewText,
        reviewRating: { "@type": "Rating", ratingValue: x.rating, bestRating: 5, worstRating: 1 },
      })),
    }] : []),
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
  // The product at a glance: what people praise and complain about, with bars so the big themes stand out. Each row opens
  // the reviews that mention it.
  const sideTags = [["Loved for", "pos", sum.loved.slice(0, 5)], ["Complaints", "neg", sum.complaints.slice(0, 5)]] as const;
  const topCount = Math.max(1, ...sideTags.flatMap(([, , ts]) => ts.map(t => sum.tagCounts.get(t) ?? 0)));
  const tagHref = (t: string) => `${productHref(r)}?tag=${encodeURIComponent(t)}#reviews`;
  const says = sum.tagCounts.size > 0 && <div className="says">
    <h2>{`What ${niche.people.many} say about ${displayName(r.name, brand?.name)}`}</h2>
    <div className="says-cards">
      {sideTags.filter(([, , ts]) => ts.length).map(([label, tone, ts]) => <section key={label} className={`says-card ${tone}`}>
        <h3>{label}</h3>
        <ul>{ts.map(t => { const n = sum.tagCounts.get(t) ?? 0; return <li key={t}><a href={tagHref(t)}><span className="says-name">{t}</span><span className="says-bar"><i style={{ width: `${Math.max(6, n / topCount * 100)}%` }}/></span><span className="says-n">{n}</span></a></li>; })}</ul>
      </section>)}
    </div>
    {sum.other.length > 0 && <p className="says-also">Also mentioned: {sum.other.slice(0, 3).map(t => <a key={t} className="tag neutral" href={tagHref(t)}>{t}<span className="c">{sum.tagCounts.get(t)}</span></a>)}</p>}
  </div>;
  // Variants compared (DiscGolfRecs "By plastic"): only variants with 3+ reviews, and only when at least two qualify. The
  // positive share and the tags are counted like the headline's (summary()), over that variant's player and web reviews.
  const variantHref = (v: string) => `${productHref(r)}?${variantParam}=${encodeURIComponent(v)}#reviews`;
  const variantRows = variants.filter(([, n]) => n >= 3).map(([v, n]) => { const vs = summary(data, r.id, v);
    return { v, n, positive: vs.positive, tags: [...vs.tagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2).map(([t]) => t) }; });
  const byVariant = niche.variants && variantRows.length >= 2 && <section className="by-variant">
    <h2>{`By ${niche.variants.label.toLowerCase()}`}</h2>
    <table>
      <thead><tr><th scope="col">{niche.variants.label}</th><th scope="col">Reviews</th><th scope="col">Positive</th><th scope="col">Mentioned most</th></tr></thead>
      <tbody>{variantRows.map(x => <tr key={x.v}>
        <th scope="row"><a href={variantHref(x.v)}>{x.v}</a></th>
        <td className="num">{x.n}</td>
        <td className="num">{x.positive === null ? "—" : `${x.positive}%`}</td>
        <td>{x.tags.length ? <div className="tags-cell">{x.tags.map(t => <span key={t} className={`tag ${tagTone(t)}`}>{t}</span>)}</div> : <span className="none">—</span>}</td>
      </tr>)}</tbody>
    </table>
  </section>;
  const affiliate = !!(amazon || site?.affiliate);


  const own = shopPhoto(r);
  return <main>
    {/* One quiet line at the top (owner choice, 2026-11-05): the buy button stays free of nearby text. */}
    {affiliate && <p className="affiliate-note compact">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you). Keeps the lights on!</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <section className="profile">
      {own ? <div className="profile-art own"><img src={own} alt={displayName(r.name, brand?.name)}/></div> : amazon?.image && !photoHidden(r)
        // Amazon's terms: the photo is served by Amazon, unaltered, and links to its product page.
        ? <a className="profile-art photo" href={amazon.url} target="_blank" rel="sponsored nofollow noopener"><img src={amazon.image} alt={displayName(r.name, brand?.name)}/></a>
        : <div className="profile-art">
          <ProductIcon shape={r.shape} brand={brand?.name}/>
          {r.shape && <small>{r.shape.toLowerCase()}</small>}
        </div>}

      <div className="profile-info">
        <div className="titleblock">
          <div className="crumbs"><a href={catalogPath}>{catalogLabel}</a><span>/</span>{typePage && <><a href={`/${typePage.slug}`}>{typePage.label}</a><span>/</span></>}{brand && <a href={`/brands/${brand.slug}`}>{brand.name}</a>}</div>
          {/* "<Product> Reviews" matches the page title and what people search for; the count sits right below. */}
          <h1>{`${displayName(r.name, brand?.name)} Reviews`}</h1>
          {sum.total > 0 && <p className="verdict-line">{sum.positive !== null && <b>{sum.positive}% positive</b>}<a href="#reviews">{`${sum.total.toLocaleString("en-US")} ${sum.total === 1 ? "review" : "reviews"}`}</a>{amazon
            ? <a className="button amazon top-buy" href={amazon.url} target="_blank" rel="sponsored nofollow noopener">View price on Amazon</a>
            : site && <a className="button visit-site top-buy" href={site.url} target="_blank" rel={site.affiliate ? "sponsored nofollow noopener" : "noopener"}>{site.label}</a>}</p>}
          {placings.length > 0 && <p className="placings">{placings.slice(0, 2).map(p => <a key={p.href} href={p.href} className="placing"><b>#{p.rank}</b> in {p.title}</a>)}</p>}
          {r.description && <p className="description">{r.description}</p>}
        </div>
        {/* "In short" (kept, owner choice 2026-11-05); the summary itself opens by naming who is speaking ("Most players…"). A 2–3 sentence summary written from the product's reviews (review_summary), checked against its tag counts. */}
        {r.reviewSummary && <div className="tldr"><input type="checkbox" id="tldr-more" className="tldr-toggle"/><p><span className="tldr-label">In short</span>{r.reviewSummary}</p><label htmlFor="tldr-more" className="tldr-more">more</label></div>}
        {says}
        {byVariant}
        <dl className="spec-strip">
          {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className={v ? undefined : "unknown"}>{v || "—"}</dd></div>)}
        </dl>
        {niche.specsNote && <p className="specs-note">{niche.specsNote.replace("{checked}", checkedDate(r.createdAt))}</p>}
      </div>

      <aside className="scorecard">
        {s.average ? <>
          <div className="big">{s.average}<small>/ 5</small></div>
          <Score rating={Number(s.average)} size="lg"/>
          <p><b>{s.count}</b>{` ${niche.people.one} `}{s.count === 1 ? "rating" : "ratings"} · <b>{reviews.length + external.length}</b> reviews</p>
          <WebSplit entries={verdicts} label="What reviewers say" noun=""/>
        </> : <>
          {reviews.length + external.length ? <>
          </> : <>
            <div className="no-score">Be the first to review it</div>
            <p>{`${niche.copy.ui.triedIt} Tell others how it went.`}</p>
          </>}
          <WebSplit entries={verdicts} label="What reviewers say" noun=""/>
        </>}
        {/* The shop button sits by the title, and on phones in the sticky bar; adding a review is at the Reviews heading. */}
        {!amazon && !site && <a className="button" href={addHref}><PlusIcon/>Add your review</a>}
        {!amazon && !site && <p className="hint">{`${niche.copy.ui.triedIt} No account needed.`}</p>}
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

        <ReviewList title={`${niche.people.One} reviews`} href={productHref(r)} addHref={addHref} addButton={shopButton ? <a className="button ghost add-review" href={addHref}><PlusIcon/>Add your review</a> : undefined} items={items} sort={sort} tag={tag} show={show}
          variants={niche.variants && variants.length ? { label: niche.variants.label, plural: niche.variants.plural, counts: variants } : undefined} variant={variant}/>
        {faq.length >= 2 && <section className="faq" id="faq">
          <h2>{`Common questions about ${name}`}</h2>
          {faq.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>}
      </div>

      <aside className="database-sidebar">
        {similar.length > 0 && <section>
          <h2>{`Similar ${(typePage?.label ?? niche.words.many).toLowerCase()}`}</h2>
          <ul className="mini">{similar.map(({ x, sc }) => { const b = data.brands.find(y => y.id === x.brandId)?.name; return <li key={x.id}><a href={productHref(x)}>
            <SideArt x={x} brand={b}/><span className="nm">{displayName(x.name, b)}<span className="mt">{`${Math.round(sc.positive / sc.judged * 100)}% positive · ${sc.count + sc.web} reviews`}</span></span>
          </a></li>; })}</ul>
        </section>}

        {siblings.length > 0 && <section>
          <h2>More from {brand?.name}</h2>
          <ul className="mini">{siblings.map(x => { const sc = score(data, x.id); return <li key={x.id}><a href={productHref(x)}>
            <SideArt x={x} brand={brand?.name}/><span className="nm">{x.name}<span className="mt">{sc.count ? `${sc.count} ${sc.count === 1 ? "rating" : "ratings"}` : webReviewsLine(sc.web)}</span></span>
            {sc.average && <span className="end"><Score rating={Number(sc.average)} size="sm"/></span>}
          </a></li>; })}</ul>
        </section>}
      </aside>
    </div>
    {/* Phones: the shop button stays in reach at the bottom of the screen. */}
    {shopButton && <div className="buy-bar">
      <span className="buy-name">{displayName(r.name, brand?.name)}</span>
      <a className={`button ${amazon ? "amazon" : "visit-site"}`} href={shopButton.url} target="_blank" rel={amazon || site?.affiliate ? "sponsored nofollow noopener" : "noopener"}>{amazon ? "View on Amazon" : site!.label}</a>
    </div>}
  </main>;
}
