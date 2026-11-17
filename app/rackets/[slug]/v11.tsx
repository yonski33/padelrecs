"use client";
// Product page v11 (owner 2026-11-17, design_handoff_product_page_v11): the browser parts. The better-matches strip shows only
// when this racket is a weak match for the picks (under 60%); the other-racket cards carry their match % after a pick and
// sort by it. Both read the same match engine as the home and the fit check (fit-live.tsx), so a pick changes them at once.
import type { FitFacts } from "../../../lib/fit-verdict";
import { useAnswer, useMatchOf } from "./fit-live";

/** A racket card's data from the server (app/rackets/[slug]/racket-fit.tsx). */
export type V11Card = { id: string; name: string; href: string; pic: string | null; line: string | null; best: string | null;
  score: number | null; shop: { url: string; rel: string } | null; vs: string | null; pick: string | null; gain: string | null; give: string | null };
export const tone = (n: number | null | undefined) => n == null ? "" : n >= 85 ? "g" : n >= 70 ? "y" : "w";
const word = (n: number) => n >= 75 ? "Strong fit" : n >= 55 ? "Decent fit" : "Weak fit";
const WEAK = 60;

/** "Better matches for your game": 3 compact cards, a sideways row on phones, then the way back to Why yes / why not. */
export function V11Better({ id, facts, cards }: { id: string; facts: FitFacts; cards: Record<string, Pick<V11Card, "name" | "href" | "pic" | "line" | "shop">> }) {
  const a = useAnswer(id, facts);
  if (!a || a.pct === null || a.pct >= WEAK) return null;
  const rows = a.alts.filter(r => r.id !== id && cards[r.id] && (r.pct ?? 0) > (a.pct ?? 0)).slice(0, 3);
  if (!rows.length) return null;
  return <section className="v11-better" id="alternatives-top" aria-label="Better matches for your game">
    <div className="v11-sh"><h2>Better matches for your game</h2><span>this one isn&apos;t your best pick</span></div>
    <div className="v11-brow">{rows.map(r => { const c = cards[r.id]; return <div key={r.id} className="v11-bcard">
      <span className="v11-bpic">{c.pic && <img src={c.pic} alt="" width={64} height={96} loading="lazy" decoding="async"/>}</span>
      <div className="v11-bbody">
        <a className="v11-stretch" href={`${c.href}${a.picksHref}`}><b>{c.name}</b></a>
        {r.pct !== null && <span className={`v11-pill ${tone(r.pct)}`}>{`${r.pct}% · ${word(r.pct)}`}</span>}
        {c.line && <span className="v11-bline">{c.line}</span>}
        {c.shop && <a className="v11-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
      </div></div>; })}</div>
    <a className="v11-curious" href="#yes-no">Still curious about this racket? Why yes, why not ↓</a>
  </section>;
}

/** "Other rackets to consider" / "for your game": detailed cards, sorted by the visitor's match once they pick. */
export function V11Others({ cards, short }: { cards: V11Card[]; short: string }) {
  const m = useMatchOf();
  const list = m.picked ? [...cards].sort((x, y) => (m.pctOf(y.id) ?? -1) - (m.pctOf(x.id) ?? -1)) : cards;
  return <section className="v11-sec" id="alternatives">
    <div className="v11-sh v11-rule"><h2>{m.picked ? "Other rackets for your game" : "Other rackets to consider"}</h2><span>{m.picked ? "sorted by your match" : "similar rackets, same quick answer"}</span></div>
    <div className="v11-others">{list.map(c => { const p = m.pctOf(c.id) ?? null;
      const head = m.picked && p !== null ? (p >= 85 ? "Yes, a strong option." : p >= 70 ? "Worth a look." : "Probably not for you.") : c.pick;
      return <article key={c.id} className="v11-ocard" id={`racket-${c.id}`}>
        <div className="v11-oleft">
          <div className="v11-otop">
            <a className="v11-opic" href={`${c.href}${m.picksHref}`}>{c.pic && <img src={c.pic} alt={c.name} width={96} height={144} loading="lazy" decoding="async"/>}</a>
            <div><a className="v11-oname" href={`${c.href}${m.picksHref}`}>{c.name}</a>
              {c.line && <p className="v11-oline">{c.line}</p>}
              {c.best && <p className="v11-obest"><b>Best for</b>{` ${c.best}.`}</p>}</div>
          </div>
          <div className="v11-ofoot">
            <span className="v11-oscore"><b className={tone(c.score)}>{c.score ?? "–"}</b><span><b>Player score</b></span></span>
            {m.picked && p !== null && <span className={`v11-pill ${tone(p)}`}>{`${p}% · ${word(p)}`}</span>}
            {c.shop && <a className="v11-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
          </div>
        </div>
        <div className="v11-oright">
          <span className="v11-otag">{m.picked ? "⚡ your match" : c.vs ? `⚡ vs the ${short}: ${c.vs}` : "⚡ similar feel"}</span>
          {head && <p className="v11-ohead">{head}</p>}
          {c.gain && <div className="v11-ogain"><b>{m.picked ? "✓ Why it fits" : "✓ What you gain"}</b><span>{c.gain}</span></div>}
          {c.give && <div className="v11-ogive"><b>{m.picked ? "↗ What to consider" : "↗ What you give up"}</b><span>{c.give}</span></div>}
        </div>
      </article>; })}</div>
  </section>;
}
