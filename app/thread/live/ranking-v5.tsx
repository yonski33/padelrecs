"use client";
// PadelRecs ranking page v5 (owner mock "Rankings Thread v4", 2026-11-21): the list rows and the sidebar's "Quick match: find
// your fit". The quick match never reorders the list: once a level and a style are picked, the box names the best fit in this
// list and that row gets a "Your best fit here" tag. The picks are the site's shared ones (live/picks.ts), so they follow the
// visitor from the home and the catalogue, and the match % comes from the same engine as the home.
import { useMemo } from "react";
import { th } from "../../../lib/thread/look";
import { usePicks, usePayload, pctsFor, complete, LEVEL_OPTS, STYLE_OPTS, styleLabel } from "./picks";

export type V5Row = { id: string; rank: number; name: string; href: string; pic: string | null; shape: string | null; line: string | null;
  pos: number; mix: number; neg: number; rating: string | null; picked: string | null; arm: boolean };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** A match this high reads as a good match; under it, the box says "closest fit" instead. */
const GOOD = 80;

/** The best fit in this list for the visitor's picks (highest match %, ties to the higher rank), or null until both are picked. */
function useBestFit(rows: V5Row[]) {
  const [picks] = usePicks(), on = complete(picks), payload = usePayload(on);
  return useMemo(() => {
    if (!on || !payload) return null;
    const pcts = pctsFor(payload, picks);
    let best: { row: V5Row; pct: number } | null = null;
    for (const row of rows) { const pct = pcts.get(row.id); if (pct != null && (!best || pct > best.pct)) best = { row, pct }; }
    return best;
  }, [on, payload, picks, rows]);
}

/** markLoved: a list ordered by its loved count (lib/thread/vote-order.ts "loved", Best overall) puts a yellow marker stroke on
 *  "N loved" under the bar (owner 2026-11-21), the number the list goes by. */
export function RankRows({ rows, ratingLabel, opinions, markLoved = false }: { rows: V5Row[]; ratingLabel: string | null; opinions: [string, string]; markLoved?: boolean }) {
  const best = useBestFit(rows);
  return <>{rows.map(r => { const total = r.pos + r.mix + r.neg;
    return <a key={r.id} className="rk5-row" href={th(r.href)}>
      <span className="rank">{r.rank}</span>
      <span className="pic">{r.pic ? <img src={r.pic} alt=""/> : <span className="th-ph" aria-hidden="true"/>}</span>
      <span className="mid">
        <span className="top"><span className="name">{r.name}</span>{r.shape && <span className="shape">{r.shape}</span>}
          {best?.row.id === r.id && <span className="fit">Your best fit here</span>}</span>
        {r.line && <span className="line">{r.line}</span>}
        {(r.picked || (r.rating && ratingLabel)) && <span className="chips">
          {r.picked && <span className="pick"><i aria-hidden="true"/>{r.picked}</span>}
          {r.rating && ratingLabel && <span className="rating">{`${ratingLabel} ${r.rating}`}</span>}</span>}
      </span>
      <span className="stat">
        <span className="n">{total > 0 ? `${total} ${total === 1 ? opinions[0] : opinions[1]}` : `No ${opinions[1]} yet`}</span>
        {total > 0 && <span className="bar" aria-hidden="true"><i className="pos" style={{ flex: r.pos }}/><i className="mix" style={{ flex: r.mix }}/><i className="neg" style={{ flex: r.neg }}/></span>}
        {total > 0 && <span className="cnt">{markLoved ? <mark className="mk">{`${r.pos} loved`}</mark> : `${r.pos} loved`}{` · ${r.mix} mixed · ${r.neg} not for me`}</span>}
      </span>
    </a>; })}</>;
}

export function QuickMatch({ rows }: { rows: V5Row[] }) {
  const [picks, set] = usePicks(), best = useBestFit(rows), any = !!(picks.level || picks.style || picks.arm);
  const good = best != null && best.pct >= GOOD;
  const why = best ? (good ? `It suits ${picks.level} players who want ${picks.style === "balance" ? "a balanced racket" : picks.style}.`
    : "Nothing here fits every pick. This one comes closest.")
    + (picks.arm ? (best.row.arm ? " Players with sore arms speak well of it." : " Some find it firm on the arm.") : "") : "";
  return <section className="th-card rk5-qm">
    <div className="head"><h3>Quick match: find your fit</h3>
      {any && <button type="button" className="reset" onClick={() => set({ level: null, style: null, arm: false })}>Reset</button>}</div>
    <p>Pick how you play. The list keeps its order.</p>
    <span className="lbl">Your level</span>
    <div className="opts">{LEVEL_OPTS.map(v => <button key={v} type="button" aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{cap(v)}</button>)}</div>
    <span className="lbl">What matters most?</span>
    <div className="opts">{STYLE_OPTS.map(v => <button key={v} type="button" aria-pressed={picks.style === v} onClick={() => set({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>)}</div>
    <button type="button" className="arm" aria-pressed={picks.arm} onClick={() => set({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>Arm comfort matters</button>
    {best && <div className="fit">
      <span className={good ? "ic good" : "ic"} aria-hidden="true">{good ? "✓" : "~"}</span>
      <span className="words"><strong>{good ? "A good match for your game" : "The closest fit in this list"}</strong>
        <span>Best fit here: <b>{best.row.name}</b>. {why}</span>
        <a href={th(best.row.href)}>See more details →</a></span>
    </div>}
  </section>;
}
