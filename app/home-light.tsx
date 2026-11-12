// Direction D (owner, 2026-11-12): light and easy to scan, after outbid.lol's feel. One rounded sans, a warm off-white
// page, one soft accent. A pill bar of types and rankings, a small centred hero with the search, then a compact
// leaderboard (rank, small photo, name, one grey line, a tiny meta line, the signal) with short #1–#5 lists beside it.
// Shown with ?home=d until the owner picks a direction; every number is counted from published reviews.
import { Poppins } from "next/font/google";
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
import { Directory, parseShow } from "./components";
import { AutoSubmitForm } from "./auto-submit";
import { ProductArt } from "./visual";
import { SourceIcon } from "./icons";
import { shapeChoices, tagCounts, consensus, ago } from "./home-catalog";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const DAY = 86_400_000, w = niche.words, p = niche.people;
const fmt = (n: number) => n.toLocaleString("en-US");
type Product = Catalog["listed"][number];
export type LightFilters = { q?: string; shape?: string; sort?: string; show?: string };

function Row({ data, r, rank, signal, line }: { data: Catalog; r: Product; rank: number | null; signal?: number; line: string | null }) {
  const brand = data.brands.find(b => b.id === r.brandId)?.name, name = displayName(r.name, brand), href = productHref(r);
  const s = score(data, r.id), total = s.count + s.web, pos = s.judged >= 3 ? Math.round(100 * s.positive / s.judged) : null;
  return <a className={`lt-row${rank !== null && rank <= 3 ? ` lt-top lt-top${rank}` : ""}`} href={href}>
    <span className="lt-rank">{rank !== null ? `#${rank}` : ""}</span>
    <span className="lt-art"><ProductArt product={r} brand={brand}/></span>
    <span className="lt-body">
      <span className="lt-name">{name}</span>
      {line && <span className="lt-line">{line}</span>}
      <span className="lt-meta">
        {r.shape && <span className="lt-shape">{r.shape}</span>}
        <span>{`${fmt(total)} ${total === 1 ? "opinion" : "opinions"}`}</span>
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
  const results = sortProducts(matchingRackets(data.listed, f.q || "").filter(r => inShape(r)).map(r => ({ r, s: score(data, r.id) })), sort,
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

  return <div className={`lt ${poppins.className}`}>
    <nav className="lt-pills" aria-label={`${w.One} types and rankings`}>
      <a href={link({ shape: undefined })} aria-current={!shape ? "true" : undefined}>All</a>
      {shapes.length > 1 && shapes.map(c => <a key={c.key} href={link({ shape: c.key })} aria-current={shape?.key === c.key ? "true" : undefined}>{c.label}</a>)}
      {!niche.typePages?.length && <span className="lt-pill-sep" aria-hidden="true"/>}
      {/* Rankings next to the types, unless the rankings are the types themselves (SkinRecs ranks per type). */}
      {!niche.typePages?.length && picks.filter((l, i) => picks.findIndex(x => x.list.label === l.list.label) === i).slice(0, 5).map(l => <a key={l.list.slug} href={listHref(l.list.slug)} className="lt-pill-list">{l.list.label}</a>)}
    </nav>

    <section className="lt-hero">
      <p className="lt-live"><span className="lt-dot" aria-hidden="true"/>{`${fmt(week)} new this week · ${fmt(everything.length)} ${p.one} opinions`}</p>
      <h1>{`Every ${w.one}, ranked by `}<span>{`real ${p.many}`}</span></h1>
      <p className="lt-sub">We read Reddit, YouTube and forums so you don’t have to. Every opinion links to its source.</p>
      <div className="lt-seg" role="group" aria-label="Order">{sorts.map(s => <a key={s.label} href={link({ sort: s.v })} aria-current={s.on ? "true" : undefined}>{s.label}</a>)}</div>
      <AutoSubmitForm className="lt-search" action="/">
        {Object.entries({ ...keep, shape: f.shape, sort: f.sort }).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v as string}/>)}
        <input type="search" name="q" defaultValue={f.q || ""} placeholder={`Search a ${w.one} or brand`} aria-label={`Search ${w.many}`}/>
        <button type="submit">Search</button>
      </AutoSubmitForm>
    </section>

    <div className="lt-grid" id="board">
      <div className="lt-board">
        {(f.q || shape) && <p className="lt-filtered">{`${fmt(results.length)} ${results.length === 1 ? w.one : w.many}${shape ? ` · ${shape.label}` : ""}${f.q ? ` · “${f.q}”` : ""} · `}<a href={link({ q: undefined, shape: undefined })}>clear</a></p>}
        <Directory show={parseShow(f.show)} moreHref={n => link({ show: String(n) })} rows={results.map(({ r }, i) => <Row key={r.id} data={data} r={r} rank={ranked ? i + 1 : null} signal={signals.get(r.id)?.signal} line={consensus(tc.get(r.id))}/>)}/>
        {!results.length && <p className="lt-filtered">{`Nothing matches. `}<a href={link({ q: undefined, shape: undefined })}>Show all</a></p>}
      </div>
      <aside className="lt-side">
        <Mini title="Fresh opinions" href="#latest" items={fresh.map(e => { const r = data.rackets.find(x => x.id === e.racketId)!; return { key: e.id, art: <SourceIcon platform={e.sourcePlatform}/>, name: displayName(r.name, brandOf(r.brandId)), href: productHref(r), value: <span className={`lt-s lt-s-${e.sentiment}`}>{ago(e.createdAt, now).replace(" ago", "")}</span> }; })}/>
        {side.map(l => <Mini key={l.list.slug} title={l.list.label} href={listHref(l.list.slug)} items={l.entries.slice(0, 5).map(e => { const full = data.rackets.find(r => r.id === e.product.id); return { key: e.product.id, rank: e.rank, art: full ? <ProductArt product={full} brand={brandOf(full.brandId)}/> : null, name: displayName(e.product.name, brandOf(e.product.brandId)), href: productHref(e.product), value: signals.get(e.product.id)?.signal ?? "" }; })}/>)}
        <p className="lt-note">The signal is positive opinions weighed by how many there are. No sponsored picks. <a href="/about#signal">How it works</a></p>
      </aside>
    </div>
  </div>;
}
