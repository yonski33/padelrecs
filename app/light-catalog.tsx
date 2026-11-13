// The light direction's catalogue (owner's mockup, 2026-11-12), the default since 2026-11-12 (?look=classic shows the old page): a title with the live counts,
// one big search, the categories as tabs with counts, a "Narrow it down" rail of checkboxes (what people mention, the
// niche's fixed-value specs, brand), and the list as calm rows with the signal and a compare box. Every number is counted
// from published reviews; nothing here needs JavaScript except the compare tray and the auto-submitting filters.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche, catalogPath, hasYears, productHref } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { matchingRackets } from "../lib/racket-search";
import { SORTS, DEFAULT_SORT, parseSort, sortProducts } from "../lib/product-sort";
import { catalogKeyword } from "../lib/catalogue-seo";
import { listLine } from "../lib/list-lines";
import type { Signal } from "../lib/signal";
import type { SpecColumn } from "../lib/niche/types";
import { Directory, parseShow } from "./components";
import { AutoSubmitForm } from "./auto-submit";
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
  const sort = parseSort(f.sort), shapes = shapeChoices(), shape = shapes.find(c => c.key.toLowerCase() === (f.shape ?? "").toLowerCase()), tc = tagCounts(data);
  const totals = new Map(data.listed.map(r => { const s = score(data, r.id); return [r.id, s.count + s.web] as const; }));
  const known = (r: Product, t: string) => { const n = tc.get(r.id)?.get(t) ?? 0; return n >= KNOWN_MIN && n >= KNOWN_SHARE * (totals.get(r.id) ?? 0); };
  const tags = (f.tag ?? []).filter(t => niche.tags.some(x => x.label === t));
  const inShape = (r: Product, c = shape) => !c || c.shapes.some(s => s.toLowerCase() === (r.shape ?? "").toLowerCase());
  const specOk = (r: Product) => specFacets.every(sp => { const want = (f.specs?.[sp.column]) ?? []; return !want.length || want.some(o => specIs((r as Record<string, unknown>)[sp.column], o)); });
  const base = matchingRackets(data.listed, f.q || "").filter(r => (!f.brand || r.brandId === f.brand) && (!f.year || String(r.year) === f.year) && specOk(r) && tags.every(t => known(r, t)));
  const results = sortProducts(base.filter(r => inShape(r)).map(r => ({ r, s: score(data, r.id) })), sort, x => { const g = signals.get(x.r.id); return g && g.signal * 10_000 - g.rank; });

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

  return <main className={`catalog v2 lt-page lc ${lightFont.className}`}>
    <p className="crumbs">{crumbs ?? <><a href="/">Home</a><span>/</span>{niche.navLabel ?? w.Many}</>}</p>
    <header className="lc-hero">
      <div>
        <h1>{title ?? <>{`Explore all ${words.join(" ")} `}<em>{last}</em></>}</h1>
        <p className="lc-sub">Real experiences, gathered in one place.</p>
      </div>
      <p className="lc-live"><span className="lt-dot" aria-hidden="true"/>{`${fmt(scope.length)} ${w.many} · ${fmt(scopeReviews)} reviews`}</p>
    </header>
    {/* Filters as you type (owner, 2026-11-13); the other filters ride along as hidden fields. */}
    <AutoSubmitForm className="lc-search" action={basePath}>
      {Object.entries({ shape: fixed.shape ? undefined : f.shape, brand: fixed.brand ? undefined : f.brand, year: f.year, sort: f.sort }).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v as string}/>)}
      {tags.map(t => <input key={`t${t}`} type="hidden" name="tag" value={t}/>)}
      {specFacets.flatMap(sp => (f.specs?.[sp.column] ?? []).map(o => <input key={sp.column + o} type="hidden" name={sp.column} value={o}/>))}
      <input type="search" name="q" defaultValue={f.q || ""} placeholder={`Search ${w.many} or brands…`} aria-label={`Search ${w.many}`} autoComplete="off"/>
    </AutoSubmitForm>
    {cats.length > 1 && <nav className="lt-cats lc-cats" aria-label={`${w.One} categories`}>
      <a href={catHref()} aria-current={!shape ? "true" : undefined}>All<small>{fmt(base.length)}</small></a>
      {shown.map(c => <a key={c.key} href={catHref(c)} aria-current={shape?.key === c.key ? "true" : undefined}>{c.label}<small>{fmt(c.n)}</small></a>)}
      {more.length > 0 && <details className="lc-more"><summary>{more.some(c => c.key === shape?.key) ? plural(shape!) : "More"} <span aria-hidden="true">⌄</span></summary>
        <div>{more.map(c => <a key={c.key} href={catHref(c)} aria-current={shape?.key === c.key ? "true" : undefined}>{c.label}<small>{fmt(c.n)}</small></a>)}</div></details>}
    </nav>}

    <div className="lc-grid">
      <aside className="lc-rail filter-panel">
        <input type="checkbox" id="filters-open" className="filters-toggle"/>
        <label htmlFor="filters-open" className="filters-button">{`Narrow it down${refined ? " (on)" : ""}`}<span aria-hidden="true"> ⌄</span></label>
        <AutoSubmitForm className="filters lc-form" action={basePath}>
                    {Object.entries({ q: f.q, shape: fixed.shape ? undefined : f.shape, sort: f.sort }).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v as string}/>)}
          <h2>Narrow it down</h2>
          {mention.length > 0 && <fieldset><legend>What people mention</legend>
            {mention.map(m => <label key={m.t} className="lc-check"><input type="checkbox" name="tag" value={m.t} defaultChecked={tags.includes(m.t)}/><span>{cap(m.t)}</span><small>{fmt(m.n)}</small></label>)}</fieldset>}
          {specFacets.map(sp => { const opts = sp.options!.filter(o => data.listed.some(r => specIs((r as Record<string, unknown>)[sp.column], o))); return opts.length > 1 && <fieldset key={sp.column}><legend>{sp.label}</legend>
            {opts.map(o => <label key={o} className="lc-check"><input type="checkbox" name={sp.column} value={o} defaultChecked={((f.specs?.[sp.column]) ?? []).includes(o)}/><span>{o}</span></label>)}</fieldset>; })}
          {!fixed.brand && <fieldset><legend>Brand</legend><select name="brand" defaultValue={f.brand || ""} aria-label="Brand"><option value="">All brands</option>{data.listedBrands.filter(b => scope.some(r => r.brandId === b.id)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></fieldset>}
          {hasYears && <fieldset><legend>Model year</legend><select name="year" defaultValue={f.year || ""} aria-label="Model year"><option value="">All years</option>{[...new Set(data.listed.map(r => r.year))].sort((a, b) => b - a).map(y => <option key={y}>{y}</option>)}</select></fieldset>}
          <noscript><button className="button">Show results</button></noscript>
          {refined && <a className="lc-clear" href={params({ q: undefined, brand: undefined, year: undefined, tag: undefined, ...Object.fromEntries(specFacets.map(s => [s.column, undefined])) })}>Clear filters</a>}
        </AutoSubmitForm>
      </aside>

      <section className="lc-list" aria-labelledby="lc-title">
        <div className="lc-head">
          <div><h2 id="lc-title">{shape ? plural(shape) : `All ${w.many}`}</h2><p>{`Showing ${fmt(results.length)} ${results.length === 1 ? w.one : w.many}`}</p></div>
          {/* Compare boxes show when this is on, or once something is picked (owner, 2026-11-12): rows stay clean by default. CSS only. */}
          <label className="lc-cmp-toggle"><input type="checkbox" id="lc-cmp"/><span className="lc-switch" aria-hidden="true"/>Compare</label>
          <SignalPop align="right"/>
          <AutoSubmitForm className="lc-sort" action={basePath}>
                        {Object.entries({ q: f.q, brand: fixed.brand ? undefined : f.brand, year: f.year, shape: fixed.shape ? undefined : f.shape }).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v as string}/>)}
            {tags.map(t => <input key={t} type="hidden" name="tag" value={t}/>)}
            {specFacets.flatMap(s => ((f.specs?.[s.column]) ?? []).map(o => <input key={s.column + o} type="hidden" name={s.column} value={o}/>))}
            <label><span>Sort:</span><select name="sort" defaultValue={sort === DEFAULT_SORT ? "" : sort}>{SORTS.map(s => <option key={s.value} value={s.value === DEFAULT_SORT ? "" : s.value}>{s.label}</option>)}</select></label>
            <noscript><button className="button ghost">Sort</button></noscript>
          </AutoSubmitForm>
        </div>
        <Directory show={parseShow(f.show)} moreHref={n => params({ show: String(n) })} rows={results.map(({ r, s }, i) => {
          const brand = data.brands.find(b => b.id === r.brandId)?.name, name = displayName(r.name, brand), href = `${productHref(r)}`;
          const pos = s.judged >= 3 ? Math.round(100 * s.positive / s.judged) : null, line = listLine(r) ?? consensus(tc.get(r.id)), sig = signals.get(r.id)?.signal;
          return <article key={r.id} className={`lr-row lc-row${i < 2 && sort === DEFAULT_SORT && !f.q ? " lr-top" : ""}`}>
            <a className="lr-art" href={href} aria-hidden="true" tabIndex={-1}><ProductArt product={r} brand={brand}/></a>
            <div className="lr-main">
              <h3><a href={href}>{name}</a></h3>
              {line && <p className="lr-line">{line}</p>}
              <p className="lr-meta">{[r.shape, `${fmt(s.count + s.web)} reviews`].filter(Boolean).join(" · ")}{pos !== null && <> · <b>{`${pos}% positive`}</b></>}</p>
              <CompareCheck slug={r.slug} name={name}/>
            </div>
            <div className="lr-side">{sig ? <a className="lr-sig" href={href}><b>{sig}</b><span>signal</span></a> : <span className="lc-new">new</span>}</div>
          </article>; })}/>
        {!results.length && <p className="empty-feed">{`No ${w.one} matches all of these. `}<a href={params({ q: undefined, brand: undefined, year: undefined, tag: undefined, shape: undefined })}>Clear filters</a></p>}
      </section>
    </div>
    <CompareTray noun={w.one}/>
  </main>;
}

