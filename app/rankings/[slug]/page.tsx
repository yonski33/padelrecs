// Read per request like the other public pages; Vercel's CDN keeps a copy for up to a minute (next.config.ts headers),
// so a list re-ranks itself as soon as new reviews are published.
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche, productHref } from "../../../lib/niche";
import { listTitle, MIN_LIST_REVIEWS, MIN_POSITIVE_SHARE, reviewWindowMonths, windowLabel, TRAIT_LIST_LIKED_WEIGHT, RANKINGS_PATH, type ListEntry } from "../../../lib/top-lists";
import type { TopList } from "../../../lib/niche/types";
import { ProductIcon, SourceIcon } from "../../icons";
import { tagTone } from "../../../lib/tags";
import { rankedLists, listHref, longDate, currentYear, modelName, type RankedList } from "../lists";
import { amazonButton, amazonLinksOn, type AmazonButton } from "../../../lib/amazon-offer";

const w = niche.words, people = niche.people;
const find = async (slug: string) => (await rankedLists()).lists.find(x => x.list.slug === slug);
const base = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

function description(r: RankedList) {
  if (!r.entries.length) return `${r.list.intro} Not enough ${people.one} reviews yet to rank any ${w.many}.`;
  const names = r.entries.slice(0, 3).map(e => e.product.name).join(", ");
  return `${r.list.intro} Ranked from ${r.reviews.toLocaleString("en-US")} first-hand reviews: ${names}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await find((await params).slug);
  if (!found) return { title: { absolute: niche.seo.productNotFound }, robots: { index: false } };
  const title = listTitle(found.list, currentYear(), found.reviews, people.One), desc = description(found), url = listHref(found.list.slug);
  // An empty list has nothing worth indexing yet.
  return { title: { absolute: title }, description: desc, alternates: { canonical: url }, openGraph: { title, description: desc, url, type: "website" },
    ...(found.entries.length ? {} : { robots: { index: false } }) };
}

const pct = (n: number, total: number) => `${n / total * 100}%`;

function Entry({ e, brand, list, amazon }: { e: ListEntry; brand: string; list: TopList; amazon: AmazonButton | null }) {
  const href = productHref(e.product);
  const parts = [["positive", e.positive], ["mixed", e.mixed], ["negative", e.negative]] as const;
  const label = parts.filter(([, n]) => n).map(([s, n]) => `${n} ${s}`).join(", ");
  return <li className="top-entry">
    <span className="top-rank" aria-label={`Rank ${e.rank}`}>{e.rank}</span>
    <a className="thumb top-thumb" href={href} aria-hidden="true" tabIndex={-1}><ProductIcon shape={e.product.shape} brand={brand}/></a>
    <div className="top-body">
      <div className="top-head">
        <h2><a className="racket-link" href={href}>{brand && <span className="brand">{brand}</span>}<span className="model">{modelName(e.product.name, brand)}</span></a></h2>
      </div>
      {/* Niches with Amazon links: a quiet text link under the name, the same Amazon page as the product page's button. */}
      {amazon && <a className="top-amazon" href={amazon.url} target="_blank" rel="sponsored nofollow noopener">Check price on Amazon<span aria-hidden="true"> ↗</span></a>}
      <div className="top-split">
        <div className="stack" role="img" aria-label={label}>
          {parts.map(([s, n]) => n ? <i key={s} className={`s-${s}`} style={{ width: pct(n, e.reviews) }}/> : null)}
        </div>
        <div className="legend">
          {parts.map(([s, n]) => <span key={s} className={`s-${s}`}>{n} {s}</span>)}
          <span className="top-count">{e.reviews} reviews</span>
        </div>
        {list.trait && <p className="top-trait">{`${e.traitReviews} of ${e.reviews} reviews mention ${list.trait.noun}`}</p>}
      </div>
      {(e.pros.length > 0 || e.con) && <div className="tags">
        {e.pros.map(t => <span key={t.label} className={`tag ${tagTone(t.label)}`}>{t.label}<span className="c">{t.count}</span></span>)}
        {e.con && <span className="tag neg">{e.con.label}<span className="c">{e.con.count}</span></span>}
      </div>}
      {e.quote && <figure className="top-quote">
        <blockquote>“{e.quote.text}”{e.quote.translatedFrom && <span className="translated-note"> (translated from {e.quote.translatedFrom})</span>}</blockquote>
        <figcaption className="cite"><a className="src-link" href={e.quote.url} target="_blank" rel="noopener noreferrer" title={`View the original on ${e.quote.platform}`}>
          <SourceIcon platform={e.quote.platform}/><b>{e.quote.platform}</b>{e.quote.source && e.quote.source !== e.quote.platform && <span>{e.quote.source}</span>}<span className="arr" aria-hidden="true">↗</span>
        </a></figcaption>
      </figure>}
      <a className="top-more" href={href}>{`Read all ${e.reviews} reviews of the ${e.product.name} →`}</a>
    </div>
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
      {list.maxAgeYears !== undefined && <li>{`Only ${w.many} from the last ${list.maxAgeYears + 1} model years are listed (${currentYear() - list.maxAgeYears} or newer), so older models don't crowd out current ones.`}</li>}
      <li>{`A ${w.one} needs at least ${min} reviews, at least ${Math.round(MIN_POSITIVE_SHARE * 100)}% of them positive (mixed counting as half), to be listed${filters.length ? `, and this list ${filters.join(" and ")}` : ""}. We never pad a list: ${count < 10 ? `only ${count} ${count === 1 ? w.one : w.many} qualify right now, so that's how many you see.` : `if fewer than 10 ${w.many} qualify, you see fewer.`}`}</li>
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
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  const affiliate = amazonLinksOn();
  const amazon = affiliate ? await Promise.all(entries.map(e => amazonButton({ name: e.product.name, brand: brandOf(e.product.brandId) || undefined }))) : [];
  const url = `${base()}${listHref(list.slug)}`;
  const title = listTitle(list, currentYear(), reviews, people.One);
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "ItemList", name: title, url, numberOfItems: entries.length, itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: entries.map(e => ({ "@type": "ListItem", position: e.rank, name: e.product.name, url: `${base()}${productHref(e.product)}` })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Rankings", item: `${base()}${RANKINGS_PATH}` },
      { "@type": "ListItem", position: 2, name: list.label, item: url },
    ] },
  ] };

  return <main className="top-page">
    {affiliate && entries.length > 0 && <p className="affiliate-note">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you). Keeps the lights on!</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <p className="breadcrumb"><a href={RANKINGS_PATH}>Rankings</a> / {list.label}</p>
    <div className="page-title">
      <h1>{title}</h1>
      <p>{list.intro}</p>
      {updated && <p className="top-updated">Last updated <time dateTime={updated}>{longDate(updated)}</time> · <a href="#how-we-rank">How we rank</a></p>}
    </div>
    {entries.length
      ? <ol className="top-list">{entries.map((e, i) => <Entry key={e.product.id} e={e} brand={brandOf(e.product.brandId)} list={list} amazon={amazon[i] ?? null}/>)}</ol>
      : <p className="empty-feed">{`No ${w.one} has enough reviews for this list yet. It fills in as reviews are published.`}</p>}
    <Method list={list} count={entries.length} affiliate={affiliate}/>
  </main>;
}
