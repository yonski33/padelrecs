"use client";
// The compare page's quick match (owner's mock 2026-11-16): the home's picks (style, level, sore arm) worked out in the
// browser from the catalog items sent once (lib/home-rank.ts matchPcts, the same function as the home and the rankings),
// with each column's match % once a level is picked. No round trip; the address keeps the products only.
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { matchPcts, type RankItem } from "../../lib/home-rank";
import { niche } from "../../lib/niche";
import { STYLES, LEVELS, levelLabel, STYLE_WORD, type QuickChoice, type Level } from "../../lib/quick-match";

const NOTE = "How well it fits your picks, from player reports. Not a % of happy players.";
const Ctx = createContext<(id: string) => number | null | undefined>(() => undefined);

export function CompareMatch({ items, children }: { items: RankItem[]; children: ReactNode }) {
  const [c, setC] = useState<QuickChoice>({ style: "any", arm: false });
  const pcts = useMemo(() => c.level ? matchPcts(items, c, niche.fit?.levelGate, niche.fit?.engine) : null, [items, c]);
  const style = (s: QuickChoice["style"]) => setC(x => ({ ...x, style: x.style === s ? "any" : s }));
  return <Ctx.Provider value={id => pcts ? pcts.get(id) ?? null : undefined}>
    <section className="cv-qm" aria-label="Quick match">
      <span className="cv-qk">quick match</span><b>I play</b>
      <span className="cv-seg">{STYLES.filter(s => s !== "any").map(s => <button key={s} type="button" aria-pressed={c.style === s} onClick={() => style(s)}>{STYLE_WORD[s] ?? s}</button>)}</span>
      <b>{"and I'm"}</b>
      <span className="cv-lv">{(LEVELS as readonly Level[]).map(l => <button key={l} type="button" aria-pressed={c.level === l} onClick={() => setC(x => ({ ...x, level: x.level === l ? undefined : l }))}>{levelLabel(l)}</button>)}</span>
      <button type="button" className="cv-arm" aria-pressed={c.arm} onClick={() => setC(x => ({ ...x, arm: !x.arm }))}><i aria-hidden="true">{c.arm ? "✓" : ""}</i>sore arm</button>
      <span className="cv-hint">{c.level ? "match % under each name" : "pick a level to see your match %"}</span>
    </section>
    {children}
  </Ctx.Provider>;
}

/** One column's match %, once a level is picked. */
export function MatchPct({ id }: { id: string }) {
  const p = useContext(Ctx)(id);
  if (p === undefined) return null;
  return p === null ? <span className="cv-pct thin" title="Too few reports from players like you for a match %">few reports</span>
    : <span className={`cv-pct${p >= 80 ? " hi" : p >= 60 ? " mid" : ""}`} title={NOTE}>{`${p}% match`}</span>;
}
