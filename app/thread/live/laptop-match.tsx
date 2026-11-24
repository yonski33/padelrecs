"use client";
// LaptopRecs' quick match in the v3 pages (owner 2026-11-24, PickleballRecs as the template): the picks (use, what matters
// most, quiet fans), kept in this browser and shared by every page, and the match % for the rows on the page
// (lib/laptop-match.ts on the inputs the page sent, so a tap never asks the server: tests/instant-views.test.ts). Like the
// other quick matches it re-orders by "% your match" and hides nothing. No score.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NO_LAPTOP_PICKS, laptopPickedAny, laptopMatch, rankLaptops, laptopFit, PART_WORDS, USES, WANTS, type LaptopPicks, type LaptopWire } from "../../../lib/laptop-match";
import { tone } from "../ui";
import { th } from "../../../lib/thread/look";
import { W } from "../../../lib/thread/words";
import type { ListMatch } from "./padel-list";

const KEY = "laptoprecs-qm", EVENT = "thread-laptop-picks";
const read = (): LaptopPicks => { try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); return { use: v.use ?? null, want: v.want ?? null, quiet: !!v.quiet }; } catch { return NO_LAPTOP_PICKS; } };

/** The visitor's picks, the same on every page and tab. Starts empty so the server's HTML and the first render agree. */
export function useLaptopPicks() {
  const [picks, setPicks] = useState<LaptopPicks>(NO_LAPTOP_PICKS);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks(read());
    const on = () => setPicks(read());
    addEventListener(EVENT, on); addEventListener("storage", on);
    return () => { removeEventListener(EVENT, on); removeEventListener("storage", on); };
  }, []);
  const set = (next: Partial<LaptopPicks>) => {
    const v = { ...read(), ...next };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode: the picks still apply on this page */ }
    setPicks(v); dispatchEvent(new Event(EVENT));
  };
  return [picks, set] as const;
}

/** The bar, in the home's classes (tch-, the creators home) or the catalogue's (tc-): I use it for … | I want … · Quiet fans. */
function LaptopBar({ picks, set, tag, after, ft, setFt, home }: { picks: LaptopPicks; set: (p: Partial<LaptopPicks>) => void; tag?: string; after?: ReactNode; ft: boolean; setFt: (x: boolean) => void; home?: boolean }) {
  const c = home ? { qm: "tch-qm", l: "tch-qm-l", sep: "tch-qm-sep", pill: "tch-chip", check: "tch-arm", reset: "tch-reset", ft: "tch-ft" }
    : { qm: "tc-qm", l: "tc-qm-l", sep: "tc-qm-sep", pill: "tc-pill", check: "th-check tc-arm", reset: "tc-link", ft: "tc-ft" };
  const any = laptopPickedAny(picks);
  return <div className={c.qm} role="group" aria-label={home ? "Quick match" : "Find my match"}>
    {tag && <span className="tc-qm-tag">{tag}</span>}
    <span className={c.l}>I use it for</span>
    {USES.map(([v, t]) => <button key={v} type="button" className={c.pill} aria-pressed={picks.use === v} onClick={() => set({ use: picks.use === v ? null : v })}>{t}</button>)}
    <span className={c.sep} aria-hidden="true"/>
    <span className={c.l}>I want</span>
    {WANTS.map(([v, t]) => <button key={v} type="button" className={c.pill} aria-pressed={picks.want === v} onClick={() => set({ want: picks.want === v ? null : v })}>{t}</button>)}
    <button type="button" className={c.check} aria-pressed={picks.quiet} onClick={() => set({ quiet: !picks.quiet })}><span aria-hidden="true">{picks.quiet ? "✓" : ""}</span>Quiet fans</button>
    {after}
    {any && <button type="button" className={c.reset} onClick={() => set(NO_LAPTOP_PICKS)}>Reset</button>}
    <button type="button" className={c.ft} aria-expanded={ft} onClick={() => setFt(!ft)}>Not sure yet? <u>fine-tune</u> {ft ? "▴" : "▾"}</button>
  </div>;
}

/** The list's match: the picks, each row's % (null where too little backs it) and the bar. */
export function useLaptopListMatch(wire: LaptopWire[] | undefined): ListMatch | undefined {
  const [picks, set] = useLaptopPicks();
  const mine = laptopPickedAny(picks);
  const pcts = useMemo(() => wire && mine ? new Map(wire.map(w => [w.id, laptopMatch(w, picks).pct])) : null, [wire, mine, picks]);
  return wire ? { mine, pcts, bar: o => <LaptopBar picks={picks} set={set} {...o}/> } : undefined;
}

const FIT_HEAD = { good: "Yes, a strong fit.", maybe: "Maybe. Check the details first.", no: "Probably not this one.", thin: "Not enough reviews to say yet." } as const;
/** "Is it right for me?" on a LaptopRecs product page, in the v3 FitCard's markup (live/racket-v7b.tsx): I use it for and I
 *  want, then this laptop's match %, what people praise or the catch, and, under 80%, up to 2 better fits. `wire`: the
 *  laptops it is compared with. `compact`: the creator page's one-row version (no card heading). */
export function LaptopFitCard({ id, wire, links, compact = false }: { id: string; wire: LaptopWire[]; links: Record<string, { name: string; href: string }>; compact?: boolean }) {
  const [picks, set] = useLaptopPicks();
  const res = useMemo(() => {
    const w = wire.find(x => x.id === id);
    if (!w || !laptopPickedAny(picks)) return null;
    const m = laptopMatch(w, picks);
    const better = m.pct != null && m.pct < 80 ? rankLaptops(wire, picks, x => x.id !== id && !!links[x.id])
      .filter(x => x.m.pct != null && x.m.pct >= m.pct! + 10 && !x.m.hard).slice(0, m.pct < 60 ? 2 : 1) : [];
    return { m, better };
  }, [wire, picks, id, links]);
  const why = res ? res.m.reasons.length ? `${res.m.reasons[0][0].toUpperCase()}${res.m.reasons[0].slice(1)}.`
    : res.m.strong.length ? `${W.People} and reviewers praise its ${res.m.strong.map(k => PART_WORDS[k]).join(" and ")}.` : null : null;
  return <section className={`th-card th7-card th7-fit${compact ? " thc-lfit" : ""}`}>
    <div className="th7-hd"><h2 className="th-h2">{`Is this ${W.item} right for me?`}</h2><span className="th-sub">Pick what you use it for and what matters most, for a quick fit from owner and reviewer feedback.</span></div>
    <div className="th-fit">
      <div className="th-picks" role="group" aria-label="I use it for"><span className="lbl">I use it for</span>
        {USES.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.use === v} onClick={() => set({ use: picks.use === v ? null : v })}>{l}</button>)}</div>
      <div className="th-picks" role="group" aria-label="I want"><span className="lbl">I want</span>
        {WANTS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.want === v} onClick={() => set({ want: picks.want === v ? null : v })}>{l}</button>)}
        <button type="button" className="th-check" aria-pressed={picks.quiet} onClick={() => set({ quiet: !picks.quiet })}><span aria-hidden="true">{picks.quiet ? "✓" : ""}</span>Quiet fans</button></div>
    </div>
    {res && <div aria-live="polite"><div className="th7-match">
      {res.m.pct != null && <span className="th7-match-pct"><span className={`th-badge ${tone(res.m.pct)}`}>{`${res.m.pct}%`}</span><small>your match</small></span>}
      <span className="th7-match-body"><b>{FIT_HEAD[laptopFit(res.m.pct)]}</b>
        {why && <span>{why}</span>}
        {res.better.length > 0 && <span className="th-fit-better">{"Better for you: "}{res.better.map((b, i) => <span key={b.w.id}>{i > 0 && " or "}<a href={th(links[b.w.id].href)}>{links[b.w.id].name}</a>{` (${b.m.pct}%)`}</span>)}.</span>}
      </span>
    </div></div>}
  </section>;
}
