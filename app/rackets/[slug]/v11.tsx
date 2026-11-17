"use client";
// Product page v11 (owner 2026-11-17, design_handoff_product_page_v11): the browser parts. The better-matches strip shows only
// when this racket is a weak match for the picks (under 60%); the other-racket cards carry their match % after a pick and
// sort by it. Both read the same match engine as the home and the fit check (fit-live.tsx), so a pick changes them at once.
import { useState } from "react";
import type { FitFacts } from "../../../lib/fit-verdict";
import { useAnswer, useMatchOf, useAlts } from "./fit-live";
import { fitStep, fittingRows, FIT_MIN } from "../../../lib/verdict-scale";
import { distinctEdges } from "../../../lib/other-picks";
import { scoreTone as tone, matchTone } from "../../../lib/score-tone";

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
/** The site's words for its products (lib/niche words). */
type Words = { one: string; many: string };
type BetterCards = Record<string, Pick<V11Card, "name" | "href" | "pic" | "line" | "shop">>;
/** The better matches for the picks when this one is a weak match (under 60%), or null: the strip shows them, and the other
 *  rackets section stays hidden meanwhile (v11c: one set of alternatives at a time). */
function useBetter(id: string, facts: FitFacts, cards: BetterCards) {
  const a = useAnswer(id, facts);
  if (!a || a.pct === null || a.pct >= WEAK) return null;
  const rows = a.alts.filter(r => r.id !== id && cards[r.id] && (r.pct ?? 0) > (a.pct ?? 0)).slice(0, 3);
  return rows.length ? { a, rows } : null;
}
export function V11Better({ id, facts, cards, words }: { id: string; facts: FitFacts; cards: BetterCards; words: Words }) {
  const b = useBetter(id, facts, cards);
  if (!b) return null;
  const { a, rows } = b;
  return <section className="v11-better" id="alternatives-top" aria-label="Better matches for your game">
    <div className="v11-sh"><h2>Better matches for your game</h2><span>this one isn&apos;t your best pick</span></div>
    <div className="v11-brow">{rows.map(r => { const c = cards[r.id]; return <div key={r.id} className="v11-bcard">
      <span className="v11-bpic"><Pic pic={c.pic} name={c.name} w={64} h={96}/></span>
      <div className="v11-bbody">
        <a className="v11-stretch" href={`${c.href}${a.picksHref}`}><b>{c.name}</b></a>
        {r.pct !== null && <span className={`v11-pill ${matchTone(r.pct)}`}>{`${r.pct}% · ${word(r.pct)}`}</span>}
        {c.line && <span className="v11-bline">{c.line}</span>}
        {c.shop && <a className="v11-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
      </div></div>; })}</div>
    <a className="v11-curious" href="#yes-no">{`Still curious about this ${words.one}? Why yes, why not ↓`}</a>
  </section>;
}

/** "Other rackets to consider" (no pick: similar rackets, Player scores) / "Other rackets for your game" (a pick: rackets that fit
 *  it, 60%+, sorted by match). v11c: a compact strip of 3 (photo, name, score or match pill, one line, quiet links); phones show
 *  2 and "one more option"; hidden while the Better matches strip is up. */
export function V11Others({ id, slug, facts, better, cards, short, pool, me, keys, gainWord, words, scoreWord }: { id: string; /** This page's slug, for "compare ↗". */ slug: string;
  facts: FitFacts; better: BetterCards; cards: V11Card[]; short: string; pool: V11Pool; me: number[]; keys: string[]; gainWord: string[]; words: Words; scoreWord: string }) {
  const m = useMatchOf(), alts = useAlts(id, 8), hide = useBetter(id, facts, better);
  const [more, setMore] = useState(false);
  if (hide) return null;
  const fitting = m.picked && alts ? fittingRows(alts, id, x => !!pool[x]) : [];
  const picked = m.picked && fitting.length > 0;
  const edges = picked ? new Map(distinctEdges(me, fitting.map(r => ({ id: r.id, dots: pool[r.id].dots })), keys, 3).map(e => [e.id, e])) : null;
  const list: { id: string; name: string; href: string; pic: string | null; score: number | null; shop: V11Card["shop"]; pct: number | null; one: string | null }[] = (picked
    ? fitting.map(r => { const c = pool[r.id], e = edges!.get(r.id);
      return { id: r.id, name: c.name, href: c.href, pic: c.pic, score: c.score, shop: c.shop, pct: r.pct, one: e ? `${cap(gainWord[e.gain])} than the ${short}.` : c.line }; })
    : cards.map(c => ({ id: c.id, name: c.name, href: c.href, pic: c.pic, score: c.score, shop: c.shop, pct: null, one: c.gain ?? c.line }))).slice(0, 3);
  if (!list.length) return null;
  return <section className="v11-sec" id="alternatives">
    <div className="v11-sh v11-rule"><h2>{picked ? `Other ${words.many} for your game` : `Other ${words.many} to consider`}</h2><span>{picked ? "the best fits for your picks, by match" : `similar ${words.many}, same quick answer`}</span></div>
    <div className={`v11-others${more ? " all" : ""}`}>{list.map((c, i) => {
      return <article key={c.id} className={`v11-ocard${i >= 2 ? " x" : ""}`} id={`racket-${c.id}`}>
        <a className="v11-opic" href={`${c.href}${m.picksHref}`} tabIndex={-1} aria-hidden="true"><Pic pic={c.pic} name={c.name} w={64} h={96}/></a>
        <div className="v11-obody">
          <a className="v11-oname" href={`${c.href}${m.picksHref}`}>{c.name}</a>
          {/* Before an answer the Player score; after it the match pill, in the shared colours (Strong fit / Worth a look / Probably not). */}
          {picked && c.pct !== null ? <span className={`v11-pill v11-omatch ${matchTone(c.pct)}`}>{`${c.pct}% · ${word(c.pct)}`}</span>
            : <span className="v11-oscore"><b className={tone(c.score)}>{c.score ?? "–"}</b><span>{scoreWord.toLowerCase()}</span></span>}
          {c.one && <p className="v11-oline">{c.one}</p>}
          <span className="v11-olinks">{c.shop && <a className="v11-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
            {/* Side by side with this one (UX audit 2026-11-17: compare was hard to find). */}
            <a className="v11-plink v11-ocmp" href={`/compare?ids=${encodeURIComponent(slug)},${encodeURIComponent(c.href.split(/[?#]/)[0].split("/").pop() ?? "")}`}>compare ↗</a></span>
        </div>
      </article>; })}</div>
    {list.length > 2 && !more && <button type="button" className="v11-omore" onClick={() => setMore(true)}>one more option ↓</button>}
  </section>;
}

/** "How it plays" (v11c): one slim box. Three bars in a row, the build as chips (a tap shows its line, the key phrase marked),
 *  then the rule of thumb. */
export function V11Plays({ bands, top, chips, tip }: { bands: { k: string; label: string; dots: number; note: string | null }[]; top: number;
  chips: { key: string; title: string; line: string }[]; tip: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const shown = chips.find(c => c.key === open);
  // The key phrase: what follows the first colon or semicolon ("Black EVA sits between soft and firm: ==some comfort…=="),
  // else the first clause.
  const mark = (t: string) => { const m = t.match(/^(.*?[:;]\s+)(.+?)(\.?)$/); if (m) return [m[1], m[2], m[3]];
    const k = t.search(/[,.]\s/); return k > 0 ? ["", t.slice(0, k), t.slice(k)] : ["", t, ""]; };
  return <div id="plays" className="v11-plays v11c">
    <h2>How it plays</h2>
    <div className="v11-bands">{bands.map(b => <div key={b.k} className={b.dots === top ? "top" : undefined}>
      <span className="v11-bh"><b>{b.label}</b><span className="v11-bn">{b.dots}<small>/5</small></span></span>
      <span className="v11-segs" aria-label={`${b.dots} of 5`}>{[1, 2, 3, 4, 5].map(x => <i key={x} className={x <= b.dots ? `on t${b.dots}` : undefined}/>)}</span>
      {b.note && <span className="v11-bnote">{b.note}</span>}</div>)}</div>
    {(chips.length > 0 || tip) && <div className="v11-pfoot">
      {chips.length > 0 && <div className="v11-chips"><span className="v11-ck">build</span>{chips.map(c =>
        <button key={c.key} type="button" aria-expanded={open === c.key} onClick={() => setOpen(open === c.key ? null : c.key)}>{c.title}<span aria-hidden="true">{open === c.key ? "−" : "+"}</span></button>)}</div>}
      {shown && (() => { const [a, b, z] = mark(shown.line); return <p className="v11-cline">{a}<mark>{b}</mark>{z}</p>; })()}
      {tip && <p className="v11-tip"><span>rule of thumb</span><span>{tip}</span></p>}
    </div>}
  </div>;
}

/** "Still deciding?" (v11c): the closing card. Before an answer the Player score and the one-line verdict; after it the match
 *  pill. Quiet links only (the page has one filled price button, in the hero). */
export function V11Decide({ id, facts, name, pic, score, line, buy, compare, ask, one }: { id: string; facts: FitFacts; name: string; pic: string | null; score: number | null;
  line: string | null; buy: { url: string; rel: string } | null; compare: { href: string; pick: { id: string; slug: string; name: string; pic: string | null } }; /** "played it? add your verdict →" */ ask: string; one: string }) {
  const a = useAnswer(id, facts);
  return <section className="v11-decide" aria-label="Still deciding?">
    <div className="v11-dl">
      <span className="v11-dpic">{pic ? <img src={pic} alt="" width={50} height={76} loading="lazy" decoding="async"/> : null}</span>
      <span className="v11-dk">Still deciding?</span>
      <b className="v11-dn">{name}</b>
      <span className="v11-dv">{a && a.pct !== null ? <span className={`v11-pill ${matchTone(a.pct)}`}>{`${a.pct}% · ${word(a.pct)}`}</span>
        : <><span className="v11-oscore"><b className={tone(score)}>{score ?? "–"}</b><span>player score</span></span>{line && <span className="v11-dline">{line}</span>}</>}</span>
    </div>
    <div className="v11-dlinks">
      {buy && <a href={buy.url} target="_blank" rel={buy.rel}>check price ↗</a>}
      <a href={compare.href} onClick={() => { try {
        const s = JSON.parse(sessionStorage.getItem("compare-picks") ?? "null"), picks = Array.isArray(s?.picks) ? s.picks.filter((p: { id: string }) => p.id !== compare.pick.id) : [];
        sessionStorage.setItem("compare-picks", JSON.stringify({ on: true, picks: [compare.pick, ...picks].slice(0, 3) })); } catch { /* private mode */ } }}>{`compare with another ${one} →`}</a>
      <a href="#played">{ask}</a>
    </div>
  </section>;
}
const cap = (t: string) => t ? t[0].toUpperCase() + t.slice(1) : t;
