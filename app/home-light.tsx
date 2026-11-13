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
import { RANKINGS_PATH } from "../lib/top-lists";
import { webDate } from "../lib/recent";
import type { Signal } from "../lib/signal";
import type { RankedList } from "./rankings/lists";
import { listHref } from "./rankings/lists";
import { HomeBoard, HomeSearch, HomeSort } from "./home-board";
import { ProductArt, SignalPop } from "./visual";
import { LightRow, quickAmazon } from "./light-row";
import { SourceIcon } from "./icons";
import { lightFont } from "./light-font";
import { listLine } from "../lib/list-lines";
import { shortLine } from "../lib/short-lines";
import { shapeChoices, tagCounts, consensus, ago } from "./home-catalog";

// Preview links carry the light look through to the product page.
const lightHref = productHref;
const DAY = 86_400_000, w = niche.words, p = niche.people;
const fmt = (n: number) => n.toLocaleString("en-US");
type Product = Catalog["listed"][number];
export type LightFilters = { q?: string; shape?: string; sort?: string; show?: string };

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
  // The home list opens most discussed first on every site (owner, 2026-11-13): review counts compare across categories,
  // and the signal-score order belongs to the rankings. "Top rated" is still in the menu.
  const sort = f.sort ? parseSort(f.sort) : "discussed", shapes = shapeChoices(), shape = shapes.find(c => c.key === f.shape), tc = tagCounts(data);
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
  const sorts = [{ v: undefined, label: "Most discussed", on: sort === "discussed" }, { v: DEFAULT_SORT, label: "Top rated", on: sort === DEFAULT_SORT }, { v: "newest", label: "Newest", on: sort === "newest" }];

  // Side lists: the newest opinions (one per product), then the top five of two rankings.
  const seen = new Set<string>();
  const fresh = [...data.external].filter(e => e.sentiment).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter(e => !seen.has(e.racketId) && seen.add(e.racketId)).slice(0, 5);
  const side = picks.filter((l, i) => l.entries.length >= 5 && picks.findIndex(x => x.list.title === l.list.title) === i).slice(1, 3);

  return <div className={`lt ${lightFont.className}`}>
    <section className="lt-hero">
      <div className="lt-live"><span className="lt-dot" aria-hidden="true"/>{`${week ? `${fmt(week)} new this week · ` : ""}${fmt(everything.length)} ${p.one} reviews`}</div>
      <h1>{`Every ${w.one}, ranked by `}<span>{`real ${p.many}`}</span></h1>
      <p className="lt-sub">Real reviews from Reddit, YouTube and blogs, linked to their sources.</p>
      {/* Filters the list as you type, without a reload (owner, 2026-11-13). */}
      <HomeSearch initial={f.q} placeholder={`Search a ${w.one} or brand`} label={`Search ${w.many}`}/>
    </section>

    <div className="lt-grid" id="board">
      <div className="lt-board">
        {/* One quiet row over the list (owner, 2026-11-12): the categories as plain words with a count and an underline on
            the one picked. It stays at the top while the long list scrolls. */}
        <HomeBoard how={sort === "discussed" ? <><span>Most discussed first<span className="lt-how-long">: the products with the most reviews.</span></span> {picks.length > 0 && <a href={RANKINGS_PATH}>See the rankings ›</a>}</>
          : sort === DEFAULT_SORT ? <><span>Sorted by signal score<span className="lt-how-long">: positive reviews, weighted by how many there are.</span></span> <SignalPop label="How it works"/></>
          : <span>Newest first.</span>} noun={[w.one, w.many]} sort={<HomeSort value={sort === "discussed" ? "" : sort} options={sorts.map(s => ({ value: s.v ?? "", label: s.label }))}/>} cats={cats} initial={shape?.key} initialQ={f.q} ranked={false} base={new URLSearchParams(Object.entries({ ...keep, sort: f.sort }).filter(([, v]) => v) as [string, string][]).toString()}
          noMatch={`No ${w.one} matches that. Try a brand or part of the name.`}
          items={results.map(({ r }) => ({ key: r.id, shape: shapes.find(c => inShape(r, c))?.key ?? null, text: `${data.brands.find(b => b.id === r.brandId)?.name ?? ""} ${r.name} ${r.shape ?? ""}`, node: <LightRow data={data} r={r} rank={null} signal={signals.get(r.id)?.signal} line={shortLine(r) ?? listLine(r) ?? consensus(tc.get(r.id))} shop={quickAmazon(r, brandOf(r.brandId))}/> }))}
          // A new site (TVRecs, 2026-11-13) before its first reviews are in.
          empty={<p className="lt-filtered">{`The first ${p.one} reviews are being collected; ${w.many} appear here as soon as they have some. `}<a href="/add-review">Add a review →</a></p>}/>
      </div>
      <aside className="lt-side">
        <Mini title="Fresh reviews" href="#latest" items={fresh.map(e => { const r = data.rackets.find(x => x.id === e.racketId)!; return { key: e.id, art: <SourceIcon platform={e.sourcePlatform}/>, name: displayName(r.name, brandOf(r.brandId)), href: lightHref(r), value: <span className={`lt-s lt-s-${e.sentiment}`}>{ago(e.createdAt, now).replace(" ago", "")}</span> }; })}/>
        {side.map(l => <Mini key={l.list.slug} title={/^best\b/i.test(l.list.label) ? l.list.label : `Best ${l.list.label[0].toLowerCase()}${l.list.label.slice(1)}`} href={listHref(l.list.slug)} items={l.entries.slice(0, 5).map(e => { const full = data.rackets.find(r => r.id === e.product.id); return { key: e.product.id, rank: e.rank, art: full ? <ProductArt product={full} brand={brandOf(full.brandId)}/> : null, name: displayName(e.product.name, brandOf(e.product.brandId)), href: lightHref(e.product), value: signals.get(e.product.id)?.signal ?? "" }; })}/>)}
      </aside>
    </div>
  </div>;
}
