// Read per request like the other public pages; Vercel's CDN keeps a copy for up to a minute (next.config.ts headers),
// so a list re-ranks itself as soon as new reviews are published.
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche, productHref } from "../../../lib/niche";
import { listTitle, MIN_LIST_REVIEWS, MIN_POSITIVE_SHARE, reviewWindowMonths, windowLabel, TRAIT_LIST_LIKED_WEIGHT, RANKINGS_PATH, listYear, MIN_LIST_ENTRIES, type ListEntry } from "../../../lib/top-lists";
import type { TopList } from "../../../lib/niche/types";
import { ProductIcon } from "../../icons";
import { tagTone } from "../../../lib/tags";
import { displayName } from "../../../lib/brand-name";
import { rankedLists, listHref, longDate, currentYear, type RankedList } from "../lists";
import { listLine } from "../../../lib/list-lines";
import { amazonButton, amazonLinksOn, type AmazonButton } from "../../../lib/amazon-offer";
import { websiteButton } from "../../../lib/product-links";
import { ProductArt, SentimentBar, Arrow } from "../../visual";
import type { Catalog } from "../../../db/data";
type Product = Catalog["rackets"][number];

const w = niche.words, people = niche.people;
const find = async (slug: string) => (await rankedLists()).lists.find(x => x.list.slug === slug);
const base = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

function description(r: RankedList) {
  const names = r.entries.slice(0, 3).map(e => e.product.name).join(", ");
  return `${r.list.intro} Ranked from ${r.reviews.toLocaleString("en-US")} first-hand reviews: ${names}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await find((await params).slug);
  if (!found) return { title: { absolute: niche.seo.productNotFound }, robots: { index: false } };
  const title = listTitle(found.list, listYear(found.list), found.reviews, people.One), desc = description(found), url = listHref(found.list.slug);
  return { title: { absolute: title }, description: desc, alternates: { canonical: url }, openGraph: { title, description: desc, url, type: "website" } };
}

const pct = (n: number, total: number) => `${n / total * 100}%`;
const withThe = (name: string) => `${/^the /i.test(name) ? "" : "the "}${name}`;

function Entry({ e, product, brand, list, amazon }: { e: ListEntry; product: Product | undefined; brand: string; list: TopList; amazon: AmazonButton | null }) {
  const href = productHref(e.product), site = websiteButton({ websiteUrl: e.product.websiteUrl ?? null, affiliateUrl: e.product.affiliateUrl ?? null });
  const line = listLine(e.product), name = displayName(e.product.name, brand);
  return <li className={`rrow${e.rank === 1 ? " lead" : ""}`}>
    <span className="rrow-rank" aria-label={`Rank ${e.rank}`}>{String(e.rank).padStart(2, "0")}</span>
    <a className="rrow-art" href={href} aria-hidden="true" tabIndex={-1}>{product ? <ProductArt product={product} brand={brand}/> : <span className="art art-none"><ProductIcon shape={e.product.shape} brand={brand}/></span>}</a>
    <div className="rrow-main">
      {e.rank === 1 && <span className="top-pick">Top pick</span>}
      {/* A model year at the end of the name reads lighter, as in the mockup. */}
      <h2><a href={href}>{name.replace(/ \d{4}$/, "")}{/ \d{4}$/.test(name) && <span className="rrow-year">{name.slice(-5)}</span>}</a></h2>
      {line && <p className="rrow-line">{line}</p>}
      {/* Owner, 2026-11-12: no tag chips here; the line above names the main downside in context, the product page has the counts. */}
      {list.trait && <p className="rrow-trait">{`${e.traitReviews} of ${e.reviews} reviews mention ${list.trait.noun}`}</p>}
      {/* A quiet text link: Amazon on niches with Amazon links, otherwise the product's own site (software, hosting, money). */}
      {amazon
        ? <a className="rrow-buy" href={amazon.url} target="_blank" rel="sponsored nofollow noopener">Check price on Amazon<span aria-hidden="true"> ↗</span></a>
        : site && <a className="rrow-buy" href={site.url} target="_blank" rel={site.affiliate ? "sponsored nofollow noopener" : "noopener"}>{site.label}<span aria-hidden="true"> ↗</span></a>}
    </div>
    <a className="rrow-score" href={href}>
      <span className="rrow-pos"><ChatGlyph/><b>{`${e.positive} positive`}</b></span>
      <span className="rrow-n">{`${e.reviews} reviews`}</span>
      {/* Owner, 2026-11-12: the split explains the order better than the count alone; no legend, to keep rows light. */}
      <SentimentBar positive={e.positive} mixed={e.mixed} negative={e.negative} className="rrow-bar"/>
    </a>
  </li>;
}

const quoted = (tags: string[]) => tags.map(t => `“${t}”`).join(tags.length > 2 ? ", " : " or ").replace(/, (“[^”]+”)$/, " or $1");

function Method({ list, count, affiliate }: { list: TopList; count: number; affiliate: boolean }) {
  const min = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const filters = (list.filters ?? []).flatMap(f => {
    const spec = niche.specs.find(s => s.column === f.column)?.label.toLowerCase() ?? f.column;
    return [f.include && `only includes ${w.many} with a ${f.include.join(" or ").toLowerCase()} ${spec}`, f.exclude && `leaves out ${w.many} with a ${f.exclude.join(" or ").toLowerCase()} ${spec}`].filter(Boolean);
  });
  const trait = list.trait;
  return <section className="top-method" id="how-we-rank">
    <h2>How we rank</h2>
    <ul>
      <li>{`Two kinds of published review count: ${people.one} reviews on ${niche.site.name} and first-hand comments quoted from around the web, each linked to its source. Each one is read as positive, mixed or negative. A ${people.one} review's star rating decides it (4–5 positive, 3 mixed, 1–2 negative); quoted comments are judged when they are moderated, and ones nobody has judged yet don't count. Only reviews from the last ${windowLabel(reviewWindowMonths(list))} count, and a quoted comment is dated by when it was written, not when we quoted it.`}</li>
      <li>{`The order rewards ${w.many} that are both well liked and widely discussed: we count how many more positive reviews a ${w.one} has than an average ${w.one} with the same number of reviews would have. A ${w.one} with 33 positive reviews out of 43 therefore ranks above one with 15 out of 17, which is why the order doesn't always follow the share of positive reviews.`}</li>
      {trait && <li>{`This list only takes ${w.many} where at least ${Math.round(trait.minShare * 100)}% of reviews are positive or mixed and tag it ${quoted(trait.tags)}${trait.against ? `, and fewer reviews tag it ${quoted(trait.against)} than that` : ""}. The order is led by how many positive or mixed reviews use those tags, counted the same way (above the site average for that many reviews); a ${w.one} liked more than average gets a smaller bonus (${TRAIT_LIST_LIKED_WEIGHT === 0.5 ? "half" : `${TRAIT_LIST_LIKED_WEIGHT}×`} of its positive reviews above average), and one liked less loses nothing beyond the ${Math.round(MIN_POSITIVE_SHARE * 100)}% minimum.`}</li>}
      {list.modelYearsBack !== undefined && <li>{`Only ${listYear(list)} models are listed: last season's ${w.many}, kept apart from this year's so each list compares like with like.`}</li>}
      {list.maxAgeYears !== undefined && <li>{list.maxAgeYears === 0
        ? `Only ${currentYear()} models are listed, so last season's ${w.many} don't crowd out this year's.`
        : `Only ${w.many} from the last ${list.maxAgeYears + 1} model years are listed (${currentYear() - list.maxAgeYears} or newer), so older models don't crowd out current ones.`}</li>}
      <li>{`A ${w.one} needs at least ${min} reviews, at least ${Math.round(MIN_POSITIVE_SHARE * 100)}% of them positive (mixed counting as half), to be listed${filters.length ? `, and this list ${filters.join(" and ")}` : ""}. We never pad a list: ${count < 10 ? `only ${count} ${w.many} qualify right now, so that's how many you see.` : `if fewer than 10 ${w.many} qualify, you see fewer.`} A list with fewer than ${MIN_LIST_ENTRIES} isn't shown until more qualify.`}</li>
      <li>{`The line under each ${w.one} is a short summary of what its reviews say, not our own opinion.`}</li>
      <li>{affiliate
        ? `The list re-ranks itself as new reviews are published. There are no sponsored placements or paid rankings. The Amazon links are affiliate links and never change the order.`
        : `The list re-ranks itself as new reviews are published. There are no sponsored placements, affiliate links or paid rankings.`}</li>
    </ul>
  </section>;
}

export default async function TopListPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { data, lists }] = await Promise.all([params, rankedLists()]);
  const found = lists.find(x => x.list.slug === slug);
  if (!found) notFound();
  const { list, entries, reviews, updated } = found;
  const related = lists.filter(l => l !== found).slice(0, 6);
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  const affiliate = amazonLinksOn();
  const amazon = affiliate ? await Promise.all(entries.map(e => amazonButton({ name: e.product.name, brand: brandOf(e.product.brandId) || undefined }))) : [];
  const url = `${base()}${listHref(list.slug)}`;
  const title = listTitle(list, listYear(list), reviews, people.One);
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "ItemList", name: title, url, numberOfItems: entries.length, itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: entries.map(e => ({ "@type": "ListItem", position: e.rank, name: e.product.name, url: `${base()}${productHref(e.product)}` })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Rankings", item: `${base()}${RANKINGS_PATH}` },
      { "@type": "ListItem", position: 2, name: list.label, item: url },
    ] },
  ] };

  const min = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const yearRule = list.modelYearsBack !== undefined ? `${listYear(list)} models only` : list.maxAgeYears === 0 ? `${currentYear()} models only` : list.maxAgeYears !== undefined ? `${currentYear() - list.maxAgeYears} or newer models` : null;
  return <main className="top-page v2">
    {affiliate && <p className="affiliate-note">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you). Keeps the lights on!</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="page-hero">
      <p className="breadcrumb"><a href={RANKINGS_PATH}>Rankings</a> / {list.label}</p>
      {/* A short heading; the full title stays the browser/search title and the ItemList name. */}
      <h1>{`${list.title} `}<span className="swash">{listYear(list)}</span></h1>
      <p>{list.intro}</p>
      {/* The lists as tabs, as in the mockup (the header's chip row is left off on rankings pages). */}
      {lists.length > 1 && <nav className="rank-tabs" aria-label="Rankings">{lists.filter((l, i) => lists.findIndex(x => x.list.slug === l.list.slug) === i).map(l => <a key={l.list.slug} href={listHref(l.list.slug)} aria-current={l.list.slug === list.slug ? "page" : undefined}>{l.list.label}</a>)}</nav>}
      <ul className="hero-facts"><li>{`${reviews.toLocaleString("en-US")} ${people.one} reviews`}</li>{updated && <li>Updated <time dateTime={updated}>{longDate(updated)}</time></li>}<li><a href="#how-we-rank">Methodology explained ↓</a></li></ul>
    </div>
    <div className="catalog-grid">
      <ol className="rank-list">{entries.map((e, i) => <Entry key={e.product.id} e={e} product={byId.get(e.product.id)} brand={brandOf(e.product.brandId)} list={list} amazon={amazon[i] ?? null}/>)}</ol>
      <aside className="filter-panel">
        <section className="how-box">
          <h2>How the ranking works</h2>
          <p>{`${people.One} opinions, not sponsored placements. The order weighs positive reviews alongside how many there are.`}</p>
          <ul>
            {yearRule && <li><CalendarGlyph/>{yearRule}</li>}
            <li><PeopleGlyph/>{`${min}+ reviews to qualify`}</li>
          </ul>
          <a className="more-link" href="#how-we-rank">Full method ↓</a>
          {niche.finder && <a className="find-button" href="/finder">{niche.finder.navLabel}<Arrow/></a>}
        </section>
        {related.length > 0 && <section className="side-lists"><h2>Other lists</h2><ul>{related.map(r => <li key={r.list.slug}><a href={listHref(r.list.slug)}>{r.list.label}<Arrow/></a></li>)}</ul></section>}
      </aside>
    </div>
    <Method list={list} count={entries.length} affiliate={affiliate}/>
  </main>;
}

const glyph = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function CalendarGlyph() { return <svg viewBox="0 0 20 20" aria-hidden="true"><g {...glyph}><rect x="3" y="4.5" width="14" height="12" rx="2"/><path d="M3 8.5h14M7 2.5v4M13 2.5v4"/></g></svg>; }
function PeopleGlyph() { return <svg viewBox="0 0 20 20" aria-hidden="true"><g {...glyph}><circle cx="7.5" cy="7" r="2.8"/><path d="M2.5 16.5c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5"/><circle cx="14" cy="7.5" r="2.2"/><path d="M14 12c1.9 0 3.2 1.2 3.6 3.6"/></g></svg>; }
function ChatGlyph() { return <svg className="cg" viewBox="0 0 20 20" aria-hidden="true"><path {...glyph} d="M3 4.5h14v9H9l-4 3v-3H3z"/></svg>; }
