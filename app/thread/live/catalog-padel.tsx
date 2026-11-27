"use client";
// PadelRecs' catalogue (owner mock 2026-11-21, "i think it works now"). Replaces the left "Your match + Filter" column (#577):
// - A full-width top card: title, counts, search, the match bar (level · style · Arm comfort; re-orders by "% your match",
//   hides nothing) and "Not sure yet? fine-tune ▾", a panel of Shape, Feel and Brand pills with live counts.
// - The list with one vote pill per row and the opinions bar on the right; no score anywhere. Then a sidebar: Rankings,
//   Latest reviews, New rackets (under the list on phones).
// Everything runs in the browser on the rows the server sent (instant filters, tests/instant-views.test.ts). The picks are the
// shared store (usePicks), so home, racket pages and this page agree.
import { useMemo, useState } from "react";
import { type ThreadRow } from "../ui";
import { th } from "../../../lib/thread/look";
import { oneShape } from "../../../lib/thread/shape";
import { Ago } from "./ago";
import { useRacketList, MatchBar, FineTune, SortMenu, RacketRow, named, opinions, plural } from "./padel-list";
import { useAudioListMatch } from "./audio-match";
import { useSkinListMatch } from "./skin-match";
import type { SkinWire } from "../../skin/rank";
import { W } from "../../../lib/thread/words";
import type { AudioWire } from "../../../lib/audio-match";
import { useLaptopListMatch } from "./laptop-match";
import { useCoffeeListMatch } from "./coffee-match";
import type { CoffeeWire } from "../../../lib/coffee-match";
import type { LaptopWire } from "../../../lib/laptop-match";

export type SideReview = { id: string; who: string; at: string; racket: string; href: string; text: string };
const STEP = 24, NEW_N = 3;

export function PadelCatalog({ rows, brands, pills, added, curated, rankings, latest, wire, skin, laptop, coffee, title = "All padel rackets", crumb = "Rackets" }: {
  rows: ThreadRow[]; brands: string[];
  /** A row's vote pill ("Most picked for power · 22 players"), when it has one. */ pills: Record<string, string>;
  /** When each racket joined the catalogue (Newest, New rackets). */ added: Record<string, string>;
  /** "PadelRecs picks": the curated order, ids; the rest follow by loved count. */ curated: string[];
  rankings: { label: string; href: string }[]; latest: SideReview[];
  /** AudioRecs: its match inputs, its own title and crumb. Padel: absent (the defaults). */ wire?: AudioWire[]; title?: string; crumb?: string;
  /** SkinRecs: the skin engine's inputs for its own quick match (live/skin-match.tsx). */ skin?: SkinWire[];
  /** LaptopRecs: its quick match inputs (live/laptop-match.tsx). */ laptop?: LaptopWire[];
  /** CoffeeRecs: its quick match inputs (live/coffee-match.tsx). */ coffee?: CoffeeWire[];
}) {
  const audio = useAudioListMatch(wire), skinMatch = useSkinListMatch(skin), laptopMatch = useLaptopListMatch(laptop), coffeeMatch = useCoffeeListMatch(coffee);
  const l = useRacketList({ rows, curated, added, search: true, match: audio ?? skinMatch ?? laptopMatch ?? coffeeMatch }), { q, setQ, list, pcts, older, setOlder, olderN, words, clearAll } = l;
  const [ft, setFt] = useState(false), [n, setN] = useState(STEP);
  const newest = useMemo(() => rows.filter(r => r.current !== false).sort((a, b) => b.year - a.year || (added[b.id] ?? "").localeCompare(added[a.id] ?? "")).slice(0, NEW_N), [rows, added]);
  const isNew = useMemo(() => new Set(newest.map(r => r.id)), [newest]);
  const total = rows.filter(r => r.current !== false), allOpinions = total.reduce((s, r) => s + opinions(r), 0);
  return <main className="th-main tc">
    <div className="th-crumbs"><a href={th("/")}>Home</a><span>/</span><span>{crumb}</span></div>
    <section className="th-card tc-top">
      <div className="tc-head">
        <div className="tc-title"><h1 className="th-h1">{title}</h1>
          <span>{`${plural(total.length, W.item, W.items)}, ${plural(allOpinions, `${W.person} opinion`)}. Find your match, or fine-tune to narrow it down.`}</span></div>
        <label className="tc-search"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>
          <input value={q} onChange={e => { setQ(e.target.value); setN(STEP); }} placeholder="Search by name or brand" aria-label={`Search ${W.items}`}/>
          {q && <button type="button" aria-label="Clear search" onClick={() => setQ("")}>×</button>}</label>
      </div>
      <MatchBar l={l} ft={ft} setFt={setFt} tag="Find my match"/>
      <FineTune l={l} ft={ft} brands={brands}/>
    </section>
    <div className="tc-cols">
      <section className="th-card tc-list">
        <div className="tc-list-h"><h2 className="th-h2">{plural(list.length, W.item, W.items)}</h2><SortMenu l={l} onPick={() => setN(STEP)}/></div>
        {list.slice(0, n).map(r => <RacketRow key={r.id} r={r} pill={pills[r.id]} match={pcts?.get(r.id)} isNew={isNew.has(r.id)}/>)}
        {list.length === 0 && <div className="tc-none"><strong>{`No ${W.items} match these filters`}</strong><span>Try removing a filter or searching for a brand.</span>
          <button type="button" className="th-btn lime round" onClick={clearAll}>Clear all filters</button></div>}
        {(list.length > n || (!older && !words.length && olderN > 0)) && <div className="tc-foot">
          {list.length > n && <button type="button" className="th-btn" onClick={() => setN(x => x + STEP)}>{`Show ${Math.min(STEP, list.length - n)} more`}</button>}
          {!older && !words.length && olderN > 0 && <button type="button" className="tc-link" onClick={() => setOlder(true)}>{`Show older models (${olderN})`}</button>}</div>}
      </section>
      <aside className="tc-side">
        {rankings.length > 0 && <section className="th-card tc-box tc-box-dark"><h2 className="tc-bh">Rankings</h2>
          {rankings.map(k => <a key={k.href} className="tc-link-row" href={th(k.href)}><span>{k.label}</span><span aria-hidden="true">→</span></a>)}</section>}
        {latest.length > 0 && <section className="th-card tc-box"><h2 className="tc-bh">Latest reviews</h2>
          {latest.map(c => <a key={c.id} className="tc-rv" href={th(c.href)}><span className="tc-rv-by"><strong>{c.who}</strong>{" · "}<Ago at={c.at}/></span>
            <b>{c.racket}</b><span className="tc-rv-t">{c.text}</span></a>)}</section>}
        {newest.length > 0 && <section className="th-card tc-box"><h2 className="tc-bh">{`New ${W.items}`}</h2>
          {newest.map(r => <a key={r.id} className="tc-new" href={th(r.href)}><span className="tc-new-ph">{r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="th-ph"/>}</span>
            <span><b>{named(r)}</b><small><span className="tc-tag new">New</span>{[oneShape(r.shape), plural(opinions(r), "opinion")].filter(Boolean).join(" · ")}</small></span></a>)}</section>}
      </aside>
    </div>
  </main>;
}
