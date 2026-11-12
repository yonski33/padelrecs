// Two home-page directions for the owner to choose between (2026-11-12), shown with ?home=a or ?home=b; the live home
// page is unchanged until one is picked. The owner's brief: keep it visual, but make it read as a live review database
// at first glance, not a generic affiliate magazine.
// A: database-forward. Search-first hero with live counters, a ranked table, a live stream of incoming reviews,
//    categories with numbers, how it works.
// B: hybrid. The same promise and counters, with the photo-led top five and category tiles kept, plus the live stream.
// Every number is counted from published reviews.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche, catalogPath, productHref } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { sourceLabel, platformName } from "../lib/source-label";
import { ProductArt, SentimentBar, Arrow, SignalInfo, BrowseTile, browseTiles } from "./visual";
import { SourceIcon } from "./icons";
import { RacketSearch } from "./racket-search";
import { CountUp } from "./count-up";
import type { RankedList } from "./rankings/lists";
import { listHref } from "./rankings/lists";
import type { Signal } from "../lib/signal";

const DAY = 86_400_000;
type Props = { all: Catalog; picks: RankedList[]; signals: Map<string, Signal>; now: number };

/** Counts for the promise line: reviews, distinct source threads, products, sources and when the latest came in. */
function counts({ all, now }: Props) {
  const threads = new Set(all.external.map(e => /reddit\.com\/r\/[^/]+\/comments\/([a-z0-9]+)/i.exec(e.sourceUrl)?.[1] ?? e.sourceUrl.replace(/[?#].*$/, "")));
  const bySource = new Map<string, number>();
  for (const e of all.external) { const p = platformName(e.sourcePlatform); bySource.set(p, (bySource.get(p) ?? 0) + 1); }
  if (all.reviews.length) bySource.set(niche.site.name, all.reviews.length);
  const added = (days: number) => [...all.reviews, ...all.external].filter(x => Date.parse(x.createdAt) >= now - days * DAY).length;
  const latest = [...all.reviews, ...all.external].reduce((m, x) => x.createdAt > m ? x.createdAt : m, "");
  return { total: all.reviews.length + all.external.length, threads: threads.size, products: all.listed.length, sources: [...bySource].sort((a, b) => b[1] - a[1]), today: added(1), week: added(7), latest };
}

const ago = (iso: string, now: number) => { const d = Math.floor((now - Date.parse(iso)) / DAY); return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };
const fmt = (n: number) => n.toLocaleString("en-US");

function Promise_({ c, now, compact = false, side }: { c: ReturnType<typeof counts>; now: number; compact?: boolean; side?: React.ReactNode }) {
  return <section className={`hv-hero${compact ? " compact" : ""}${side ? " with-side" : ""}`}><div className="hv-hero-main">
    <p className="hv-kicker">{`A live database of ${niche.people.one} reviews · no sponsored picks`}</p>
    <h1>{`Every ${niche.words.one}, ranked by what ${niche.people.many} actually say`}</h1>
    <div className="hv-search"><RacketSearch/></div>
    <p className="hv-counter"><b><CountUp value={c.total}/></b>{` first-hand reviews from ${fmt(c.threads)} threads and videos, on ${fmt(c.products)} ${niche.words.many} · updated ${ago(c.latest, now)}`}</p>
    <ul className="hv-sources">{c.sources.slice(0, 5).map(([p, n]) => <li key={p}><SourceIcon platform={p === niche.site.name ? "forum" : p}/>{p}<b>{fmt(n)}</b></li>)}</ul>
  </div>{side}</section>;
}

/** The latest reviews coming in: source, community and date, one line each. */
function Stream({ all, now }: Props) {
  const nameOf = (id: string) => { const r = all.rackets.find(x => x.id === id); return r ? { r, name: displayName(r.name, all.brands.find(b => b.id === r.brandId)?.name) } : null; };
  // One line per product, newest first, so a burst of reviews on one product doesn't fill the stream.
  const seen = new Set<string>();
  const latest = [...all.external].filter(e => e.sentiment).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter(e => !seen.has(e.racketId) && seen.add(e.racketId)).slice(0, 6);
  return <section className="hv-stream" aria-labelledby="hv-stream-title">
    <div className="section-head"><h2 id="hv-stream-title"><span className="hv-live" aria-hidden="true"/>Just added</h2><a className="section-link" href="#latest">All latest reviews<Arrow/></a></div>
    <ul>{latest.map(e => { const p = nameOf(e.racketId); const label = sourceLabel(e); if (!p) return null; return <li key={e.id}>
      <SourceIcon platform={e.sourcePlatform}/>
      <a className="hv-s-product" href={productHref(p.r)}>{p.name}</a>
      <span className={`spill s-${e.sentiment}`}>{e.sentiment}</span>
      <span className="hv-s-src">{[label.platform, label.name].filter(Boolean).join(" · ")}</span>
      <span className="hv-s-when">{ago(e.createdAt, now)}</span>
    </li>; })}</ul>
  </section>;
}

/** The lead ranking as a compact table: rank, small photo, name, signal, split, reviews, the top liked and disliked theme. */
function RankedTable({ all, picks, signals }: Props) {
  const lead = picks[0];
  if (!lead) return null;
  const brandOf = (id: string) => all.brands.find(b => b.id === id)?.name;
  return <section className="hv-table" aria-labelledby="hv-table-title">
    <div className="section-head"><h2 id="hv-table-title">{lead.list.title}</h2><a className="section-link" href={listHref(lead.list.slug)}>{`Full ranking (${lead.entries.length})`}<Arrow/></a></div>
    <table>
      <thead><tr><th scope="col">#</th><th scope="col">{niche.words.One}</th><th scope="col">Signal <SignalInfo/></th><th scope="col">What reviews say</th><th scope="col" className="hv-num">Reviews</th><th scope="col">Liked / disliked</th></tr></thead>
      <tbody>{lead.entries.slice(0, 8).map(e => { const full = all.rackets.find(r => r.id === e.product.id); const s = score(all, e.product.id); const sig = signals.get(e.product.id);
        return <tr key={e.product.id}>
          <td className="hv-rank">{e.rank}</td>
          <td><a className="hv-prod" href={productHref(e.product)}>{full && <ProductArt product={full} brand={brandOf(e.product.brandId)}/>}<span>{displayName(e.product.name, brandOf(e.product.brandId))}</span></a></td>
          <td className="hv-sig">{sig?.signal ?? "—"}</td>
          <td className="hv-bar"><SentimentBar positive={s.positive} mixed={s.mixed} negative={s.negative}/><small>{`${Math.round(100 * s.positive / Math.max(1, s.judged))}% positive`}</small></td>
          <td className="hv-num">{fmt(s.judged)}</td>
          <td className="hv-tags">{e.pros[0] && <span className="chip-liked">{e.pros[0].label}</span>}{e.con && <span className="chip-watch">{e.con.label}</span>}</td>
        </tr>; })}</tbody>
    </table>
  </section>;
}

/** Categories with their numbers: type pages where the niche has them, else the rankings. */
function Categories({ all, picks }: Props) {
  const rows = niche.typePages?.length
    ? niche.typePages.map(t => { const ids = new Set(all.listed.filter(r => r.shape?.toLowerCase() === t.shape.toLowerCase()).map(r => r.id)); return { href: `/${t.slug}`, label: t.label, products: ids.size, reviews: [...all.reviews, ...all.external].filter(x => ids.has(x.racketId)).length }; })
    : picks.map(p => ({ href: listHref(p.list.slug), label: p.list.label, products: p.entries.length, reviews: p.reviews }));
  return <section className="hv-cats" aria-labelledby="hv-cats-title">
    <div className="section-head"><h2 id="hv-cats-title">{niche.typePages?.length ? "Browse by category" : "Explore the rankings"}</h2></div>
    <ul>{rows.filter(r => r.products).map(r => <li key={r.href}><a href={r.href}><b>{r.label}</b><span>{`${fmt(r.products)} ${niche.typePages?.length ? niche.words.many : "ranked"} · ${fmt(r.reviews)} reviews`}</span><Arrow/></a></li>)}</ul>
  </section>;
}

function HowItWorks() {
  return <section className="hv-how" aria-labelledby="hv-how-title">
    <h2 id="hv-how-title">How it works</h2>
    <ol>
      <li><b>We read the threads</b><span>{`Reddit, YouTube, forums and blogs, plus reviews ${niche.people.many} write here.`}</span></li>
      <li><b>We summarize first-hand experiences</b><span>Only people who used it, each linked to the original, read as positive, mixed or negative.</span></li>
      <li><b>We rank by signal</b><span>Positive reviews weighed by how many there are. No sponsored picks.</span></li>
    </ol>
    <a className="section-link" href="/about#signal">How the signal works<Arrow/></a>
  </section>;
}

export function HomeA(props: Props) {
  const c = counts(props);
  return <>
    <Promise_ c={c} now={props.now} side={<Stream {...props}/>}/>
    <RankedTable {...props}/>
    <Categories {...props}/>
    <HowItWorks/>
  </>;
}

export function HomeB(props: Props) {
  const c = counts(props), lead = props.picks[0];
  const tiles = browseTiles(props.all, props.picks, id => props.all.reviews.filter(r => r.racketId === id).length + props.all.external.filter(e => e.racketId === id).length);
  const brandOf = (id: string) => props.all.brands.find(b => b.id === id)?.name;
  return <>
    <Promise_ c={c} now={props.now} compact/>
    {lead && <section className="top5 hv-top5" aria-labelledby="hv-top5-title">
      <div className="section-head"><h2 id="hv-top5-title">{lead.list.title}</h2><a className="section-link" href={listHref(lead.list.slug)}>{`See the top ${lead.entries.length}`}<Arrow/></a></div>
      <ol className="top5-row">{lead.entries.slice(0, 5).map(e => { const full = props.all.rackets.find(r => r.id === e.product.id); const s = score(props.all, e.product.id); const sig = props.signals.get(e.product.id);
        return <li key={e.product.id}><a className="pcard" href={productHref(e.product)}>
          <span className="rank-badge">{String(e.rank).padStart(2, "0")}</span>
          {full && <ProductArt product={full} brand={brandOf(e.product.brandId)} eager/>}
          <span className="pcard-body"><span className="pcard-name">{displayName(e.product.name, brandOf(e.product.brandId))}</span>
            <span className="hv-card-data"><b>{sig?.signal ?? "—"}</b><span>signal</span><span>{`${Math.round(100 * s.positive / Math.max(1, s.judged))}% positive · ${fmt(s.judged)} reviews`}</span></span></span>
        </a></li>; })}</ol>
    </section>}
    <div className="hv-split"><Stream {...props}/><HowItWorks/></div>
    {tiles.length > 0 && <section className="browse hv-tiles"><div className="section-head"><h2>{niche.typePages?.length ? "Browse by category" : "Explore the rankings"}</h2><a className="section-link" href={catalogPath}>{`All ${niche.words.many}`}<Arrow/></a></div>
      <div className="btile-row">{tiles.slice(0, 4).map(t => <BrowseTile key={t.key} tile={t} data={props.all}/>)}</div></section>}
    {tiles.length === 0 && <Categories {...props}/>}
  </>;
}
