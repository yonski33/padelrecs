// Direction D (owner, 2026-11-12): light and easy to scan, after outbid.lol's feel. One rounded sans, a warm off-white
// page, one soft accent. A pill bar of types and rankings, a small centred hero with the search, then a compact
// leaderboard (rank, small photo, name, one grey line, a tiny meta line, the signal) with short #1–#5 lists beside it.
// Shown with ?home=d until the owner picks a direction; every number is counted from published reviews.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche, productHref } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { matchingRackets } from "../lib/racket-search";
import { DEFAULT_SORT, parseSort, sortProducts } from "../lib/product-sort";
import { webDate } from "../lib/recent";
import type { Signal } from "../lib/signal";
import type { RankedList } from "./rankings/lists";
import { listHref } from "./rankings/lists";
import { HomeBoard, HomeSearch, HomeSort } from "./home-board";
import { ProductArt, SignalPop } from "./visual";
import { SourceIcon } from "./icons";
import { lightFont } from "./light-font";
import { shapeChoices, tagCounts, consensus, ago } from "./home-catalog";

// Preview links carry the light look through to the product page.
const lightHref = productHref;
const DAY = 86_400_000, w = niche.words, p = niche.people;
const fmt = (n: number) => n.toLocaleString("en-US");
type Product = Catalog["listed"][number];
export type LightFilters = { q?: string; shape?: string; sort?: string; show?: string };

/** The rank number comes from CSS (a counter over the rows shown), so it follows the category picked on the page. */
function Row({ data, r, signal, line }: { data: Catalog; r: Product; signal?: number; line: string | null }) {
  const brand = data.brands.find(b => b.id === r.brandId)?.name, name = displayName(r.name, brand), href = lightHref(r);
  const s = score(data, r.id), total = s.count + s.web, pos = s.judged >= 3 ? Math.round(100 * s.positive / s.judged) : null;
  return <a className="lt-row" href={href}>
    <span className="lt-rank" aria-hidden="true"/>
    <span className="lt-art"><ProductArt product={r} brand={brand}/></span>
    <span className="lt-body">
      <span className="lt-name">{name}</span>
      {line && <span className="lt-line">{line}</span>}
      <span className="lt-meta">
        {r.shape && <span className="lt-shape">{r.shape}</span>}
        <span>{`${fmt(total)} ${total === 1 ? "review" : "reviews"}`}</span>
        {pos !== null && <span className="lt-pos">{`${pos}% positive`}</span>}
        <span className="lt-see">see reviews</span>
      </span>
    </span>
    <span className="lt-sig">{signal ? <><b>{signal}</b><small>signal</small></> : <small>new</small>}</span>
  </a>;
}

/** A short "#1–#5" list for the side: a ranking's top five, or the newest opinions. */
function Mini({ title, href, items }: { title: string; href: string; items: { key: string; rank?: number; art: React.ReactNode; name: string; href: string; value: React.ReactNode }[] }) {
  return <section className="lt-mini">
    <div className="lt-mini-head"><h2><span className="lt-dot" aria-hidden="true"/>{title}</h2><a href={href}>See all ›</a></div>
    <ol>{items.map(x => <li key={x.key}><a href={x.href}>
      <span className="lt-mini-rank">{x.rank !== undefined ? `#${x.rank}` : ""}</span>
      <span className="lt-mini-art">{x.art}</span><span className="lt-mini-name">{x.name}</span><span className="lt-mini-v">{x.value}</span>
    </a></li>)}</ol>
  </section>;
}

export function HomeLight({ data, f, signals, picks, now, keep = {} }: { data: Catalog; f: LightFilters; signals: Map<string, Signal>; picks: RankedList[]; now: number; keep?: Record<string, string> }) {
  const sort = parseSort(f.sort), shapes = shapeChoices(), shape = shapes.find(c => c.key === f.shape), tc = tagCounts(data);
  const inShape = (r: Product, c = shape) => !c || c.shapes.some(s => s.toLowerCase() === (r.shape ?? "").toLowerCase());
  const searched = matchingRackets(data.listed, f.q || "");
  // Category names as the site says them elsewhere ("Cleansers"), with how many products each holds under the search.
  const plural = (c: { key: string; label: string; shapes: string[] }) => niche.typePages?.find(t => c.shapes.some(s => s.toLowerCase() === t.shape.toLowerCase()))?.label ?? c.label;
  const cats = shapes.map(c => ({ key: c.key, label: plural(c), n: searched.filter(r => inShape(r, c)).length })).filter(c => c.n > 0 || c.key === shape?.key);
  // Every product, in order; the search box and the category row filter them on the page (app/home-board.tsx).
  const results = sortProducts(data.listed.map(r => ({ r, s: score(data, r.id) })), sort,
    x => { const g = signals.get(x.r.id); return g && g.signal * 10_000 - g.rank; });
  const link = (extra: Record<string, string | undefined>) => { const q = new URLSearchParams(Object.entries({ ...keep, ...f, show: undefined, ...extra }).filter(([, v]) => v) as [string, string][]); return q.size ? `/?${q}#board` : "/#board"; };
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name;
  const everything = [...data.reviews, ...data.external];
  const week = [...data.reviews.map(r => r.createdAt), ...data.external.map(webDate)].filter(d => Date.parse(d) >= now - 7 * DAY).length;
  const sorts = [{ v: undefined, label: "Top rated", on: sort === DEFAULT_SORT }, { v: "discussed", label: "Most discussed", on: sort === "discussed" }, { v: "newest", label: "Newest", on: sort === "newest" }];
  const ranked = sort === DEFAULT_SORT && !f.q;

  // Side lists: the newest opinions (one per product), then the top five of two rankings.
  const seen = new Set<string>();
  const fresh = [...data.external].filter(e => e.sentiment).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter(e => !seen.has(e.racketId) && seen.add(e.racketId)).slice(0, 5);
  const side = picks.filter((l, i) => l.entries.length >= 5 && picks.findIndex(x => x.list.title === l.list.title) === i).slice(1, 3);

  return <div className={`lt ${lightFont.className}`}>
    <section className="lt-hero">
      <div className="lt-live"><span className="lt-dot" aria-hidden="true"/>{`${week ? `${fmt(week)} new this week · ` : ""}${fmt(everything.length)} ${p.one} reviews`}</div>
      <h1>{`Every ${w.one}, ranked by `}<span>{`real ${p.many}`}</span></h1>
      <p className="lt-sub">We read Reddit, YouTube and blogs so you don’t have to. Every review links to its source.</p>
      {/* Filters the list as you type, without a reload (owner, 2026-11-13). */}
      <HomeSearch initial={f.q} placeholder={`Search a ${w.one} or brand`} label={`Search ${w.many}`}/>
    </section>

    <div className="lt-grid" id="board">
      <div className="lt-board">
        {/* One quiet row over the list (owner, 2026-11-12): the categories as plain words with a count and an underline on
            the one picked. It stays at the top while the long list scrolls. */}
        <HomeBoard noun={[w.one, w.many]} sort={<HomeSort value={sort === DEFAULT_SORT ? "" : sort} options={sorts.map(s => ({ value: s.v ?? "", label: s.label }))}/>} cats={cats} initial={shape?.key} initialQ={f.q} ranked={sort === DEFAULT_SORT} base={new URLSearchParams(Object.entries({ ...keep, sort: f.sort }).filter(([, v]) => v) as [string, string][]).toString()}
          noMatch={`No ${w.one} matches that. Try a brand or part of the name.`}
          items={results.map(({ r }) => ({ key: r.id, shape: shapes.find(c => inShape(r, c))?.key ?? null, text: `${data.brands.find(b => b.id === r.brandId)?.name ?? ""} ${r.name} ${r.shape ?? ""}`, node: <Row data={data} r={r} signal={signals.get(r.id)?.signal} line={consensus(tc.get(r.id))}/> }))}
          // A new site (TVRecs, 2026-11-13) before its first reviews are in.
          empty={<p className="lt-filtered">{`The first ${p.one} reviews are being collected; ${w.many} appear here as soon as they have some. `}<a href="/add-review">Add a review →</a></p>}/>
      </div>
      <aside className="lt-side">
        <Mini title="Fresh reviews" href="#latest" items={fresh.map(e => { const r = data.rackets.find(x => x.id === e.racketId)!; return { key: e.id, art: <SourceIcon platform={e.sourcePlatform}/>, name: displayName(r.name, brandOf(r.brandId)), href: lightHref(r), value: <span className={`lt-s lt-s-${e.sentiment}`}>{ago(e.createdAt, now).replace(" ago", "")}</span> }; })}/>
        {side.map(l => <Mini key={l.list.slug} title={/^best\b/i.test(l.list.label) ? l.list.label : `Best ${l.list.label[0].toLowerCase()}${l.list.label.slice(1)}`} href={listHref(l.list.slug)} items={l.entries.slice(0, 5).map(e => { const full = data.rackets.find(r => r.id === e.product.id); return { key: e.product.id, rank: e.rank, art: full ? <ProductArt product={full} brand={brandOf(full.brandId)}/> : null, name: displayName(e.product.name, brandOf(e.product.brandId)), href: lightHref(e.product), value: signals.get(e.product.id)?.signal ?? "" }; })}/>)}
        <div className="lt-note">The signal is positive reviews weighed by how many there are. No sponsored picks. <SignalPop label="How it works"/></div>
      </aside>
    </div>
  </div>;
}
