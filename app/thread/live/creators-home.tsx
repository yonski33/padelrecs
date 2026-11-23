"use client";
// The creators home preview, top part (owner handoff "PickleballRecs Home Thread v6", 2026-11-22): the hero (paddle drawing,
// "Every pickleball paddle review, summed up", the line, the review count pill), the quick match (I'm … | I want … · Arm
// comfort, the "quick match" sticker, Reset, "Not sure yet? fine-tune"), the fine-tune panel and chips, then "Top paddles
// right now" (ranked rows, sort menu, show more). The list state is the shared one (live/padel-list.tsx useRacketList): the
// same picks store, the real match engine for "% your match" and the same fine-tune filters, all in the browser on the rows
// the server sent. No score badge (owner rule: words, never scores); match % only after a pick.
import { useMemo, useState, type ReactNode } from "react";
import { type ThreadRow } from "../ui";
import { th } from "../../../lib/thread/look";
import { oneShape } from "../../../lib/thread/shape";
import { useRacketList, named, type Key } from "./padel-list";
import { LEVEL_OPTS, type Level, type Style } from "./picks";
import { countsLine, opinionsLabel, siteSentiment } from "../../../lib/thread/site-sentiment";
import { W } from "../../../lib/thread/words";

const FIRST = 6, STEP = 10;
const STYLES: [Style, string][] = [["control", "Control"], ["balance", "Balance"], ["power", "Power"]];
const LEVEL_WORD: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
export const LEVEL_ICON: Record<Level, ReactNode> = {
  beginner: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M7 13V6M7 6C7 3 5 1.5 2 1.5 2 4.5 4 6 7 6zM7 7.5c0-2.5 1.8-4 5-4 0 3-2 4-5 4"/></svg>,
  intermediate: <svg width="12" height="15" viewBox="0 0 12 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M7 1L1.5 8.5H6L5 14l5.5-7.5H6z"/></svg>,
  advanced: <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M4 1h8l3 4-7 8-7-8zM1 5h14M6 1L5 5l3 8 3-8-1-4"/></svg>,
};
const SHAPES = ["Widebody", "Standard", "Elongated", "Hybrid"], FEELS = ["Soft", "Medium", "Hard"], TOP_BRANDS = 6;

/** One row's extra data from the server: its praise pill, where it links, its lowest price (lib/thread/creator-home.ts). The
 *  bar and counts are the row's own site votes (owner 2026-11-22). */
import type { RowExtra as HomeExtra } from "../../../lib/thread/creator-home";
export type { HomeExtra };

export function CreatorsHomeTop({ rows, extra, curated, added, total, brands, after, side }: {
  rows: ThreadRow[]; extra: Record<string, HomeExtra>; curated: string[]; added: Record<string, string>;
  /** "247 reviews summarised". */ total: string; brands: string[]; after: ReactNode; side: ReactNode;
}) {
  const l = useRacketList({ rows, curated, added, home: true }), { list, pcts, mine, picks, setPicks, f, toggle, chips, clearAll, pool, pass, test } = l;
  const [ft, setFt] = useState(false), [count, setCount] = useState(FIRST), [sortOpen, setSortOpen] = useState(false), [moreBrands, setMoreBrands] = useState(false);
  // The list grows 10 at a time (owner 2026-11-23), then "Show fewer" folds it back to the first six.
  const shown = list.slice(0, count), left = list.length - shown.length;
  const groups = useMemo(() => ([["shape", "Shape", SHAPES], ["feel", "Feel", FEELS], ["brand", "Brand", brands]] as [Key, string, string[]][]).map(([k, title, vals]) => {
    const opts = vals.map(v => ({ v, n: pool.filter(r => pass(r, k) && test(r, k, v)).length, on: !!f[k]?.includes(v) })).filter(o => k !== "shape" || o.n > 0 || o.on);
    return { k, title, opts: k === "brand" && !moreBrands ? opts.filter((o, i) => i < TOP_BRANDS || o.on) : opts, more: k === "brand" && opts.length > TOP_BRANDS ? opts.length - TOP_BRANDS : 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [pool, f, brands, moreBrands]);
  // The list title says what it holds once filters or a quick match are on (owner 2026-11-23): "Top Widebody, Medium paddles (8)".
  const listTitle = chips.length ? `Top ${chips.map(c => c.v).join(", ")} paddles` : mine || picks.arm ? "Your best matches" : "Top paddles right now";
  const sortLabel = l.sorts.find(([k]) => k === l.sort)?.[1] ?? l.sorts[0][1];
  return <>
    <section className="tch-hero">
      <div className="tch-hero-top">
        <div className="tch-hero-l">
          <svg className="tch-art" width="74" height="80" viewBox="0 0 74 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <ellipse cx="33" cy="30" rx="20" ry="24" transform="rotate(28 33 30)" fill="#fff"/>
            <g fill="currentColor" stroke="none">{[[27, 20], [35, 18], [24, 28], [32, 26], [40, 25], [29, 34], [37, 33], [26, 41], [34, 41]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1"/>)}</g>
            <path d="M20 51 L9 74 M15 49 L5 70 M26 53 L15 76"/><path d="M57 7 l3 -5 M63 15 l6 -3 M65 25 l6 1"/></svg>
          <div className="tch-hero-t">
            <h1>Every pickleball paddle review, summed up<svg width="26" height="28" viewBox="0 0 30 30" fill="none" stroke="oklch(0.92 0.17 105)" strokeWidth="4" strokeLinecap="round" aria-hidden="true"><path d="M6 14 L12 4 M12 20 L24 13 M14 27 L27 26"/></svg></h1>
            <span>Reviews from YouTube, blogs and Reddit, read and summed up so you don&apos;t have to.</span>
          </div>
        </div>
        <span className="tch-count"><i aria-hidden="true"/>{total}</span>
      </div>
      <div className="tch-qm" role="group" aria-label="Quick match">
        <span className="tch-qm-l">{"I'm"}</span>
        {LEVEL_OPTS.map(v => <button key={v} type="button" className="tch-chip" aria-pressed={picks.level === v} onClick={() => setPicks({ level: picks.level === v ? null : v })}>{LEVEL_ICON[v]}{LEVEL_WORD[v]}</button>)}
        <span className="tch-qm-sep" aria-hidden="true"/>
        <span className="tch-qm-l">I want</span>
        {STYLES.map(([v, t]) => <button key={v} type="button" className="tch-chip" aria-pressed={picks.style === v} onClick={() => setPicks({ style: picks.style === v ? null : v })}>{t}</button>)}
        <button type="button" className="tch-arm" aria-pressed={picks.arm} onClick={() => setPicks({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>Arm comfort</button>
        <span className="tch-sticker" aria-hidden="true"><svg width="58" height="26" viewBox="0 0 58 26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M55 20C44 24 30 23 20 16 15 12.5 11 10 5 10"/><path d="M11 4.5L4.5 10l6.5 5"/></svg>
          <span>{mine ? "your match" : "quick match"}</span></span>
        {(mine || picks.arm) && <button type="button" className="tch-reset" onClick={() => setPicks({ level: null, style: null, arm: false })}>Reset</button>}
        <button type="button" className="tch-ft" aria-expanded={ft} onClick={() => setFt(!ft)}>Not sure yet? <u>fine-tune</u> {ft ? "▴" : "▾"}</button>
      </div>
      {ft && <div className="tch-panel"><strong>Only show:</strong>
        {groups.map(g => <div key={g.k} className="tch-fg"><span className="tch-fg-h">{g.title}</span>
          {g.opts.map(o => <button key={o.v} type="button" className="tch-fchip" aria-pressed={o.on} style={{ opacity: o.n || o.on ? 1 : 0.4 }} onClick={() => toggle(g.k, o.v)}>{o.v}<small>{o.n}</small></button>)}
          {g.more > 0 && <button type="button" className="tch-ul" onClick={() => setMoreBrands(x => !x)}>{moreBrands ? "Show fewer" : `+ ${g.more} more`}</button>}</div>)}
      </div>}
      {chips.length > 0 && <div className="tch-fchips">{chips.map(c => <button key={`${c.k}:${c.v}`} type="button" onClick={() => toggle(c.k, c.v)}>{c.v}<span aria-hidden="true">×</span></button>)}
        <button type="button" className="tch-ul" onClick={clearAll}>Clear all</button></div>}
    </section>

    <div className="tch-cols">
      <div className="tch-main">
        <section className="tch-card tch-top">
          <div className="tch-top-h">
            <h2><svg width="28" height="28" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><ellipse cx="17" cy="12" rx="9" ry="10" transform="rotate(30 17 12)"/><path d="M11 20L4 28"/><g fill="currentColor" stroke="none"><circle cx="15" cy="9" r="1.2"/><circle cx="19" cy="9" r="1.2"/><circle cx="14" cy="13" r="1.2"/><circle cx="18" cy="13" r="1.2"/><circle cx="21" cy="12" r="1.2"/></g></svg>{listTitle}{(chips.length > 0 || mine || picks.arm) && <small className="tch-top-n">{` (${list.length})`}</small>}</h2>
            <span className="tch-sort"><span>Sort:</span>
              <button type="button" aria-haspopup="listbox" aria-expanded={sortOpen} onClick={() => setSortOpen(o => !o)}>{sortLabel}<small aria-hidden="true">▼</small></button>
              {sortOpen && <span className="tch-sort-m" role="listbox" aria-label="Sort paddles">{l.sorts.filter(([k]) => k !== "match" || pcts).map(([k, t]) =>
                <button key={k} type="button" role="option" aria-selected={l.sort === k} onClick={() => { l.setSort(k); setSortOpen(false); }}>{t}<span>{l.sort === k ? "✓" : ""}</span></button>)}</span>}
            </span>
          </div>
          {shown.map((r, i) => { const x = extra[r.id], m = pcts?.get(r.id) ?? null, t = r.pos + r.mix + r.neg;
            return <div key={r.id} className="tch-row">
              <span className="tch-rank">{`#${i + 1}`}</span>
              <a className="tch-ph" href={th(x?.href ?? r.href)} tabIndex={-1} aria-hidden="true">{r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="tch-noimg"/>}</a>
              <div className="tch-txt">
                <span className="tch-name"><a href={th(x?.href ?? r.href)}>{named(r)}</a>{oneShape(r.shape) && <span className="tch-type">{oneShape(r.shape)}</span>}</span>
                {r.line && <span className="tch-desc">{r.line}</span>}
                {x?.pill && <span className="tch-pill">{x.pill}</span>}
              </div>
              <div className="tch-stat">
                {mine && m != null ? <span className={`tch-match ${m >= 85 ? "g" : m >= 70 ? "y" : ""}`}>{`${m}% your match`}</span>
                  : <span className="tch-n">{opinionsLabel(t, W.person)}</span>}
                <span className="tch-bar" aria-hidden="true"><i className="p" style={{ flex: r.pos }}/><i className="m" style={{ flex: r.mix }}/><i className="n" style={{ flex: r.neg }}/></span>
                <span className="tch-counts">{countsLine(siteSentiment(r))}</span>
                <span className="tch-links"><a className="tch-go" href={th(x?.href ?? r.href)}>See reviews ›</a>
                  {x?.price && <a className="tch-price" href={x.price.url} target="_blank" rel={x.price.rel}>{x.price.label}</a>}</span>
              </div>
            </div>; })}
          {list.length === 0 && <div className="tch-none">No paddles match. <button type="button" onClick={clearAll}>Clear all</button></div>}
          {list.length > FIRST && <div className="tch-more"><button type="button" onClick={() => setCount(c => left > 0 ? c + STEP : FIRST)}>{left > 0 ? `Show ${Math.min(STEP, left)} more ${Math.min(STEP, left) === 1 ? "paddle" : "paddles"}` : "Show fewer"}</button></div>}
        </section>
        {after}
      </div>
      {side}
    </div>
  </>;
}
