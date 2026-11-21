"use client";
// PadelRecs home, top part (v3 handoff "Home Thread v6", owner 2026-11-21): the hero (racket drawing, the title with the one
// squiggle on the page, the live count), the match bar (re-orders, "% your match") + fine-tune (hides), and "Top rackets right
// now" (#1…, 6 then show more; this season's models, most loved by default, lib/thread/home-order.ts). No subline under the title. The list code is shared with the
// catalogue (./padel-list.tsx), so the two never disagree.
import { useState, type ReactNode } from "react";
import { type ThreadRow } from "../ui";
import { th } from "../../../lib/thread/look";
import { useRacketList, MatchBar, FineTune, SortMenu, RacketRow } from "./padel-list";
import type { Level } from "./picks";

const FIRST = 6, MORE = 20;
/** The mock's small level icons: a sprout, a bolt, a gem. */
const ICONS: Record<Level, React.ReactNode> = {
  beginner: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M7 13V6M7 6C7 3 5 1.5 2 1.5 2 4.5 4 6 7 6zM7 7.5c0-2.5 1.8-4 5-4 0 3-2 4-5 4"/></svg>,
  intermediate: <svg width="12" height="15" viewBox="0 0 12 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M7 1L1.5 8.5H6L5 14l5.5-7.5H6z"/></svg>,
  advanced: <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M4 1h8l3 4-7 8-7-8zM1 5h14M6 1L5 5l3 8 3-8-1-4"/></svg>,
};
const Racket = () => <svg className="hp3-art" width="74" height="80" viewBox="0 0 74 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <ellipse cx="33" cy="30" rx="20" ry="24" transform="rotate(28 33 30)" fill="#fff"/>
  <g fill="currentColor" stroke="none">{[[27, 20], [35, 18], [24, 28], [32, 26], [40, 25], [29, 34], [37, 33], [26, 41], [34, 41]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1"/>)}</g>
  <path d="M20 51 L9 74 M15 49 L5 70 M26 53 L15 76"/><path d="M57 7 l3 -5 M63 15 l6 -3 M65 25 l6 1"/></svg>;
/** The page's only squiggle, after the title (owner: squiggle only on the hero). */
const Squiggle = () => <svg className="hp3-sq" width="26" height="28" viewBox="0 0 30 30" fill="none" stroke="#B9E85A" strokeWidth="4" strokeLinecap="round" aria-hidden="true"><path d="M6 14 L12 4 M12 20 L24 13 M14 27 L27 26"/></svg>;

export function PadelHomeTop({ rows, brands, pills, added, curated, season, live, after, side }: {
  rows: ThreadRow[]; brands: string[]; pills: Record<string, string>; added: Record<string, string>; curated: string[];
  /** The list's pool: this season's models with 10+ opinions (lib/thread/home-order.ts). */ season: string[];
  /** "2,936 reviews · 36 opinions collected this week", or null. */ live: string | null;
  /** The rest of the main column (Top picks, reviews) and the sidebar, server-rendered. */ after: ReactNode; side: ReactNode;
}) {
  const l = useRacketList({ rows, curated, added, season }), { list, pcts, mine, clearAll } = l;
  const [ft, setFt] = useState(false), [n, setN] = useState(FIRST);
  const sticker = <span className="hp3-sticker" aria-hidden="true"><svg width="58" height="26" viewBox="0 0 58 26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M55 20C44 24 30 23 20 16 15 12.5 11 10 5 10"/><path d="M11 4.5L4.5 10l6.5 5"/></svg>
    <span>{mine ? "your match" : "quick match"}</span></span>;
  return <>
    <section className="th-card tc-top hp3-hero">
      <div className="hp3-head">
        <div className="hp3-title"><Racket/><h1 className="th-h1">The padel racket community<Squiggle/></h1></div>
        {live && <span className="th-live"><i aria-hidden="true"/>{live}</span>}
      </div>
      <MatchBar l={l} ft={ft} setFt={setFt} icons={ICONS} after={sticker}/>
      <FineTune l={l} ft={ft} brands={brands}/>
    </section>
    <div className="hp3-cols"><div className="th-col">
    <section className="th-card tc-list hp3-top">
      <div className="tc-list-h"><h2 className="th-h2 hp3-h2"><svg width="28" height="28" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><ellipse cx="17" cy="12" rx="9" ry="10" transform="rotate(30 17 12)"/><path d="M11 20L4 28"/></svg>Top rackets right now</h2>
        <SortMenu l={l} onPick={() => setN(FIRST)}/></div>
      {list.slice(0, n).map((r, i) => <RacketRow key={r.id} r={r} rank={i + 1} pill={pills[r.id]} match={pcts?.get(r.id)} link/>)}
      {list.length === 0 && <div className="tc-none"><strong>No rackets match</strong><span>Try removing a filter.</span>
        <button type="button" className="th-btn lime round" onClick={clearAll}>Clear all</button></div>}
      {list.length > FIRST && <div className="tc-foot">
        {n === FIRST ? <button type="button" className="th-btn" onClick={() => setN(MORE)}>{`Show ${Math.min(MORE, list.length) - FIRST} more rackets`}</button>
          : <><button type="button" className="th-btn" onClick={() => setN(FIRST)}>Show fewer</button><a className="tc-link" href={th("/rackets")}>{`See all ${list.length} rackets →`}</a></>}
      </div>}
    </section>
    {after}</div>{side}</div>
  </>;
}
