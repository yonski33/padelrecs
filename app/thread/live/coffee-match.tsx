"use client";
// CoffeeRecs' quick match in the v3 pages (2026-11-28, PickleballRecs as the template, LaptopRecs' match as the model): the
// picks (what you make, what matters most, quiet), kept in this browser and shared by every page, and the match % for the rows
// on the page (lib/coffee-match.ts on the inputs the page sent, so a tap never asks the server: tests/instant-views.test.ts).
// Like the other quick matches it re-orders by "% your match" and hides nothing. No score.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NO_COFFEE_PICKS, coffeePickedAny, coffeeMatch, rankCoffee, coffeeFit, PART_WORDS, DRINKS, WANTS, type CoffeePicks, type CoffeeWire } from "../../../lib/coffee-match";
import { tone } from "../ui";
import { th } from "../../../lib/thread/look";
import { W } from "../../../lib/thread/words";
import type { ListMatch } from "./padel-list";

const KEY = "coffeerecs-qm", EVENT = "thread-coffee-picks";
const read = (): CoffeePicks => { try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); return { make: v.make ?? null, want: v.want ?? null, quiet: !!v.quiet }; } catch { return NO_COFFEE_PICKS; } };

/** The visitor's picks, the same on every page and tab. Starts empty so the server's HTML and the first render agree. */
export function useCoffeePicks() {
  const [picks, setPicks] = useState<CoffeePicks>(NO_COFFEE_PICKS);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks(read());
    const on = () => setPicks(read());
    addEventListener(EVENT, on); addEventListener("storage", on);
    return () => { removeEventListener(EVENT, on); removeEventListener("storage", on); };
  }, []);
  const set = (next: Partial<CoffeePicks>) => {
    const v = { ...read(), ...next };
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode: the picks still apply on this page */ }
    setPicks(v); dispatchEvent(new Event(EVENT));
  };
  return [picks, set] as const;
}

/** The bar, in the home's classes (tch-, the creators home) or the catalogue's (tc-): I make … | I want … · Quiet. */
function CoffeeBar({ picks, set, tag, after, ft, setFt, home }: { picks: CoffeePicks; set: (p: Partial<CoffeePicks>) => void; tag?: string; after?: ReactNode; ft: boolean; setFt: (x: boolean) => void; home?: boolean }) {
  const c = home ? { qm: "tch-qm", l: "tch-qm-l", sep: "tch-qm-sep", pill: "tch-chip", check: "tch-arm", reset: "tch-reset", ft: "tch-ft" }
    : { qm: "tc-qm", l: "tc-qm-l", sep: "tc-qm-sep", pill: "tc-pill", check: "th-check tc-arm", reset: "tc-link", ft: "tc-ft" };
  const any = coffeePickedAny(picks);
  return <div className={c.qm} role="group" aria-label={home ? "Quick match" : "Find my match"}>
    {tag && <span className="tc-qm-tag">{tag}</span>}
    <span className={c.l}>I make</span>
    {DRINKS.map(([v, t]) => <button key={v} type="button" className={c.pill} aria-pressed={picks.make === v} onClick={() => set({ make: picks.make === v ? null : v })}>{t}</button>)}
    <span className={c.sep} aria-hidden="true"/>
    <span className={c.l}>I want</span>
    {WANTS.map(([v, t]) => <button key={v} type="button" className={c.pill} aria-pressed={picks.want === v} onClick={() => set({ want: picks.want === v ? null : v })}>{t}</button>)}
    <button type="button" className={c.check} aria-pressed={picks.quiet} onClick={() => set({ quiet: !picks.quiet })}><span aria-hidden="true">{picks.quiet ? "✓" : ""}</span>Quiet</button>
    {after}
    {any && <button type="button" className={c.reset} onClick={() => set(NO_COFFEE_PICKS)}>Reset</button>}
    <button type="button" className={c.ft} aria-expanded={ft} onClick={() => setFt(!ft)}>Not sure yet? <u>fine-tune</u> {ft ? "▴" : "▾"}</button>
  </div>;
}

/** The list's match: the picks, each row's % (null where too little backs it) and the bar. */
export function useCoffeeListMatch(wire: CoffeeWire[] | undefined): ListMatch | undefined {
  const [picks, set] = useCoffeePicks();
  const mine = coffeePickedAny(picks);
  const pcts = useMemo(() => wire && mine ? new Map(wire.map(w => [w.id, coffeeMatch(w, picks).pct])) : null, [wire, mine, picks]);
  return wire ? { mine, pcts, bar: o => <CoffeeBar picks={picks} set={set} {...o}/> } : undefined;
}

const FIT_HEAD = { good: "Yes, a strong fit.", maybe: "Maybe. Check the details first.", no: "Probably not this one.", thin: "Not enough reviews to say yet." } as const;
/** "Is it right for me?" on a CoffeeRecs product page, in the v3 FitCard's markup (live/racket-v7b.tsx): I make and I want,
 *  then this product's match %, what people praise or the catch, and, under 80%, up to 2 better fits. `wire`: the products it
 *  is compared with (the same category). `compact`: the creator page's one-row version. */
export function CoffeeFitCard({ id, wire, links, compact = false }: { id: string; wire: CoffeeWire[]; links: Record<string, { name: string; href: string }>; compact?: boolean }) {
  const [picks, set] = useCoffeePicks();
  const res = useMemo(() => {
    const w = wire.find(x => x.id === id);
    if (!w || !coffeePickedAny(picks)) return null;
    const m = coffeeMatch(w, picks);
    const better = m.pct != null && m.pct < 80 ? rankCoffee(wire, picks, x => x.id !== id && !!links[x.id])
      .filter(x => x.m.pct != null && x.m.pct >= m.pct! + 10 && !x.m.hard).slice(0, m.pct < 60 ? 2 : 1) : [];
    return { m, better };
  }, [wire, picks, id, links]);
  const why = res ? res.m.reasons.length ? `${res.m.reasons[0][0].toUpperCase()}${res.m.reasons[0].slice(1)}.`
    : res.m.strong.length ? `${W.People} and reviewers praise its ${res.m.strong.map(k => PART_WORDS[k]).join(" and ")}.` : null : null;
  return <section className={`th-card th7-card th7-fit${compact ? " thc-lfit" : ""}`}>
    <div className="th7-hd"><h2 className="th-h2">{`Is this ${W.item} right for me?`}</h2><span className="th-sub">Pick what you make and what matters most, for a quick fit from owner and reviewer feedback.</span></div>
    <div className="th-fit">
      <div className="th-picks" role="group" aria-label="I make"><span className="lbl">I make</span>
        {DRINKS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.make === v} onClick={() => set({ make: picks.make === v ? null : v })}>{l}</button>)}</div>
      <div className="th-picks" role="group" aria-label="I want"><span className="lbl">I want</span>
        {WANTS.map(([v, l]) => <button key={v} type="button" className="th-pick sm" aria-pressed={picks.want === v} onClick={() => set({ want: picks.want === v ? null : v })}>{l}</button>)}
        <button type="button" className="th-check" aria-pressed={picks.quiet} onClick={() => set({ quiet: !picks.quiet })}><span aria-hidden="true">{picks.quiet ? "✓" : ""}</span>Quiet</button></div>
    </div>
    {res && <div aria-live="polite"><div className="th7-match">
      {res.m.pct != null && <span className="th7-match-pct"><span className={`th-badge ${tone(res.m.pct)}`}>{`${res.m.pct}%`}</span><small>your match</small></span>}
      <span className="th7-match-body"><b>{FIT_HEAD[coffeeFit(res.m.pct)]}</b>
        {why && <span>{why}</span>}
        {res.better.length > 0 && <span className="th-fit-better">{"Better for you: "}{res.better.map((b, i) => <span key={b.w.id}>{i > 0 && " or "}<a href={th(links[b.w.id].href)}>{links[b.w.id].name}</a>{` (${b.m.pct}%)`}</span>)}.</span>}
      </span>
    </div></div>}
  </section>;
}
