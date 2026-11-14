export const dynamic = "force-dynamic";
import { isLight } from "../../../lib/look";
import { amazonPhoto } from "../../../lib/amazon-photos";
import { photoHidden, shopPhoto } from "../../../lib/shop-photos";
import { cache } from "react";
import { lightFont } from "../../light-font";
import { platformName } from "../../../lib/source-label";
import { fitText } from "../../../lib/fit-text";
import { productSignals, categoryWords, signalCategory } from "../../signals";
import { discoverPicks, weekOf } from "../../../lib/discover";
import { MIN_SIGNAL_REVIEWS } from "../../../lib/signal";
import { helpfulnessScore, nicheTerms } from "../../../lib/review-order";
import type { Metadata } from "next";
import { catalog as loadCatalog, score } from "../../../db/data";
import { isRecent, webDate, MIN_RECENT } from "../../../lib/recent";
import { notFound, permanentRedirect } from "next/navigation";
import { redirectedSlug } from "../../../db/racket-slugs";
import { database } from "../../../db/data";
import { saveAmazonPhoto } from "../../../db/amazon-photo-save";
import { after } from "next/server";
import { displayName } from "../../../lib/brand-name";
import { Review, External, WebSplit, racketParts, webReviewsLine } from "../../components";
import { Score, PlusIcon, ProductIcon } from "../../icons";
import ReviewList, { PAGE, variantParam, type ListItem } from "./review-list";
import QuickVote from "../../quick-vote";
import { tagTone } from "../../../lib/tags";
import { niche, catalogPath, catalogLabel, productHref, hasYears, typePageFor } from "../../../lib/niche";
import { amazonButton } from "../../../lib/amazon-offer";
import { websiteButton } from "../../../lib/product-links";
import { ratingVerdict, listYear } from "../../../lib/top-lists";
import { rankedLists, listHref } from "../../rankings/lists";
import { similarProducts, tagProfiles } from "../../../lib/similar";
import { variantCounts } from "../../../lib/variants";
import { listLine } from "../../../lib/list-lines";
import { shortLine } from "../../../lib/short-lines";
import { ProductArt, SentimentBar, SentimentBand, Voice, positiveShare, shares, SignalInfo, SignalPop } from "../../visual";
import { summary } from "../../../lib/product-summary";
import { comparePairs, comparePick, pairHref, pairKey } from "../../../lib/compare-pairs";
import "../../compare/compare-lists.css";

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

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const [{slug}, data] = await Promise.all([params, catalog()]);
  const r = data.rackets.find(x => x.slug === slug);
  if (!r) return { title: { absolute: niche.seo.productNotFound }, robots: { index: false } };
  const name = displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name);
  const base = niche.seo.product(name), sum = summary(data, r.id);
  // With enough reviews, the search snippet says what the page knows: how many, how positive, what people praise and
  // complain about. Below that, the niche's generic wording.
  // The same "% positive" as the page header and the FAQ (all reviews), not the recent-window share (audit, 2026-11-13).
  const shown = positiveShare(score(data, r.id));
  const rich = sum.total >= 5 && shown !== null;
  // Just the name and "Player Reviews" (owner, 2026-11-12): short enough for Google to show whole, no repeated year.
  const title = `${name} ${niche.people.One} Reviews`;
  const description = r.reviewSummary && r.reviewSummary.length <= 170 ? r.reviewSummary : rich
    ? fitText([`${sum.total.toLocaleString("en-US")} real reviews of ${name}, ${shown}% positive.`,
       // Only themes with 3+ mentions make the snippet (owner, 2026-11-12, UX audit).
       sum.loved.filter(t => (sum.tagCounts.get(t) ?? 0) >= 3).length ? `Loved for: ${sum.loved.filter(t => (sum.tagCounts.get(t) ?? 0) >= 3).slice(0, 3).join(", ")}.` : "",
       (sum.tagCounts.get(sum.complaints[0]) ?? 0) >= 3 ? `Most common complaint: ${sum.complaints[0]}.` : ""])
    : base.description;
  const images = [{ url: `${productHref(r)}/share-image`, width: 1200, height: 630, alt: niche.seo.ogProductAlt }];
  return { title: { absolute: title }, description, alternates: { canonical: productHref(r) }, openGraph: { title, description, url: productHref(r), type: "website", images }, twitter: { card: "summary_large_image", images } };
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
  const live = await amazonButton({ name: r.name, brand: brand?.name });
  // The saved Amazon item (backfill or admin) wins over the live lookup (owner, 2026-11-12: the live search matched
  // CeraVe Healing Ointment to a Lip Balm twin pack). When the two disagree, the buttons go to the saved item, with no
  // price, since the live price belongs to the other listing.
  const saved = amazonPhoto(r);
  // Also when the live lookup only found a search page: the button goes to the exact saved listing (auditor, 2026-11-14).
  const amazon = live && saved && live.asin !== (r as { amazonAsin?: string | null }).amazonAsin ? { url: saved.url, price: null, image: null } : live;
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
  // The sentiment bar counts user reviews too, by their stars (4–5 positive, 3 mixed, 1–2 negative), like the rankings.
  // Every review with a verdict, the same count as the bar and the tabs (owner, 2026-11-12).
  const verdicts = [...reviews.map(x => ({ sentiment: ratingVerdict(x.rating) })), ...external];
  // Newest first by default (auditor, 2026-11-14: with no helpful votes, "Most helpful" overpromised); "Most detailed"
  // (our helpfulness score: length, specifics, tags) on request.
  const sort = query.sort === "helpful" ? "helpful" : "newest";
  const sum = summary(data, r.id);
  const tag = typeof query.tag === "string" && sum.tagCounts.has(query.tag) ? query.tag : undefined;
  const verdict = (["positive", "mixed", "negative"] as const).find(v => v === query.verdict);
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
    ...reviews.map(x => ({ kind: "players" as const, verdict: ratingVerdict(x.rating), date: x.createdAt, helpful: x.helpful, key: `p-${x.id}`, tags: x.tags, variant: x.variant, node: () => <Voice review={x} textFirst light={isLight(query.look)}/>,
      score: helpfulnessScore({ text: x.reviewText, tags: x.tags, ratings: categories.filter(([, key]) => x[key] != null).length, profile: [x.playerLevel, x.playingSide, x.playingStyle, x.timeWithRacket].filter(Boolean).length }, terms) })),
    // "Newest" goes by the date the review was written; one without a known date sorts last, not by when we imported it
    // (owner, 2026-11-12: the Newest order looked alphabetical).
    ...external.map(e => ({ kind: "web" as const, verdict: e.sentiment, date: e.sourceDate ?? "", older: older(e), helpful: e.helpful, key: `w-${e.id}`, tags: e.tags, variant: e.variant, node: () => <Voice entry={e} textFirst light={isLight(query.look)}/>,
      score: helpfulnessScore({ text: [e.summary, e.excerptTranslation ?? e.excerpt].filter(Boolean).join(" "), tags: e.tags, sentiment: e.sentiment }, terms) })),
  ];
  // Specs we don't know yet are left out rather than shown as "—".
  const specs = ([...(hasYears ? [["Year", r.year] as [string, number]] : []), ...niche.specs.map(spec => [spec.label, r[spec.column]] as [string, string | null])] as [string, string | number | null][]).filter(([, v]) => v);
  const addHref = `/add-review?racket=${r.id}`;
  const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const url = `${base}${productHref(r)}`;
  const typePage = typePageFor(r.shape);
  // Where it ranks: every list it's on, best placing first (shown under the name, and in the FAQ).
  const sigs = await productSignals(), sig = sigs.get(r.id) ?? null;
  const ranked = (await rankedLists()).lists;
  const placings = ranked.flatMap(l => {
    const e = l.entries.find(x => x.product.id === r.id);
    return e ? [{ rank: e.rank, title: `${l.list.title} ${listYear(l.list)}`, label: l.list.label, href: listHref(l.list.slug) }] : [];
  }).sort((a, b) => a.rank - b.rank);
  // The page's ending (owner, 2026-11-12): "Discover more", a different handful of well-reviewed products of the same
  // kind on every page, reshuffled weekly (lib/discover.ts), leaving out this product and the sidebar's similar ones.
  const category = signalCategory(r);
  const pool = data.listed.filter(x => signalCategory(x) === category && sigs.has(x.id)).sort((a, b) => sigs.get(b.id)!.signal - sigs.get(a.id)!.signal).map(x => x.id);
  const discover = discoverPicks(pool, new Set([r.id, ...similar.map(s => s.x.id)]), `${r.id}|${weekOf()}`).map(id => data.listed.find(x => x.id === id)!);

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
  if (r.reviewSummary) faq.push({ q: `What do ${niche.people.many} say about ${name}?`, a: r.reviewSummary });
  if (judged >= 5) faq.push({ q: `Is ${name} worth it?`, a: [`Of the ${judged.toLocaleString("en-US")} reviews with a clear verdict, ${share("positive")}% are positive, ${share("mixed")}% mixed and ${share("negative")}% negative.`,
    sum.loved[0] ? `The praise mentioned most is ${sum.loved[0]}.` : "", sum.complaints[0] ? `The most common complaint is ${sum.complaints[0]}.` : ""].filter(Boolean).join(" ") });
  if (sum.loved.length) { const ex = example(sum.loved[0], "positive"); faq.push({ q: `What do people like about ${name}?`, a: `The praise reviewers mention most: ${list(sum.loved.slice(0, 3).map(mention))}.${ex ? ` For example: ${ex}` : ""}` }); }
  if (sum.complaints.length) { const ex = example(sum.complaints[0], "negative"); faq.push({ q: `What are the most common complaints about ${name}?`, a: `The complaints reviewers mention most: ${list(sum.complaints.slice(0, 3).map(mention))}.${ex ? ` For example: ${ex}` : ""}` }); }
  if (sig?.set) faq.push({ q: `What does the signal score of ${sig.signal} mean?`, a: `It's how well reviewed ${name} is, out of 100, next to the other ${categoryWords(sig.category)} here. This one was set by the ${niche.site.name} team rather than worked out from reviews alone.` });
  else if (sig) faq.push({ q: `What does the signal score of ${sig.signal} mean?`, a: `It's how well reviewed ${name} is, out of 100. Negative and mixed reviews take points off, and so does having only a few reviews: a ${niche.words.one} needs plenty of them, compared with the most-reviewed ${niche.words.many} here, to reach the high 80s and 90s. It's worked out from reviews only, needs at least ${MIN_SIGNAL_REVIEWS} of them, and updates as new ones come in.` });
  if (specs.length) faq.push({ q: `What are the specs of ${name}?`, a: specs.map(([k, v]) => `${k}: ${v}`).join(". ") + "." });
  if (placings.length) faq.push({ q: `How does ${name} rank?`, a: `${placings.slice(0, 3).map(p => `#${p.rank} in ${p.title}`).join(", ")}, ranked by real ${niche.people.one} reviews.` });
  // Where the reviews come from (this used to be two sidebar boxes): web reviews by platform, and how user reviews count.
  if (external.length || reviews.length) {
    const plats = [...new Set(platforms.map(([p]) => platformName(p) === "Blog" ? "blogs" : platformName(p)))], list2 = (ts: string[]) => ts.length > 1 ? `${ts.slice(0, -1).join(", ")} and ${ts[ts.length - 1]}` : ts[0];
    faq.push({ q: `Where do these ${name} reviews come from?`, a: [
      // Collected and summarized, not quoted (auditor, 2026-11-14): most web reviews show as short summaries.
      external.length ? `We collected and summarized ${external.length.toLocaleString("en-US")} ${external.length === 1 ? "experience" : "experiences"} shared on ${list2(plats)}, with links to the original sources.` : "",
      reviews.length ? `${reviews.length === 1 ? "One review was" : `${reviews.length.toLocaleString("en-US")} reviews were`} submitted directly to ${niche.site.name}.` : "",
      `Reviews submitted here are checked for spam before they appear. Every review, submitted here or collected, is read as positive, mixed or negative.`,
    ].filter(Boolean).join(" ") });
  }
  // Structured data for Google: FAQ and breadcrumbs. The star-rating Product block went with the 1–5 ratings (owner
  // decision 2026-11-12: reviews are positive / mixed / negative), since Google's Product needs a numeric rating, review or offer.
  // Four distinct questions (owner's audit, 2026-11-13): what people say, whether it's worth it, the complaints, and
  // where the reviews come from. The others repeated those or the page above them.
  const keepFaq = [/^What do .+ say about/, /^Is .+ worth it\?/, /most common complaints/, /^Where do these/];
  faq.splice(0, faq.length, ...keepFaq.flatMap(re => faq.filter(f => re.test(f.q)).slice(0, 1)));
  const jsonLd = { "@context": "https://schema.org", "@graph": [
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
  // A theme gets its own row at MIN_THEME mentions, shown as a share of the product's reviews; rarer ones go under "Also
  // mentioned" (owner, 2026-11-12, UX audit: one or two mentions read as a finding).
  const MIN_THEME = 3, mentions = (t: string) => sum.tagCounts.get(t) ?? 0;
  const sideTags = [["Liked", "pos", sum.loved.filter(t => mentions(t) >= MIN_THEME).slice(0, 5)], ["Watch for", "neg", sum.complaints.filter(t => mentions(t) >= MIN_THEME).slice(0, 5)]] as const;
  const rare = [...sum.loved, ...sum.complaints].filter(t => mentions(t) < MIN_THEME);
  const also = [...sum.other, ...rare].sort((a, b) => mentions(b) - mentions(a));
  const topCount = Math.max(1, ...sideTags.flatMap(([, , ts]) => ts.map(t => mentions(t))));
  const pctOf = (n: number) => Math.max(1, Math.round(n / Math.max(1, sum.total) * 100));
  const tagHref = (t: string) => `${productHref(r)}?tag=${encodeURIComponent(t)}#reviews`;
  const says = sideTags.some(([, , ts]) => ts.length) && <div className="says">
    <h2><span className="d-only">{`What ${niche.people.many} love, and what they don’t`}</span><span className="m-only">{`What ${niche.people.many} noticed`}</span></h2>
    <div className="says-cards">
      {sideTags.filter(([, , ts]) => ts.length).map(([label, tone, ts]) => <section key={label} className={`says-card ${tone}`}>
        <h3><TagGlyph tone={tone}/>{label}</h3>
        <ul>{ts.map(t => { const n = mentions(t); return <li key={t}><a href={tagHref(t)}><span className="says-name">{t}</span><span className="says-bar"><i style={{ width: `${Math.max(6, n / topCount * 100)}%` }}/></span><span className="says-n" title={`${n} of ${sum.total} reviews`}>{`${pctOf(n)}%`}</span></a></li>; })}</ul>
      </section>)}
    </div>
    {also.length > 0 && <p className="says-also">Also mentioned: {also.slice(0, 4).map(t => <a key={t} className="tag neutral" href={tagHref(t)}>{t}<span className="c">{sum.tagCounts.get(t)}</span></a>)}</p>}
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


  const own = shopPhoto(r), stored = amazonPhoto(r);
  const amazonImage = !photoHidden(r) ? (stored?.image ?? amazon?.image) : null;
  // Cards (home, lists, rankings) only read the saved photo, so a photo found by the live lookup is saved for them, once,
  // after the page is sent (owner, 2026-11-12: GolfRecs top 5 showed drawings for drivers whose pages had photos).
  if (!own && !stored && !(r as { amazonImage?: string | null }).amazonImage && amazon?.asin && amazon.image && !photoHidden(r)) {
    const { asin, image } = amazon;
    after(() => saveAmazonPhoto(r.id, asin, image).catch(error => console.error(`[amazon] Saving the photo for ${r.slug} failed: ${error}`)));
  }
  const pos = positiveShare(s);
  const oneLine = listLine(r);
  // "Compare with …": the previous version, else a recent close rival (lib/compare-pairs comparePick); its own "X vs Y"
  // page when that pair has one, else the open compare view.
  const compareWith = comparePick(data, r) ?? similar[0]?.x;
  const pairWith = compareWith && comparePairs(data).byKey.has(pairKey(r.slug, compareWith.slug)) ? compareWith : undefined;
  const fullName = displayName(r.name, brand?.name);
  // Pieces both layouts show (the light one is the default; ?look=classic shows the old one).
  const similarBox = similar.length > 0 && <section id="similar" className="similar">
          <p className="swipe m-only" aria-hidden="true">Swipe to explore →</p>
          <h2>{`Similar ${(typePage?.label ?? niche.words.many).toLowerCase()}`}</h2>
          <ul className="sim-cards">{[...similar].sort((p, q) => (sigs.get(q.x.id)?.signal ?? -1) - (sigs.get(p.x.id)?.signal ?? -1)).map(({ x, sc }) => { const b = data.brands.find(y => y.id === x.brandId)?.name, sp = positiveShare(sc); return <li key={x.id}><a href={productHref(x)}>
            <ProductArt product={x} brand={b}/><span className="sim-body"><span className="sim-name">{displayName(x.name, b)}</span>
            <span className="sim-meta">{[x.shape, `${sc.count + sc.web} reviews`].filter(Boolean).join(" · ")}</span>
            {sigs.get(x.id) ? <span className="sim-meta sim-signal"><b>{sigs.get(x.id)!.signal}</b> signal</span> : sp !== null && <span className="sim-meta"><b>{sp}%</b> positive</span>}
            <span className="sim-go">View reviews <span aria-hidden="true">→</span></span></span>
          </a></li>; })}</ul>
        </section>;
  const siblingsBox = siblings.length > 0 && <section>
          <h2>More from {brand?.name}</h2>
          <ul className="mini">{siblings.map(x => { const sc = score(data, x.id); return <li key={x.id}><a href={productHref(x)}>
            <SideArt x={x} brand={brand?.name}/><span className="nm">{x.name}<span className="mt">{`${sc.count + sc.web} ${sc.count + sc.web === 1 ? "review" : "reviews"}`}</span></span>
          </a></li>; })}</ul>
        </section>;
  const nextBox = (discover.length >= 3 || niche.finder) && <section className="p-next" aria-labelledby="next-title">
      {discover.length >= 3 && <>
        <div className="section-head"><h2 id="next-title">{`Discover more ${typePage ? typePage.label.toLowerCase() : niche.words.many}`}</h2><a className="section-link" href={typePage ? `/${typePage.slug}` : catalogPath}>{`See all ${typePage ? typePage.label.toLowerCase() : niche.words.many}`} <span aria-hidden="true">→</span></a></div>
        <ul className="top5-row discover-row">{discover.map(x => { const b = data.brands.find(y => y.id === x.brandId)?.name; return <li key={x.id}><a className="pcard" href={productHref(x)}>
          <ProductArt product={x} brand={b}/>
          <span className="pcard-body"><span className="pcard-name">{displayName(x.name, b)}</span></span>
        </a></li>; })}</ul>
      </>}
      <div className="p-next-actions">
        <a className="p-next-card" href={addHref}><b>{niche.copy.ui.triedIt}</b><span>Add your review in about two minutes. No account needed.</span><span className="button">Add your review</span></a>
        {niche.finder && <a className="p-next-card" href="/finder"><b>{niche.finder.heading}</b><span>{niche.finder.invite}</span><span className="button ghost">{niche.finder.navLabel} <span aria-hidden="true">→</span></span></a>}
      </div>
    </section>;
  const buyBar = shopButton && <div className="buy-bar">
      <a className={`button ${amazon ? "amazon" : "visit-site"}`} href={shopButton.url} target="_blank" rel={amazon || site?.affiliate ? "sponsored nofollow noopener" : "noopener"}>{amazon ? "Check price on Amazon" : site!.label}</a>
    </div>;
  const faqBox = faq.length >= 2 && <section className="faq" id="faq">
          <h2>{`Common questions about ${name}`}</h2>
          {faq.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>;
  // The light direction's product page, the default since 2026-11-12 (?look=classic shows the old page) (owner, 2026-11-12).
  if (isLight(query.look)) {
    // Compact, after the owner's mockup (2026-11-12): photo and numbers in one tight block, what people mention as chips,
    // then the reviews with "At a glance" beside them, so the reviews start high on the page.
    const cap = (t: string) => t ? t[0].toUpperCase() + t.slice(1) : t;
    const liked = sum.loved.filter(t => mentions(t) >= MIN_THEME).slice(0, 5), concerns = sum.complaints.filter(t => mentions(t) >= MIN_THEME).slice(0, 5);
    const latest = [...reviews.map(x => x.createdAt), ...external.map(x => x.createdAt)].sort().pop();
    const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const sources = [...new Set(platforms.map(([p]) => platformName(p) === "Blog" ? "Blogs" : platformName(p)))].concat(reviews.length ? [niche.site.name] : []);
    // Only the product's details (owner, 2026-11-13): type, review count and sources are already at the top of the page.
    const glance = specs.filter(([k]) => k !== (niche.specs.find(x => x.column === "shape")?.label ?? "Type")).map(([k, v]) => [k, String(v)]);
    const buy = amazon ? <a className="button amazon-out" href={amazon.url} target="_blank" rel="sponsored nofollow noopener">Check price on Amazon</a>
      : site ? <a className="button" href={site.url} target="_blank" rel={site.affiliate ? "sponsored nofollow noopener" : "noopener"}>{site.label}</a>
      : <a className="button" href={addHref}><PlusIcon/>Add your review</a>;
    const chips = (ts: readonly string[]) => <p className="lp-chips">{ts.map(t => <a key={t} href={tagHref(t)}>{cap(t)}<b>{mentions(t)}</b></a>)}</p>;
    // "More balms & ointments" at the bottom (owner's mockup, 2026-11-13): the category's best-scored others, three cards.
    const sameType = typePage ? data.listed.filter(x => x.id !== r.id && typePageFor(x.shape)?.slug === typePage.slug) : [];
    const more = sameType.filter(x => sigs.get(x.id)).sort((a, b) => sigs.get(b.id)!.signal - sigs.get(a.id)!.signal).slice(0, 3);
    const moreBox = typePage && more.length >= 2 && <section className="lp-more" aria-labelledby="lp-more-title">
      <div className="lp-more-head"><div><h2 id="lp-more-title">{`More ${typePage.label.toLowerCase()}`}</h2>{typePage.intro && <p>{`${typePage.intro}, ranked by real ${niche.people.many}.`}</p>}</div>
        <a className="lp-more-all" href={`/${typePage.slug}`}>{`View all ${typePage.label.toLowerCase()}`} <span aria-hidden="true">→</span></a></div>
      <ul>{more.map(x => { const b = data.brands.find(y => y.id === x.brandId)?.name, sc = score(data, x.id), n = sc.count + sc.web, take = shortLine(x) ?? listLine(x);
        return <li key={x.id}><a href={productHref(x)}>
          <span className="lp-more-art"><ProductArt product={x} brand={b}/></span>
          <span className="lp-more-body"><b>{displayName(x.name, b)}</b>{take && <span>{take}</span>}</span>
          <span className="lp-more-foot"><small>{`${n.toLocaleString("en-US")} ${n === 1 ? "review" : "reviews"}`}</small><em>Read reviews <span aria-hidden="true">→</span></em></span>
        </a></li>; })}</ul>
      <p className="lp-more-swipe m-only" aria-hidden="true">Swipe to explore →</p>
    </section>;
    return <main className={`product v2 lt-page lp ${lightFont.className}`}>
      {affiliate && <p className="affiliate-note compact">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you). Keeps the lights on!</p>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
      <div className="crumbs"><a href={catalogPath}>{catalogLabel}</a><span>/</span>{typePage && <><a href={`/${typePage.slug}`}>{typePage.label}</a><span>/</span></>}{brand && <a href={`/brands/${brand.slug}`}>{brand.name}</a>}</div>
      <section className="lp-hero">
        {own ? <div className="lp-photo art art-own"><img src={own} alt={fullName}/></div> : amazonImage
          // Not a link (owner, 2026-11-14): people click a photo to look at it, so the Amazon link stays on the button only.
          ? <div className="lp-photo art art-amazon"><img src={amazonImage} alt={fullName}/></div>
          : <div className="lp-photo art art-none"><ProductIcon shape={r.shape} brand={brand?.name}/></div>}
        <div className="lp-info">
          {/* After the owner's product-page mockup (2026-11-13): the name with "Reviews" after it (owner, 2026-11-14; no kicker above), the category chip, the take, then the
              signal, the positive share and the review count as one group, one Amazon button and a quiet reviews link. */}
          <div className="lp-title">
            <h1>{fullName}<span className="lp-h1-rev"> Reviews</span></h1>
          </div>
          {r.shape && <p className="lp-chiprow"><span className="lp-cat">{r.shape}</span>{hasYears && <span className="lp-year">{r.year}</span>}{placings[0] && <a className="lp-rank" href={placings[0].href}>{`Ranked #${placings[0].rank} in ${placings[0].label}`}</a>}</p>}
          {oneLine && <p className="lp-line">{oneLine}</p>}
          {sum.total > 0 ? <div className="lp-stats lp-stats2">
            {sig && <div className="lp-stat"><b className="lp-signal">{sig.signal}</b><span>Signal score</span></div>}
            {/* The counts over the bar, not a share (owner, 2026-11-14): a "% positive" read like a second score next to the signal. */}
            {pos !== null && <div className="lp-stat lp-split"><p className="lp-counts">
              <span className="c-pos"><b>{s.positive.toLocaleString("en-US")}</b> positive</span>
              <span className="c-mix"><b>{s.mixed.toLocaleString("en-US")}</b> mixed</span>
              <span className="c-neg"><b>{s.negative.toLocaleString("en-US")}</b> negative</span></p>
              <SentimentBar positive={s.positive} mixed={s.mixed} negative={s.negative}/></div>}
            <a className="lp-stat" href="#reviews"><b>{sum.total.toLocaleString("en-US")}</b><span>{sum.total === 1 ? "review" : "reviews"}</span></a>
          </div> : <p className="p-first">{`Be the first to review it. ${niche.copy.ui.triedIt}`}</p>}
          {/* Quick ratings (2026-11-14 pivot, owner): tap a ball right under the sentiment bar. */}
          <QuickVote racketId={r.id} name={fullName} people={niche.people} addHref={addHref}/>
          <div className="lp-sub"><SignalPop label="How the signal works"/>{latest && <span>{`Updated ${day(latest)}`}</span>}</div>
          <p className="lp-actions">{amazon ? <a className="button amazon-out lp-buy" href={amazon.url} target="_blank" rel="sponsored nofollow noopener">Check price on Amazon <span aria-hidden="true">↗</span></a> : buy}
            {sum.total > 0 && <a className="lp-read" href="#reviews">{`Read ${sum.total.toLocaleString("en-US")} ${sum.total === 1 ? "review" : "reviews"}`} <span aria-hidden="true">↓</span></a>}</p>
        </div>
      </section>
      {(liked.length > 0 || concerns.length > 0) && <section className="lp-mention" aria-labelledby="lp-mention-title">
        <h2 id="lp-mention-title">What people mention</h2>
        <div className="lp-mention-cols">
          {liked.length > 0 && <div className="lp-m-row lp-m-pos"><h3>Often liked</h3>{chips(liked)}</div>}
          {concerns.length > 0 && <div className="lp-m-row lp-m-neg"><h3>Common concerns</h3>{chips(concerns)}</div>}
        </div>
      </section>}
      {byVariant}
      <div className="columns lp-cols">
        <div>
          <ReviewList verdict={verdict} title={`Real ${niche.people.one} experiences`} href={productHref(r)} addHref={addHref} addButton={<a className="button ghost add-review" href={addHref}><PlusIcon/>Add your review</a>} items={items} sort={sort} tag={tag} show={show}
            variants={niche.variants && variants.length ? { label: niche.variants.label, plural: niche.variants.plural, counts: variants } : undefined} variant={variant}/>
          {faqBox}
        </div>
        <aside className="database-sidebar">
          {glance.length > 0 && <section className="lp-glance"><h2>At a glance</h2><dl>{glance.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>}
          {/* "Compare with …" sits with the similar products, not in the header (owner's audit, 2026-11-13). */}
          {compareWith && <a className="lp-compare" href={pairWith ? pairHref(r.slug, pairWith.slug) : `/compare?ids=${r.slug},${compareWith.slug}`}>{`Compare with ${displayName(compareWith.name, data.brands.find(b => b.id === compareWith.brandId)?.name)}`} <span aria-hidden="true">→</span></a>}
          {similarBox}
          {siblingsBox}
        </aside>
      </div>
      {moreBox}
      {nextBox}
      {/* No fixed "Check price" bar on phones (owner, 2026-11-13, audit): the one button in the header stays where it is. */}
    </main>;
  }
  return <main className="product v2">
    {/* One quiet line at the top (owner choice, 2026-11-05): the buy button stays free of nearby text. */}
    {affiliate && <p className="affiliate-note compact">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you). Keeps the lights on!</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="crumbs"><a href={catalogPath}>{catalogLabel}</a><span>/</span>{typePage && <><a href={`/${typePage.slug}`}>{typePage.label}</a><span>/</span></>}{brand && <a href={`/brands/${brand.slug}`}>{brand.name}</a>}</div>
    <section className="p-hero">
      <div className="p-head">
        {/* "<Product> Reviews" matches the page title and what people search for; the word itself is for search and screen readers. */}
        <h1>{fullName}<span className="h1-reviews"> Reviews</span></h1>
        {(r.shape || hasYears) && <p className="p-kicker">{[hasYears ? String(r.year) : null, r.shape && `${r.shape}${typePage?.one || niche.categoryPaths ? "" : ` ${niche.words.one}`}`].filter(Boolean).join(" · ")}</p>}
        {placings[0] && <a className="p-placing" href={placings[0].href}><span className="d-only">{`#${placings[0].rank} in ${placings[0].title}`}</span><span className="m-only">{`#${placings[0].rank} · ${placings[0].label}`}</span> <span aria-hidden="true">→</span></a>}
        {sum.total > 0 && <a className="p-count m-only" href="#reviews"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12v7H7l-3 2.5v-2.5H2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>{`${sum.total.toLocaleString("en-US")} ${sum.total === 1 ? "review" : "reviews"}`}</a>}
      </div>
      {own ? <div className="p-photo art art-own"><img src={own} alt={fullName}/></div> : amazonImage
        // Amazon's terms: the photo is served by Amazon, unaltered, and links to its product page.
        ? <a className="p-photo art art-amazon" href={stored?.url ?? amazon?.url} target="_blank" rel="sponsored nofollow noopener"><img src={amazonImage} alt={fullName}/></a>
        : <div className="p-photo art art-none"><ProductIcon shape={r.shape} brand={brand?.name}/>{r.shape && <small>{r.shape.toLowerCase()}</small>}</div>}
      <div className="p-scorebox">
        {sum.total > 0 ? <div className="p-score">
          {/* The signal score leads (owner, 2026-11-12); the bar below shows the split it comes from. */}
          {sig ? <div className="p-big p-pos p-signal"><b>{sig.signal}</b><span>signal</span>
            {/* What the number means, one tap away (owner, 2026-11-12, after the outside audit). No JavaScript. */}
            <SignalInfo/></div>
            : pos !== null && <div className="p-big p-pos"><b>{pos}%</b><span>positive</span></div>}
          <a className="p-big p-total" href="#reviews"><b>{sum.total.toLocaleString("en-US")}</b><span>{sum.total === 1 ? "review" : "reviews"}</span></a>
        </div> : <p className="p-first">{`Be the first to review it. ${niche.copy.ui.triedIt}`}</p>}
        {pos !== null && <SentimentBand positive={s.positive} mixed={s.mixed} negative={s.negative}/>}
        {/* What the split is a share of, so it reads the same as the review tabs below (owner, 2026-11-12). */}
        {pos !== null && <p className="sband-base">{`Of ${s.judged.toLocaleString("en-US")} ${s.judged === 1 ? "review" : "reviews"} with a clear verdict`}</p>}
        {pos !== null && <ul className="p-legend m-only" aria-hidden="true">{([["positive", "Positive", s.positive], ["mixed", "Mixed", s.mixed], ["negative", "Negative", s.negative]] as const).map(([k, w, n], i) =>
          <li key={k} className={`s-${k}`}><span>{w}</span><b>{`${shares([s.positive, s.mixed, s.negative])[i]}%`}</b></li>)}</ul>}
      </div>
      <div className="p-rest">
        {/* "In short" is one sentence now (owner, 2026-11-12): the product's one-line take (lib/list-lines), else the first
            sentence of its review summary. The whole summary answers the first question in the FAQ. */}
        {oneLine && <p className="p-line">{oneLine}</p>}
        <p className="p-actions">
          {/* The shop link is the main button, with one label everywhere; reviews are a text link (owner, 2026-11-12, UX audit). */}
          {amazon ? <a className="button amazon-out" href={amazon.url} target="_blank" rel="sponsored nofollow noopener">Check price on Amazon</a>
            : site ? <a className="button" href={site.url} target="_blank" rel={site.affiliate ? "sponsored nofollow noopener" : "noopener"}>{site.label}</a>
            : <a className="button ghost" href={addHref}><PlusIcon/>Add your review</a>}
          {sum.total > 0 && <a className="p-read" href="#reviews">Read reviews <span aria-hidden="true">↓</span></a>}
        </p>
        <p className="p-links m-only">
          {sum.total > 0 && <a href="#reviews">{`Read ${niche.people.one} reviews`} <span aria-hidden="true">↓</span></a>}
          {similar.length > 0 && <a className="p-compare" href="#similar">{`Similar ${niche.words.many}`} <span aria-hidden="true">→</span></a>}
        </p>
        {/* Side by side with the product reviewers describe most like it: its indexable "vs" page when the pair has one,
            else that product (or an empty slot) at /compare?ids=. */}
        <p className="p-compare-link"><a href={pairWith ? pairHref(r.slug, pairWith.slug) : `/compare?ids=${[r.slug, ...(compareWith ? [compareWith.slug] : [])].join(",")}`}>{compareWith ? `Compare with ${displayName(compareWith.name, data.brands.find(b => b.id === compareWith.brandId)?.name)}` : `Compare with another ${niche.words.one}`} <span aria-hidden="true">→</span></a></p>
      </div>
    </section>
    {/* Specs live in the FAQ now (owner, 2026-11-12): reviews are what the page is for. */}
    {says}
    {byVariant}
    {niche.specsNote && <p className="specs-note">{niche.specsNote.replace("{checked}", checkedDate(r.createdAt))}</p>}
    {r.description && <p className="p-description">{r.description}</p>}

    <div className="columns">
      <div>
        <ReviewList verdict={verdict} title={`${niche.people.One} reviews`} href={productHref(r)} addHref={addHref} addButton={<a className="button ghost add-review" href={addHref}><PlusIcon/>Add your review</a>} items={items} sort={sort} tag={tag} show={show}
          variants={niche.variants && variants.length ? { label: niche.variants.label, plural: niche.variants.plural, counts: variants } : undefined} variant={variant}/>
        {reviews.length >= 3 && <div className="panels one">
          {/* "How it plays" (old 1–5 averages) is gone (owner, 2026-11-12): reviews are positive, mixed or negative now. */}
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
          </section>
        </div>}

{faqBox}
      </div>

      <aside className="database-sidebar">
{similarBox}

{siblingsBox}
      </aside>
    </div>

{nextBox}
    {/* Phones: the shop button stays in reach at the bottom of the screen. */}
{buyBar}
  </main>;
}

/** Thumbs-up for what reviewers liked, a warning sign for what to watch for. */
function TagGlyph({ tone }: { tone: "pos" | "neg" }) {
  const g = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return tone === "pos"
    ? <svg className="tag-glyph" viewBox="0 0 20 20" aria-hidden="true"><path {...g} d="M6.5 9.5v7h-3v-7zM6.5 9.5l3.2-6c1.4 0 2.2 1 1.9 2.3l-.6 2.7h4.3c1 0 1.7.9 1.5 1.9l-1.1 5.2c-.2.9-.9 1.4-1.8 1.4H6.5"/></svg>
    : <svg className="tag-glyph" viewBox="0 0 20 20" aria-hidden="true"><path {...g} d="M10 3l7.5 13.5h-15zM10 8.5v3.5M10 14.4v.1"/></svg>;
}
