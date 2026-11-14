// The light direction's catalogue (owner's mockup, 2026-11-12), the default since 2026-11-12 (?look=classic shows the old page): a title with the live counts,
// one big search, the categories as tabs with counts, a "Narrow it down" rail of checkboxes (what people mention, the
// niche's fixed-value specs, brand), and the list as calm rows with the signal and a compare box. Every number is counted
// from published reviews; nothing here needs JavaScript except the compare tray and the auto-submitting filters.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche, catalogPath, hasYears, productHref } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { matchingRackets } from "../lib/racket-search";
import { SORTS, DEFAULT_SORT, parseSort, sortProducts, firstReviewed } from "../lib/product-sort";
import { catalogKeyword } from "../lib/catalogue-seo";
import { listLine } from "../lib/list-lines";
import { shortLine } from "../lib/short-lines";
import { LightRow, quickAmazon, sigTipStyle } from "./light-row";
import type { Signal } from "../lib/signal";
import type { SpecColumn } from "../lib/niche/types";
import { Directory, parseShow } from "./components";
import { AutoSubmitForm } from "./auto-submit";
import { CatRadios, type CatChoice } from "./cat-radios";
import { ProductArt, SignalPop } from "./visual";
import { CompareCheck, CompareTray } from "./compare/compare-pick";
import { lightFont } from "./light-font";
import { shapeChoices, specFacets, specIs, tagCounts, consensus } from "./home-catalog";

const w = niche.words, fmt = (n: number) => n.toLocaleString("en-US");
const cap = (t: string) => t ? t[0].toUpperCase() + t.slice(1) : t;
type Product = Catalog["listed"][number];
export type LightCatalogFilters = { q?: string; brand?: string; year?: string; shape?: string; sort?: string; show?: string; tag?: string[] } & { specs?: Partial<Record<SpecColumn, string[]>> };

/** The light catalogue's filters from the address: single values, and lists for the checkbox groups. */
export function lightFilters(raw: Record<string, string | string[] | undefined>): LightCatalogFilters {
  const one = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v, all = (v: string | string[] | undefined) => v === undefined ? [] : Array.isArray(v) ? v : [v];
  return { q: one(raw.q), brand: one(raw.brand), year: one(raw.year), shape: one(raw.shape), sort: one(raw.sort), show: one(raw.show), tag: all(raw.tag),
    specs: Object.fromEntries(niche.specs.filter(s => s.column !== "shape").map(s => [s.column, all(raw[s.column])])) };
}

/** "Known for" a tag: at least KNOWN_MIN reviews say it, and KNOWN_SHARE of all of the product's reviews. */
const KNOWN_MIN = 3, KNOWN_SHARE = 0.08;

/** basePath and fixed let a category page (/serums) or a brand page reuse it: that category or brand is set and can't be
 *  cleared from the rail, and the page has its own title. */
export function LightCatalog({ data, f, signals, basePath = catalogPath, fixed = {}, title, crumbs }: { data: Catalog; f: LightCatalogFilters; signals: Map<string, Signal>;
  basePath?: string; fixed?: { shape?: string; brand?: string }; title?: React.ReactNode; crumbs?: React.ReactNode }) {
  f = { ...f, shape: fixed.shape ?? f.shape, brand: fixed.brand ?? f.brand };
  const shapes = shapeChoices(), shape = shapes.find(c => c.key.toLowerCase() === (f.shape ?? "").toLowerCase()), tc = tagCounts(data);
  // A list mixing different kinds of product (all of SkinRecs, or one brand) opens most discussed first: signal scores only
  // compare within a category (owner, 2026-11-13). A category opens on the signal order; "Top rated" stays one click away.
  const mixed = (niche.typePages?.length ?? 0) > 1 && !shape;
  // The signal score shows only where every product is the same kind (owner, 2026-11-13): hidden in these mixed views.
  const defaultSort = mixed ? "discussed" : DEFAULT_SORT, sort = f.sort ? parseSort(f.sort) : defaultSort;
  const totals = new Map(data.listed.map(r => { const s = score(data, r.id); return [r.id, s.count + s.web] as const; }));
  const known = (r: Product, t: string) => { const n = tc.get(r.id)?.get(t) ?? 0; return n >= KNOWN_MIN && n >= KNOWN_SHARE * (totals.get(r.id) ?? 0); };
  const tags = (f.tag ?? []).filter(t => niche.tags.some(x => x.label === t));
  const inShape = (r: Product, c = shape) => !c || c.shapes.some(s => s.toLowerCase() === (r.shape ?? "").toLowerCase());
  const specOk = (r: Product) => specFacets.every(sp => { const want = (f.specs?.[sp.column]) ?? []; return !want.length || want.some(o => specIs((r as Record<string, unknown>)[sp.column], o)); });
  const base = matchingRackets(data.listed, f.q || "").filter(r => (!f.brand || r.brandId === f.brand) && (!f.year || String(r.year) === f.year) && specOk(r) && tags.every(t => known(r, t)));
  const first = firstReviewed(data);
  const results = sortProducts(base.filter(r => inShape(r)).map(r => ({ r, s: score(data, r.id) })), sort, x => { const g = signals.get(x.r.id); return g && g.signal * 10_000 - g.rank; }, x => [hasYears ? x.r.year : 0, first.get(x.r.id) ?? 0]);

  // Links keep the other filters; the look stays light while this is a preview.
  const params = (extra: Record<string, string | string[] | undefined>, path = basePath) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: f.q, brand: fixed.brand ? undefined : f.brand, year: f.year, shape: fixed.shape ? undefined : f.shape, sort: f.sort, tag: tags, ...Object.fromEntries(specFacets.map(s => [s.column, f.specs?.[s.column]])), ...extra }))
      for (const x of Array.isArray(v) ? v : v ? [v] : []) q.append(k, x);
    return q.size ? `${path}?${q}` : path;
  };
  // On niches with category pages (SkinRecs /serums) the tabs go to those pages; elsewhere they filter in place.
  const typeOf = (c: { shapes: string[] }) => niche.typePages?.find(t => c.shapes.some(s => s.toLowerCase() === t.shape.toLowerCase()));
  const catHref = (c?: { key: string; shapes: string[] }) => {
    const tp = c && typeOf(c);
    if (niche.typePages?.length && !fixed.brand) return tp ? params({ shape: undefined }, `/${tp.slug}`) : params({ shape: undefined }, catalogPath);
    return params({ shape: c?.key });
  };
  const plural = (c: { key: string; label: string; shapes: string[] }) => niche.typePages?.find(t => c.shapes.some(s => s.toLowerCase() === t.shape.toLowerCase()))?.label ?? c.label;
  const cats = shapes.map(c => ({ key: c.key, shapes: c.shapes, label: plural(c), n: base.filter(r => inShape(r, c)).length })).filter(c => c.n > 0 || c.key === shape?.key);
  const shown = cats.slice(0, 5), more = cats.slice(5);
  // The rail's "What people mention": the liked and descriptive tags the most products are known for, with counts.
  const mention = niche.tags.filter(t => t.tone !== "neg").map(t => ({ t: t.label, n: base.filter(r => inShape(r) && known(r, t.label)).length }))
    .filter(x => x.n > 0 || tags.includes(x.t)).sort((a, b) => b.n - a.n).slice(0, 8);
  const refined = !!(f.q || (f.brand && !fixed.brand) || f.year || tags.length || specFacets.some(s => (f.specs?.[s.column])?.length));
  // The live counts are for what the page covers: the whole catalogue, a category or a brand.
  const scope = data.listed.filter(r => (!fixed.brand || r.brandId === fixed.brand) && (!fixed.shape || inShape(r)));
  const scopeReviews = scope.reduce((n, r) => n + (totals.get(r.id) ?? 0), 0);
  const words = catalogKeyword.toLowerCase().split(" "), last = words.pop();

  // After the owner's mockup (2026-11-13): a "Filters" rail (category, what people mention, the niche's specs, brand),
  // and over the list the title, one line of counts, the search, Compare and Sort, and how the order works.
  const hidden = (keep: Record<string, string | undefined>, withTags = true) => <>
    {Object.entries(keep).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v as string}/>)}
    {withTags && tags.map(t => <input key={`t${t}`} type="hidden" name="tag" value={t}/>)}
    {withTags && specFacets.flatMap(sp => (f.specs?.[sp.column] ?? []).map(o => <input key={sp.column + o} type="hidden" name={sp.column} value={o}/>))}
  </>;
  const clearAll = params({ q: undefined, brand: undefined, year: undefined, tag: undefined, shape: undefined, ...Object.fromEntries(specFacets.map(s => [s.column, undefined])) }, niche.typePages?.length && !fixed.brand ? catalogPath : basePath);
  const mentionShown = mention.slice(0, 5), mentionMore = mention.slice(5);
  const check = (m: { t: string; n: number }) => <label key={m.t} className="lc-check"><input type="checkbox" name="tag" value={m.t} defaultChecked={tags.includes(m.t)}/><span>{cap(m.t)}</span><small>{fmt(m.n)}</small></label>;
  const choice = (c: (typeof cats)[number]): CatChoice => ({ key: c.key, href: catHref(c), label: c.label, n: fmt(c.n), current: shape?.key === c.key });
  const group = (label: string, body: React.ReactNode) => <details className="lc-group" open><summary>{label}<span className="lc-chev" aria-hidden="true"/></summary><div className="lc-group-body">{body}</div></details>;

  return <main className={`catalog v2 lt-page lc lcx ${lightFont.className}`}>
    <p className="crumbs">{crumbs ?? <><a href="/">Home</a><span>/</span>{niche.navLabel ?? w.Many}</>}</p>
    <div className="lc-grid">
      <aside className="lc-rail filter-panel">
        <input type="checkbox" id="filters-open" className="filters-toggle"/>
        <label htmlFor="filters-open" className="filters-button">{`Filters${refined || shape ? " (on)" : ""}`}<span aria-hidden="true"> ⌄</span></label>
        <div className="filters lc-form">
          <div className="lc-rail-head"><h2>Filters</h2>{(refined || (shape && !fixed.shape)) && <a href={clearAll}>Clear all</a>}</div>
          {cats.length > 1 && group("Category", <CatRadios label={`${w.One} categories`}
            head={[{ key: "", href: catHref(), label: `All ${w.many}`, n: fmt(base.length), current: !shape }, ...cats.slice(0, 5).map(choice)]}
            more={cats.slice(5).map(choice)}/>)}
          <AutoSubmitForm className="lc-form-inner" action={basePath}>
            {hidden({ q: f.q, shape: fixed.shape ? undefined : f.shape, sort: f.sort }, false)}
            {mention.length > 0 && group("What people mention", <>{mentionShown.map(check)}
              {mentionMore.length > 0 && <details className="lc-showmore"><summary>Show more <span aria-hidden="true">›</span></summary>{mentionMore.map(check)}</details>}</>)}
            {specFacets.map(sp => { const opts = sp.options!.filter(o => data.listed.some(r => specIs((r as Record<string, unknown>)[sp.column], o))); return opts.length > 1 && <div key={sp.column}>{group(sp.label,
              opts.map(o => <label key={o} className="lc-check"><input type="checkbox" name={sp.column} value={o} defaultChecked={((f.specs?.[sp.column]) ?? []).includes(o)}/><span>{o}</span></label>))}</div>; })}
            {!fixed.brand && group("Brand", <select name="brand" defaultValue={f.brand || ""} aria-label="Brand"><option value="">All brands</option>{data.listedBrands.filter(b => scope.some(r => r.brandId === b.id)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>)}
            {hasYears && group("Model year", <select name="year" defaultValue={f.year || ""} aria-label="Model year"><option value="">All years</option>{[...new Set(data.listed.map(r => r.year))].sort((a, b) => b - a).map(y => <option key={y}>{y}</option>)}</select>)}
            <noscript><button className="button">Show results</button></noscript>
          </AutoSubmitForm>
        </div>
      </aside>

      <section className="lc-list" aria-labelledby="lc-title">
        <header className="lcx-head">
          <h1 id="lc-title">{title ?? (shape ? plural(shape) : `All ${w.many}`)}</h1>
          <p className="lcx-sub">{`${fmt(results.length)} ${results.length === 1 ? w.one : w.many} · ${fmt(scopeReviews)} reviews from Reddit, YouTube and blogs`}</p>
        </header>
        <div className="lcx-tools">
          {/* Filters as you type (owner, 2026-11-13); the other filters ride along as hidden fields. */}
          <AutoSubmitForm className="lc-search" action={basePath}>
            {hidden({ shape: fixed.shape ? undefined : f.shape, brand: fixed.brand ? undefined : f.brand, year: f.year, sort: f.sort })}
            <input type="search" name="q" defaultValue={f.q || ""} placeholder={`Search a ${w.one} or brand…`} aria-label={`Search ${w.many}`} autoComplete="off"/>
          </AutoSubmitForm>
          {/* Compare boxes show when this is on, or once something is picked (owner, 2026-11-12): rows stay clean by default. CSS only. */}
          <label className="lc-cmp-toggle lcx-cmp"><input type="checkbox" id="lc-cmp"/>Compare</label>
          {/* Keyed so the menu shows the right order after a category switch without a reload. */}
          <AutoSubmitForm key={`${basePath}-${sort}`} className="lc-sort lcx-sort" action={basePath}>
            {hidden({ q: f.q, brand: fixed.brand ? undefined : f.brand, year: f.year, shape: fixed.shape ? undefined : f.shape })}
            <label><span>Sort:</span><select name="sort" defaultValue={sort === defaultSort ? "" : sort}>{SORTS.map(s => <option key={s.value} value={s.value === defaultSort ? "" : s.value}>{s.label}</option>)}</select></label>
            <noscript><button className="button ghost">Sort</button></noscript>
          </AutoSubmitForm>
        </div>
        <p className="lcx-how">{sort === DEFAULT_SORT ? "Ranked by signal score: positive reviews, weighted by how many there are." : `Sorted by ${SORTS.find(s => s.value === sort)?.label.toLowerCase()}.${mixed && sort === "discussed" ? " Pick a category to see it ranked by signal score." : ""}`} <SignalPop label="How it works"/></p>
        {/* The home page's row (owner, 2026-11-13), with the compare box under the name and no rank number. */}
        <div className="lc-rows lt-list" style={sigTipStyle}><Directory show={parseShow(f.show)} moreHref={n => params({ show: String(n) })} rows={results.map(({ r }, i) => {
          const brand = data.brands.find(b => b.id === r.brandId)?.name, name = displayName(r.name, brand);
          return <div key={r.id} className="lt-slot">
            <LightRow data={data} r={r} rank={null} noSignal={mixed} signal={signals.get(r.id)?.signal} line={shortLine(r) ?? listLine(r) ?? consensus(tc.get(r.id))} shop={quickAmazon(r, brand)}
              extra={<CompareCheck slug={r.slug} name={name}/>}/>
          </div>; })}/></div>
        {!results.length && <p className="empty-feed">{`No ${w.one} matches all of these. `}<a href={clearAll}>Clear filters</a></p>}
      </section>
    </div>
    <CompareTray noun={w.one}/>
  </main>;
}

