// Read per request like the other public pages; Vercel's CDN keeps a copy for up to a minute (next.config.ts headers),
// so a list re-ranks itself as soon as new reviews are published.
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche, productHref } from "../../../lib/niche";
import { listTitle, MIN_LIST_REVIEWS, type ListEntry } from "../../../lib/top-lists";
import type { TopList } from "../../../lib/niche/types";
import { ProductIcon, SourceIcon } from "../../icons";
import { tagTone } from "../../../lib/tags";
import { rankedLists, topLists, listHref, longDate, currentYear, type RankedList } from "../lists";

const w = niche.words, people = niche.people;
const find = async (slug: string) => (await rankedLists()).lists.find(x => x.list.slug === slug);
const base = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

function description(r: RankedList) {
  if (!r.entries.length) return `${r.list.intro} Not enough ${people.one} reviews yet to rank any ${w.many}.`;
  const names = r.entries.slice(0, 3).map(e => e.product.name).join(", ");
  return `${r.list.intro} Top ${r.entries.length} from ${r.reviews.toLocaleString("en-US")} first-hand reviews: ${names}…`;
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
// "Bullpadel Vertex 05 2026" under a "Bullpadel" line reads as "Vertex 05 2026", like the rest of the site.
const modelName = (name: string, brand: string) => brand && name.toLowerCase().startsWith(`${brand.toLowerCase()} `) ? name.slice(brand.length + 1) : name;

function Entry({ e, brand }: { e: ListEntry; brand: string }) {
  const href = productHref(e.product.slug);
  const parts = [["positive", e.positive], ["mixed", e.mixed], ["negative", e.negative]] as const;
  const label = parts.filter(([, n]) => n).map(([s, n]) => `${n} ${s}`).join(", ");
  return <li className="top-entry">
    <span className="top-rank" aria-label={`Rank ${e.rank}`}>{e.rank}</span>
    <a className="thumb top-thumb" href={href} aria-hidden="true" tabIndex={-1}><ProductIcon shape={e.product.shape} brand={brand}/></a>
    <div className="top-body">
      <div className="top-head">
        <h2><a className="racket-link" href={href}>{brand && <span className="brand">{brand}</span>}<span className="model">{modelName(e.product.name, brand)}</span></a></h2>
        <span className="top-score" title="Rank score out of 100: see How we rank"><b>{Math.round(e.score * 100)}</b><small>score</small></span>
      </div>
      <div className="top-split">
        <div className="stack" role="img" aria-label={label}>
          {parts.map(([s, n]) => n ? <i key={s} className={`s-${s}`} style={{ width: pct(n, e.reviews) }}/> : null)}
        </div>
        <div className="legend">
          {parts.map(([s, n]) => <span key={s} className={`s-${s}`}>{n} {s}</span>)}
          <span className="top-count">{e.reviews} reviews</span>
        </div>
      </div>
      {(e.pros.length > 0 || e.con) && <div className="tags">
        {e.pros.map(t => <span key={t.label} className={`tag ${tagTone(t.label)}`}>{t.label}<span className="c">{t.count}</span></span>)}
        {e.con && <span className="tag neg">{e.con.label}<span className="c">{e.con.count}</span></span>}
      </div>}
      {e.quote && <figure className="top-quote">
        <blockquote>“{e.quote.text}”</blockquote>
        <figcaption className="cite"><a className="src-link" href={e.quote.url} target="_blank" rel="noopener noreferrer" title={`View the original on ${e.quote.platform}`}>
          <SourceIcon platform={e.quote.platform}/><b>{e.quote.platform}</b>{e.quote.source && e.quote.source !== e.quote.platform && <span>{e.quote.source}</span>}<span className="arr" aria-hidden="true">↗</span>
        </a></figcaption>
      </figure>}
      <a className="top-more" href={href}>{`Read all ${e.reviews} reviews of the ${e.product.name} →`}</a>
    </div>
  </li>;
}

const quoted = (tags: string[]) => tags.map(t => `“${t}”`).join(tags.length > 2 ? ", " : " or ").replace(/, (“[^”]+”)$/, " or $1");

function Method({ list, count }: { list: TopList; count: number }) {
  const weights = Object.entries(list.tagWeights ?? {});
  const rewarded = weights.filter(([, v]) => v > 0).map(([t]) => t), penalised = weights.filter(([, v]) => v < 0).map(([t]) => t);
  const blend = rewarded.length ? Math.round(Math.min(1, Math.max(0, list.tagBlend ?? 0.5)) * 100) : 0;
  const min = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const filters = (list.filters ?? []).flatMap(f => {
    const spec = niche.specs.find(s => s.column === f.column)?.label.toLowerCase() ?? f.column;
    return [f.include && `only includes ${w.many} with a ${f.include.join(" or ").toLowerCase()} ${spec}`, f.exclude && `leaves out ${w.many} with a ${f.exclude.join(" or ").toLowerCase()} ${spec}`].filter(Boolean);
  });
  return <section className="top-method" id="how-we-rank">
    <h2>How we rank</h2>
    <ul>
      <li>{`Two kinds of published review count: ${people.one} reviews on ${niche.site.name} and first-hand comments quoted from around the web, each linked to its source. Each one is read as positive, mixed or negative. A ${people.one} review's star rating decides it (4–5 positive, 3 mixed, 1–2 negative); quoted comments are judged when they are moderated, and ones nobody has judged yet don't count.`}</li>
      <li>{`Mixed reviews count as half positive. To keep a ${w.one} with five glowing reviews from beating one with fifty mostly glowing ones, we use the lower bound of the 95% Wilson confidence interval of that positive share. More reviews, more confidence.`}</li>
      {rewarded.length > 0 && <li>{`For this list, ${100 - blend}% of the score is that confidence figure and ${blend}% is how often reviewers tag the ${w.one} ${quoted(rewarded)}${penalised.length ? `, minus how often they tag it ${quoted(penalised)}` : ""}. A ${w.one} needs at least ${list.minTagged ?? 1} reviews with one of those positive tags.`}</li>}
      <li>{`A ${w.one} needs at least ${min} reviews to be ranked${filters.length ? `, and this list ${filters.join(" and ")}` : ""}. We never pad a list: ${count < 10 ? `only ${count} ${count === 1 ? w.one : w.many} qualify right now, so that's how many you see.` : `if fewer than 10 ${w.many} qualify, you see fewer.`}`}</li>
      <li>{`The score shown is out of 100. The list re-ranks itself as new reviews are published. There are no sponsored placements, affiliate links or paid rankings.`}</li>
    </ul>
  </section>;
}

export default async function TopListPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { data, lists }] = await Promise.all([params, rankedLists()]);
  const found = lists.find(x => x.list.slug === slug);
  if (!found) notFound();
  const { list, entries, reviews, updated } = found;
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  const url = `${base()}${listHref(list.slug)}`;
  const title = listTitle(list, currentYear(), reviews, people.One);
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "ItemList", name: title, url, numberOfItems: entries.length, itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: entries.map(e => ({ "@type": "ListItem", position: e.rank, name: e.product.name, url: `${base()}${productHref(e.product.slug)}` })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Top 10", item: `${base()}/best` },
      { "@type": "ListItem", position: 2, name: list.label, item: url },
    ] },
  ] };

  return <main className="top-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <p className="breadcrumb"><a href="/best">Top 10</a> / {list.label}</p>
    <div className="page-title">
      <h1>{title}</h1>
      <p>{list.intro}</p>
      {updated && <p className="top-updated">Last updated <time dateTime={updated}>{longDate(updated)}</time> · <a href="#how-we-rank">How we rank</a></p>}
    </div>
    <nav className="chips top-tabs" aria-label="Top 10 lists">
      {topLists.map(l => <a key={l.slug} href={listHref(l.slug)} aria-current={l.slug === list.slug ? "page" : undefined}>{l.label}</a>)}
    </nav>
    {entries.length
      ? <ol className="top-list">{entries.map(e => <Entry key={e.product.id} e={e} brand={brandOf(e.product.brandId)}/>)}</ol>
      : <p className="empty-feed">{`No ${w.one} has enough reviews for this list yet. It fills in as reviews are published.`}</p>}
    <Method list={list} count={entries.length}/>
  </main>;
}
