"use client";
// "Find my match" on a ranking page (owner 2026-11-17): the quick-match picks open right here instead of sending the visitor
// to the home. Once a style and level are picked, every row shows its match % and fit word, from the same engine as the home
// and the racket pages (lib/home-rank matchPcts over /api/rank-items, loaded once). The list's own order stays.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { matchPcts, type RankItem } from "../../../lib/home-rank";
import { RANK_SETUP } from "../../../lib/rank-seed";
import { SAVED_PICKS_KEY } from "../../../lib/saved-picks";
import { STYLES, LEVELS, levelLabel, STYLE_WORD, type QuickChoice, type Level } from "../../../lib/quick-match";

const Ctx = createContext<(id: string) => number | null | undefined>(() => undefined);
const word = (n: number) => n >= 75 ? "Strong fit" : n >= 55 ? "Decent fit" : "Weak fit";
const toneOf = (n: number) => n >= 85 ? " g" : n >= 70 ? " y" : "";

export function RankMatch({ head, children }: { head: string; children: ReactNode }) {
  const [c, setC] = useState<QuickChoice>({ style: "any", arm: false });
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RankItem[] | null>(null);
  // The visitor's saved picks from a racket page, when there are some (the same profile).
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(SAVED_PICKS_KEY) || "null");
    if (s && LEVELS.includes(s.level)) { setC({ style: STYLES.includes(s.style) ? s.style : "any", level: s.level, arm: !!s.arm }); setOpen(true); } } catch { /* storage off */ } }, []);
  useEffect(() => { if (!open || items) return; let live = true;
    fetch("/api/rank-items").then(r => r.ok ? r.json() : null).then((x: RankItem[] | null) => { if (live && Array.isArray(x)) setItems(x); }, () => {});
    return () => { live = false; }; }, [open, items]);
  const pcts = useMemo(() => items && c.level ? matchPcts(items, c, RANK_SETUP.levelGate, RANK_SETUP.engine) : null, [items, c]);
  const save = (n: QuickChoice) => { setC(n); if (n.level) try { localStorage.setItem(SAVED_PICKS_KEY, JSON.stringify({ style: n.style, level: n.level, arm: n.arm })); } catch { /* storage off */ } };
  return <Ctx.Provider value={id => pcts ? pcts.get(id) ?? null : undefined}>
    <div className={`rk3-you${open ? " open" : ""}`} id="rk-match">
      <b>{head}</b>
      {!open ? <button type="button" onClick={() => setOpen(true)}>find my match →</button> : <div className="rk3-picks">
        <span className="rk3-seg" role="group" aria-label="What you want most">{STYLES.filter(s => s !== "any").map(s =>
          <button key={s} type="button" aria-pressed={c.style === s} onClick={() => save({ ...c, style: c.style === s ? "any" : s })}>{STYLE_WORD[s] ?? s}</button>)}</span>
        <span className="rk3-seg" role="group" aria-label="Your level">{(LEVELS as readonly Level[]).map(l =>
          <button key={l} type="button" aria-pressed={c.level === l} onClick={() => save({ ...c, level: l })}>{levelLabel(l)}</button>)}</span>
        <button type="button" className="rk3-arm" aria-pressed={c.arm} onClick={() => save({ ...c, arm: !c.arm })}><i aria-hidden="true">{c.arm ? "✓" : ""}</i>sore arm</button>
        <span className="rk3-hint">{!c.level ? "pick your level to see your match" : !pcts ? "working it out…" : "your match is on every row"}</span>
      </div>}
    </div>
    {children}
  </Ctx.Provider>;
}

/** One row's match % and fit word once picked; nothing before. */
export function RowMatch({ id }: { id: string }) {
  const p = useContext(Ctx)(id);
  if (p === undefined) return null;
  return p === null ? <span className="rk3-mp none">too few reports</span> : <span className={`rk3-mp${toneOf(p)}`} title="How well it fits your picks. Not a % of happy players.">{`${p}% · ${word(p)}`}</span>;
}
