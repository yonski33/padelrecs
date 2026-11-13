// Read per request like the other public pages; Vercel's CDN keeps a copy for up to a minute (next.config.ts headers),
import { isLight } from "../../../lib/look";
import { fitText } from "../../../lib/fit-text";
import { siteOgImages } from "../../site-og";
// so a list re-ranks itself as soon as new reviews are published.
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche, productHref } from "../../../lib/niche";
import { listTitle, MIN_LIST_REVIEWS, MIN_POSITIVE_SHARE, reviewWindowMonths, windowLabel, RANKINGS_PATH, listYear, type ListEntry } from "../../../lib/top-lists";
import type { TopList } from "../../../lib/niche/types";
import { ProductIcon } from "../../icons";
import { lightFont } from "../../light-font";
import { platformName } from "../../../lib/source-label";
import { tagTone } from "../../../lib/tags";
import { displayName } from "../../../lib/brand-name";
import { rankedLists, listHref, longDate, currentYear, type RankedList } from "../lists";
import { listLine } from "../../../lib/list-lines";
import { shortLine } from "../../../lib/short-lines";
import { LightRow, sigTipStyle } from "../../light-row";
import { amazonButton, amazonLinksOn, type AmazonButton } from "../../../lib/amazon-offer";
import { websiteButton } from "../../../lib/product-links";
import { ProductArt, SentimentBar, Arrow, SignalInfo, SignalPop } from "../../visual";
import { score, type Catalog, type Score } from "../../../db/data";
import { type Signal, MIN_SIGNAL_REVIEWS } from "../../../lib/signal";
type Product = Catalog["rackets"][number];

const w = niche.words, people = niche.people;
const find = async (slug: string) => (await rankedLists()).lists.find(x => x.list.slug === slug);
const base = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// About 155 characters so Google shows it whole: who leads, how many reviews, then the list's intro if it fits.
function description(r: RankedList) {
  const [a, b, c] = r.entries.map(e => e.product.name);
  return fitText([`#1 ${a}${b ? `, then ${b}${c ? ` and ${c}` : ""}` : ""}.`, `Ranked from ${r.reviews.toLocaleString("en-US")} first-hand reviews.`, r.list.intro]);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await find((await params).slug);
  if (!found) return { title: { absolute: niche.seo.productNotFound }, robots: { index: false } };
  const title = listTitle(found.list, listYear(found.list), found.reviews, people.One), desc = description(found), url = listHref(found.list.slug);
  return { title: { absolute: title }, description: desc, alternates: { canonical: url }, openGraph: { title, description: desc, url, type: "website", images: siteOgImages } };
}

const pct = (n: number, total: number) => `${n / total * 100}%`;
const withThe = (name: string) => `${/^the /i.test(name) ? "" : "the "}${name}`;

function Entry({ e, sc, product, brand, list, amazon }: { e: ListEntry & { signal: Signal | null }; sc: Score; product: Product | undefined; brand: string; list: TopList; amazon: AmazonButton | null }) {
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
        ? <a className="rrow-buy button" href={amazon.url} target="_blank" rel="sponsored nofollow noopener">Check price on Amazon</a>
        : site && <a className="rrow-buy button" href={site.url} target="_blank" rel={site.affiliate ? "sponsored nofollow noopener" : "noopener"}>{site.label}</a>}
    </div>
    {/* The same row as the catalogue (owner, 2026-11-12): the split with its legend, then the count the order rests on. */}
    <div className="rrow-split"><SentimentBar positive={sc.positive} mixed={sc.mixed} negative={sc.negative} legend className="stacked"/></div>
    <a className="rrow-score" href={href}>
      {/* The signal score (owner, 2026-11-12): what the order follows, so the numbers always run high to low. */}
      {e.signal ? <span className="rrow-pos rrow-signal"><b>{e.signal.signal}</b><span>signal</span></span> : <span className="rrow-pos"><span>No signal yet</span></span>}
      {/* The count the score rests on (owner, 2026-11-12, UX audit). */}
      <span className="rrow-n">{`${sc.judged.toLocaleString("en-US")} ${sc.judged === 1 ? "review" : "reviews"}`}</span>
    </a>
  </li>;
}

const quoted = (tags: string[]) => tags.map(t => `“${t}”`).join(tags.length > 2 ? ", " : " or ").replace(/, (“[^”]+”)$/, " or $1");

/* FAQ at the bottom of each ranking (owner, 2026-11-12): it replaces the long "How we rank" block, with a short
   version of the method as answers, and is marked up as FAQPage for search. Every answer comes from the list's data. */
function rankingFaq(list: TopList, entries: ListEntry[], affiliate: boolean, nameOf: (e: ListEntry) => string, brandName: (e: ListEntry) => string, data: Catalog, updated?: string): { q: string; a: string }[] {
  const min = Math.max(MIN_LIST_REVIEWS, list.minReviews ?? MIN_LIST_REVIEWS);
  const year = listYear(list);
  const filters = (list.filters ?? []).flatMap(f => {
    const spec = niche.specs.find(s => s.column === f.column)?.label.toLowerCase() ?? f.column;
    return [f.include && `only includes ${w.many} with a ${f.include.join(" or ").toLowerCase()} ${spec}`, f.exclude && `leaves out ${w.many} with a ${f.exclude.join(" or ").toLowerCase()} ${spec}`].filter(Boolean);
  });
  const yearRule = list.modelYearsBack !== undefined ? `Only ${year} models are listed.`
    : list.maxAgeYears === 0 ? `Only ${currentYear()} models are listed.`
    : list.maxAgeYears !== undefined ? `Only ${currentYear() - list.maxAgeYears} or newer models are listed.` : "";
  const faq: { q: string; a: string }[] = [];
  // Not readable off the rows (owner, 2026-11-12): what reviews say across the whole list, and which brands lead it.
  const ids = new Set(entries.map(e => e.product.id));
  const counts = new Map<string, Map<string, number>>();
  for (const x of [...data.reviews, ...data.external]) if (ids.has(x.racketId)) for (const t of x.tags ?? []) {
    const m = counts.get(t) ?? new Map<string, number>(); counts.set(t, m); m.set(x.racketId, (m.get(x.racketId) ?? 0) + 1);
  }
  const total = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
  const top = (tone: string) => [...counts].filter(([t, m]) => tagTone(t) === tone && total(m) >= 3).sort((x, y) => total(y[1]) - total(x[1]) || x[0].localeCompare(y[0])).slice(0, 3);
  const said = (tags: [string, Map<string, number>][]) => tags.map(([t, m]) => `“${t}” (${total(m)} reviews)`).join(tags.length > 2 ? ", " : " and ").replace(/, ([^,]+)$/, " and $1");
  const byId = new Map(entries.map(e => [e.product.id, e]));
  const most = (m: Map<string, number>) => byId.get([...m].sort((x, y) => y[1] - x[1])[0][0])!;
  const loved = top("pos"), complaints = top("neg");
  if (loved.length) faq.push({ q: `What do ${people.many} like most about these ${w.many}?`, a:
    `Across the ${entries.length} ${w.many} on this list, the praise mentioned most is ${said(loved)}. ${nameOf(most(loved[0][1]))} gets the most “${loved[0][0]}” mentions.` });
  if (complaints.length) faq.push({ q: `What are the most common complaints about these ${w.many}?`, a:
    `The complaints that come up most are ${said(complaints)}. “${complaints[0][0]}” is mentioned most for ${nameOf(most(complaints[0][1]))}.` });
  const brands = new Map<string, ListEntry[]>();
  for (const e of entries) { const b = brandName(e); if (b) brands.set(b, [...(brands.get(b) ?? []), e]); }
  const lead = [...brands].sort((x, y) => y[1].length - x[1].length)[0];
  if (lead && lead[1].length >= 2 && [...brands.values()].filter(v => v.length === lead[1].length).length === 1) faq.push({ q: `Which brand has the most ${w.many} on this list?`, a:
    `${lead[0]}, with ${lead[1].length} of the ${entries.length}: ${lead[1].map(e => `${nameOf(e)} (#${e.rank})`).join(", ").replace(/, ([^,]+)$/, " and $1")}.` });
  faq.push({ q: `How is this ranking made?`, a:
    `It's counted from published reviews: ${people.one} reviews on ${niche.site.name} and first-hand comments quoted from around the web. Each is read as positive, mixed or negative, and only reviews from the last ${windowLabel(reviewWindowMonths(list))} count. The order follows each ${w.one}'s signal score, which rewards ${w.many} that are both well liked and widely discussed.` });
  faq.push({ q: `What is the signal score?`, a: `A score out of 100 for how well reviewed a ${w.one} is. Negative and mixed reviews take points off, and so does having only a few reviews, so a ${w.one} many people like ranks above one a handful love. It needs at least ${MIN_SIGNAL_REVIEWS} reviews and moves as new reviews come in.` });
  faq.push({ q: `What does a ${w.one} need to make this list?`, a: [
    `At least ${min} reviews, with at least ${Math.round(MIN_POSITIVE_SHARE * 100)}% of them positive (mixed counts as half).`,
    list.trait ? `It also needs reviews that tag it ${quoted(list.trait.tags)}.` : "",
    filters.length ? `This list ${filters.join(" and ")}.` : "", yearRule,
    entries.length < 10 ? `Only ${entries.length} ${w.many} qualify right now, so the list isn't padded to 10.` : "",
  ].filter(Boolean).join(" ") });
  faq.push({ q: `Are these rankings sponsored?`, a: affiliate
    ? `No. There are no sponsored placements or paid rankings. The Amazon links are affiliate links and never change the order.`
    : `No. There are no sponsored placements, affiliate links or paid rankings.` });
  faq.push({ q: `How often is this list updated?`, a: `It re-ranks itself whenever new reviews are published${updated ? `; the latest change was on ${longDate(updated)}` : ""}.` });
  return faq;
}

export default async function TopListPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ look?: string }> }) {
  const [{ slug }, { data, lists }, query] = await Promise.all([params, rankedLists(), searchParams]);
  const found = lists.find(x => x.list.slug === slug);
  if (!found) notFound();
  const { list, entries, reviews, updated } = found;
  const related = lists.filter(l => l !== found).slice(0, 6);
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name ?? "";
  const affiliate = amazonLinksOn();
  const amazon = affiliate ? await Promise.all(entries.map(e => amazonButton({ name: e.product.name, brand: brandOf(e.product.brandId) || undefined }))) : [];
  const url = `${base()}${listHref(list.slug)}`;
  const title = listTitle(list, listYear(list), reviews, people.One);
  const faq = rankingFaq(list, entries, affiliate, e => displayName(e.product.name, brandOf(e.product.brandId)), e => brandOf(e.product.brandId), data, updated);
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "FAQPage", mainEntity: faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
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
  if (isLight(query.look)) return <LightRanking {...{ data, lists, found, entries, reviews, updated, amazon, affiliate, faq, jsonLd, byId, brandOf }}/>;
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
      <ul className="hero-facts"><li>{`${reviews.toLocaleString("en-US")} ${people.one} reviews`}</li>{updated && <li>Updated <time dateTime={updated}>{longDate(updated)}</time></li>}<li><a href="#how-we-rank">How we rank ↓</a></li><li className="hero-sig">Signal score <SignalInfo/></li></ul>
    </div>
    <div className="catalog-grid">
      <ol className="rank-list">{entries.map((e, i) => <Entry key={e.product.id} e={e} sc={score(data, e.product.id)} product={byId.get(e.product.id)} brand={brandOf(e.product.brandId)} list={list} amazon={amazon[i] ?? null}/>)}</ol>
      <aside className="filter-panel">
        <section className="how-box">
          <h2>How the ranking works</h2>
          <p>{`${people.One} opinions, not sponsored placements. The order follows the signal score: positive reviews weighed with how many there are.`}</p>
          <ul>
            {yearRule && <li><CalendarGlyph/>{yearRule}</li>}
            <li><PeopleGlyph/>{`${min}+ reviews to qualify`}</li>
          </ul>
          <a className="more-link" href="#how-we-rank">More on the method ↓</a>
          {niche.finder && <a className="find-button" href="/finder">{niche.finder.navLabel}<Arrow/></a>}
        </section>
        {related.length > 0 && <section className="side-lists"><h2>Other lists</h2><ul>{related.map(r => <li key={r.list.slug}><a href={listHref(r.list.slug)}>{r.list.label}<Arrow/></a></li>)}</ul></section>}
      </aside>
    </div>
    <section className="faq top-faq" id="how-we-rank">
      <h2>{`${list.title}: common questions`}</h2>
      {faq.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
    </section>
  </main>;
}

const glyph = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function CalendarGlyph() { return <svg viewBox="0 0 20 20" aria-hidden="true"><g {...glyph}><rect x="3" y="4.5" width="14" height="12" rx="2"/><path d="M3 8.5h14M7 2.5v4M13 2.5v4"/></g></svg>; }
function PeopleGlyph() { return <svg viewBox="0 0 20 20" aria-hidden="true"><g {...glyph}><circle cx="7.5" cy="7" r="2.8"/><path d="M2.5 16.5c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5"/><circle cx="14" cy="7.5" r="2.2"/><path d="M14 12c1.9 0 3.2 1.2 3.6 3.6"/></g></svg>; }

/** "Best Face Serums" reads as "Best face serums"; words in capitals (SPF, AT10) stay as they are. */
const sentenceCase = (t: string) => t.split(" ").map((x, i) => i === 0 || /^[A-Z0-9]{2,}$/.test(x) || /\d/.test(x) ? x : x.toLowerCase()).join(" ");

/** The light direction's ranking page (owner's mockup, 2026-11-12), the default since 2026-11-12 (?look=classic shows the old page): the claim in the title
 *  ("according to real users"), one line of facts, the list as calm rows with the shop button at the right, and a short
 *  "How this ranking works" beside it. The FAQ stays below for search. */
function LightRanking({ data, lists, found, entries, reviews, updated, amazon, affiliate, faq, jsonLd, byId, brandOf }: {
  data: Catalog; lists: RankedList[]; found: RankedList; entries: RankedList["entries"]; reviews: number; updated?: string; amazon: (AmazonButton | null)[]; affiliate: boolean;
  faq: { q: string; a: string }[]; jsonLd: object; byId: Map<string, Product>; brandOf: (id: string) => string }) {
  const { list } = found;
  const ids = new Set(entries.map(e => e.product.id));
  // Where the opinions come from, as the owner says it (2026-11-12): Reddit, YouTube and blogs, plus reviews written here.
  const order = ["Reddit", "YouTube", "Blog"];
  const platforms = [...new Set(data.external.filter(e => ids.has(e.racketId)).map(e => platformName(e.sourcePlatform)))].filter(p => order.includes(p)).sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(p => p === "Blog" ? "blogs" : p);
  const sources = [...platforms, niche.site.name].join(", ").replace(/, ([^,]+)$/, " and $1");
  const others = lists.filter((l, i) => l !== found && lists.findIndex(x => x.list.slug === l.list.slug) === i);
  const lightHref = (x: { slug: string }) => `${productHref(x)}`;
  return <main className={`top-page v2 lt-page lr ${lightFont.className}`}>
    {affiliate && <p className="affiliate-note compact">Quick note: Some links are affiliate links. We earn a tiny commission if you buy (at no cost to you).</p>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <p className="crumbs"><a href={RANKINGS_PATH}>Rankings</a><span>/</span>{list.label}</p>
    <header className="lr-hero">
      <h1>{`${sentenceCase(list.title)}, according to `}<em>{`real ${people.many}`}</em></h1>
      {/* One line of facts (owner, 2026-11-12: less meta under the title). */}
      <p className="lr-sub">{`${entries.length} ${entries.length === 1 ? w.one : w.many} ranked from ${reviews.toLocaleString("en-US")} reviews of the last ${windowLabel(reviewWindowMonths(list))} on ${sources}${updated ? ` · updated ${new Date(updated).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`}</p>
      {/* "How we rank" leads the row of other rankings (owner, 2026-11-12), so the list starts right under it. */}
      <nav className="lr-others" aria-label="More rankings"><SignalPop label="How we rank"/><a href={RANKINGS_PATH}>All rankings</a>{others.slice(0, 5).map(l => <a key={l.list.slug} href={`${listHref(l.list.slug)}`}>{l.list.label}</a>)}</nav>
    </header>
    <div className="lr-grid">
      <section aria-label={`${list.title}, ranked`}>
        {/* The home page's row (owner, 2026-11-13), without the category line: the list is one category already. */}
        <ol className="lr-list lt-list" style={sigTipStyle}>{entries.map((e, i) => { const brand = brandOf(e.product.brandId), product = byId.get(e.product.id);
          if (!product) return null;
          const a = amazon[i], site = websiteButton({ websiteUrl: e.product.websiteUrl ?? null, affiliateUrl: e.product.affiliateUrl ?? null });
          const shop = a ? { url: a.url, label: "Check price on Amazon", short: "Check Amazon price", rel: "sponsored nofollow noopener" }
            : site ? { url: site.url, label: site.label, short: site.label, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener" } : null;
          return <li key={e.product.id} className={`lt-slot${e.rank <= 3 ? ` lt-top lt-top${e.rank}` : ""}${i === 0 ? " lt-first" : ""}`}>
            <LightRow data={data} r={product} rank={e.rank} signal={e.signal?.signal} line={shortLine(e.product) ?? listLine(e.product)} shop={shop} shape={false}
              extra={list.trait ? <span className="lt-trait">{`${e.traitReviews} mention ${list.trait.noun}`}</span> : undefined}/>
          </li>; })}</ol>
      </section>
      <aside className="lr-aside">
        <section className="lr-box">
          <h2>How this ranking works</h2>
          <p>{`We collect first-hand ${people.one} reviews, read each as positive, mixed or negative, and rank by the signal: positive reviews weighed by how many there are. No sponsored placements.`}</p>
        </section>
        {others.length > 0 && <section className="lr-box lr-more"><h2>More rankings</h2><ul>{others.slice(0, 8).map(l => <li key={l.list.slug}><a href={`${listHref(l.list.slug)}`}>{l.list.label}<span aria-hidden="true">→</span></a></li>)}</ul></section>}
        {niche.finder && <a className="lr-box lr-finder" href="/finder"><b>{niche.finder.navLabel}</b><span>{niche.finder.invite}</span></a>}
      </aside>
    </div>
    <section className="faq top-faq" id="how-we-rank">
      <h2>{`${sentenceCase(list.title)}: common questions`}</h2>
      {faq.map(f => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
    </section>
  </main>;
}
