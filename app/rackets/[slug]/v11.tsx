"use client";
// Product page v11 (owner 2026-11-17, design_handoff_product_page_v11): the browser parts. The better-matches strip shows only
// when this racket is a weak match for the picks (under 60%); the other-racket cards carry their match % after a pick and
// sort by it. Both read the same match engine as the home and the fit check (fit-live.tsx), so a pick changes them at once.
import type { FitFacts } from "../../../lib/fit-verdict";
import { useAnswer, useMatchOf, useAlts } from "./fit-live";
import { fitStep, fittingRows, FIT_MIN } from "../../../lib/verdict-scale";
import { distinctEdges } from "../../../lib/other-picks";
import { scoreTone as tone } from "../../../lib/score-tone";

/** A racket card's data from the server (app/rackets/[slug]/racket-fit.tsx). */
export type V11Card = { id: string; name: string; href: string; pic: string | null; line: string | null; best: string | null;
  score: number | null; shop: { url: string; rel: string } | null; vs: string | null; pick: string | null; gain: string | null; give: string | null };
const word = (n: number) => fitStep(n).word;
const WEAK = FIT_MIN;
/** A racket for the "for your game" cards: the server sends one for every racket the picks can bring up. */
export type V11Pool = Record<string, { name: string; href: string; pic: string | null; line: string | null; shop: { url: string; rel: string } | null;
  score: number | null; best: string | null; dots: number[] }>;
/** The photo, or a tile with the name when the catalog has none. */
const Pic = ({ pic, name, w, h }: { pic: string | null; name: string; w: number; h: number }) => pic ? <img src={pic} alt={name} width={w} height={h} loading="lazy" decoding="async"/>
  : <span className="v11-tile">{name.split(" ").slice(0, 2).join(" ")}</span>;

/** "Better matches for your game": 3 compact cards, a sideways row on phones, then the way back to Why yes / why not. */
export function V11Better({ id, facts, cards }: { id: string; facts: FitFacts; cards: Record<string, Pick<V11Card, "name" | "href" | "pic" | "line" | "shop">> }) {
  const a = useAnswer(id, facts);
  if (!a || a.pct === null || a.pct >= WEAK) return null;
  const rows = a.alts.filter(r => r.id !== id && cards[r.id] && (r.pct ?? 0) > (a.pct ?? 0)).slice(0, 3);
  if (!rows.length) return null;
  return <section className="v11-better" id="alternatives-top" aria-label="Better matches for your game">
    <div className="v11-sh"><h2>Better matches for your game</h2><span>this one isn&apos;t your best pick</span></div>
    <div className="v11-brow">{rows.map(r => { const c = cards[r.id]; return <div key={r.id} className="v11-bcard">
      <span className="v11-bpic"><Pic pic={c.pic} name={c.name} w={64} h={96}/></span>
      <div className="v11-bbody">
        <a className="v11-stretch" href={`${c.href}${a.picksHref}`}><b>{c.name}</b></a>
        {r.pct !== null && <span className={`v11-pill ${tone(r.pct)}`}>{`${r.pct}% · ${word(r.pct)}`}</span>}
        {c.line && <span className="v11-bline">{c.line}</span>}
        {c.shop && <a className="v11-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
      </div></div>; })}</div>
    <a className="v11-curious" href="#yes-no">Still curious about this racket? Why yes, why not ↓</a>
  </section>;
}

/** "Other rackets to consider" (no pick: similar rackets, Player scores) / "Other rackets for your game" (a pick: rackets that fit
 *  it, 60%+, the curated list first then the engine, sorted by match; fewer cards rather than ones that don't fit). */
export function V11Others({ id, cards, short, pool, me, keys, gainWord, giveWord }: { id: string; cards: V11Card[]; short: string; pool: V11Pool;
  me: number[]; keys: string[]; gainWord: string[]; giveWord: string[] }) {
  const m = useMatchOf(), alts = useAlts(id, 8);
  const fitting = m.picked && alts ? fittingRows(alts, id, x => !!pool[x]) : [];
  const picked = m.picked && fitting.length > 0;
  const edges = picked ? new Map(distinctEdges(me, fitting.map(r => ({ id: r.id, dots: pool[r.id].dots })), keys, 3).map(e => [e.id, e])) : null;
  const list: (V11Card & { pct: number | null })[] = picked ? fitting.map(r => { const c = pool[r.id], e = edges!.get(r.id);
    return { id: r.id, name: c.name, href: c.href, pic: c.pic, line: c.line, best: c.best, score: c.score, shop: c.shop, pct: r.pct,
      vs: e ? gainWord[e.gain] : null, pick: null, gain: e ? `${cap(gainWord[e.gain])} than the ${short}.` : c.line, give: e && e.give !== null ? `${cap(giveWord[e.give])} than the ${short}.` : null }; })
    : cards.map(c => ({ ...c, pct: null }));
  return <section className="v11-sec" id="alternatives">
    <div className="v11-sh v11-rule"><h2>{picked ? "Other rackets for your game" : "Other rackets to consider"}</h2><span>{picked ? "the best fits for your picks, by match" : "similar rackets, same quick answer"}</span></div>
    <div className="v11-others">{list.map(c => { const st = c.pct !== null ? fitStep(c.pct) : null;
      return <article key={c.id} className="v11-ocard" id={`racket-${c.id}`}>
        <div className="v11-oleft">
          <div className="v11-otop">
            <a className="v11-opic" href={`${c.href}${m.picksHref}`}><Pic pic={c.pic} name={c.name} w={96} h={144}/></a>
            <div><a className="v11-oname" href={`${c.href}${m.picksHref}`}>{c.name}</a>
              {c.line && <p className="v11-oline">{c.line}</p>}
              {c.best && <p className="v11-obest"><b>Best for</b>{` ${c.best}.`}</p>}</div>
          </div>
          <div className="v11-ofoot">
            <span className="v11-oscore"><b className={tone(c.score)}>{c.score ?? "–"}</b><span><b>Player score</b></span></span>
            {picked && st && <span className={`v11-pill ${tone(c.pct)}`}>{`${c.pct}% · ${st.word}`}</span>}
            {c.shop && <a className="v11-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
          </div>
        </div>
        <div className="v11-oright">
          <span className="v11-otag">{picked ? "⚡ your match" : c.vs ? `⚡ vs the ${short}: ${c.vs}` : "⚡ similar feel"}</span>
          {(picked ? st?.head : c.pick) && <p className="v11-ohead">{picked ? st!.head : c.pick}</p>}
          {c.gain && <div className="v11-ogain"><b>{picked && st?.fits ? "✓ Why it fits" : "✓ What you gain"}</b><span>{c.gain}</span></div>}
          {c.give && <div className="v11-ogive"><b>{picked ? "↗ What to consider" : "↗ What you give up"}</b><span>{c.give}</span></div>}
        </div>
      </article>; })}</div>
  </section>;
}
const cap = (t: string) => t ? t[0].toUpperCase() + t.slice(1) : t;
