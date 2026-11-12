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
export type IndexFilters = { q?: string; brand?: string; year?: string; shape?: string; tag?: string; sort?: string; show?: string };

/** The shape/type chips: the niche's grouped tabs where it has them, else its shape list. */
const shapeChips = () => niche.shapeTabs?.length
  ? niche.shapeTabs.map(t => ({ key: t.key, label: t.label, shapes: t.shapes }))
  : niche.shapeFilter.map(s => ({ key: s, label: s, shapes: [s] }));

/** How many reviews of each product mention each tag, counted once for the whole page. */
function tagCounts(data: Catalog) {
  const out = new Map<string, Map<string, number>>();
  for (const x of [...data.reviews, ...data.external]) {
    if (!x.tags.length) continue;
    const m = out.get(x.racketId) ?? new Map<string, number>(); out.set(x.racketId, m);
    for (const t of x.tags) m.set(t, (m.get(t) ?? 0) + 1);
  }
  return out;
}

/** A product is "known for" a liked or descriptive tag when at least KNOWN_MIN reviews and KNOWN_SHARE of all its reviews say it. */
const KNOWN_MIN = 3, KNOWN_SHARE = 0.08;
const knownFor = (counts: Map<string, number> | undefined, total: number, tag: string) => { const n = counts?.get(tag) ?? 0; return n >= KNOWN_MIN && n >= KNOWN_SHARE * total; };

/** The most mentioned liked and disliked theme with how many reviews raise each, so a lone complaint never reads as the verdict. */
function gist(counts: Map<string, number> | undefined) {
  const best = (tone: string) => [...(counts ?? [])].filter(([t, n]) => n >= 3 && tagTone(t) === tone).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return { liked: best("pos"), disliked: best("neg") };
}


function IndexRow({ data, r, rank, signal, tags, picked = [] }: { data: Catalog; r: Catalog["listed"][number]; rank: number | null; signal?: number; tags?: Map<string, number>; picked?: string[] }) {
  const brand = data.brands.find(b => b.id === r.brandId)?.name, name = displayName(r.name, brand), href = productHref(r);
  const s = score(data, r.id), total = s.count + s.web, g = gist(tags);
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
      {/* The tags someone filtered by, with how many reviews say it, so they can see why the product is in the list. */}
      {picked.filter(t => t !== g.liked?.[0]).length > 0 && <p className="ix-picked">{picked.filter(t => t !== g.liked?.[0]).map(t => <span key={t}>{`${t} (${tags?.get(t) ?? 0})`}</span>)}</p>}
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
  const tc = tagCounts(data), totals = new Map(data.listed.map(r => { const s = score(data, r.id); return [r.id, s.count + s.web] as const; }));
  const picked = (f.tag ?? "").split(",").map(t => t.trim()).filter(t => niche.tags.some(x => x.label === t));
  const inShape = (r: Catalog["listed"][number], c = chip) => !c || c.shapes.some(s => s.toLowerCase() === (r.shape ?? "").toLowerCase());
  const has = (r: Catalog["listed"][number], tags: string[]) => tags.every(t => knownFor(tc.get(r.id), totals.get(r.id) ?? 0, t));
  // Everything but one filter, so each chip can say how many products it would leave.
  const base = matchingRackets(data.listed, f.q || "").filter(r => !f.year || String(r.year) === f.year);
  const pass = (r: Catalog["listed"][number], skip: "brand" | "shape" | "tag" | null = null) =>
    (skip === "brand" || !f.brand || r.brandId === f.brand) && (skip === "shape" || inShape(r)) && (skip === "tag" || has(r, picked));
  const results = sortProducts(base.filter(r => pass(r)).map(r => ({ r, s: score(data, r.id) })), sort, x => { const g = signals.get(x.r.id); return g && g.signal * 10_000 - g.rank; });
  const filtered = !!(f.q || f.brand || f.year || f.shape || picked.length || f.sort);
  const link = (extra: Record<string, string | undefined>) => { const q = new URLSearchParams(Object.entries({ ...keep, ...f, tag: picked.join(",") || undefined, show: undefined, ...extra }).filter(([, v]) => v) as [string, string][]); return q.size ? `${basePath}?${q}#ix-title` : `${basePath}#ix-title`; };
  const clear = link({ q: undefined, brand: undefined, year: undefined, shape: undefined, tag: undefined, sort: undefined });
  const toggleTag = (t: string) => link({ tag: (picked.includes(t) ? picked.filter(x => x !== t) : [...picked, t]).join(",") || undefined });

  // Facets. Type chips carry the photo of their best-scored product; tag chips are the liked and descriptive tags from the
  // niche's tag bank, most common first; brand chips are the brands with the most products.
  const noTag = base.filter(r => pass(r, "tag"));
  const tagChips = niche.tags.filter(t => t.tone !== "neg").map(t => ({ label: t.label, n: noTag.filter(r => has(r, [...picked.filter(x => x !== t.label), t.label])).length }))
    .filter(t => t.n > 0 || picked.includes(t.label)).sort((a, b) => b.n - a.n).slice(0, 14);
  const noShape = base.filter(r => pass(r, "shape"));
  const best = (list: Catalog["listed"]) => [...list].sort((a, b) => (signals.get(b.id)?.signal ?? 0) - (signals.get(a.id)?.signal ?? 0))[0];
  const typeChips = chips.map(c => { const list = noShape.filter(r => inShape(r, c)); return { ...c, n: list.length, top: best(list) }; }).filter(c => c.n > 0 || c.key === f.shape);
  const noBrand = base.filter(r => pass(r, "brand"));
  const brandChips = data.listedBrands.map(b => ({ b, n: noBrand.filter(r => r.brandId === b.id).length })).filter(x => x.n > 0 || x.b.id === f.brand).sort((a, z) => z.n - a.n).slice(0, 10);
  const brandName = (id?: string) => data.brands.find(b => b.id === id)?.name;
  const active = [
    ...(f.q ? [{ label: `“${f.q}”`, href: link({ q: undefined }) }] : []),
    ...(chip ? [{ label: chip.label, href: link({ shape: undefined }) }] : []),
    ...picked.map(t => ({ label: t[0].toUpperCase() + t.slice(1), href: toggleTag(t) })),
    ...(f.brand ? [{ label: brandName(f.brand) ?? "Brand", href: link({ brand: undefined }) }] : []),
    ...(f.year ? [{ label: f.year, href: link({ year: undefined }) }] : []),
  ];

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
  // A rank number only means something in signal order: within the filters, it is the place among what's shown.
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
      <div className="ix-filters">
        <AutoSubmitForm className="ix-bar" action={basePath}>
          {Object.entries({ ...keep, shape: f.shape, tag: picked.join(",") || undefined, sort: f.sort }).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v as string}/>)}
          <label className="ix-q"><span className="sr-only">{`Search ${w.many}`}</span><input type="search" name="q" defaultValue={f.q || ""} placeholder={`Search ${w.many} or brands`}/></label>
          <label className="ix-sel"><span className="sr-only">Brand</span><select name="brand" defaultValue={f.brand || ""}><option value="">All brands</option>{data.listedBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          {hasYears && <label className="ix-sel"><span className="sr-only">Model year</span><select name="year" defaultValue={f.year || ""}><option value="">All years</option>{[...new Set(data.listed.map(r => r.year))].sort((a, b) => b - a).map(y => <option key={y}>{y}</option>)}</select></label>}
          <noscript><button className="button">Search</button></noscript>
        </AutoSubmitForm>
        {typeChips.length > 1 && <div className="ix-facet ix-types"><span className="ix-facet-label">{niche.specs.find(s => s.column === "shape")?.label ?? "Type"}</span>
          <div className="ix-scroll">
            <a className="ix-type" href={link({ shape: undefined })} aria-current={!f.shape ? "true" : undefined}><span className="ix-type-all" aria-hidden="true">All</span><b>{`All ${w.many}`}</b><small>{fmt(noShape.length)}</small></a>
            {typeChips.map(c => <a key={c.key} className="ix-type" href={link({ shape: f.shape === c.key ? undefined : c.key })} aria-current={f.shape === c.key ? "true" : undefined}>
              {c.top ? <ProductArt product={c.top} brand={brandName(c.top.brandId)}/> : <span className="ix-type-all" aria-hidden="true"/>}<b>{c.label}</b><small>{fmt(c.n)}</small></a>)}
          </div></div>}
        {tagChips.length > 0 && <div className="ix-facet"><span className="ix-facet-label">Known for</span>
          <div className="ix-scroll ix-tags">{tagChips.map(t => <a key={t.label} href={toggleTag(t.label)} aria-current={picked.includes(t.label) ? "true" : undefined} rel="nofollow">
            {picked.includes(t.label) && <span aria-hidden="true">✓ </span>}{t.label[0].toUpperCase() + t.label.slice(1)}<small>{fmt(t.n)}</small></a>)}</div></div>}
        {brandChips.length > 1 && <div className="ix-facet"><span className="ix-facet-label">Brand</span>
          <div className="ix-scroll ix-tags ix-brands">{brandChips.map(({ b, n }) => <a key={b.id} href={link({ brand: f.brand === b.id ? undefined : b.id })} aria-current={f.brand === b.id ? "true" : undefined} rel="nofollow">{b.name}<small>{fmt(n)}</small></a>)}</div></div>}
      </div>
      <div className="ix-list">
        <div className="list-bar">
          <p>{`${fmt(results.length)} ${results.length === 1 ? w.one : w.many}`}</p>
          {active.length > 0 && <p className="ix-active">{active.map(a => <a key={a.label} href={a.href} aria-label={`Remove ${a.label}`}>{a.label}<span aria-hidden="true"> ×</span></a>)}<a className="ix-clear" href={clear}>Clear all</a></p>}
          <AutoSubmitForm className="ix-sort" action={basePath}>
            {Object.entries({ ...keep, ...f, tag: picked.join(",") || undefined, sort: undefined, show: undefined }).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v as string}/>)}
            <SortSelect sort={sort}/><noscript><button className="button ghost">Sort</button></noscript>
          </AutoSubmitForm><SignalInfo align="right"/></div>
        {picked.length > 0 && <p className="ix-why">{`Showing ${w.many} where at least ${KNOWN_MIN} reviews, and ${Math.round(KNOWN_SHARE * 100)}% of all of them, say ${picked.map(t => `“${t}”`).join(" and ")}.`}</p>}
        <Directory show={parseShow(f.show)} moreHref={n => link({ show: String(n) })} rows={results.map(({ r }, i) => <IndexRow key={r.id} data={data} r={r} rank={ranked ? i + 1 : null} signal={signals.get(r.id)?.signal} tags={tc.get(r.id)} picked={picked}/>)}/>
        {!results.length && <p className="empty-feed">{`No ${w.one} matches all of these. `}<a href={clear}>Clear filters</a> or remove one above.</p>}
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

