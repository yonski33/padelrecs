"use client";
// "Is this racket right for me?" as the racket page's core (owner OK 2026-11-22; lib/thread/fit-core.ts has the rules and
// lib/thread/sites.ts fitCoreSite the flag). The picks and engine are the site's own (picks.ts: fitFor, adviceFor, pctsFor).
// ?fit=classic shows the earlier card (FitCard) for comparison.
import { useEffect, useMemo, useState } from "react";
import { th } from "../../../lib/thread/look";
import { niche } from "../../../lib/niche";
import { FIT_LABEL, betterPicks, levelLine, pickLines, type FitLine, type PickData, type TapChip } from "../../../lib/thread/fit-core";
import { PickChips } from "./pick-chips";
import { usePicks, usePayload, complete, fitFor, adviceFor, pctsFor } from "./picks";
import { FIT_HEAD } from "./racket";
import { FitCard, OPEN_REVIEW } from "./racket-v7b";

let picksData: Promise<PickData> | null = null;
const loadPickData = () => picksData ??= fetch("/api/fit-picks").then(r => r.ok ? r.json() as Promise<PickData> : {}).catch(() => { picksData = null; return {}; });
/** "intermediate → advanced, power players" → "Intermediate to advanced, power". */
const bestWords = (b?: string) => b ? (b[0].toUpperCase() + b.slice(1)).replace(/ → /g, " to ").replace(/ players\b/g, "") : "";
const slugOf = (href: string) => href.split("/").pop() ?? href;

const Icon = ({ tone }: { tone: FitLine["tone"] }) => <span className={`th-fc-ic ${tone}`} aria-hidden="true">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
    {tone === "pos" ? <path d="M5 12.5l4.5 4.5L19 7"/> : tone === "mix" ? <><path d="M12 5v9"/><path d="M12 19.2v.1"/></> : <path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>}
  </svg></span>;

export function FitCore({ id, slug, short, sub, yes, no, taps }: { id: string; slug: string; short: string; sub: string; yes: FitLine[]; no: FitLine[]; taps: TapChip[] }) {
  const [classic, setClassic] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setClassic(new URLSearchParams(location.search).get("fit") === "classic"); }, []);
  const [picks, set] = usePicks();
  const on = complete(picks), payload = usePayload(on);
  const [data, setData] = useState<PickData | null>(null);
  useEffect(() => { if (on && !data) loadPickData().then(setData); }, [on, data]);
  const fit = useMemo(() => on && payload ? fitFor(payload, picks, id) : null, [on, payload, picks, id]);
  const adv = useMemo(() => fit && payload && fit.verdict.kind !== "thin" ? adviceFor(payload, picks, id, fit.pct) : null, [fit, payload, picks, id]);
  const self = useMemo(() => payload?.items.find(x => x.id === id) ?? null, [payload, id]);
  const lines = useMemo(() => fit ? pickLines(yes, no, picks, levelLine(picks, self?.facts.suits)) : [], [fit, yes, no, picks, self]);
  const better = useMemo(() => {
    if (!fit || !payload || !data || !self || fit.verdict.kind === "good") return [];
    const pcts = pctsFor(payload, picks);
    const cands = payload.items.flatMap(x => { const c = payload.cards[x.id], pct = pcts.get(x.id);
      return c && pct != null ? [{ id: x.id, row: x.row, slug: slugOf(c.href), pct, facts: x.facts }] : []; });
    return betterPicks({ id, row: self.row, slug, pct: 0, facts: self.facts }, cands, data, picks);
  }, [fit, payload, data, self, picks, id, slug]);
  // Two taps: each chip casts (or clears) one "How does it play?" vote; the review form follows from "Add a line".
  const [tapped, setTapped] = useState<Record<string, boolean>>({}), [tapErr, setTapErr] = useState("");
  const tap = async (c: TapChip) => {
    const was = !!tapped[c.group]; setTapped(t => ({ ...t, [c.group]: !was })); setTapErr("");
    try {
      const r = await fetch("/api/trait-votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ racketId: id, trait: c.group, choice: was ? null : c.choice }) });
      if (!r.ok) throw new Error();
    } catch { setTapped(t => ({ ...t, [c.group]: was })); setTapErr("Could not save that. Try again?"); }
  };
  const nTapped = Object.values(tapped).filter(Boolean).length;
  const review = () => dispatchEvent(new CustomEvent(OPEN_REVIEW, { detail: null }));

  if (classic) return <FitCard id={id} title={`Is this ${niche.words.one} right for me?`} sub="Pick how you play and what you want, for a quick fit from community feedback."/>;
  const kind = fit?.verdict.kind;
  return <section className="th-card th7-card th-fc" aria-labelledby="fit-title">
    <div className="th-fc-h">
      <div className="th-fc-hl">
        <span className="th-fc-badge" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3c-5.5 0-9 3.9-9 9 0 4.6 3.1 8.2 6.6 9.3L13 29h6l-.6-7.7C21.9 20.2 25 16.6 25 12c0-5.1-3.5-9-9-9z"/>
          {[[13, 9.5], [19, 9.5], [16, 13], [13, 16.5], [19, 16.5]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" fill="currentColor"/>)}</svg><span className="ball"/></span>
        <div><h2 id="fit-title" className="th-h2">{`Is this ${niche.words.one} right for me?`}</h2><p className="th-sub">{sub}</p></div>
      </div>
      {(picks.level || picks.style || picks.arm) && <button type="button" className="th-fc-start" onClick={() => set({ level: null, style: null, arm: false })}>Start over</button>}
    </div>
    <div className="th-fc-picks th-fit"><PickChips picks={picks} set={set} small armLabel="Arm comfort" labels={["Your level", "What matters most?"]}/></div>
    <div aria-live="polite">
      {!on ? <p className="th-fc-note">Pick a level and a style to see your answer.</p> : !fit ? <p className="th-fc-note">Working out your answer…</p> : <>
        <div className="th-fc-ans">
          <div className="th-fc-ans-h"><span className={`th-fc-label ${kind}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/></svg>{FIT_LABEL[kind!]}</span>
            <h3>{adv?.line ?? FIT_HEAD[kind!]}</h3></div>
          {lines.length > 0 && <ul className="th-fc-lines">{lines.map(l => <li key={`${l.tone}-${l.title}`}><Icon tone={l.tone}/>
            <div><p><b>{l.title}</b> {l.text}</p>{l.chip && <a className="th-fc-src" href="#web">{`${l.chip} ↓`}</a>}</div></li>)}</ul>}
        </div>
        {better.length > 0 && payload && <div className="th-fc-better">
          <div className="th-fc-better-h"><h3>Better picks for you</h3><span>Ranked by fit to your answers.</span></div>
          <div className="th-fc-cards">{better.map(b => { const c = payload.cards[b.id]; const total = c.pos + c.mix + c.neg;
            return <article key={b.id} className="th-fc-card">
              <div className="th-fc-card-top">{c.pic ? <img className="th-fc-pic" src={c.pic} alt="" loading="lazy"/> : <span className="th-fc-pic"/>}
                <div><h4>{c.name}</h4>{c.best && <small>{bestWords(c.best)}</small>}</div></div>
              <p className="th-fc-why"><b>Why it fits you:</b> {b.why}</p>
              {total > 0 && <span className="th-fc-bar" role="img" aria-label="How players and reviews feel about it"><i className="p" style={{ flex: c.pos }}/><i className="m" style={{ flex: c.mix }}/><i className="n" style={{ flex: c.neg }}/></span>}
              <div className="th-fc-act"><a className="see" href={th(c.href)}>{`See ${niche.words.one} ›`}</a><a href={th(`/compare?ids=${encodeURIComponent(slug)},${encodeURIComponent(slugOf(c.href))}`)}>Compare</a></div>
            </article>; })}</div>
        </div>}
      </>}
    </div>
    <div className="th-fc-tap">
      <div className="th-fc-tap-t"><strong>{`Played the ${short}?`}</strong><span>{`Two quick taps help the next ${niche.people.one} get a sharper answer.`}</span></div>
      {taps.length > 0 && <div className="th-fc-chips" role="group" aria-label="How does it play?">{taps.map(c =>
        <button key={c.group} type="button" aria-pressed={!!tapped[c.group]} onClick={() => tap(c)}>{`${tapped[c.group] ? "✓" : "+"} ${c.label}`}</button>)}</div>}
      {tapErr ? <p className="th-fc-thanks" role="alert">{tapErr}</p>
        : nTapped === 1 ? <p className="th-fc-thanks" role="status">Saved to How does it play. One more tap?</p>
        : nTapped >= 2 ? <p className="th-fc-thanks" role="status"><span>Thanks, that helps. Want to add a line about why?</span><button type="button" className="go" onClick={review}>Add a line</button></p> : null}
      <div className="th-fc-more"><button type="button" onClick={review}>Add your review</button><a href="#reviews">Ask a question or share a tip</a></div>
    </div>
  </section>;
}
