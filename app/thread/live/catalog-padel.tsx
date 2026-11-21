"use client";
// PadelRecs' catalogue (owner mock 2026-11-21, "i think it works now"). Replaces the left "Your match + Filter" column (#577):
// - A full-width top card: title, counts, search, the match bar (level · style · Arm comfort; re-orders by "% your match",
//   hides nothing) and "Not sure yet? fine-tune ▾", a panel of Shape, Feel and Brand pills with live counts.
// - The list with one vote pill per row and the opinions bar on the right; no score anywhere. Then a sidebar: Rankings,
//   Latest reviews, New rackets (under the list on phones).
// Everything runs in the browser on the rows the server sent (instant filters, tests/instant-views.test.ts). The picks are the
// shared store (usePicks), so home, racket pages and this page agree.
import { useEffect, useMemo, useState } from "react";
import { type ThreadRow } from "../ui";
import { th } from "../../../lib/thread/look";
import { withoutYear } from "../../../lib/brand-name";
import { usePicks, usePayload, pctsFor, LEVEL_OPTS, STYLE_OPTS, styleLabel, type Level } from "./picks";
import { Ago } from "./ago";

export type SideReview = { id: string; who: string; at: string; racket: string; href: string; text: string };
type Sort = "picks" | "loved" | "new" | "match";
type Key = "shape" | "feel" | "brand";
const SORTS: [Sort, string][] = [["picks", "PadelRecs picks"], ["loved", "Most loved"], ["new", "Newest"], ["match", "By your match"]];
const FEELS = ["Soft", "Medium", "Hard"];
const TOP_BRANDS = 6, STEP = 24, NEW_N = 3;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "Head Extreme Motion (2026)", as the racket page titles it. */
const named = (r: ThreadRow) => { const b = withoutYear(r.name); return r.year && b !== r.name ? `${b} (${r.year})` : r.name; };
const opinions = (r: ThreadRow) => r.pos + r.mix + r.neg;
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

export function PadelCatalog({ rows, brands, pills, added, curated, rankings, latest }: {
  rows: ThreadRow[]; brands: string[];
  /** A row's vote pill ("Most picked for power · 22 players"), when it has one. */ pills: Record<string, string>;
  /** When each racket joined the catalogue (Newest, New rackets). */ added: Record<string, string>;
  /** "PadelRecs picks": the curated order, ids; the rest follow by loved count. */ curated: string[];
  rankings: { label: string; href: string }[]; latest: SideReview[];
}) {
  const [q, setQ] = useState(""), [f, setF] = useState<Partial<Record<Key, string[]>>>({}), [sort, setSort] = useState<Sort>("picks"), [sortOpen, setSortOpen] = useState(false);
  const [ft, setFt] = useState(false), [allBrands, setAllBrands] = useState(false), [n, setN] = useState(STEP), [older, setOlder] = useState(false);
  const [picks, setPicks] = usePicks(); const mine = !!(picks.level || picks.style), payload = usePayload(mine);
  const pcts = useMemo(() => mine && payload ? pctsFor(payload, picks) : null, [mine, payload, picks]);
  // ?q= from the header search, ?shape= / ?feel= from the home's links, ?level= sets the level pick (no Level filter here).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const u = new URLSearchParams(location.search), v = u.get("q"); if (v) setQ(v);
    const pre: Partial<Record<Key, string[]>> = {}; for (const k of ["feel", "shape"] as const) { const x = u.get(k); if (x) pre[k] = [x]; }
    const lv = u.get("level")?.toLowerCase(); if (lv && (LEVEL_OPTS as string[]).includes(lv)) setPicks({ level: lv as Level });
    if (Object.keys(pre).length) setF(pre);
  // Read the address once, on load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // A level or style pick switches to "By your match"; clearing them goes back to the picks order.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSort(s => mine ? "match" : s === "match" ? "picks" : s); }, [mine]);
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const pool = useMemo(() => older || words.length ? rows : rows.filter(r => r.current !== false), [rows, older, words.length]);
  const olderN = rows.length - rows.filter(r => r.current !== false).length;
  const shapes = useMemo(() => [...new Set(rows.map(r => r.shape).filter((x): x is string => !!x))].sort((a, b) => rows.filter(r => r.shape === b).length - rows.filter(r => r.shape === a).length).slice(0, 5), [rows]);
  const test = (r: ThreadRow, k: Key, v: string) => k === "shape" ? r.shape === v : k === "feel" ? r.feel === v : r.brand === v;
  const pass = (r: ThreadRow, skip?: Key) => words.every(w => `${r.name} ${r.brand} ${r.slug.replace(/-/g, " ")}`.toLowerCase().includes(w))
    && (["shape", "feel", "brand"] as Key[]).every(k => k === skip || !f[k]?.length || f[k]!.some(v => test(r, k, v)));
  const toggle = (k: Key, v: string) => { setN(STEP); setF(x => { const cur = x[k] ?? []; return { ...x, [k]: cur.includes(v) ? cur.filter(y => y !== v) : [...cur, v] }; }); };
  const chips = (Object.entries(f) as [Key, string[]][]).flatMap(([k, vs]) => vs.map(v => ({ k, v })));
  const clearAll = () => { setF({}); setQ(""); setN(STEP); };
  const pick = useMemo(() => new Map(curated.map((id, i) => [id, i])), [curated]);
  const newest = useMemo(() => rows.filter(r => r.current !== false).sort((a, b) => b.year - a.year || (added[b.id] ?? "").localeCompare(added[a.id] ?? "")).slice(0, NEW_N), [rows, added]);
  const isNew = useMemo(() => new Set(newest.map(r => r.id)), [newest]);
  const by = sort === "match" && !pcts ? "picks" : sort;
  const list = useMemo(() => pool.filter(r => pass(r)).sort((a, b) => by === "loved" ? b.pos - a.pos || opinions(b) - opinions(a)
    : by === "new" ? b.year - a.year || (added[b.id] ?? "").localeCompare(added[a.id] ?? "")
    : by === "match" ? (pcts!.get(b.id) ?? -1) - (pcts!.get(a.id) ?? -1)
    : (pick.get(a.id) ?? 1e6) - (pick.get(b.id) ?? 1e6) || b.pos - a.pos),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [pool, f, q, by, pcts, pick, added]);
  const total = rows.filter(r => r.current !== false), allOpinions = total.reduce((s, r) => s + opinions(r), 0);
  const group = (k: Key, title: string, vals: string[], more?: boolean) => {
    const opts = vals.map(v => ({ v, c: pool.filter(r => pass(r, k) && test(r, k, v)).length, sel: !!f[k]?.includes(v) })).filter(o => o.c > 0 || o.sel);
    const shown = more === undefined || allBrands ? opts : opts.filter((o, i) => i < TOP_BRANDS || o.sel);
    return opts.length > 0 && <div key={k} className="tc-fg"><span className="tc-fg-h">{title}</span>
      {shown.map(({ v, c, sel }) => <button key={v} type="button" className="tc-pill" aria-pressed={sel} onClick={() => toggle(k, v)}>{v}<small>{c}</small></button>)}
      {more !== undefined && opts.length > TOP_BRANDS && <button type="button" className="tc-more" onClick={() => setAllBrands(x => !x)}>{allBrands ? "Fewer" : `+ ${opts.length - TOP_BRANDS} more`}</button>}</div>;
  };
  const sortLabel = SORTS.find(([k]) => k === by)![1];
  return <main className="th-main tc">
    <div className="th-crumbs"><a href={th("/")}>Home</a><span>/</span><span>Rackets</span></div>
    <section className="th-card tc-top">
      <div className="tc-head">
        <div className="tc-title"><h1 className="th-h1">All padel rackets</h1>
          <span>{`${plural(total.length, "racket")}, ${plural(allOpinions, "player opinion")}. Find your match, or fine-tune to narrow it down.`}</span></div>
        <label className="tc-search"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>
          <input value={q} onChange={e => { setQ(e.target.value); setN(STEP); }} placeholder="Search by name or brand" aria-label="Search rackets"/>
          {q && <button type="button" aria-label="Clear search" onClick={() => setQ("")}>×</button>}</label>
      </div>
      <div className="tc-qm" role="group" aria-label="Find my match">
        <span className="tc-qm-tag">Find my match</span>
        <span className="tc-qm-l">{"I'm"}</span>
        {LEVEL_OPTS.map(v => <button key={v} type="button" className="tc-pill" aria-pressed={picks.level === v} onClick={() => setPicks({ level: picks.level === v ? null : v })}>{cap(v)}</button>)}
        <span className="tc-qm-sep" aria-hidden="true"/>
        <span className="tc-qm-l">I want</span>
        {STYLE_OPTS.map(v => <button key={v} type="button" className="tc-pill" aria-pressed={picks.style === v} onClick={() => setPicks({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>)}
        <button type="button" className="th-check tc-arm" aria-pressed={picks.arm} onClick={() => setPicks({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>Arm comfort</button>
        {(mine || picks.arm) && <button type="button" className="tc-link" onClick={() => setPicks({ level: null, style: null, arm: false })}>Reset</button>}
        <button type="button" className="tc-ft" aria-expanded={ft} onClick={() => setFt(x => !x)}>Not sure yet? <u>fine-tune</u> {ft ? "▴" : "▾"}</button>
      </div>
      {ft && <div className="tc-panel"><span className="tc-panel-h">Only show:</span>
        {group("shape", "Shape", shapes)}{group("feel", "Feel", FEELS)}{group("brand", "Brand", brands, true)}</div>}
      {chips.length > 0 && <div className="tc-chips">{chips.map(c => <button key={`${c.k}:${c.v}`} type="button" className="tc-chip" onClick={() => toggle(c.k, c.v)}>{c.v}<span aria-hidden="true">×</span><span className="sr">{`Remove ${c.v}`}</span></button>)}
        <button type="button" className="tc-link" onClick={clearAll}>Clear all</button></div>}
    </section>
    <div className="tc-cols">
      <section className="th-card tc-list">
        <div className="tc-list-h"><h2 className="th-h2">{plural(list.length, "racket")}</h2>
          <span className="tc-sort"><span className="lbl">Sort:</span>
            <button type="button" className="tc-sort-btn" aria-haspopup="listbox" aria-expanded={sortOpen} onClick={() => setSortOpen(o => !o)}>{sortLabel}<small aria-hidden="true">▼</small></button>
            {sortOpen && <span className="tc-sort-menu" role="listbox" aria-label="Sort rackets">{SORTS.filter(([k]) => k !== "match" || pcts).map(([k, l]) =>
              <button key={k} type="button" role="option" aria-selected={by === k} onClick={() => { setSort(k); setSortOpen(false); setN(STEP); }}>{l}<span>{by === k ? "✓" : ""}</span></button>)}</span>}
          </span></div>
        {list.slice(0, n).map(r => { const o = opinions(r), m = pcts?.get(r.id);
          return <a key={r.id} className="tc-row" href={th(r.href)}>
            <span className="tc-ph">{r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="th-ph" aria-hidden="true"/>}</span>
            <span className="tc-txt">
              <span className="tc-name"><strong>{named(r)}</strong>{r.shape && <span className="tc-tag">{r.shape}</span>}{isNew.has(r.id) && <span className="tc-tag new">New</span>}</span>
              {(r.line || r.best) && <span className="tc-desc">{r.line ?? `Best for ${r.best}.`}</span>}
              {pills[r.id] && <span className="tc-vote"><span aria-hidden="true"/>{pills[r.id]}</span>}
            </span>
            <span className="tc-stat">
              {m != null ? <span className="tc-match">{`${m}% your match`}</span> : <span className="tc-n">{plural(o, "opinion")}</span>}
              {o > 0 && <><span className="tc-bar" aria-hidden="true"><i style={{ flex: r.pos }}/><i style={{ flex: r.mix }}/><i style={{ flex: r.neg }}/></span>
                <small>{`${r.pos} loved · ${r.mix} mixed · ${r.neg} not for me`}</small></>}
            </span>
          </a>; })}
        {list.length === 0 && <div className="tc-none"><strong>No rackets match these filters</strong><span>Try removing a filter or searching for a brand.</span>
          <button type="button" className="th-btn lime round" onClick={clearAll}>Clear all filters</button></div>}
        {(list.length > n || (!older && !words.length && olderN > 0)) && <div className="tc-foot">
          {list.length > n && <button type="button" className="th-btn" onClick={() => setN(x => x + STEP)}>{`Show ${Math.min(STEP, list.length - n)} more`}</button>}
          {!older && !words.length && olderN > 0 && <button type="button" className="tc-link" onClick={() => setOlder(true)}>{`Show older models (${olderN})`}</button>}</div>}
      </section>
      <aside className="tc-side">
        {rankings.length > 0 && <section className="th-card tc-box"><h2 className="tc-bh">Rankings</h2>
          {rankings.map(k => <a key={k.href} className="tc-link-row" href={th(k.href)}><span>{k.label}</span><span aria-hidden="true">→</span></a>)}</section>}
        {latest.length > 0 && <section className="th-card tc-box"><h2 className="tc-bh">Latest reviews</h2>
          {latest.map(c => <a key={c.id} className="tc-rv" href={th(c.href)}><span className="tc-rv-by"><strong>{c.who}</strong>{" · "}<Ago at={c.at}/></span>
            <b>{c.racket}</b><span className="tc-rv-t">{c.text}</span></a>)}</section>}
        {newest.length > 0 && <section className="th-card tc-box"><h2 className="tc-bh">New rackets</h2>
          {newest.map(r => <a key={r.id} className="tc-new" href={th(r.href)}><span className="tc-new-ph">{r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="th-ph"/>}</span>
            <span><b>{named(r)}</b><small><span className="tc-tag new">New</span>{[r.shape, plural(opinions(r), "opinion")].filter(Boolean).join(" · ")}</small></span></a>)}</section>}
      </aside>
    </div>
  </main>;
}
