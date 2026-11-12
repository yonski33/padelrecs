// Direction C (owner's mockup, 2026-11-12): the home page is the racket index. A hero that says what the site is ("A
// racket index built from players' opinions."), a "keeps growing" strip, a row of filters, the ranked list with a one-line
// player consensus, and "Fresh from the court" beside it with the newest opinions. Shown with ?home=c until the owner
// picks it; every number is counted from published reviews.
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche, productHref } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { matchingRackets } from "../lib/racket-search";
import { SORTS, DEFAULT_SORT, parseSort, sortProducts } from "../lib/product-sort";
import { sourceLabel } from "../lib/source-label";
import { tagTone } from "../lib/tags";
import { webDate } from "../lib/recent";
import type { Signal } from "../lib/signal";
import type { SpecColumn } from "../lib/niche/types";
import { Directory, parseShow } from "./components";
import { AutoSubmitForm } from "./auto-submit";
import { ProductArt, SentimentBar, Arrow, SignalInfo, quoteText } from "./visual";
import { SourceIcon } from "./icons";
import { CompareTray } from "./compare/compare-pick";

const DAY = 86_400_000, HOUR = 3_600_000, w = niche.words, p = niche.people;
const fmt = (n: number) => n.toLocaleString("en-US");
const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;
type Product = Catalog["listed"][number];
export type IndexFilters = { q?: string; brand?: string; shape?: string; sort?: string; show?: string } & Partial<Record<SpecColumn, string>>;

/** The shape/type choices: the niche's grouped tabs where it has them, else its shape list. */
const shapeChoices = () => niche.shapeTabs?.length
  ? niche.shapeTabs.map(t => ({ key: t.key, label: t.label, shapes: t.shapes }))
  : niche.shapeFilter.map(s => ({ key: s, label: s, shapes: [s] }));
/** Other specs with a fixed list of values (padel balance, skincare fragrance) get a dropdown too. */
const specFacets = niche.specs.filter(s => s.column !== "shape" && s.options?.length);
/** "High (~26 cm)" and "Medium-high" count as High and Medium: the value starts with the option, then a non-letter. */
const specIs = (value: unknown, option: string) => typeof value === "string" && value.toLowerCase().startsWith(option.toLowerCase()) && !/[a-z]/i.test(value.charAt(option.length));
const spec = (r: Product, column: SpecColumn) => (r as Record<string, unknown>)[column];

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

/** One line of player consensus from the most mentioned liked and disliked themes (3+ mentions each). */
function consensus(counts: Map<string, number> | undefined) {
  const top = (tone: string) => [...(counts ?? [])].filter(([t, n]) => n >= 3 && tagTone(t) === tone).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  const liked = top("pos").slice(0, 2), disliked = top("neg")[0];
  if (!liked.length && !disliked) return null;
  const praise = liked.length ? cap(liked.join(", ")) : "";
  return praise && disliked ? `${praise}; some find it ${disliked}.` : praise ? `${praise}.` : `Some find it ${disliked}.`;
}

/** The short spec line: shape, then the other fixed-value specs with their label ("Medium balance"). */
function specLine(r: Product) {
  const parts = [typeof r.shape === "string" ? r.shape : ""];
  for (const sp of specFacets) { const o = sp.options!.find(o => specIs(spec(r, sp.column), o)); if (o) parts.push(sp.column === "balance" && niche.id === "padel" ? `${o} balance` : o); }
  return parts.filter(Boolean).join(" · ");
}

function IndexRow({ data, r, rank, signal, tags }: { data: Catalog; r: Product; rank: number | null; signal?: number; tags?: Map<string, number> }) {
  const brand = data.brands.find(b => b.id === r.brandId)?.name, name = displayName(r.name, brand), href = productHref(r);
  const s = score(data, r.id), total = s.count + s.web, line = consensus(tags), specs = specLine(r);
  const pos = s.judged >= 3 ? Math.round(100 * s.positive / s.judged) : null;
  return <article className="ix-row">
    <span className="ix-rank">{rank !== null ? String(rank).padStart(2, "0") : ""}</span>
    <a className="ix-art" href={href} aria-hidden="true" tabIndex={-1}><ProductArt product={r} brand={brand}/></a>
    <div className="ix-main">
      <h3><a href={href}>{name}</a></h3>
      {specs && <p className="ix-specs">{specs}</p>}
      {line && <p className="ix-line">{line}</p>}
      <p className="ix-n">{pos !== null && <b>{`${pos}% positive`}</b>}{pos !== null && " · "}{`${fmt(total)} ${total === 1 ? "opinion" : "opinions"}`}</p>
      {pos !== null && <SentimentBar positive={s.positive} mixed={s.mixed} negative={s.negative}/>}
    </div>
    <a className="ix-sig" href={`${href}#reviews`} aria-label={signal ? `Signal ${signal}` : "Reviews"}>{signal ? <><b>{signal}</b><span>Signal</span></> : <span className="ix-few">Too few to score</span>}</a>
  </article>;
}

const ago = (iso: string, now: number) => { const h = Math.floor((now - Date.parse(iso)) / HOUR); return h < 1 ? "just now" : h < 24 ? `${h} hour${h === 1 ? "" : "s"} ago` : h < 48 ? "yesterday" : `${Math.floor(h / 24)} days ago`; };
const clip = (s: string, n = 90) => s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n)).replace(/[,;:.]$/, "")}…`;

/** The newest opinions, one per product: reviews written here in quotes (their own words), web opinions as our summary. */
function Fresh({ data, now }: { data: Catalog; now: number }) {
  type Item = { key: string; id: string; at: string; kind: "own" | "web"; platform: string; head: string; text: string };
  const items: Item[] = [
    ...data.reviews.map(r => ({ key: `p${r.id}`, id: r.racketId, at: r.createdAt, kind: "own" as const, platform: "forum", head: `${p.one} review`, text: r.reviewText })),
    ...data.external.filter(e => e.sentiment && quoteText(e)).map(e => { const l = sourceLabel(e); return { key: `w${e.id}`, id: e.racketId, at: e.createdAt, kind: "web" as const, platform: e.sourcePlatform, head: l.platform, text: quoteText(e) }; }),
  ].sort((a, b) => b.at.localeCompare(a.at));
  // One per product, and the newest from each kind of source first (a review written here, Reddit, YouTube...), so the box
  // shows where opinions come from rather than four Reddit threads.
  const seen = new Set<string>(), fresh = items.filter(x => !seen.has(x.id) && seen.add(x.id));
  const kinds = new Set<string>(), first = fresh.filter(x => { const k = x.kind === "own" ? "own" : x.head; return !kinds.has(k) && kinds.add(k); });
  const pick = [...first, ...fresh.filter(x => !first.includes(x))].slice(0, 4).sort((a, b) => b.at.localeCompare(a.at));
  const nameOf = (id: string) => { const r = data.rackets.find(x => x.id === id); return r ? { r, name: displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name) } : null; };
  return <aside className="ix-fresh" aria-labelledby="ix-fresh-title">
    <h2 id="ix-fresh-title">{niche.id === "padel" ? "Fresh from the court" : "Fresh opinions"}</h2>
    <p className="ix-fresh-sub">New opinions added to the database.</p>
    <ul>{pick.map(x => { const n = nameOf(x.id); if (!n) return null; return <li key={x.key}>
      <p className="ix-fresh-src"><SourceIcon platform={x.platform}/>{`${x.head} · ${ago(x.at, now)}`}</p>
      <a className="ix-fresh-name" href={productHref(n.r)}>{n.name}</a>
      <p className="ix-fresh-text">{x.kind === "own" ? `“${clip(x.text)}”` : clip(x.text)}</p>
      <span className="ix-fresh-kind">{x.kind === "own" ? `Written by a ${p.one} here` : `Summary of a ${p.one}’s ${x.head === "YouTube" ? "video" : "post"}`}</span>
    </li>; })}</ul>
    <a className="ix-fresh-all" href="#latest">View all recent reviews<Arrow/></a>
    <p className="ix-fresh-note">Every web opinion links to its original discussion.</p>
  </aside>;
}

export function HomeC({ data, f, signals, now, basePath = "/", keep = {} }: { data: Catalog; f: IndexFilters; signals: Map<string, Signal>; now: number; basePath?: string; keep?: Record<string, string> }) {
  const sort = parseSort(f.sort), shapes = shapeChoices(), shape = shapes.find(c => c.key === f.shape);
  const tc = tagCounts(data);
  const results = sortProducts(matchingRackets(data.listed, f.q || "")
    .filter(r => (!f.brand || r.brandId === f.brand)
      && (!shape || shape.shapes.some(s => s.toLowerCase() === (r.shape ?? "").toLowerCase()))
      && specFacets.every(sp => !f[sp.column] || specIs(spec(r, sp.column), f[sp.column]!)))
    .map(r => ({ r, s: score(data, r.id) })), sort, x => { const g = signals.get(x.r.id); return g && g.signal * 10_000 - g.rank; });
  const link = (extra: Record<string, string | undefined>) => { const q = new URLSearchParams(Object.entries({ ...keep, ...f, show: undefined, ...extra }).filter(([, v]) => v) as [string, string][]); return q.size ? `${basePath}?${q}#browse` : `${basePath}#browse`; };
  const refined = !!(f.q || f.brand || f.shape || specFacets.some(s => f[s.column]));
  const reset = link(Object.fromEntries(["q", "brand", "shape", "sort", ...specFacets.map(s => s.column)].map(k => [k, undefined])));
  const ranked = sort === DEFAULT_SORT && !f.q;

  const everything = [...data.reviews, ...data.external];
  // New opinions by the date they were written (the source's own date where we have it), not when we read them: re-reading
  // old threads would otherwise make hundreds look new.
  const written = [...data.reviews.map(r => r.createdAt), ...data.external.map(webDate)].map(d => Date.parse(d));
  const week = written.filter(t => t >= now - 7 * DAY).length, today = written.filter(t => t >= now - DAY).length;
  const updated = everything.reduce((m, x) => x.createdAt > m ? x.createdAt : m, "");
  const Select = ({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) =>
    <label className="ix-sel"><span className="sr-only">{label}</span><select name={name} defaultValue={value || ""}><option value="">{`${label}: All`}</option>{options.map(o => <option key={o.value} value={o.value}>{`${label}: ${o.label}`}</option>)}</select></label>;

  return <>
    <section className="ix-hero">
      <div>
        <p className="hv-kicker">{`Not another ${w.one} review site`}</p>
        <h1>{`A ${w.one} index built from `}<em>{`${p.many}’ opinions.`}</em></h1>
        <p className="ix-lede">{`Real experiences, collected across the web and organized by ${w.one}. Follow the original discussion, or add your own.`}</p>
      </div>
      <dl className="ix-stats">
        <div><dt>opinions</dt><dd>{fmt(everything.length)}</dd></div>
        <div><dt>{w.many}</dt><dd>{fmt(data.listed.length)}</dd></div>
      </dl>
    </section>
    <p className="ix-growing"><b>The index keeps growing</b>
      <span><em>{`+${fmt(week)}`}</em>{" opinions this week"}</span>
      {today > 0 && <span>{`${fmt(today)} new today`}</span>}
      {updated && <span>{`Last updated ${new Date(updated).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}</span>}
    </p>

    <section className="ix" id="browse" aria-labelledby="ix-title">
      <div className="ix-head"><h2 id="ix-title">{`Browse what ${p.many} think`}</h2><a className="ix-how" href="/about#signal">How scores work<Arrow/></a></div>
      <AutoSubmitForm className="ix-bar" action={basePath}>
        {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v}/>)}
        <label className="ix-q"><span className="sr-only">{`Search ${w.many}`}</span><input type="search" name="q" defaultValue={f.q || ""} placeholder={`Search a ${w.one}…`}/></label>
        <Select name="brand" label="Brand" value={f.brand} options={data.listedBrands.map(b => ({ value: b.id, label: b.name }))}/>
        {shapes.length > 1 && <Select name="shape" label={niche.specs.find(s => s.column === "shape")?.label ?? "Type"} value={f.shape} options={shapes.map(c => ({ value: c.key, label: c.label }))}/>}
        {specFacets.map(sp => { const opts = sp.options!.filter(o => data.listed.some(r => specIs(spec(r, sp.column), o))); return opts.length > 1 && <Select key={sp.column} name={sp.column} label={sp.label} value={f[sp.column]} options={opts.map(o => ({ value: o, label: o }))}/>; })}
        <label className="ix-sel ix-sort"><span className="sr-only">Sort</span><select name="sort" defaultValue={sort === DEFAULT_SORT ? "" : sort}>{SORTS.map(s => <option key={s.value} value={s.value === DEFAULT_SORT ? "" : s.value}>{`Sort: ${s.value === DEFAULT_SORT ? "Signal ↓" : s.label}`}</option>)}</select></label>
        <noscript><button className="button">Show</button></noscript>
      </AutoSubmitForm>
      {refined && <p className="ix-refined">{`${fmt(results.length)} ${results.length === 1 ? w.one : w.many} match · `}<a href={reset}>Reset filters</a></p>}
      <div className="ix-grid">
        <div className="ix-list">
          <Directory show={parseShow(f.show)} moreHref={n => link({ show: String(n) })} rows={results.map(({ r }, i) => <IndexRow key={r.id} data={data} r={r} rank={ranked ? i + 1 : null} signal={signals.get(r.id)?.signal} tags={tc.get(r.id)}/>)}/>
          {!results.length && <p className="empty-feed">{`No ${w.one} matches all of these. `}<a href={reset}>Reset filters</a></p>}
          <div className="ix-sig-note"><SignalInfo/><span>The signal: positive opinions, weighed by how many there are.</span></div>
        </div>
        <Fresh data={data} now={now}/>
      </div>
    </section>
    <CompareTray noun={w.one}/>
  </>;
}
