"use client";
// "Is this paddle right for me?" in the Hybrid v19 mockup's compact style (owner 2026-11-22: "match this to the mockup", and
// keep it small once it opens): bold "I'm" and "I want" labels, icon level chips, style chips that fill with the accent when
// picked, the arm check; then, under a thin rule, the match pill, one bold line, one reason and Reset. The same picks store
// and engine as the other fit checks (./picks), so the home's quick match and this card agree. The site's own styles show
// (PickleballRecs adds Spin, a real style there).
import { useMemo } from "react";
import { usePicks, usePayload, complete, fitFor, adviceFor, LEVEL_OPTS, STYLE_OPTS, styleLabel, type Level } from "./picks";
import { FIT_HEAD } from "./racket";
import { LEVEL_ICON } from "./creators-home";
import { th } from "../../../lib/thread/look";

const LEVEL_WORD: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export function CompactFit({ id, title, sub }: { id: string; title: string; sub: string }) {
  const [picks, set] = usePicks();
  const on = complete(picks), payload = usePayload(on);
  const fit = useMemo(() => on && payload ? fitFor(payload, picks, id) : null, [on, payload, picks, id]);
  const adv = useMemo(() => fit && payload && fit.verdict.kind !== "thin" ? adviceFor(payload, picks, id, fit.pct) : null, [fit, payload, picks, id]);
  const reason = adv?.line ?? fit?.verdict.reasons[0] ?? null;
  const tone = fit?.pct == null ? "" : fit.pct >= 85 ? " g" : fit.pct >= 70 ? " y" : " r";
  return <section className="thc-box1 thc-fit">
    <h2>{title}</h2>
    <span className="thc-fit-sub">{sub}</span>
    <div className="thc-fit-row"><b>{"I'm"}</b>
      {LEVEL_OPTS.map(v => <button key={v} type="button" className="thc-chip" aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{LEVEL_ICON[v]}{LEVEL_WORD[v]}</button>)}</div>
    <div className="thc-fit-row"><b>I want</b>
      {STYLE_OPTS.map(v => <button key={v} type="button" className="thc-chip" aria-pressed={picks.style === v} onClick={() => set({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>)}
      <label className="thc-arm"><input type="checkbox" checked={picks.arm} onChange={() => set({ arm: !picks.arm })}/><span>Arm comfort</span></label></div>
    {(picks.level || picks.style || picks.arm) && <div className="thc-fit-out" aria-live="polite">
      {!on ? <span className="thc-fit-note">Pick a level and a style to see your match.</span> : !fit ? <span className="thc-fit-note">Working out your match…</span> : <>
        {fit.pct != null && <span className={`thc-fit-pct${tone}`}>{`${fit.pct}% your match`}</span>}
        <strong>{FIT_HEAD[fit.verdict.kind]}</strong>
        {reason && <span className="thc-fit-why">{reason}</span>}
        {adv && adv.better.length > 0 && fit.verdict.kind !== "good" && <span className="thc-fit-why">{"Better for you: "}{adv.better.slice(0, 2).map((b, i) => <span key={b.id}>{i > 0 && " or "}<a href={th(b.href)}>{b.name}</a></span>)}.</span>}
      </>}
      <button type="button" className="thc-fit-reset" onClick={() => set({ level: null, style: null, arm: false })}>Reset</button>
    </div>}
  </section>;
}
