export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche, catalogPath, hasYears, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { catalogKeyword, catalogTitle, catalogDescription, listJsonLd, catalogCrumb } from "../../lib/catalogue-seo";
import { rankedLists, listHref } from "../rankings/lists";
import { catalog, score, topTags } from "../../db/data";
import { matchingRackets } from "../../lib/racket-search";
import { SORTS, parseSort, sortProducts } from "../../lib/product-sort";
import { ProductCard, Directory, parseShow } from "../components";
import { AutoSubmitForm } from "../auto-submit";
import { FinderInvite } from "../finder/invite";

const w = niche.words, shapeSpec = niche.specs.find(s => s.column === "shape");

export async function generateMetadata(): Promise<Metadata> {
  const data = await catalog();
  const top = sortProducts(data.listed.map(r => ({ r, s: score(data, r.id) })), "discussed").slice(0, 3);
  const title = catalogTitle(data.listed.length);
  const description = catalogDescription(data.reviews.length + data.external.length, top.map(({ r }) => displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name)));
  return { title, description, alternates: { canonical: catalogPath }, openGraph: { title, description, url: catalogPath, type: "website" } };
}

export default async function Rackets({ searchParams }: { searchParams: Promise<{ q?: string; brand?: string; year?: string; shape?: string; sort?: string; show?: string }> }) {
  const [data, f, { lists }] = await Promise.all([catalog(), searchParams, rankedLists()]);
  const sort = parseSort(f.sort);
  // ?q= still narrows the list for old links; the header search is where people type names now.
  const results = sortProducts(matchingRackets(data.listed, f.q || "")
    .filter(r => (!f.brand || r.brandId === f.brand) && (!f.year || String(r.year) === f.year) && (!f.shape || r.shape === f.shape))
    .map(r => ({ r, s: score(data, r.id) })), sort);
  const shapes = [...new Set([...niche.shapeFilter, ...data.listed.map(r => r.shape).filter((s): s is string => !!s)])].sort();
  const filtered = !!(f.q || f.brand || f.year || f.shape || f.sort);
  const tags = topTags(data), show = parseShow(f.show);
  const moreHref = (n: number) => { const q = new URLSearchParams(Object.entries({ ...f, show: String(n) }).filter(([, v]) => v) as [string, string][]); return `${catalogPath}?${q}`; };
  const brandName = (id: string) => data.brands.find(b => b.id === id)?.name;
  const jsonLd = listJsonLd([catalogCrumb], results.map(({ r }) => ({ name: displayName(r.name, brandName(r.brandId)), href: productHref(r) })));
  // Yearly lists can share a title with the all-time one; each name shows once.
  const best = lists.filter((l, i) => l.entries.length >= 3 && lists.findIndex(x => x.list.title === l.list.title) === i).slice(0, 4);
  // Brands with the most reviews first: plain links, because Google can't follow the filter dropdowns.
  const brandOf = new Map(data.listed.map(r => [r.id, r.brandId])), brandReviews = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) { const b = brandOf.get(x.racketId); if (b) brandReviews.set(b, (brandReviews.get(b) ?? 0) + 1); }
  const topBrands = data.listedBrands.map(b => ({ b, n: brandReviews.get(b.id) ?? 0 })).sort((a, z) => z.n - a.n).slice(0, 16);
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }}/>
    <div className="page-title"><h1>{catalogKeyword}</h1><p>{`${data.listed.length.toLocaleString("en-US")} ${w.many}, compared by what ${niche.people.many} actually say.`}</p></div>
    {best.length > 0 && <p className="best-links"><span>Top picks:</span>{best.map(l => <a key={l.list.slug} href={listHref(l.list.slug)}>{l.list.title}</a>)}</p>}
    <FinderInvite/>
    <AutoSubmitForm className="pills" action={catalogPath}>
      <label className={f.brand ? "pill on" : "pill"}><span className="sr-only">Brand</span><select name="brand" defaultValue={f.brand || ""}><option value="">All brands</option>{data.listedBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      {hasYears && <label className={f.year ? "pill on" : "pill"}><span className="sr-only">Year</span><select name="year" defaultValue={f.year || ""}><option value="">All years</option>{[...new Set(data.listed.map(r => r.year))].map(y => <option key={y}>{y}</option>)}</select></label>}
      {shapeSpec && <label className={f.shape ? "pill on" : "pill"}><span className="sr-only">{shapeSpec.label}</span><select name="shape" defaultValue={f.shape || ""}><option value="">{`All ${shapeSpec.label.toLowerCase()}s`}</option>{shapes.map(s => <option key={s}>{s}</option>)}</select></label>}
      {f.q && <input type="hidden" name="q" value={f.q}/>}
      {filtered && <a className="pills-clear" href={catalogPath}>Clear</a>}
      <p className="pills-count">{`${results.length} ${results.length === 1 ? w.one : w.many}`}</p>
      <label className="pills-sort">Sort:<select name="sort" defaultValue={sort === "discussed" ? "" : sort}>{SORTS.map(s => <option key={s.value} value={s.value === "discussed" ? "" : s.value}>{s.label}</option>)}</select></label>
      <noscript><button>Filter</button></noscript>
    </AutoSubmitForm>
    <Directory show={show} moreHref={moreHref} rows={results.map(({ r, s }) => <ProductCard key={r.id} racket={r} brand={data.brands.find(b => b.id === r.brandId)?.name} count={s.count} web={s.web} tags={tags.get(r.id)}
      details={[r.shape, niche.rowDetail && r[niche.rowDetail.column] && `${r[niche.rowDetail.column]}${niche.rowDetail.suffix}`].filter(Boolean).join(" · ")}/>)}/>
    {!results.length && <p className="empty-feed">{`No ${w.one} found. Either it’s very new, very obscure, or we need to add it. `}<a href={catalogPath}>Clear filters</a> or <a href="/add-review">add it with a review →</a></p>}
    <nav className="browse" aria-label="Browse">
      {niche.typePages && <div><h2>Browse by type</h2><p>{niche.typePages.map(t => <a key={t.slug} href={`/${t.slug}`}>{t.label}</a>)}</p></div>}
      <div><h2>Browse by brand</h2><p>{topBrands.map(({ b }) => <a key={b.id} href={`/brands/${b.slug}`}>{b.name}</a>)}<a href="/brands">All brands →</a></p></div>
    </nav>
  </main>;
}
