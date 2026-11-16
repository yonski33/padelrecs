"use client";
// The catalogue's filters and list (owner 2026-11-15: "/rackets … still slow on every tap"). The server renders the first view
// for the address (app/rackets/catalog-v2.tsx), so every filter combination is still a real, shareable page; a tap re-runs the
// same pure filter (lib/catalog-filter.ts) on the rows sent with the page and updates the address, with no round trip. Links
// stay real links: a new tab, or no JavaScript, still gets the server's page.
import { useEffect } from "react";
import { useInstantView, instantClick } from "../instant-view";
import { catalogView, catalogHref, readCatalogFilters, CATALOG_KEYS, CATALOG_STYLES, CATALOG_LEVELS, CATALOG_SHAPES, CATALOG_SORTS, CATALOG_PAGE,
  type CatalogFilters, type CatalogRow, type SpecGroup } from "../../lib/catalog-filter";
import { WEIGHTS, FEELS } from "../../lib/fine-tune";
import { levelLabel, type Level } from "../../lib/quick-match";
import { hasYears, mockLook } from "../../lib/niche";
import { MIN_LIST_REVIEWS } from "../../lib/top-lists";
import { useComparePicks, CompareTray, MAX_PICKS } from "./compare-tray";
/** How an option reads: levels on the site's own scale (pickleball 2.5 / 3.5 / 4.5+). */
const optWord = (key: string, val: string) => key === "level" ? levelLabel(val as Level) : val;

export type CatalogCard = { name: string; slug: string; href: string; pic: string | null; tile: string; line: string | null; /** The ranking rows' "best for" words. */ best?: string; shop: { url: string; rel: string } | null; pos: number; mix: number; neg: number };
type F = CatalogFilters;

/** A type-picker site's catalogue (lib/fit-config.ts quick: DiscGolfRecs): which of the niche's spec filters lead (disc type,
 *  stability) in place of padel's play style / shape / year / weight / feel, and its words. Unset: padel's catalogue, unchanged. */
export type CatalogLook = { lead: string[]; arm: string; score: string };

export function CatalogBrowser({ rows, cards, f: first, base, suitsOk, many, one, spec = [], look }: { rows: CatalogRow[]; cards: Record<string, CatalogCard>; f: F; base: string; suitsOk: number; many: string; one: string;
  /** The niche's spec filters (lib/guide.ts specGroups), under "more filters". */ spec?: SpecGroup[]; look?: CatalogLook }) {
  const specKeys = spec.map(g => g.key);
  // Back and forward step through the filters (app/instant-view.ts).
  const cmp = useComparePicks();
  const [f, setF] = useInstantView<F>(first, q => readCatalogFilters(Object.fromEntries(q), specKeys), v => catalogHref(base, {}, v, specKeys));
  // The site's own phone mock (mockLook): the filter groups start closed on a phone, except one with a pick.
  useEffect(() => { if (mockLook && matchMedia("(max-width: 760px)").matches) document.querySelectorAll<HTMLDetailsElement>(".ct2-m .ct-g").forEach(d => { if (!d.querySelector(".ct-opt.on")) d.open = false; }); }, []);
  const v = catalogView(rows, f, suitsOk, spec);
  const href = (next: F) => catalogHref(base, f, next, specKeys);
  // From the latest view, not this render's state, so two quick taps both count.
  const go = (next: F) => instantClick(() => setF(cur => readCatalogFilters(Object.fromEntries(new URL(catalogHref(base, cur, next, specKeys), location.origin).searchParams), specKeys)));
  const to = (next: F, current?: boolean) => ({ href: href(next), onClick: go(next), ...(current ? { "aria-current": "true" as const } : {}) });
  const specGroup = (g: SpecGroup) => [g.label, g.key, g.values] as [string, string, readonly string[]];
  const lead = look ? spec.filter(g => look.lead.includes(g.key)) : [];
  const groups: [string, string, readonly string[]][] = look
    ? [...lead.slice(0, 1).map(specGroup), ["Level", "level", CATALOG_LEVELS], ...lead.slice(1).map(specGroup)]
    : [["Play style", "style", CATALOG_STYLES], ["Level", "level", CATALOG_LEVELS], ["Shape", "shape", CATALOG_SHAPES], ...(hasYears && v.years.length > 1 ? [["Year", "year", v.years] as [string, "year", string[]]] : [])];
  const extra: [string, string, readonly string[]][] = look ? spec.filter(g => !look.lead.includes(g.key)).map(specGroup)
    : [["Weight", "weight", WEIGHTS], ["Feel on impact", "feel", FEELS], ...spec.map(specGroup)];
  const moreOpen = f.more === "1" || !!f.weight || !!f.feel || specKeys.some(k => !!f[k] && !look?.lead.includes(k)) || f.sweet === "1";
  const armWord = look?.arm ?? "arm-friendly";
  const active = [...[...CATALOG_KEYS, ...specKeys].filter(k => f[k]).map(k => ({ label: optWord(k, f[k]!), next: { [k]: undefined } as F })),
    ...(f.arm === "1" ? [{ label: armWord, next: { arm: undefined } as F }] : []), ...(f.sweet === "1" ? [{ label: "bigger sweet spot", next: { sweet: undefined } as F }] : [])];
  const clearAll: F = Object.fromEntries(Object.keys(f).map(k => [k, undefined]));
  const group = ([label, key, vals]: [string, string, readonly string[]]) =>
    <details key={key} className="ct-g" open>
      <summary><b>{label}</b>{f[key] && <span className="ct-val">{optWord(key, f[key]!)}</span>}<i aria-hidden="true"/></summary>
      <div className="ct-opts">{vals.map(val => { const on = f[key] === val, n = v.counts[key]?.[val] ?? 0;
        return <a {...to({ [key]: on ? undefined : val }, on)} key={val} className={`ct-opt${on ? " on" : ""}${!n && !on ? " none" : ""}`}>
          <span className="ct-dot" aria-hidden="true"/><span className="ct-ol">{optWord(key, val)}</span><span className="ct-n">{n}</span></a>; })}</div>
    </details>;
  const { shown, sort, show } = v;

  return <div className="ct2-grid">
    <aside className="ct2-side" aria-label="Filters">
      <input type="checkbox" id="ct2-ft" className="ct2-ft"/>
      <div className="ct2-sh"><label htmlFor="ct2-ft" className="ct2-badge">filters<span className="ct2-mtog" aria-hidden="true"> ▾</span></label>
        {active.length > 0 && <a {...to(clearAll)} className="ct2-clear">clear all</a>}</div>
      <div className="ct2-groups">
        {groups.map(group)}
        <a {...to({ arm: f.arm === "1" ? undefined : "1" }, f.arm === "1")} className={`ct2-check${f.arm === "1" ? " on" : ""}`}>
          <i aria-hidden="true">{f.arm === "1" ? "✓" : ""}</i><b>{`${armWord[0].toUpperCase()}${armWord.slice(1)} only`}</b></a>
        {/* More filters, like the home's fine-tune (owner 2026-11-15): weight, feel and a bigger sweet spot. */}
        {extra.length > 0 && <details className="ct2-more" open={moreOpen}>
          <summary><span className="c">more filters ▾</span><span className="o">fewer filters ▴</span></summary>
          {extra.map(group)}
          {!look && <a {...to({ sweet: f.sweet === "1" ? undefined : "1", more: "1" }, f.sweet === "1")} className={`ct2-check${f.sweet === "1" ? " on" : ""}`}>
            <i aria-hidden="true">{f.sweet === "1" ? "✓" : ""}</i><b>Bigger sweet spot</b></a>}
        </details>}
      </div>
    </aside>

    <section className="ct2-main">
      <div className="ct2-bar">
        <div className="ct2-count"><b>{active.length || f.q || f.older === "1" ? `${shown.length} ${shown.length === 1 ? one : many}` : `All ${v.total} ${many}`}</b>
          {active.map(a => <a {...to(a.next)} key={a.label} className="ct2-chipx">{a.label} <i aria-hidden="true">✕</i></a>)}</div>
        <div className="ct2-sort"><button type="button" className={`ct2-cmp${cmp.on ? " on" : ""}`} aria-pressed={cmp.on} onClick={cmp.toggleMode}><i aria-hidden="true"/>compare</button><span>sort</span>{CATALOG_SORTS.map(([k, sortLabel]) => { const label = mockLook && k === "score" ? "top rated" : sortLabel; return <a {...to({ sort: k === "score" ? undefined : k }, sort === k)} key={k} className={sort === k ? "on" : undefined}>{label}</a>; })}</div>
      </div>
      {cmp.on && <p className="ct2-cmpnote"><b>compare on</b><span>{`Tap up to ${MAX_PICKS} ${many} to compare them side by side.`}</span></p>}
      <ol className={`ct2-list${cmp.on ? " cmp" : ""}`}>{shown.slice(0, show).map((x, i) => {
        const c = cards[x.id];
        const chips = [...(i === 0 && sort === "score" ? [{ k: "top", t: "★ top pick" }] : []), ...(x.arm ? [{ k: "arm", t: armWord }] : [])];
        const meta = (look ? look.lead.map(k => x.spec?.[k]) : [x.lean === "balance" ? "all-round" : x.lean, x.shape, hasYears ? x.year : null]).filter(Boolean) as string[];
        // One link per row (the name's, stretched over the row) and "check price" as a quiet text link at the end of the specs
        // row (owner 2026-11-15). Reviews over the sentiment bar, then the Player score box.
        const ticked = cmp.on && cmp.has(x.id);
        // Compare mode: a tap anywhere on the row (but "check price") picks it instead of opening the page.
        const pick = cmp.on ? (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest(".ct2-buy")) return; e.preventDefault(); cmp.toggle({ id: x.id, slug: c.slug, name: c.name, pic: c.pic }); } : undefined;
        return <li key={x.id} className={[i === 0 ? "first" : i < 3 ? "top" : "", ticked ? "picked" : ""].filter(Boolean).join(" ") || undefined}><div className="ct2-row" onClickCapture={pick}>
          {cmp.on ? <span className={`ct2-tick${ticked ? " on" : ""}`} role="checkbox" aria-checked={ticked} aria-label={`Compare ${c.name}`}>{ticked ? "✓" : ""}</span> : <span className="ct2-rank">{i + 1}</span>}
          <span className="ct2-pic">{c.pic ? <img src={c.pic} alt="" width={408} height={620} decoding="async" loading={i < 4 ? "eager" : "lazy"}/> : <span className="ct2-tile">{c.tile}</span>}</span>
          <span className="ct2-body">
            <span className="ct2-nrow">{mockLook && <b className="ct2-rk" aria-hidden="true">{`#${i + 1}`}</b>}<a className="ct2-name" href={c.href}>{c.name}</a>{chips.map(ch => <span key={ch.k} className={`ct2-chip ${ch.k}`}>{ch.t}</span>)}</span>
            {c.line && <span className="ct2-line">{c.line}</span>}
            {c.best && <span className="ct2-best">{`best for ${c.best}`}</span>}
            <span className="ct2-mt">{meta.map(m => <span key={m}>{m}</span>)}{c.shop && <a className="ct2-buy" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}</span>
          </span>
          <span className="ct2-sent"><span><strong>{x.n.toLocaleString("en-US")}</strong>{` ${x.n === 1 ? "review" : "reviews"}`}</span>
            {x.judged > 0 && <span className="ct2-bar6" aria-label={`${c.pos} positive, ${c.mix} mixed, ${c.neg} negative`}><i className="p" style={{ flex: c.pos }}/><i className="m" style={{ flex: c.mix }}/><i className="n" style={{ flex: c.neg }}/></span>}</span>
          <span className={`ct2-sc ${x.signal === null ? "none" : x.signal >= 85 ? "hi" : x.signal >= 75 ? "mid" : ""}`} title={`${look ? `${look.score[0].toUpperCase()}${look.score.slice(1)}` : "Player score"}: not a % of happy players. It blends how much players like it with how many have weighed in.`}>
            <b>{x.signal ?? "—"}</b>{mockLook ? <>
              {x.judged > 0 && <span className="ct2-bar6" aria-hidden="true"><i className="p" style={{ flex: c.pos }}/><i className="m" style={{ flex: c.mix }}/><i className="n" style={{ flex: c.neg }}/></span>}
              <small><span className="ct2-ps">player score · </span>{`${x.n.toLocaleString("en-US")} ${x.n === 1 ? "review" : "reviews"}`}</small></> : <small>{look?.score ?? "player score"}</small>}</span>
        </div></li>; })}</ol>
      {shown.length === 0 && <div className="ct2-empty"><b>Nothing matches all of that</b><a {...to(clearAll)}>clear filters</a></div>}
      {!f.q && !f.year && v.olderN > 0 && <a {...to({ older: f.older === "1" ? undefined : "1" })} className="ct2-older">{f.older === "1" ? "hide older models ▴" : `show older models (${v.olderN}) ▾`}</a>}
      {shown.length > show && <a {...to({ show: String(show + CATALOG_PAGE) })} className="ct2-load">{`load ${Math.min(CATALOG_PAGE, shown.length - show)} more ↓`}</a>}
      {cmp.on && <CompareTray picks={cmp.picks} remove={cmp.remove} clear={cmp.clear} one={one}/>}
      {mockLook && <p className="ct2-note">{`${many} with fewer than ${MIN_LIST_REVIEWS} reviews get no score yet, so one loud opinion can't top the list.`}</p>}
    </section>
  </div>;
}
