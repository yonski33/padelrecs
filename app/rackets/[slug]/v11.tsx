"use client";
// Product page v11 (owner 2026-11-17, design_handoff_product_page_v11): the browser parts. The better-matches strip shows only
// when this racket is a weak match for the picks (under 60%); the other-racket cards carry their match % after a pick and
// sort by it. Both read the same match engine as the home and the fit check (fit-live.tsx), so a pick changes them at once.
import { ownScore, niche } from "../../../lib/niche";
import type { FitFacts } from "../../../lib/fit-verdict";
import { useAnswer, useMatchOf, useAlts } from "./fit-live";
import { fitStep, fittingRows, FIT_MIN } from "../../../lib/verdict-scale";
import { distinctEdges } from "../../../lib/other-picks";
import { sameFlightFact } from "../../../lib/claim-guard";
import { scoreTone as tone, matchTone } from "../../../lib/score-tone";
/** "Better matches for your game" in the site's word (CoffeeRecs: "setup"); default "game". */
const GAME = niche.v2copy?.game ?? "game";

/** A racket card's data from the server (app/rackets/[slug]/racket-fit.tsx). */
export type V11Card = { id: string; name: string; href: string; pic: string | null; line: string | null; best: string | null;
  score: number | null; shop: { url: string; rel: string } | null; vs: string | null; pick: string | null; gain: string | null; give: string | null;
  /** This page's racket by its shortest name beside this card ("12K", #435 rule), for "than the …" lines. */ ref: string };
const word = (n: number) => fitStep(n).word;
const WEAK = FIT_MIN;
/** A racket for the "for your game" cards: the server sends one for every racket the picks can bring up. */
export type V11Pool = Record<string, { name: string; href: string; pic: string | null; line: string | null; shop: { url: string; rel: string } | null;
  score: number | null; best: string | null; dots: number[]; /** As V11Card.ref. */ ref: string;
  /** The traits this racket may be called better (gain) or worse (give) at beside this one: lib/claim-guard.ts, on the server. */
  ok: { gain: number[]; give: number[]; /** Disc golf: flight-number gaps per trait (cand − this), and the numbers for the line. */
    gap: Record<number, number>; note: Record<number, string> } }>;
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
  return <section className="v11-better" id="alternatives-top" aria-label={`Better matches for your ${GAME}`}>
    <div className="v11-sh"><h2>{`Better matches for your ${GAME}`}</h2><span>this one isn&apos;t your best pick</span></div>
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

/** "Other rackets to consider" (no pick: similar rackets) / "for your game" (a pick: rackets that fit it, 60%+, by match). Owner
 *  2026-11-17: two cards side by side (stacked on phones): photo, name, Player score or match pill, the racket's own tagline,
 *  a green gain line and a peach give-up line (only a real one), then the quiet links. Hidden while Better matches shows. */
export function V11Others({ id, slug, facts, better, cards, pool, me, keys, gainWord, giveWord, words, scoreWord }: { id: string; /** This page's slug, for "compare ↗". */ slug: string;
  facts: FitFacts; better: BetterCards; cards: V11Card[]; pool: V11Pool; me: number[]; keys: string[]; gainWord: string[]; giveWord: string[]; words: Words; scoreWord: string }) {
  const m = useMatchOf(), alts = useAlts(id, 8), hide = useBetter(id, facts, better);
  if (hide) return null;
  const fitting = m.picked && alts ? fittingRows(alts, id, x => !!pool[x]) : [];
  const picked = m.picked && fitting.length > 0;
  const list = (picked ? withEdges(fitting, pool, me, keys, gainWord, giveWord) : cards.map(c => ({ ...c, pct: null as number | null }))).slice(0, 2);
  // Fewer cards, or none, rather than a card without both lines (owner 2026-11-18).
  if (!list.length) return null;
  return <section className="v11-sec" id="alternatives">
    <div className="v11-sh v11-rule"><h2>{picked ? `Other ${words.many} for your ${GAME}` : `Other ${words.many} to consider`}</h2><span>{picked ? "the best fits for your picks, by match" : `similar ${words.many}, same quick answer`}</span></div>
    {/* One card only (no second with honest lines): full width, photo left, the two lines side by side (owner 2026-11-18). */}
    <div className={`v11-others ${list.length > 1 ? "two" : "one"}`}>{list.map(c => <article key={c.id} className="v11-ocard" id={`racket-${c.id}`}>
      <a className="v11-opic" href={`${c.href}${m.picksHref}`} tabIndex={-1} aria-hidden="true"><Pic pic={c.pic} name={c.name} w={64} h={96}/></a>
      <div className="v11-obody">
        <a className="v11-oname" href={`${c.href}${m.picksHref}`}>{c.name}</a>
        <Score pct={picked ? c.pct : null} score={c.score} word={scoreWord}/>
        {c.line && <p className="v11-oline">{c.line}</p>}
        <div className="v11-olines">{c.gain && <p className="v11-tgain">{`✓ ${c.gain}`}</p>}
          {c.give && <p className="v11-tgive">{`↗ ${c.give}`}</p>}</div>
        <Links c={c} slug={slug}/>
      </div>
    </article>)}</div>
  </section>;
}

/** "More rackets for your game" (owner 2026-11-17): only in the not-a-fit state (the Better matches strip is up), the next
 *  2–3 best matches at 60%+ by match, never one already in the strip; the richer card (left: photo, name, tagline, best for,
 *  match, price; right: "vs the 12K" tag, the gain box and a real give-up box). */
export function V11More({ id, slug, facts, better, pool, me, keys, gainWord, giveWord, words, scoreWord }: { id: string; slug: string; facts: FitFacts; better: BetterCards;
  pool: V11Pool; me: number[]; keys: string[]; gainWord: string[]; giveWord: string[]; words: Words; scoreWord: string }) {
  const m = useMatchOf(), alts = useAlts(id, 12), b = useBetter(id, facts, better);
  if (!b || !alts) return null;
  const shown = new Set(b.rows.map(r => r.id));
  const next = alts.filter(r => r.id !== id && pool[r.id] && !shown.has(r.id) && (r.pct ?? 0) >= FIT_MIN).sort((x, y) => (y.pct ?? 0) - (x.pct ?? 0));
  if (next.length < 2) return null;
  // All the 60%+ candidates go in, best first: one without two honest lines gives way to the next (owner 2026-11-18).
  const list = withEdges(next, pool, me, keys, gainWord, giveWord).slice(0, 3);
  if (list.length < 2) return null;
  return <section className="v11-sec v11-more2" id="more-for-you">
    <div className="v11-sh v11-rule"><h2>{`More ${words.many} for your ${GAME}`}</h2><span>the next best fits for your picks, by match</span></div>
    <div className="v11-mlist">{list.map(c => <article key={c.id} className="v11-ocard">
      <div className="v11-oleft">
        <div className="v11-otop">
          <a className="v11-opic" href={`${c.href}${m.picksHref}`} tabIndex={-1} aria-hidden="true"><Pic pic={c.pic} name={c.name} w={96} h={144}/></a>
          <div><a className="v11-oname" href={`${c.href}${m.picksHref}`}>{c.name}</a>
            {c.line && <p className="v11-oline">{c.line}</p>}
            {c.best && <p className="v11-obest"><b>Best for</b>{` ${c.best}.`}</p>}</div>
        </div>
        <div className="v11-ofoot"><Score pct={c.pct} score={c.score} word={scoreWord}/><Links c={c} slug={slug}/></div>
      </div>
      <div className="v11-oright">
        {c.vs && <span className="v11-otag">{`vs the ${c.ref}: ${c.vs}`}</span>}
        {c.gain && <div className="v11-ogain"><b>✓ What you gain</b><span>{c.gain}</span></div>}
        {c.give && <div className="v11-ogive"><b>↗ What you give up</b><span>{c.give}</span></div>}
      </div>
    </article>)}</div>
  </section>;
}

type Row = { id: string; pct: number | null };
/** A pool racket as a card with its gain and give-up against this one, in the short names. */
function withEdges(rows: Row[], pool: V11Pool, me: number[], keys: string[], gainWord: string[], giveWord: string[]) {
  // The server's verdicts per trait (lib/claim-guard.ts); only rows with both a gain and a give-up are kept (owner 2026-11-18).
  const allow = (id: string, i: number, dir: 1 | -1) => (dir > 0 ? pool[id].ok.gain : pool[id].ok.give).includes(i);
  const edges = new Map(distinctEdges(me, rows.map(r => ({ id: r.id, dots: pool[r.id].dots })), keys, 3, "arm", undefined, allow, true, (id, i) => pool[id].ok.gap[i],
    (g, v) => sameFlightFact(niche.id, keys[g], keys[v])).map(e => [e.id, e]));
  return rows.filter(r => edges.has(r.id)).map(r => { const c = pool[r.id], e = edges.get(r.id);
    return { id: r.id, name: c.name, href: c.href, pic: c.pic, line: c.line, best: c.best, score: c.score, shop: c.shop, pct: r.pct, ref: c.ref,
      vs: e ? gainWord[e.gain] : null, gain: e ? `${cap(gainWord[e.gain])} than the ${c.ref}${c.ok.note[e.gain] ?? ""}.` : null,
      give: e && e.give !== null ? `${cap(giveWord[e.give])} than the ${c.ref}${c.ok.note[e.give] ?? ""}.` : null }; });
}
/** Before an answer the Player score; after it the match pill in the shared colours (Strong fit / Worth a look / Probably not). */
const Score = ({ pct, score, word: w }: { pct: number | null; score: number | null; word: string }) => pct !== null
  ? <span className={`v11-pill v11-omatch ${matchTone(pct)}`}>{`${pct}% · ${word(pct)}`}</span>
  : <span className="v11-oscore"><b className={tone(score)}>{score ?? "–"}</b><span>{w.toLowerCase()}</span></span>;
const Links = ({ c, slug }: { c: { href: string; shop: V11Card["shop"] }; slug: string }) => <span className="v11-olinks">
  {c.shop && <a className="v11-plink" href={c.shop.url} target="_blank" rel={c.shop.rel}>check price ↗</a>}
  {/* Side by side with this one (UX audit 2026-11-17: compare was hard to find). */}
  <a className="v11-plink v11-ocmp" href={`/compare?ids=${encodeURIComponent(slug)},${encodeURIComponent(c.href.split(/[?#]/)[0].split("/").pop() ?? "")}`}>compare ↗</a></span>;

/** "How it plays" (v11c): one slim box. Three bars in a row, then the rule of thumb. The build has its own cards below
 *  (V11BuildCards, owner 2026-11-18: the explained cards are the expert content). */
export function V11Plays({ bands, top, tip, title = "How it plays" }: { bands: { k: string; label: string; dots: number; note: string | null }[]; top: number;
  tip: string; /** SimRacingRecs: "How it drives". */ title?: string }) {
  if (!bands.length && !tip) return null;
  return <div id="plays" className="v11-plays v11c">
    <h2>{title}</h2>
    {bands.length > 0 && <div className="v11-bands">{bands.map(b => <div key={b.k} className={b.dots === top ? "top" : undefined}>
      <span className="v11-bh"><b>{b.label}</b><span className="v11-bn">{b.dots}<small>/5</small></span></span>
      <span className="v11-segs" aria-label={`${b.dots} of 5`}>{[1, 2, 3, 4, 5].map(x => <i key={x} className={x <= b.dots ? `on t${b.dots}` : undefined}/>)}</span>
      {b.note && <span className="v11-bnote">{b.note}</span>}</div>)}</div>}
    {tip && <div className="v11-pfoot"><p className="v11-tip"><span>rule of thumb</span><span>{tip}</span></p></div>}
  </div>;
}

/** One build card for "What the …'s build means for you" (lib/v11-site.ts builds()). */
export type V11BuildCard = { key: string; title: string; line: string; at?: number; shape?: string; nums?: number[]; low?: string; high?: string };
/** "What the <product>'s build means for you" (owner 2026-11-18: back as full cards below How it plays): each spec with its
 *  small picture and its plain line. A grid on desktop, a sideways swipe row on phones. */
export function V11BuildCards({ head, cards, ring = false }: { head: string; cards: V11BuildCard[]; /** Disc golf: a plain card shows a disc. */ ring?: boolean }) {
  if (!cards.length) return null;
  // A plain fact (a drive type, a boiler, a pattern) has no gauge; off disc golf it shows no picture.
  const plain = (c: V11BuildCard) => c.key !== "shape" && c.key !== "flight" && c.key !== "balance" && c.key !== "face" && (c.key === "disc" || c.at === undefined);
  const dot = (at?: number) => `calc(${Math.round((at ?? 0.5) * 100)}% - 7px)`;
  return <section id="build" className="v11-build v11c" aria-labelledby="v11-build-t">
    <h2 id="v11-build-t">{head}</h2>
    <div className="v11-bcards">{cards.map((c, i) => <div key={`${c.key}-${i}`} className={`v11-bc ${c.key}`}>
      {plain(c) && !ring ? null : <span className="v11-vis" aria-hidden="true">{c.key === "shape" ? <i className={`sh ${c.shape ?? "round"}`}/>
        : c.key === "flight" ? <i className="flight">{(c.nums ?? []).map((n, j) => <b key={j}>{n}</b>)}</i>
        : plain(c) ? <i className="disc"/>
        : c.key === "gauge" || c.key === "weight" ? <i className="gauge"><i className="core"><i style={{ left: dot(c.at) }}/></i><small>{c.low ?? "light"}</small><small>{c.high ?? "heavy"}</small></i>
        : c.key === "core" ? <i className="gauge"><i className="core"><i style={{ left: dot(c.at) }}/></i><small>soft</small><small>firm</small></i>
        : c.key === "balance" ? <i className="bal"><i style={{ top: `calc(${Math.round((1 - (c.at ?? 0.5)) * 100)}% - 7px)` }}/></i> : <i className="face"/>}</span>}
      <b>{c.title}</b><span>{c.line}</span></div>)}</div>
  </section>;
}

/** "Still deciding?" (v11c): the closing card. Before an answer the Player score and the one-line verdict; after it the match
 *  pill. Quiet links only (the page has one filled price button, in the hero). */
export function V11Decide({ id, facts, name, pic, score, line, buy, compare, ask, one }: { id: string; facts: FitFacts; name: string; pic: string | null; score: number | null;
  line: string | null; buy: { url: string; rel: string } | null; compare: { href: string; pick: { id: string; slug: string; name: string; pic: string | null } }; /** "played it? add your review →" */ ask: string; one: string }) {
  const a = useAnswer(id, facts);
  return <section className="v11-decide" aria-label="Still deciding?">
    <div className="v11-dl">
      <span className="v11-dpic">{pic ? <img src={pic} alt="" width={50} height={76} loading="lazy" decoding="async"/> : null}</span>
      <span className="v11-dk">Still deciding?</span>
      <b className="v11-dn">{name}</b>
      <span className="v11-dv">{a && a.pct !== null ? <span className={`v11-pill ${matchTone(a.pct)}`}>{`${a.pct}% · ${word(a.pct)}`}</span>
        : <><span className="v11-oscore"><b className={tone(score)}>{score ?? "–"}</b><span>{ownScore("player score")}</span></span>{line && <span className="v11-dline">{line}</span>}</>}</span>
    </div>
    <div className="v11-dlinks">
      {buy && <a href={buy.url} target="_blank" rel={buy.rel}>check price ↗</a>}
      <a href={compare.href} onClick={() => { try {
        const s = JSON.parse(sessionStorage.getItem("compare-picks") ?? "null"), picks = Array.isArray(s?.picks) ? s.picks.filter((p: { id: string }) => p.id !== compare.pick.id) : [];
        sessionStorage.setItem("compare-picks", JSON.stringify({ on: true, picks: [compare.pick, ...picks].slice(0, 3) })); } catch { /* private mode */ } }}>{`compare with another ${one} →`}</a>
      <a href="#played" onClick={toPlayed}>{ask}</a>
    </div>
  </section>;
}
/** "add your review →" (owner 2026-11-18): a smooth scroll to the "Played it?" box, clear of the sticky header, then focus on its
 *  first verdict button (no jump, the focus doesn't scroll again). Falls back to the plain #played jump if the box is missing. */
function toPlayed(e: React.MouseEvent<HTMLAnchorElement>) {
  const box = document.getElementById("played"); if (!box) return;
  e.preventDefault();
  // The sticky bar at the top (padel's is 98px, more than the box's 80px scroll margin, which hid it): whatever sticky or
  // fixed element covers the top of the viewport.
  let head: Element | null = document.elementFromPoint(window.innerWidth / 2, 2);
  while (head && !/sticky|fixed/.test(getComputedStyle(head).position)) head = head.parentElement;
  const off = (head ? Math.max(0, head.getBoundingClientRect().bottom) : 0) + 16, still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = () => Math.max(0, box.getBoundingClientRect().top + window.scrollY - off);
  box.querySelector<HTMLButtonElement>(".rv-prow button")?.focus({ preventScroll: true });
  window.scrollTo({ top: target(), behavior: still ? "auto" : "smooth" });
  // A smooth scroll can stop short (a background tab, images loading above it and moving the box): after it, if the box
  // isn't where it should be, finish with a jump.
  setTimeout(() => { if (Math.abs(box.getBoundingClientRect().top - off) > 24) window.scrollTo({ top: target() }); }, still ? 50 : 1000);
  try { history.replaceState(null, "", "#played"); } catch { /* sandboxed */ }
}
const cap = (t: string) => t ? t[0].toUpperCase() + t.slice(1) : t;
