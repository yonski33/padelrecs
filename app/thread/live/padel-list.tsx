"use client";
// The PadelRecs racket list the home and the catalogue share (v3 handoff, owner 2026-11-21): the match bar (level · style ·
// Arm comfort; re-orders by "% your match", hides nothing), "Not sure yet? fine-tune" with Shape, Feel and Brand pills
// (hides rackets, live counts), the filter chips, the sort menu and the row. All in the browser on the rows the server sent
// (instant filters, tests/instant-views.test.ts). Picks: the shared usePicks store ("padelrecs-qm"); fine-tune: "padelrecs-ft".
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { type ThreadRow } from "../ui";
import { th } from "../../../lib/thread/look";
import { withoutYear } from "../../../lib/brand-name";
import { usePicks, usePayload, pctsFor, LEVEL_OPTS, STYLE_OPTS, BUDGETS, styleLabel, type Level } from "./picks";
import { bandOrder } from "../../../lib/thread/home-order";
import { niche } from "../../../lib/niche";
import { W } from "../../../lib/thread/words";
import { USES, SOUNDS, type AudioPicks } from "../../../lib/audio-match";

export type Sort = "picks" | "loved" | "opinions" | "new" | "match";
export type Key = "shape" | "feel" | "brand";
type Filters = Partial<Record<Key, string[]>>;
/** AudioRecs (V3-ROLLOUT-BRIEF): no curated lists, so no "picks" order; Type and Sound in place of Shape and Feel (its rows
 *  carry the kind as `shape` and the tuning as `feel`, app/thread/padel-list-data.ts). */
const AUDIO = niche.id === "audio";
/** SimRacingRecs (v3 rollout 2026-11-21): no curated lists either; Type and Drive (its rows carry the drive kind as `feel`,
 *  app/thread/padel-list-data.ts); its match bar picks a budget, not a style, and "I race on console". */
const SR = niche.id === "simracing";
export const SORTS: [Sort, string][] = AUDIO || SR ? [["loved", "Most loved"], ["new", "Newest"], ["match", "By your match"]]
  : [["picks", "PadelRecs picks"], ["loved", "Most loved"], ["new", "Newest"], ["match", "By your match"]];
const BASE_SORT: Sort = SORTS[0][0];
/** The home's menu (owner 2026-11-21: "PadelRecs picks" read as random there): Most loved (default), Most opinions, and By
 *  your match once a pick is set. The catalogue keeps SORTS. */
export const HOME_SORTS: [Sort, string][] = [["loved", "Most loved"], ["opinions", "Most opinions"], ["match", "By your match"]];
const FEELS = AUDIO ? ["Warm", "Balanced", "Bright"] : SR ? ["Direct drive", "Belt", "Gear"] : ["Soft", "Medium", "Hard"];
const GROUP_TITLES: Record<Key, string> = AUDIO ? { shape: "Type", feel: "Sound", brand: "Brand" } : SR ? { shape: "Type", feel: "Drive", brand: "Brand" } : { shape: "Shape", feel: "Feel", brand: "Brand" };
/** AudioRecs' match (lib/audio-match.ts), worked out by the page's own hook (live/audio-match.tsx) and handed to the list. */
export type ListMatch = { mine: boolean; pcts: Map<string, number | null> | null; picks: AudioPicks; set: (p: Partial<AudioPicks>) => void };
const TOP_BRANDS = 6;
/** Fine-tune filters kept in this browser (handoff README: "padelrecs-ft"), the same on the home and the catalogue. */
export const FT_KEY = "padelrecs-ft";
const readFt = (): Filters => { try { const v = JSON.parse(localStorage.getItem(FT_KEY) || "{}");
  return Object.fromEntries((["shape", "feel", "brand"] as Key[]).flatMap(k => Array.isArray(v[k]) && v[k].length ? [[k, v[k].filter((x: unknown) => typeof x === "string")]] : [])); } catch { return {}; } };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "Head Extreme Motion (2026)", as the racket page titles it. */
export const named = (r: ThreadRow) => { const b = withoutYear(r.name); return r.year && b !== r.name ? `${b} (${r.year})` : r.name; };
export const opinions = (r: ThreadRow) => r.pos + r.mix + r.neg;
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** The list's state: picks, fine-tune, search, sort and the sorted, filtered rows. `search`: the catalogue's search box.
 *  `season` (the home, lib/thread/home-order.ts): only these ids, "Most loved" by default, and "By your match" in 10-point
 *  bands with the most loved first inside each. `match`: AudioRecs' own quick match (live/audio-match.tsx). */
export function useRacketList({ rows, curated, added, search = false, season, match }: { rows: ThreadRow[]; curated: string[]; added: Record<string, string>; search?: boolean; season?: string[]; match?: ListMatch }) {
  const base: Sort = season ? "loved" : BASE_SORT;
  const [q, setQ] = useState(""), [f, setF] = useState<Filters>({}), [sort, setSort] = useState<Sort>(base), [ftReady, setFtReady] = useState(false), [older, setOlder] = useState(false);
  const [picks, setPicks] = usePicks(); const padelMine = !match && !!(picks.level || picks.style || picks.budget), payload = usePayload(padelMine);
  const padelPcts = useMemo(() => padelMine && payload ? pctsFor(payload, picks) : null, [padelMine, payload, picks]);
  const mine = match ? match.mine : padelMine, pcts = match ? match.pcts : padelPcts;
  // ?q= (catalogue), ?shape= / ?feel= from links, ?level= sets the level pick. A link's filter wins over the kept filters.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const u = new URLSearchParams(location.search), v = u.get("q"); if (v && search) setQ(v);
    const pre: Filters = {}; for (const k of ["feel", "shape"] as const) { const x = u.get(k); if (x) pre[k] = [x]; }
    const lv = u.get("level")?.toLowerCase(); if (lv && (LEVEL_OPTS as string[]).includes(lv)) setPicks({ level: lv as Level });
    const kept = Object.keys(pre).length ? pre : readFt(); if (Object.keys(kept).length) setF(kept); setFtReady(true);
  // Read the address once, on load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (!ftReady) return; try { localStorage.setItem(FT_KEY, JSON.stringify(f)); } catch { /* private mode */ } }, [f, ftReady]);
  // A level or style pick switches to "By your match"; clearing them goes back to the picks order.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSort(s => mine ? "match" : s === "match" ? base : s); }, [mine, base]);
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const only = useMemo(() => season ? new Set(season) : null, [season]);
  const pool = useMemo(() => only ? rows.filter(r => only.has(r.id)) : older || words.length ? rows : rows.filter(r => r.current !== false), [rows, only, older, words.length]);
  const olderN = rows.length - rows.filter(r => r.current !== false).length;
  const test = (r: ThreadRow, k: Key, v: string) => k === "shape" ? r.shape === v : k === "feel" ? r.feel === v : r.brand === v;
  const pass = (r: ThreadRow, skip?: Key) => words.every(w => `${r.name} ${r.brand} ${r.slug.replace(/-/g, " ")}`.toLowerCase().includes(w))
    && (["shape", "feel", "brand"] as Key[]).every(k => k === skip || !f[k]?.length || f[k]!.some(v => test(r, k, v)));
  const toggle = (k: Key, v: string) => setF(x => { const cur = x[k] ?? []; return { ...x, [k]: cur.includes(v) ? cur.filter(y => y !== v) : [...cur, v] }; });
  const chips = (Object.entries(f) as [Key, string[]][]).flatMap(([k, vs]) => vs.map(v => ({ k, v })));
  const clearAll = () => { setF({}); setQ(""); };
  const pick = useMemo(() => new Map(curated.map((id, i) => [id, i])), [curated]);
  const by: Sort = sort === "match" && !pcts ? base : sort;
  const list = useMemo(() => pool.filter(r => pass(r)).sort((a, b) => by === "loved" ? b.pos - a.pos || opinions(b) - opinions(a)
    : by === "opinions" ? opinions(b) - opinions(a) || b.pos - a.pos
    : by === "new" ? b.year - a.year || (added[b.id] ?? "").localeCompare(added[a.id] ?? "")
    : by === "match" ? (only ? bandOrder(a, b, pcts!) : (pcts!.get(b.id) ?? -1) - (pcts!.get(a.id) ?? -1))
    : (pick.get(a.id) ?? 1e6) - (pick.get(b.id) ?? 1e6) || b.pos - a.pos),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [pool, f, q, by, pcts, pick, added, only]);
  const sorts = season ? HOME_SORTS : SORTS;
  return { q, setQ, f, toggle, chips, clearAll, picks, setPicks, mine, pcts, sort: by, setSort, sorts, list, pool, pass, test, older, setOlder, olderN, words, match };
}
export type RacketList = ReturnType<typeof useRacketList>;

/** The match bar: Find my match · I'm … | I want … · Arm comfort · Reset, then "Not sure yet? fine-tune" on the right.
 *  `tag`: the yellow sticker label (catalogue: "Find my match"); `lead` and `after` add the home's icons and sticker. */
export function MatchBar({ l, ft, setFt, tag, icons, after }: { l: RacketList; ft: boolean; setFt: (x: boolean) => void; tag?: string; icons?: Partial<Record<Level, ReactNode>>; after?: ReactNode }) {
  const { picks, setPicks, mine } = l;
  // AudioRecs: I use them for … | I want … · Noise cancelling (lib/audio-match.ts), the same bar and classes.
  if (l.match) { const m = l.match, any = !!(m.picks.use || m.picks.sound || m.picks.anc);
    return <div className="tc-qm" role="group" aria-label="Find my match">
      {tag && <span className="tc-qm-tag">{tag}</span>}
      <span className="tc-qm-l">I use them for</span>
      {USES.map(([v, t]) => <button key={v} type="button" className="tc-pill" aria-pressed={m.picks.use === v} onClick={() => m.set({ use: m.picks.use === v ? null : v })}>{t}</button>)}
      <span className="tc-qm-sep" aria-hidden="true"/>
      <span className="tc-qm-l">I want</span>
      {SOUNDS.map(([v, t]) => <button key={v} type="button" className="tc-pill" aria-pressed={m.picks.sound === v} onClick={() => m.set({ sound: m.picks.sound === v ? null : v })}>{t}</button>)}
      <button type="button" className="th-check tc-arm" aria-pressed={m.picks.anc} onClick={() => m.set({ anc: !m.picks.anc })}><span aria-hidden="true">{m.picks.anc ? "✓" : ""}</span>Noise cancelling</button>
      {after}
      {any && <button type="button" className="tc-link" onClick={() => m.set({ use: null, sound: null, anc: false })}>Reset</button>}
      <button type="button" className="tc-ft" aria-expanded={ft} onClick={() => setFt(!ft)}>Not sure yet? <u>fine-tune</u> {ft ? "▴" : "▾"}</button>
    </div>; }
  return <div className="tc-qm" role="group" aria-label="Find my match">
    {tag && <span className="tc-qm-tag">{tag}</span>}
    <span className="tc-qm-l">{"I'm"}</span>
    {LEVEL_OPTS.map(v => <button key={v} type="button" className="tc-pill" aria-pressed={picks.level === v} onClick={() => setPicks({ level: picks.level === v ? null : v })}>{icons?.[v]}{cap(v)}</button>)}
    <span className="tc-qm-sep" aria-hidden="true"/>
    <span className="tc-qm-l">I want</span>
    {STYLE_OPTS.map(v => <button key={v} type="button" className="tc-pill" aria-pressed={picks.style === v} onClick={() => setPicks({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>)}
    {BUDGETS.map(([k, w]) => <button key={k} type="button" className="tc-pill" aria-pressed={picks.budget === k} onClick={() => setPicks({ budget: picks.budget === k ? null : k })}>{w}</button>)}
    <button type="button" className="th-check tc-arm" aria-pressed={picks.arm} onClick={() => setPicks({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>{SR ? "I race on console" : "Arm comfort"}</button>
    {after}
    {(mine || picks.arm) && <button type="button" className="tc-link" onClick={() => setPicks({ level: null, style: null, arm: false, ...(BUDGETS.length ? { budget: null } : {}) })}>Reset</button>}
    <button type="button" className="tc-ft" aria-expanded={ft} onClick={() => setFt(!ft)}>Not sure yet? <u>fine-tune</u> {ft ? "▴" : "▾"}</button>
  </div>;
}

/** "Only show:" Shape, Feel and Brand pills with live counts (top 6 brands + more), then the active chips with × and Clear all. */
export function FineTune({ l, ft, brands }: { l: RacketList; ft: boolean; brands: string[] }) {
  const { pool, pass, test, f, toggle, chips, clearAll } = l, [allBrands, setAllBrands] = useState(false);
  const shapes = useMemo(() => [...new Set(pool.map(r => r.shape).filter((x): x is string => !!x))].sort((a, b) => pool.filter(r => r.shape === b).length - pool.filter(r => r.shape === a).length).slice(0, 5), [pool]);
  const group = (k: Key, title: string, vals: string[], more?: boolean) => {
    const opts = vals.map(v => ({ v, c: pool.filter(r => pass(r, k) && test(r, k, v)).length, sel: !!f[k]?.includes(v) })).filter(o => o.c > 0 || o.sel);
    const shown = !more || allBrands ? opts : opts.filter((o, i) => i < TOP_BRANDS || o.sel);
    return opts.length > 0 && <div key={k} className="tc-fg"><span className="tc-fg-h">{title}</span>
      {shown.map(({ v, c, sel }) => <button key={v} type="button" className="tc-pill" aria-pressed={sel} onClick={() => toggle(k, v)}>{v}<small>{c}</small></button>)}
      {more && opts.length > TOP_BRANDS && <button type="button" className="tc-more" onClick={() => setAllBrands(x => !x)}>{allBrands ? "Show fewer" : `+ ${opts.length - TOP_BRANDS} more`}</button>}</div>;
  };
  return <>
    {ft && <div className="tc-panel"><span className="tc-panel-h">Only show:</span>{group("shape", GROUP_TITLES.shape, shapes)}{group("feel", GROUP_TITLES.feel, FEELS)}{group("brand", GROUP_TITLES.brand, brands, true)}</div>}
    {chips.length > 0 && <div className="tc-chips">{chips.map(c => <button key={`${c.k}:${c.v}`} type="button" className="tc-chip" onClick={() => toggle(c.k, c.v)}>{c.v}<span aria-hidden="true">×</span><span className="sr">{`Remove ${c.v}`}</span></button>)}
      <button type="button" className="tc-link" onClick={clearAll}>Clear all</button></div>}
  </>;
}

/** The sort menu (catalogue: PadelRecs picks · Most loved · Newest · By your match; home: Most loved · Most opinions · By your
 *  match), "By your match" once a pick is made. */
export function SortMenu({ l, onPick }: { l: RacketList; onPick?: () => void }) {
  const [open, setOpen] = useState(false), label = l.sorts.find(([k]) => k === l.sort)?.[1] ?? l.sorts[0][1];
  return <span className="tc-sort"><span className="lbl">Sort:</span>
    <button type="button" className="tc-sort-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}>{label}<small aria-hidden="true">▼</small></button>
    {open && <span className="tc-sort-menu" role="listbox" aria-label={`Sort ${W.items}`}>{l.sorts.filter(([k]) => k !== "match" || l.pcts).map(([k, t]) =>
      <button key={k} type="button" role="option" aria-selected={l.sort === k} onClick={() => { l.setSort(k); setOpen(false); onPick?.(); }}>{t}<span>{l.sort === k ? "✓" : ""}</span></button>)}</span>}
  </span>;
}

/** One racket row: photo, name (year) + shape (+ New), one line, the vote pill; then N opinions (or % your match), the bar and
 *  the counts. No score. `rank`: the home's "#1". `link`: the home's "See reviews ›". */
export function RacketRow({ r, pill, match, isNew, rank, link }: { r: ThreadRow; pill?: string; match?: number | null; isNew?: boolean; rank?: number; link?: boolean }) {
  const o = opinions(r);
  return <a className={`tc-row${rank ? " ranked" : ""}`} href={th(r.href)}>
    {rank != null && <span className="tc-rank">{`#${rank}`}</span>}
    <span className="tc-ph">{r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="th-ph" aria-hidden="true"/>}</span>
    <span className="tc-txt">
      <span className="tc-name"><strong>{named(r)}</strong>{r.shape && <span className="tc-tag">{r.shape}</span>}{isNew && <span className="tc-tag new">New</span>}</span>
      {(r.line || r.best) && <span className="tc-desc">{r.line ?? `Best for ${r.best}.`}</span>}
      {pill && <span className="tc-vote"><span aria-hidden="true"/>{pill}</span>}
    </span>
    <span className="tc-stat">
      {match != null ? <span className="tc-match">{`${match}% your match`}</span> : <span className="tc-n">{plural(o, "opinion")}</span>}
      {o > 0 && <><span className="tc-bar" aria-hidden="true"><i style={{ flex: r.pos }}/><i style={{ flex: r.mix }}/><i style={{ flex: r.neg }}/></span>
        <small>{`${r.pos} loved · ${r.mix} mixed · ${r.neg} not for me`}</small></>}
      {link && <span className="tc-go">See reviews ›</span>}
    </span>
  </a>;
}
