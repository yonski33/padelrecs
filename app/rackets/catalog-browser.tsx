"use client";
// The catalogue's filters and list (owner 2026-11-15: "/rackets … still slow on every tap"). The server renders the first view
// for the address (app/rackets/catalog-v2.tsx), so every filter combination is still a real, shareable page; a tap re-runs the
// same pure filter (lib/catalog-filter.ts) on the rows sent with the page and updates the address, with no round trip. Links
// stay real links: a new tab, or no JavaScript, still gets the server's page.
import { useEffect, useState, type MouseEvent } from "react";
import { catalogView, catalogHref, readCatalogFilters, CATALOG_KEYS, CATALOG_STYLES, CATALOG_LEVELS, CATALOG_SHAPES, CATALOG_SORTS, CATALOG_PAGE,
  type CatalogFilters, type CatalogRow, type CatalogKey } from "../../lib/catalog-filter";
import { WEIGHTS, FEELS } from "../../lib/fine-tune";
import { BALANCES, FACES } from "../../lib/guide";

export type CatalogCard = { name: string; href: string; pic: string | null; tile: string; line: string | null; shop: { url: string; rel: string } | null; pos: number; mix: number; neg: number };
type F = CatalogFilters;

export function CatalogBrowser({ rows, cards, f: first, base, suitsOk, many, one }: { rows: CatalogRow[]; cards: Record<string, CatalogCard>; f: F; base: string; suitsOk: number; many: string; one: string }) {
  const [f, setF] = useState<F>(first);
  // Back and forward step through the filters.
  useEffect(() => { const on = () => setF(readCatalogFilters(Object.fromEntries(new URLSearchParams(location.search)))); addEventListener("popstate", on); return () => removeEventListener("popstate", on); }, []);
  const v = catalogView(rows, f, suitsOk);
  const href = (next: F) => catalogHref(base, f, next);
  const go = (next: F) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // a new tab gets the server's page
    e.preventDefault();
    // From the address, not this render's state, so two quick taps both count.
    const url = catalogHref(base, readCatalogFilters(Object.fromEntries(new URLSearchParams(location.search))), next);
    setF(readCatalogFilters(Object.fromEntries(new URL(url, location.origin).searchParams)));
    history.pushState(null, "", url);
  };
  const to = (next: F, current?: boolean) => ({ href: href(next), onClick: go(next), ...(current ? { "aria-current": "true" as const } : {}) });
  const groups: [string, CatalogKey, readonly string[]][] = [["Play style", "style", CATALOG_STYLES], ["Level", "level", CATALOG_LEVELS], ["Shape", "shape", CATALOG_SHAPES], ...(v.years.length > 1 ? [["Year", "year", v.years] as [string, "year", string[]]] : [])];
  const extra: [string, CatalogKey, readonly string[]][] = [["Weight", "weight", WEIGHTS], ["Feel on impact", "feel", FEELS], ["Balance", "balance", BALANCES], ["Face", "face", FACES]];
  const moreOpen = f.more === "1" || !!f.weight || !!f.feel || !!f.balance || !!f.face || f.sweet === "1";
  const active = [...CATALOG_KEYS.filter(k => f[k]).map(k => ({ label: f[k]!, next: { [k]: undefined } as F })),
    ...(f.arm === "1" ? [{ label: "arm-friendly", next: { arm: undefined } as F }] : []), ...(f.sweet === "1" ? [{ label: "bigger sweet spot", next: { sweet: undefined } as F }] : [])];
  const clearAll: F = Object.fromEntries(Object.keys(f).map(k => [k, undefined]));
  const group = ([label, key, vals]: [string, CatalogKey, readonly string[]]) =>
    <details key={key} className="ct-g" open>
      <summary><b>{label}</b>{f[key] && <span className="ct-val">{f[key]}</span>}<i aria-hidden="true"/></summary>
      <div className="ct-opts">{vals.map(val => { const on = f[key] === val, n = v.counts[key]?.[val] ?? 0;
        return <a {...to({ [key]: on ? undefined : val }, on)} key={val} className={`ct-opt${on ? " on" : ""}${!n && !on ? " none" : ""}`}>
          <span className="ct-dot" aria-hidden="true"/><span className="ct-ol">{val}</span><span className="ct-n">{n}</span></a>; })}</div>
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
          <i aria-hidden="true">{f.arm === "1" ? "✓" : ""}</i><b>Arm-friendly only</b></a>
        {/* More filters, like the home's fine-tune (owner 2026-11-15): weight, feel and a bigger sweet spot. */}
        <details className="ct2-more" open={moreOpen}>
          <summary><span className="c">more filters ▾</span><span className="o">fewer filters ▴</span></summary>
          {extra.map(group)}
          <a {...to({ sweet: f.sweet === "1" ? undefined : "1", more: "1" }, f.sweet === "1")} className={`ct2-check${f.sweet === "1" ? " on" : ""}`}>
            <i aria-hidden="true">{f.sweet === "1" ? "✓" : ""}</i><b>Bigger sweet spot</b></a>
        </details>
      </div>
    </aside>

    <section className="ct2-main">
      <div className="ct2-bar">
        <div className="ct2-count"><b>{active.length || f.q || f.older === "1" ? `${shown.length} ${shown.length === 1 ? one : many}` : `All ${v.total} ${many}`}</b>
          {active.map(a => <a {...to(a.next)} key={a.label} className="ct2-chipx">{a.label} <i aria-hidden="true">✕</i></a>)}</div>
        <div className="ct2-sort"><span>sort</span>{CATALOG_SORTS.map(([k, label]) => <a {...to({ sort: k === "score" ? undefined : k }, sort === k)} key={k} className={sort === k ? "on" : undefined}>{label}</a>)}</div>
      </div>
      <ol className="ct2-list">{shown.slice(0, show).map((x, i) => {
        const c = cards[x.id];
        const chips = [...(i === 0 && sort === "score" ? [{ k: "top", t: "★ top pick" }] : []), ...(x.arm ? [{ k: "arm", t: "arm-friendly" }] : [])];
        const meta = [x.lean === "balance" ? "all-round" : x.lean, x.shape, x.year].filter(Boolean) as string[];
        // One link per row (the name's, stretched over the row) and "check price" as a quiet text link at the end of the specs
        // row (owner 2026-11-15). Reviews over the sentiment bar, then the Player score box.
        return <li key={x.id} className={i === 0 ? "first" : i < 3 ? "top" : undefined}><div className="ct2-row">
          <span className="ct2-rank">{i + 1}</span>
          <span className="ct2-pic">{c.pic ? <img src={c.pic} alt="" width={408} height={620} decoding="async" loading={i < 4 ? "eager" : "lazy"}/> : <span className="ct2-tile">{c.tile}</span>}</span>
          <span className="ct2-body">
            <span className="ct2-nrow"><a className="ct2-name" href={c.href}>{c.name}</a>{chips.map(ch => <span key={ch.k} className={`ct2-chip ${ch.k}`}>{ch.t}</span>)}</span>
            {c.line && <span className="ct2-line">{c.line}</span>}
            <span className="ct2-mt">{meta.map(m => <span key={m}>{m}</span>)}{c.shop && <a className="ct2-buy" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}</span>
          </span>
          <span className="ct2-sent"><span><strong>{x.n.toLocaleString("en-US")}</strong>{` ${x.n === 1 ? "review" : "reviews"}`}</span>
            {x.judged > 0 && <span className="ct2-bar6" aria-label={`${c.pos} positive, ${c.mix} mixed, ${c.neg} negative`}><i className="p" style={{ flex: c.pos }}/><i className="m" style={{ flex: c.mix }}/><i className="n" style={{ flex: c.neg }}/></span>}</span>
          <span className={`ct2-sc ${x.signal === null ? "none" : x.signal >= 85 ? "hi" : x.signal >= 75 ? "mid" : ""}`} title="Player score: not a % of happy players. It blends how much players like it with how many have weighed in.">
            <b>{x.signal ?? "—"}</b><small>player score</small></span>
        </div></li>; })}</ol>
      {shown.length === 0 && <div className="ct2-empty"><b>Nothing matches all of that</b><a {...to(clearAll)}>clear filters</a></div>}
      {!f.q && !f.year && v.olderN > 0 && <a {...to({ older: f.older === "1" ? undefined : "1" })} className="ct2-older">{f.older === "1" ? "hide older models ▴" : `show older models (${v.olderN}) ▾`}</a>}
      {shown.length > show && <a {...to({ show: String(show + CATALOG_PAGE) })} className="ct2-load">{`load ${Math.min(CATALOG_PAGE, shown.length - show)} more ↓`}</a>}
    </section>
  </div>;
}
