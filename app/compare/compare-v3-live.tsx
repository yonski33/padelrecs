"use client";
// PadelRecs compare v3, the parts that follow the visitor's picks: "Which one fits you?" and the cards. The picks are the
// site's shared ones (app/thread/live/picks.ts), so they follow the visitor from the home, the catalogue and the rankings.
// The cards keep their order; the best fit gets a "Best fit for you" tag and each card its "% your match".
import { useMemo, type ReactNode } from "react";
import { usePicks, usePayload, pctsFor, complete, LEVEL_OPTS, STYLE_OPTS, styleLabel } from "../thread/live/picks";

export type V3Card = { id: string; name: string; short: string; href: string; pic: string | null; shape: string | null; feel: string | null;
  picked: string | null; pos: number; mix: number; neg: number; shop: { url: string; rel: string } | null; tint: string; dot: string; remove: string };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const tone = (n: number) => n >= 85 ? "g" : n >= 70 ? "y" : "";

export function FitBar() {
  const [picks, set] = usePicks(), any = !!(picks.level || picks.style || picks.arm);
  return <div className="cp3-fit">
    <div className="head"><span><h2>Which one fits you?</h2><small>Pick your level and style. The best fit gets highlighted below.</small></span>
      {any && <button type="button" className="reset" onClick={() => set({ level: null, style: null, arm: false })}>Reset</button>}</div>
    <div className="row">
      <span className="lbl">I&apos;m</span>{LEVEL_OPTS.map(v => <button key={v} type="button" aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{cap(v)}</button>)}
      <span className="sep" aria-hidden="true"/>
      <span className="lbl">I want</span>{STYLE_OPTS.map(v => <button key={v} type="button" aria-pressed={picks.style === v} onClick={() => set({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>)}
      <button type="button" className="arm" aria-pressed={picks.arm} onClick={() => set({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>Arm comfort</button>
    </div>
  </div>;
}

export function Cards({ cards, add }: { cards: V3Card[]; add: ReactNode }) {
  const [picks] = usePicks(), on = complete(picks), payload = usePayload(on);
  const pcts = useMemo(() => on && payload ? pctsFor(payload, picks) : null, [on, payload, picks]);
  const best = pcts ? cards.reduce<{ id: string; p: number } | null>((b, c) => { const p = pcts.get(c.id); return p != null && (!b || p > b.p) ? { id: c.id, p } : b; }, null) : null;
  return <div className="cp3-scroll"><div className="cp3-cards" style={{ "--n": cards.length + (add ? 1 : 0) } as React.CSSProperties}>
    {cards.map(c => { const pct = pcts?.get(c.id) ?? null, fit = best?.id === c.id, total = c.pos + c.mix + c.neg;
      return <article key={c.id} className={fit ? "cp3-card fit" : "cp3-card"}>
        {fit && <span className="tag">Best fit for you</span>}
        <a className="x" href={c.remove} aria-label={`Remove ${c.name}`}>×</a>
        <a className="pic" href={c.href} tabIndex={-1} aria-hidden="true">{c.pic ? <img src={c.pic} alt=""/> : <span className="th-ph"/>}</a>
        <a className="nm" href={c.href}>{c.name}</a>
        <span className="pills">{c.shape && <span style={{ background: c.tint }}>{c.shape}</span>}{c.feel && <span>{`${c.feel} feel`}</span>}
          {pct != null && <span className={`m ${tone(pct)}`}>{`${pct}% your match`}</span>}</span>
        {c.picked && <span className="pick">{c.picked}</span>}
        {total > 0 ? <span className="sent"><span className="bar" aria-hidden="true"><i className="pos" style={{ flex: c.pos }}/><i className="mix" style={{ flex: c.mix }}/><i className="neg" style={{ flex: c.neg }}/></span>
          <small>{`${c.pos} loved · ${c.mix} mixed · ${c.neg} not for me`}</small></span> : <small className="none">No opinions yet</small>}
        <span className="foot"><a href={`${c.href}#reviews`}>See reviews ›</a>
          {c.shop && <a className="buy" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}</span>
        {c.shop?.rel.startsWith("sponsored") && <small className="aff">Affiliate link - price stays the same</small>}
      </article>; })}
    {add}
  </div></div>;
}
