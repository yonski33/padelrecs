"use client";
// PadelRecs ranking page (owner design 2026-11-21, artifact "Rankings"): "Check your fit" folds open under the hero and never
// reorders the list; once a level and a style are picked each row shows "% your fit". The picks are the site's shared ones
// (live/picks.ts), so they follow the visitor from the home and the catalogue. Rows: big rank, photo, name, shape, the
// line, the curated category rating out of 10 (lib/category-rating.ts), and the loved / mixed / not for me counts.
import { useMemo, useState } from "react";
import { th } from "../../../lib/thread/look";
import { usePicks, usePayload, pctsFor, complete, LEVEL_OPTS, STYLE_OPTS } from "./picks";

export type V4Row = { id: string; rank: number; name: string; href: string; pic: string | null; shape: string | null; line: string | null;
  pos: number; mix: number; neg: number; rating: string | null };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const tone = (n: number) => n >= 85 ? "g" : n >= 70 ? "y" : "w";

export function FitBar() {
  const [picks, set] = usePicks(), [open, setOpen] = useState(false), on = complete(picks);
  const summary = on ? `${cap(picks.level!)} · ${picks.style}${picks.arm ? " · arm comfort" : ""}` : "";
  return <section className="th-card rk4-fit">
    <button type="button" className="rk4-fit-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}><span>{`Check your fit ${open ? "▴" : "▾"}`}</span>{on && <span className="sum">{summary}</span>}</button>
    {open && <>
      <div className="rk4-fit-row">
        <span className="lbl">I&apos;m</span>{LEVEL_OPTS.map(v => <button key={v} type="button" aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{cap(v)}</button>)}
        <span className="gap"/>
        <span className="lbl">I want</span>{STYLE_OPTS.map(v => <button key={v} type="button" aria-pressed={picks.style === v} onClick={() => set({ style: picks.style === v ? null : v })}>{cap(v)}</button>)}
        <button type="button" className="arm" aria-pressed={picks.arm} onClick={() => set({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>Arm comfort</button>
      </div>
      <span className="rk4-note">Order stays as picked. % shows how each fits you.</span>
    </>}
  </section>;
}

export function RankRows({ rows, ratingLabel }: { rows: V4Row[]; ratingLabel: string | null }) {
  const [picks] = usePicks(), on = complete(picks), payload = usePayload(on);
  const pcts = useMemo(() => on && payload ? pctsFor(payload, picks) : null, [on, payload, picks]);
  return <section className="th-card rk4-list">
    {rows.map(r => { const total = r.pos + r.mix + r.neg, pct = pcts?.get(r.id) ?? null;
      return <div key={r.id} className="rk4-row">
        <span className="rank">{`#${r.rank}`}</span>
        <a className="pic" href={th(r.href)} tabIndex={-1} aria-hidden="true">{r.pic ? <img src={r.pic} alt=""/> : <span className="th-ph"/>}</a>
        <div className="mid">
          <span className="top"><a className="name" href={th(r.href)}>{r.name}</a>{r.shape && <span className="shape">{r.shape}</span>}
            {pct != null && <span className={`fit ${tone(pct)}`}>{`${pct}% your fit`}</span>}</span>
          {r.line && <span className="line">{r.line}</span>}
          {r.rating && ratingLabel && <span className="rating">{`${ratingLabel} ${r.rating}`}</span>}
        </div>
        <div className="stat">
          <span className="n">{total > 0 ? `${total} ${total === 1 ? "opinion" : "opinions"}` : "No opinions yet"}</span>
          {total > 0 && <span className="bar" aria-hidden="true"><i className="pos" style={{ flex: r.pos }}/><i className="mix" style={{ flex: r.mix }}/><i className="neg" style={{ flex: r.neg }}/></span>}
          {total > 0 && <span className="cnt">{`${r.pos} loved · ${r.mix} mixed · ${r.neg} not for me`}</span>}
          <a className="go" href={th(r.href)}>See reviews ›</a>
        </div>
      </div>; })}
  </section>;
}

/** Phones: the lists as one select (the mock's "Ranking:"), which opens the chosen list. */
export function RankSelect({ lists, current }: { lists: { slug: string; href: string; label: string }[]; current: string }) {
  return <label className="rk4-select"><span>Ranking:</span>
    <select value={current} onChange={e => { const l = lists.find(x => x.slug === e.target.value); if (l) location.href = th(l.href); }}>
      {lists.map(l => <option key={l.slug} value={l.slug}>{l.label}</option>)}</select></label>;
}
