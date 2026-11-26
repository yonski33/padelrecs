"use client";
// PadelRecs ranking page v5 (owner mock "Rankings Thread v4", 2026-11-21): the list rows and the sidebar's "Quick match: find
// your fit". The quick match never reorders the list: once a level and a style are picked, the box names the best fit in this
// list and that row gets a "Your best fit here" tag. The picks are the site's shared ones (live/picks.ts), so they follow the
// visitor from the home and the catalogue, and the match % comes from the same engine as the home.
import { useMemo, useState, type ReactNode } from "react";
import { th } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { usePicks, usePayload, pctsFor, complete, LEVEL_OPTS, STYLE_OPTS, BUDGETS, styleLabel } from "./picks";
import { useAudioPicks } from "./audio-match";
import { audioMatch, audioPickedAny, USES, SOUNDS, USE_WORDS, type AudioWire } from "../../../lib/audio-match";

export type V5Row = { id: string; rank: number; name: string; href: string; pic: string | null; shape: string | null; line: string | null;
  pos: number; mix: number; neg: number; rating: string | null; picked: string | null; arm: boolean;
  /** "Picked by 3 expert lists" (lib/thread/expert-lists.ts), or null. */ experts?: string | null };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** A match this high reads as a good match; under it, the box says "closest fit" instead. */
const GOOD = 80;

/** The best fit in this list for the visitor's picks (highest match %, ties to the higher rank), or null until both are picked. */
/** `wire`: AudioRecs' match inputs (lib/audio-match.ts, its own picks); absent on padel. */
function useBestFit(rows: V5Row[], wire?: AudioWire[]) {
  const [padel] = usePicks(), [audio] = useAudioPicks(), on = !wire && complete(padel), payload = usePayload(on);
  return useMemo(() => {
    if (wire) {
      if (!audioPickedAny(audio)) return null;
      const by = new Map(wire.map(w => [w.id, w]));
      let best: { row: V5Row; pct: number } | null = null;
      for (const row of rows) { const w = by.get(row.id), m = w ? audioMatch(w, audio) : null; if (m?.pct != null && !m.hard && (!best || m.pct > best.pct)) best = { row, pct: m.pct }; }
      return best;
    }
    const picks = padel;
    if (!on || !payload) return null;
    const pcts = pctsFor(payload, picks);
    let best: { row: V5Row; pct: number } | null = null;
    for (const row of rows) { const pct = pcts.get(row.id); if (pct != null && (!best || pct > best.pct)) best = { row, pct }; }
    return best;
  }, [on, payload, padel, audio, rows, wire]);
}

/** markLoved: a list ordered by its loved count (lib/thread/vote-order.ts "loved", Best overall) puts a yellow marker stroke on
 *  "N loved" under the bar (owner 2026-11-21), the number the list goes by. */
/** `fitId`: the best fit worked out by the site's own match (SkinRecs, live/skin-match.tsx); padel's engine when left out. */
export function RankRows({ rows, ratingLabel, opinions, markLoved = false, wire, fitId }: { rows: V5Row[]; ratingLabel: string | null; opinions: [string, string]; markLoved?: boolean; wire?: AudioWire[]; fitId?: string | null }) {
  const auto = useBestFit(rows, wire), bestId = fitId === undefined ? auto?.row.id : fitId;
  return <>{rows.map(r => { const total = r.pos + r.mix + r.neg;
    return <a key={r.id} className="rk5-row" href={th(r.href)}>
      <span className="rank">{r.rank}</span>
      <span className="pic">{r.pic ? <img src={r.pic} alt=""/> : <span className="th-ph" aria-hidden="true"/>}</span>
      <span className="mid">
        <span className="top"><span className="name">{r.name}</span>{r.shape && <span className="shape">{r.shape}</span>}
          {bestId === r.id && <span className="fit">Your best fit here</span>}</span>
        {r.line && <span className="line">{r.line}</span>}
        {(r.picked || r.experts || (r.rating && ratingLabel)) && <span className="chips">
          {r.picked && <span className="pick"><i aria-hidden="true"/>{r.picked}</span>}
          {r.experts && <span className="xp">{r.experts}</span>}
          {r.rating && ratingLabel && <span className="rating">{`${ratingLabel} ${r.rating}`}</span>}</span>}
      </span>
      <span className="stat">
        <span className="n">{total > 0 ? `${total} ${total === 1 ? opinions[0] : opinions[1]}` : `No ${opinions[1]} yet`}</span>
        {total > 0 && <span className="bar" aria-hidden="true"><i className="pos" style={{ flex: r.pos }}/><i className="mix" style={{ flex: r.mix }}/><i className="neg" style={{ flex: r.neg }}/></span>}
        {total > 0 && <span className="cnt">{markLoved ? <mark className="mk">{`${r.pos} loved`}</mark> : `${r.pos} loved`}{` · ${r.mix} mixed · ${r.neg} not for me`}</span>}
      </span>
    </a>; })}</>;
}

/** The quick match box. On phones (owner 2026-11-25) it sits above the list (thread.css, .rk5-grid order) and starts folded:
 *  the title, what's picked (or the best fit) and a Show/Hide toggle, so the list stays on screen. Desktop: always open, in the sidebar. */
function QmShell({ summary, reset, children }: { summary: string; reset: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <section className={`th-card rk5-qm rk5-qm-fold${open ? " open" : ""}`}>
    <div className="head"><h3>Quick match: find your fit</h3>{reset}
      <button type="button" className="fold" aria-expanded={open} aria-controls="rk5-qm-body" onClick={() => setOpen(o => !o)}>{open ? "Hide" : "Show"}<span aria-hidden="true">{open ? "▴" : "▾"}</span></button></div>
    <span className="fold-sum">{summary}</span>
    <div className="body" id="rk5-qm-body">{children}</div>
  </section>;
}

export function QuickMatch({ rows, wire }: { rows: V5Row[]; wire?: AudioWire[] }) {
  const [picks, set] = usePicks(), best = useBestFit(rows, wire), any = !!(picks.level || picks.style || picks.arm || picks.budget);
  const [ap, aset] = useAudioPicks();
  // AudioRecs: the same box with its own picks (use, sound, noise cancelling).
  if (wire) { const good = best != null && best.pct >= GOOD;
    const picked = [USES.find(([v]) => v === ap.use)?.[1], SOUNDS.find(([v]) => v === ap.sound)?.[1], ap.anc ? "noise cancelling" : null].filter(Boolean).join(" · ");
    return <QmShell summary={best ? `Best fit here: ${best.row.name}` : picked || "Pick how you listen."}
      reset={audioPickedAny(ap) && <button type="button" className="reset" onClick={() => aset({ use: null, sound: null, anc: false })}>Reset</button>}>
      <p>Pick how you listen. The list keeps its order.</p>
      <span className="lbl">Mostly for</span>
      <div className="opts">{USES.map(([v, t]) => <button key={v} type="button" aria-pressed={ap.use === v} onClick={() => aset({ use: ap.use === v ? null : v })}>{t}</button>)}</div>
      <span className="lbl">I want</span>
      <div className="opts">{SOUNDS.map(([v, t]) => <button key={v} type="button" aria-pressed={ap.sound === v} onClick={() => aset({ sound: ap.sound === v ? null : v })}>{t}</button>)}</div>
      <button type="button" className="arm" aria-pressed={ap.anc} onClick={() => aset({ anc: !ap.anc })}><span aria-hidden="true">{ap.anc ? "✓" : ""}</span>Noise cancelling</button>
      {best && <div className="fit">
        <span className={good ? "ic good" : "ic"} aria-hidden="true">{good ? "✓" : "~"}</span>
        <span className="words"><strong>{good ? "A good match for how you listen" : "The closest fit in this list"}</strong>
          <span>Best fit here: <b>{best.row.name}</b>. {good ? (ap.use ? `Listeners rate it well for ${USE_WORDS[ap.use]}.` : "Listeners rate it well for the sound you picked.") : "Nothing here fits every pick. This one comes closest."}</span>
          <a href={th(best.row.href)}>See more details →</a></span>
      </div>}
    </QmShell>; }
  const good = best != null && best.pct >= GOOD;
  // SimRacingRecs (BUDGETS, no styles): level and budget, "I race on console" (a hard filter, so no arm line).
  const budget = BUDGETS.find(([k]) => k === picks.budget)?.[1].toLowerCase();
  const why = best ? (good ? (BUDGETS.length ? `It suits ${picks.level} racers${budget ? ` on a ${budget} budget` : ""}.` : `It suits ${picks.level} players who want ${picks.style === "balance" ? "a balanced racket" : picks.style}.`)
    : "Nothing here fits every pick. This one comes closest.")
    + (picks.arm && !BUDGETS.length ? (best.row.arm ? " Players with sore arms speak well of it." : " Some find it firm on the arm.") : "") : "";
  const picked = [picks.level && cap(picks.level), picks.style && styleLabel(picks.style), BUDGETS.find(([k]) => k === picks.budget)?.[1], picks.arm ? (BUDGETS.length ? "console" : "arm comfort") : null].filter(Boolean).join(" · ");
  return <QmShell summary={best ? `Best fit here: ${best.row.name}` : picked || (BUDGETS.length ? "Pick your level and budget." : "Pick your level and what matters most.")}
    reset={any && <button type="button" className="reset" onClick={() => set({ level: null, style: null, arm: false, ...(BUDGETS.length ? { budget: null } : {}) })}>Reset</button>}>
    <p>{BUDGETS.length ? "Pick your level and budget. The list keeps its order." : "Pick how you play. The list keeps its order."}</p>
    <span className="lbl">Your level</span>
    <div className="opts">{LEVEL_OPTS.map(v => <button key={v} type="button" aria-pressed={picks.level === v} onClick={() => set({ level: picks.level === v ? null : v })}>{cap(v)}</button>)}</div>
    <span className="lbl">{BUDGETS.length ? "Your budget" : "What matters most?"}</span>
    <div className="opts">{STYLE_OPTS.map(v => <button key={v} type="button" aria-pressed={picks.style === v} onClick={() => set({ style: picks.style === v ? null : v })}>{styleLabel(v)}</button>)}
      {BUDGETS.map(([k, w]) => <button key={k} type="button" aria-pressed={picks.budget === k} onClick={() => set({ budget: picks.budget === k ? null : k })}>{w}</button>)}</div>
    <button type="button" className="arm" aria-pressed={picks.arm} onClick={() => set({ arm: !picks.arm })}><span aria-hidden="true">{picks.arm ? "✓" : ""}</span>{BUDGETS.length ? "I race on console" : niche.id === "discgolf" ? "Slower arm" : "Arm comfort matters"}</button>
    {best && <div className="fit">
      <span className={good ? "ic good" : "ic"} aria-hidden="true">{good ? "✓" : "~"}</span>
      <span className="words"><strong>{good ? "A good match for your game" : "The closest fit in this list"}</strong>
        <span>Best fit here: <b>{best.row.name}</b>. {why}</span>
        <a href={th(best.row.href)}>See more details →</a></span>
    </div>}
  </QmShell>;
}
