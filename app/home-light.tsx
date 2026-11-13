// Direction D (owner, 2026-11-12): light and easy to scan, after outbid.lol's feel. One rounded sans, a warm off-white
// page, one soft accent. A pill bar of types and rankings, a small centred hero with the search, then a compact
// leaderboard (rank, small photo, name, one grey line, a tiny meta line, the signal) with short #1–#5 lists beside it.
// Shown with ?home=d until the owner picks a direction; every number is counted from published reviews.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche, productHref } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { matchingRackets } from "../lib/racket-search";
import { sortProducts } from "../lib/product-sort";
import { RANKINGS_PATH } from "../lib/top-lists";
import { catalogKeyword } from "../lib/catalogue-seo";
import { webDate } from "../lib/recent";
import type { Signal } from "../lib/signal";
import type { RankedList } from "./rankings/lists";
import { listHref } from "./rankings/lists";
import { HomeBoard, HomeSearch } from "./home-board";
import { quoteText } from "./visual";
import { LightRow, quickAmazon } from "./light-row";
import { ProductIcon, SourceIcon } from "./icons";
import { lightFont } from "./light-font";
import { listLine } from "../lib/list-lines";
import { shortLine } from "../lib/short-lines";
import { shapeChoices, tagCounts, consensus, ago } from "./home-catalog";

// Preview links carry the light look through to the product page.
const lightHref = productHref;
const DAY = 86_400_000, TALK_DAYS = 182, w = niche.words, p = niche.people;
const fmt = (n: number) => n.toLocaleString("en-US");
type Product = Catalog["listed"][number];
export type LightFilters = { q?: string; shape?: string; sort?: string; show?: string };

// "skincare products", "padel rackets", "climbing gear": the catalogue's keyword, lowercased except acronyms ("AI tools").
const talkLabel = niche.talkLabel ?? catalogKeyword.split(" ").map(x => /^[A-Z]{2,}s?$/.test(x) ? x : x.toLowerCase()).join(" ");

/** "Best Padel Rackets for Power" → "Best padel rackets for power" (acronyms stay: "Best AI Tools" → "Best AI tools"). */
const sentence = (t: string) => t.split(" ").map((x, i) => i === 0 || /^[A-Z0-9]{2,}s?$/.test(x) ? x : x.toLowerCase()).join(" ");

export function HomeLight({ data, f, signals, picks, now, keep = {} }: { data: Catalog; f: LightFilters; signals: Map<string, Signal>; picks: RankedList[]; now: number; keep?: Record<string, string> }) {
  // The home list is a "most reviewed" browse on every site (owner and auditor, 2026-11-13): review counts compare across
  // categories, so there's no sort menu and no signal score here; the signal order belongs to the rankings.
  const sort = "discussed", shapes = shapeChoices(), shape = shapes.find(c => c.key === f.shape), tc = tagCounts(data);
  const inShape = (r: Product, c = shape) => !c || c.shapes.some(s => s.toLowerCase() === (r.shape ?? "").toLowerCase());
  const searched = matchingRackets(data.listed, f.q || "");
  // Category names as the site says them elsewhere ("Cleansers"), with how many products each holds under the search.
  const plural = (c: { key: string; label: string; shapes: string[] }) => niche.typePages?.find(t => c.shapes.some(s => s.toLowerCase() === t.shape.toLowerCase()))?.label ?? c.label;
  const cats = shapes.map(c => ({ key: c.key, label: plural(c), n: searched.filter(r => inShape(r, c)).length })).filter(c => c.n > 0 || c.key === shape?.key);
  // Every product, in order; the search box and the category row filter them on the page (app/home-board.tsx).
  // "Most talked-about" (owner, 2026-11-13): ordered by the reviews posted in the last six months, dated by their source,
  // so the list follows what people discuss now (2026 rackets, not the 2025 ones with the most reviews ever). Products
  // with no recent reviews follow, most reviewed first.
  const since = now - TALK_DAYS * DAY, recent = new Map<string, number>();
  for (const e of data.external) if (Date.parse(webDate(e)) >= since) recent.set(e.racketId, (recent.get(e.racketId) ?? 0) + 1);
  for (const r of data.reviews) if (Date.parse(r.createdAt) >= since) recent.set(r.racketId, (recent.get(r.racketId) ?? 0) + 1);
  const results = sortProducts(data.listed.map(r => ({ r, s: score(data, r.id) })), sort)
    .sort((a, b) => (recent.get(b.r.id) ?? 0) - (recent.get(a.r.id) ?? 0));
  const link = (extra: Record<string, string | undefined>) => { const q = new URLSearchParams(Object.entries({ ...keep, ...f, show: undefined, ...extra }).filter(([, v]) => v) as [string, string][]); return q.size ? `/?${q}#board` : "/#board"; };
  const brandOf = (id: string) => data.brands.find(b => b.id === id)?.name;
  const everything = [...data.reviews, ...data.external];
  const week = [...data.reviews.map(r => r.createdAt), ...data.external.map(webDate)].filter(d => Date.parse(d) >= now - 7 * DAY).length;

  // Side lists: the newest opinions (one per product), then the top five of two rankings.
  const seen = new Set<string>();
  const fresh = [...data.external].filter(e => e.sentiment).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter(e => !seen.has(e.racketId) && seen.add(e.racketId)).slice(0, 5);
  // Rankings to explore: one per category where the site has them (Best cleansers, Best serums…), else its first lists.
  const uniq = picks.filter((l, i) => l.entries.length > 0 && picks.findIndex(x => x.list.slug === l.list.slug) === i);
  const byType = uniq.filter(l => !l.list.trait);
  // Each by its title in sentence case; a year list adds its year ("Best padel rackets of 2025"), and repeats are dropped.
  const rankName = (l: RankedList) => { const y = l.list.label.match(/\b(19|20)\d{2}\b/)?.[0], t = sentence(l.list.title); return y && !t.includes(y) ? `${t} of ${y}` : t; };
  const named = new Set<string>();
  const explore = (byType.length >= 3 ? byType : uniq).filter(l => !named.has(rankName(l)) && !!named.add(rankName(l))).slice(0, 5);

  return <div className={`lt ${lightFont.className}`}>
    <section className="lt-hero">
      <div className="lt-live"><span className="lt-dot" aria-hidden="true"/>{`${week ? `${fmt(week)} new this week · ` : ""}${fmt(everything.length)} ${p.one} reviews`}</div>
      <h1>{`Every ${w.one}, reviewed by `}<span>{`real ${p.many}`}</span></h1>
      <p className="lt-sub">Real reviews from Reddit, YouTube and blogs, linked to their sources.</p>
      {/* Filters the list as you type, without a reload (owner, 2026-11-13). */}
      <HomeSearch initial={f.q} placeholder={`Search a ${w.one} or brand`} label={`Search ${w.many}`}/>
    </section>

    <div className="lt-grid" id="board">
      <div className="lt-board">
        {/* A clear title says what the order is, so nobody reads it as a rating (auditor's mockup, owner, 2026-11-13). The
            verdict lives in the rankings, one prominent link away. */}
        <header className="lt-listhead">
          <div><h2>{`Most talked about ${talkLabel}`}</h2>
            <p>{`The ${w.many} people have posted about most in the last 6 months, on Reddit, YouTube and blogs.`}</p></div>
          {picks.length > 0 && <a className="lt-explore" href={RANKINGS_PATH}>Explore rankings <span aria-hidden="true">→</span></a>}
        </header>
        {/* The categories as plain words with a count and an underline on the one picked (owner, 2026-11-12). */}
        <HomeBoard noun={[w.one, w.many]} cats={cats} initial={shape?.key} initialQ={f.q} ranked={false} base={new URLSearchParams(Object.entries(keep).filter(([, v]) => v) as [string, string][]).toString()}
          noMatch={`No ${w.one} matches that. Try a brand or part of the name.`}
          items={results.map(({ r }) => ({ key: r.id, shape: shapes.find(c => inShape(r, c))?.key ?? null, text: `${data.brands.find(b => b.id === r.brandId)?.name ?? ""} ${r.name} ${r.shape ?? ""}`, node: <LightRow data={data} r={r} rank={null} noSignal line={shortLine(r) ?? listLine(r) ?? consensus(tc.get(r.id))} shop={quickAmazon(r, brandOf(r.brandId))}/> }))}
          // A new site (TVRecs, 2026-11-13) before its first reviews are in.
          empty={<p className="lt-filtered">{`The first ${p.one} reviews are being collected; ${w.many} appear here as soon as they have some. `}<a href="/add-review">Add a review →</a></p>}/>
      </div>
      {/* The side after the auditor's mockup (owner, 2026-11-13): the newest reviews with a line of each, then the rankings. */}
      <aside className="lt-side lt-side2">
        <section className="ls-fresh">
          <div className="ls-head"><h2>Fresh reviews</h2><a href="/reviews">See all <span aria-hidden="true">→</span></a></div>
          <ul>{fresh.slice(0, 4).map(e => { const r = data.rackets.find(x => x.id === e.racketId)!; return <li key={e.id}><a href={`${lightHref(r)}#reviews`}>
            <span className="ls-src"><SourceIcon platform={e.sourcePlatform}/></span>
            <span className="ls-body"><b>{displayName(r.name, brandOf(r.brandId))}</b><span className="ls-quote">{`“${quoteText(e)}”`}</span></span>
            <span className="ls-ago">{`· ${ago(e.createdAt, now)}`}</span></a></li>; })}</ul>
        </section>
        {explore.length > 0 && <section className="ls-rank">
          <div className="ls-head"><h2>Explore rankings</h2></div>
          <ul>{explore.map(l => <li key={l.list.slug}><a href={listHref(l.list.slug)}>
            <span className="ls-icon" aria-hidden="true"><ProductIcon shape={l.entries[0]?.product.shape ?? null} brand={brandOf(l.entries[0]?.product.brandId ?? "")}/></span>
            <b>{rankName(l)}</b>
            <span className="ls-go" aria-hidden="true">→</span></a></li>)}</ul>
        </section>}
      </aside>
    </div>
  </div>;
}
