export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche, catalogPath, catalogLabel, hasYears } from "../../lib/niche";
import { catalog, score, topTags } from "../../db/data";
import { matchingRackets } from "../../lib/racket-search";
import { SORTS, parseSort, sortProducts } from "../../lib/product-sort";
import { ProductCard, Directory, parseShow } from "../components";
import { AutoSubmitForm } from "../auto-submit";

const w = niche.words, shapeSpec = niche.specs.find(s => s.column === "shape");
export const metadata: Metadata = { ...niche.seo.catalog, alternates: { canonical: catalogPath } };

export default async function Rackets({ searchParams }: { searchParams: Promise<{ q?: string; brand?: string; year?: string; shape?: string; sort?: string; show?: string }> }) {
  const [data, f] = await Promise.all([catalog(), searchParams]);
  const sort = parseSort(f.sort);
  // ?q= still narrows the list for old links; the header search is where people type names now.
  const results = sortProducts(matchingRackets(data.listed, f.q || "")
    .filter(r => (!f.brand || r.brandId === f.brand) && (!f.year || String(r.year) === f.year) && (!f.shape || r.shape === f.shape))
    .map(r => ({ r, s: score(data, r.id) })), sort);
  const shapes = [...new Set([...niche.shapeFilter, ...data.listed.map(r => r.shape).filter((s): s is string => !!s)])].sort();
  const filtered = !!(f.q || f.brand || f.year || f.shape || f.sort);
  const tags = topTags(data), show = parseShow(f.show);
  const moreHref = (n: number) => { const q = new URLSearchParams(Object.entries({ ...f, show: String(n) }).filter(([, v]) => v) as [string, string][]); return `${catalogPath}?${q}`; };
  return <main>
    <div className="page-title"><h1>{catalogLabel}</h1><p>{`Find a ${w.one}. Read what ${niche.people.many} think.`}</p></div>
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
  </main>;
}
