"use client";
// "Is this paddle right for me?" in the Hybrid v19 mockup's compact style (owner 2026-11-22: "match this to the mockup", and
// keep it small once it opens): bold "I'm" and "I want" labels, icon level chips, style chips that fill with the accent when
// picked, the arm check; then, under a thin rule, the match pill, one bold line, one reason and Reset. The same picks store
// and engine as the other fit checks (./picks), so the home's quick match and this card agree. The site's own styles show
// (PickleballRecs adds Spin, a real style there).
import { useMemo } from "react";
import { usePicks, usePayload, complete, fitFor, adviceFor, rankFor, LEVEL_OPTS, STYLE_OPTS, styleLabel, type Level } from "./picks";
import { FIT_HEAD } from "./racket";
import { LEVEL_ICON } from "./creators-home";
import { th } from "../../../lib/thread/look";

const LEVEL_WORD: Record<Level, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
/** The one-line row's labels (paddle page v3 mockup), by the engine's own verdict for the %: its cuts (padel 75 / 55) decide
 *  the word and the pill's colour, so the label never disagrees with the number (owner report 2026-11-26: 66% read "Probably
 *  not for you" from a fixed 70 line while the engine called it "maybe"). */
const BAR_HEAD = { good: "Great fit for you", maybe: "Good fit, one catch", no: "Probably not for you", thin: "Not enough reports to say yet" } as const;
const BAR_TONE = { good: " g", maybe: " y", no: " r", thin: " r" } as const;
/** How many better matches the row names when the fit isn't a great one. */
const BETTER = 3;

/** `bar`: one row across the page under the head (owner mock 2026-11-23), the chips in joined groups, the result below. */
export function CompactFit({ id, title, sub, bar = false }: { id: string; title: string; sub: string; bar?: boolean }) {
  const [picks, set] = usePicks();
  const on = complete(picks), payload = usePayload(on);
  const fit = useMemo(() => on && payload ? fitFor(payload, picks, id) : null, [on, payload, picks, id]);
  const adv = useMemo(() => fit && payload && fit.verdict.kind !== "thin" ? adviceFor(payload, picks, id, fit.pct) : null, [fit, payload, picks, id]);
  const reason = adv?.line ?? fit?.verdict.reasons[0] ?? null;
  // The best matches for the same picks (owner 2026-11-26: "never say others match better without naming them"): the home
  // list's own order for these picks, this model's other years left out, each with its name, link and %.
  const better = useMemo(() => { if (!bar || !fit || !payload || fit.verdict.kind === "good") return [];
    const own = payload.items.find(x => x.id === id)?.row;
    return rankFor(payload, picks, 12).filter(x => x.id !== id && payload.items.find(y => y.id === x.id)?.row !== own && x.pct != null && payload.cards[x.id] && x.pct > (fit.pct ?? 0))
      .slice(0, BETTER).map(x => ({ id: x.id, name: payload.cards[x.id]!.name, href: payload.cards[x.id]!.href, pct: x.pct! })); }, [bar, fit, payload, picks, id]);
  const tone = fit?.pct == null ? "" : fit.pct >= 85 ? " g" : fit.pct >= 70 ? " y" : " r";
  const levels = LEVEL_OPTS.map(v => <button key={v} type="button" className="thc-chip" aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{LEVEL_ICON[v]}{LEVEL_WORD[v]}</button>);
  const styles = STYLE_OPTS.map(v => <button key={v} type="button" className="thc-chip" aria-pressed={picks.style === v} onClick={() => set({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>);
  const arm = <label className="thc-arm"><input type="checkbox" checked={picks.arm} onChange={() => set({ arm: !picks.arm })}/><span>{bar ? "Sore arm?" : "Arm comfort"}</span></label>;
  const reset = <button type="button" className="thc-fit-reset" onClick={() => set({ level: null, style: null, arm: false })}>Reset</button>;
  // Paddle page v3 (owner handoff 2026-11-26): the result sits at the end of the same row. Before both picks a muted hint;
  // then the match pill (green 85+, yellow 70 to 84, white below), its label in the same bands, one reason line and Reset.
  const kind = fit?.verdict.kind ?? "thin";
  const result = <span className="thc-fit-res" aria-live="polite">{!on ? <span className="thc-fit-hint">Pick both to see your match %</span>
    : !fit ? <span className="thc-fit-hint">Working out your match…</span> : <>
      {fit.pct != null && <span className={`thc-fit-pct${BAR_TONE[kind]}`}>{`${fit.pct}% match`}</span>}
      <span className="thc-fit-txt"><strong>{`${fit.pct == null ? BAR_HEAD.thin : BAR_HEAD[kind]}.`}</strong>{reason && <>{" "}<span>{reason}</span></>}</span>
      {reset}
      {better.length > 0 && <span className="thc-fit-better">{"Better matches: "}{better.map((b, i) => <span key={b.id}>{i > 0 && " · "}
        <a className="thc-fit-alt" href={th(b.href)}>{b.name}</a>{` ${b.pct}%`}</span>)}</span>}</>}</span>;
  return <section className={`thc-box1 thc-fit${bar ? " bar" : ""}`}>
    {/* The home's quick-match row (owner 2026-11-23): separate chips with icons, a thin divider, all on one line. */}
    {bar ? <><h2>{title}</h2><div className="thc-fit-line">
      <b>{"I'm"}</b>{levels}<span className="thc-fit-sep" aria-hidden="true"/><b>I want</b>{styles}{arm}{result}</div></> : <>
    <h2>{title}</h2>
    <span className="thc-fit-sub">{sub}</span>
    <div className="thc-fit-row"><b>{"I'm"}</b>{levels}</div>
    <div className="thc-fit-row"><b>I want</b>{styles}{arm}</div></>}
    {!bar && (picks.level || picks.style || picks.arm) && <div className="thc-fit-out" aria-live="polite">
      {!on ? <span className="thc-fit-note">Pick a level and a style to see your match.</span> : !fit ? <span className="thc-fit-note">Working out your match…</span> : <>
        {fit.pct != null && <span className={`thc-fit-pct${tone}`}>{`${fit.pct}% your match`}</span>}
        <strong>{FIT_HEAD[fit.verdict.kind]}</strong>
        {reason && <span className="thc-fit-why">{reason}</span>}
        {adv && adv.better.length > 0 && fit.verdict.kind !== "good" && <span className="thc-fit-why">{"Better for you: "}{adv.better.slice(0, 2).map((b, i) => <span key={b.id}>{i > 0 && " or "}<a className="thc-fit-alt" href={th(b.href)}>{b.name}</a></span>)}.</span>}
      </>}
      {reset}
    </div>}
  </section>;
}
