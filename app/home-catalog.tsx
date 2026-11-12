// Direction C (owner, 2026-11-12): the home page is the catalog. A slim hero says what the site is (an index of first-hand
// reviews, updated daily) with live counts, then the whole catalog in signal order with a filter rail, then a strip of
// what came in today. Shown with ?home=c until the owner picks it; every number is counted from published reviews.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche, hasYears, productHref } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { matchingRackets } from "../lib/racket-search";
import { SORTS, DEFAULT_SORT, parseSort, sortProducts } from "../lib/product-sort";
import { platformName, sourceLabel } from "../lib/source-label";
import { tagTone } from "../lib/tags";
import { webDate } from "../lib/recent";
import type { Signal } from "../lib/signal";
import { Directory, parseShow } from "./components";
import { AutoSubmitForm } from "./auto-submit";
import { ProductArt, SentimentBar, Arrow, SignalInfo } from "./visual";
import { SourceIcon } from "./icons";
import { CompareCheck, CompareTray } from "./compare/compare-pick";

const DAY = 86_400_000, w = niche.words;
const fmt = (n: number) => n.toLocaleString("en-US");
export type IndexFilters = { q?: string; brand?: string; year?: string; shape?: string; sort?: string; show?: string };

/** The shape/type chips: the niche's grouped tabs where it has them, else its shape list. */
const shapeChips = () => niche.shapeTabs?.length
  ? niche.shapeTabs.map(t => ({ key: t.key, label: t.label, shapes: t.shapes }))
  : niche.shapeFilter.map(s => ({ key: s, label: s, shapes: [s] }));

/** The most mentioned liked and disliked theme with how many reviews raise each, so a lone complaint never reads as the verdict. */
function gist(data: Catalog, id: string) {
  const counts = new Map<string, number>();
  for (const x of [...data.reviews.filter(r => r.racketId === id), ...data.external.filter(e => e.racketId === id)]) for (const t of x.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const best = (tone: string) => [...counts].filter(([t, n]) => n >= 3 && tagTone(t) === tone).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return { liked: best("pos"), disliked: best("neg") };
}

function IndexRow({ data, r, rank, signal }: { data: Catalog; r: Catalog["listed"][number]; rank: number | null; signal?: number }) {
  const brand = data.brands.find(b => b.id === r.brandId)?.name, name = displayName(r.name, brand), href = productHref(r);
  const s = score(data, r.id), total = s.count + s.web, g = gist(data, r.id);
  const specs = niche.specs.slice(0, 3).map(x => (r as Record<string, unknown>)[x.column]).filter((v): v is string => typeof v === "string" && !!v && v.length <= 24).slice(0, 2);
  const pos = s.judged ? Math.round(100 * s.positive / s.judged) : null;
  return <article className="ix-row">
    <span className="ix-rank">{rank !== null ? String(rank).padStart(2, "0") : ""}</span>
    <a className="ix-art" href={href} aria-hidden="true" tabIndex={-1}><ProductArt product={r} brand={brand}/></a>
    <div className="ix-main">
      <h3><a href={href}>{name}</a></h3>
      {specs.length > 0 && <p className="ix-specs">{specs.join(" · ")}</p>}
      {(g.liked || g.disliked) && <p className="ix-gist">
        {g.liked && <span><span className="ix-k">Liked</span>{` ${g.liked[0]} `}<small>{`(${g.liked[1]})`}</small></span>}
        {g.disliked && <span><span className="ix-k neg">Disliked</span>{` ${g.disliked[0]} `}<small>{`(${g.disliked[1]})`}</small></span>}
      </p>}
      <CompareCheck slug={r.slug} name={name}/>
    </div>
    <a className="ix-score" href={`${href}#reviews`}>
      {signal ? <><b className="ix-signal">{signal}</b><span className="ix-signal-label">Signal</span></> : <span className="ix-few">Too few reviews to score</span>}
      <span className="ix-n">{`${fmt(total)} ${total === 1 ? "review" : "reviews"}`}</span><span className="ix-src">source-linked</span>
      {pos !== null && s.judged >= 3 && <><SentimentBar positive={s.positive} mixed={s.mixed} negative={s.negative}/><span className="ix-pos">{`${pos}% positive`}</span></>}
    </a>
  </article>;
}

export function HomeC({ data, f, signals, now, basePath = "/", keep = {} }: { data: Catalog; f: IndexFilters; signals: Map<string, Signal>; now: number; basePath?: string; keep?: Record<string, string> }) {
  const sort = parseSort(f.sort), chips = shapeChips(), chip = chips.find(c => c.key === f.shape);
  const results = sortProducts(matchingRackets(data.listed, f.q || "")
    .filter(r => (!f.brand || r.brandId === f.brand) && (!f.year || String(r.year) === f.year) && (!chip || chip.shapes.some(s => s.toLowerCase() === (r.shape ?? "").toLowerCase())))
    .map(r => ({ r, s: score(data, r.id) })), sort, x => { const g = signals.get(x.r.id); return g && g.signal * 10_000 - g.rank; });
  const filtered = !!(f.q || f.brand || f.year || f.shape || f.sort);
  const link = (extra: Record<string, string | undefined>) => { const q = new URLSearchParams(Object.entries({ ...keep, ...f, show: undefined, ...extra }).filter(([, v]) => v) as [string, string][]); return q.size ? `${basePath}?${q}` : basePath; };
  const clear = link({ q: undefined, brand: undefined, year: undefined, shape: undefined, sort: undefined });

  // Hero counts.
  const everything = [...data.reviews, ...data.external];
  // "This month" counts reviews written in the last 30 days (the source's own date where we have it), not when we read them:
  // a re-read of old threads would otherwise make every review look new.
  const total = everything.length, month = [...data.reviews.map(r => r.createdAt), ...data.external.map(webDate)].filter(d => Date.parse(d) >= now - 30 * DAY).length;
  const today = everything.filter(x => Date.parse(x.createdAt) >= now - DAY).length;
  const sources = new Map<string, number>(); for (const e of data.external) { const p = platformName(e.sourcePlatform); sources.set(p, (sources.get(p) ?? 0) + 1); }
  const top = [...sources].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => p === "Blog" ? "independent blogs" : p);
  const latestWeb = [...data.external].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const latestLabel = latestWeb && [sourceLabel(latestWeb).platform, sourceLabel(latestWeb).name].filter(Boolean).join(" · ");
  const updated = everything.reduce((m, x) => x.createdAt > m ? x.createdAt : m, "");
  // A rank number only means something in signal order over the whole list.
  const ranked = sort === DEFAULT_SORT && !f.q;

  return <>
    <section className="ix-hero">
      <div>
        <p className="hv-kicker">{`The ${niche.people.one} review index · updated daily`}</p>
        <h1>{`Every ${w.one}. `}<em>{`Real ${niche.people.one} opinions.`}</em></h1>
        <p className="ix-lede">{`Ranked by what ${niche.people.many} who own them say: reviews written here and first-hand experiences we read on ${top.slice(0, -1).join(", ")}${top.length > 1 ? " and " : ""}${top[top.length - 1]}, each linked to the original. No sponsored picks.`}</p>
      </div>
      <dl className="ix-stats">
        <div><dt>reviews</dt><dd>{fmt(total)}</dd></div>
        <div><dt>{w.many}</dt><dd>{fmt(data.listed.length)}</dd></div>
        <div><dt>this month</dt><dd>{`+${fmt(month)}`}</dd></div>
        <p className="ix-stats-note"><span className="hv-live" aria-hidden="true"/>{`From ${niche.people.many} on ${niche.site.name}, ${top.join(", ")}`}</p>
      </dl>
    </section>

    <section className="ix" aria-labelledby="ix-title">
      <div className="section-head"><h2 id="ix-title">{`Explore the ${w.one} index`}</h2><a className="section-link" href="/about#signal">How the signal score works<Arrow/></a></div>
      <div className="ix-grid">
        <aside className="ix-rail filter-panel">
          <input type="checkbox" id="filters-open" className="filters-toggle"/>
          <label htmlFor="filters-open" className="filters-button">{`Filter and sort${filtered ? " (on)" : ""}`}<span aria-hidden="true"> ⌄</span></label>
          <AutoSubmitForm className="filters" action={basePath}>
            {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v}/>)}
            {f.shape && <input type="hidden" name="shape" value={f.shape}/>}
            <h2>Narrow it down</h2>
            <label className="f-field"><span>Search</span><input type="search" name="q" defaultValue={f.q || ""} placeholder={`Search ${w.many}`}/></label>
            <label className="f-field"><span>Brand</span><select name="brand" defaultValue={f.brand || ""}><option value="">All brands</option>{data.listedBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
            {hasYears && <label className="f-field"><span>Model year</span><select name="year" defaultValue={f.year || ""}><option value="">All years</option>{[...new Set(data.listed.map(r => r.year))].sort((a, b) => b - a).map(y => <option key={y}>{y}</option>)}</select></label>}
            <noscript><button className="button">Show results</button></noscript>
          </AutoSubmitForm>
          {chips.length > 1 && <div className="ix-chips"><span>{niche.specs.find(s => s.column === "shape")?.label ?? "Type"}</span><p>
            <a href={link({ shape: undefined })} aria-current={!f.shape ? "page" : undefined}>All</a>
            {chips.map(c => <a key={c.key} href={link({ shape: c.key })} aria-current={f.shape === c.key ? "page" : undefined}>{c.label}</a>)}</p></div>}
          {filtered && <a className="f-clear" href={clear}>Clear filters</a>}
        </aside>
        <div className="ix-list">
          <div className="list-bar"><p>{`${fmt(results.length)} ${results.length === 1 ? w.one : w.many}`}</p>
            <AutoSubmitForm className="ix-sort" action={basePath}>
              {Object.entries({ ...keep, ...f, sort: undefined, show: undefined }).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v as string}/>)}
              <SortSelect sort={sort}/><noscript><button className="button ghost">Sort</button></noscript>
            </AutoSubmitForm><SignalInfo align="right"/></div>
          <Directory show={parseShow(f.show)} moreHref={n => link({ show: String(n) })} rows={results.map(({ r }, i) => <IndexRow key={r.id} data={data} r={r} rank={ranked ? i + 1 : null} signal={signals.get(r.id)?.signal}/>)}/>
          {!results.length && <p className="empty-feed">{`No ${w.one} found. `}<a href={clear}>Clear filters</a> or <a href="/add-review">add it with a review →</a></p>}
        </div>
      </div>
    </section>

    <aside className="ix-strip" aria-label="New reviews">
      <b>New today</b>
      <span>{`${fmt(today)} ${today === 1 ? "review" : "reviews"} added in the last 24 hours`}</span>
      {latestLabel && <span>{`Latest source: ${latestLabel}`}</span>}
      {updated && <span>{`Updated ${new Date(updated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}</span>}
      <a href="#latest">Read the latest reviews<Arrow/></a>
    </aside>
    <CompareTray noun={w.one}/>
  </>;
}

function SortSelect({ sort }: { sort: string }) {
  return <label className="ix-sort-field"><span>Sort</span><select name="sort" defaultValue={sort === DEFAULT_SORT ? "" : sort}>{SORTS.map(s => <option key={s.value} value={s.value === DEFAULT_SORT ? "" : s.value}>{s.label}</option>)}</select></label>;
}

