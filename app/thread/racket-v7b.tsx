// PadelRecs' racket page, v7b (owner design 2026-11-20, design_handoff_padel_product_v7b). A community page, so no byline or
// date. Order: top card (title, tags, photo, TL;DR, jump row) → Is it right for me? → poll → How does it play? → Similar →
// Player reviews → Discussion → also loved, then stories and the brand's line. The sidebar is compact: score, Best for, six
// specs, one lime Check price. Phones show a small score in the tag row; mid widths get the sidebar's facts as a card.
// app/thread/rackets/[slug]/page.tsx renders this on padel only; every other site keeps its own layout there.
import type { ReactNode } from "react";
import { Photo, SBar, tone, plural, type ThreadRow } from "./ui";
import { th } from "../../lib/thread/look";
import { W } from "../../lib/thread/words";
import { traitSeed } from "../../lib/thread/trait-seed";
import { niche } from "../../lib/niche";
import { TraitVotes } from "./live/trait-votes";
import { FitCard, PollCard, ReviewsV7b } from "./live/racket-v7b";
import { Discussion } from "./live/discussion";
import { MemberMark } from "./live/member-mark";
import type { RvCard } from "./racket-data";

export type V7bProps = {
  id: string; title: string; model: string; crumbs: ReactNode; tags: string[]; lime: boolean; row: ThreadRow | null; judged: number;
  lead: string | null; bullets: { tone: "pos" | "mix" | "neg" | "catch"; text: string }[]; specs: [string, string][];
  shop: { url: string; rel: string } | null; cards: RvCard[]; sim: ReactNode[]; also: ReactNode[]; line: ReactNode | null;
  stories: { id: string; slug: string; title: string; author: { name: string } }[];
};
/** The mock's dots: green praise, orange mixed (the catch colour), red complaint. */
const DOT = { pos: "pos", mix: "catch", catch: "catch", neg: "neg" } as const;
/** Owner 2026-11-20: this exact note under Check price. */
const BUY_NOTE = "Affiliate link - price stays the same";

export function RacketV7b(p: V7bProps) {
  const { row, judged } = p, score = row?.score ?? null;
  const badge = (size?: string) => score != null ? <span className={`th-badge ${tone(score)}${size ? ` ${size}` : ""}`}>{score}</span> : <span className="th-badge new">New</span>;
  const scoreLine = score != null ? `${W.score} from ${judged}` : judged > 0 ? `${plural(judged, W.opinions.replace(/s$/, ""), W.opinions)} so far` : "No votes yet";
  const facts = <>
    <div className="th7-score">{badge()}<span><span>{scoreLine}</span>{judged > 0 && <SBar lg pos={row!.pos} mix={row!.mix} neg={row!.neg}/>}</span></div>
    {row?.best && <span className="th7-best"><strong>Best for</strong>{` ${row.best}.`}</span>}
    {p.specs.length > 0 && <div className="th7-specs">{p.specs.map(([k, v]) => <span key={k} className="th-kv"><span>{k}</span><strong>{v}</strong></span>)}</div>}
  </>;
  const buy = p.shop && <div className="th7-buy"><a href={p.shop.url} target="_blank" rel={p.shop.rel}>Check price ↗</a><small>{BUY_NOTE}</small></div>;
  return <main className="th-main th7">
    <div className="th-col">
      {p.crumbs}
      <article id="overview" className="th-card th7-top">
        <h1 className="th-h1">{p.title}</h1>
        <div className="th-tags">
          {p.tags.map((t, i) => <span key={t} className={`th-pill${i === 0 && p.lime ? " lime" : ""}`}>{t}</span>)}
          {/* Phones only (owner 2026-11-20): no sidebar there, so a small score sits with the tags. */}
          <span className="th7-tag-score">{score != null ? <>{badge("xs")}{W.score}</> : "New, not enough votes yet"}</span>
        </div>
        <div className="th7-hero">
          <Photo src={row?.pic ?? null} className="th-bigphoto"/>
          {(p.lead || p.bullets.length > 0) && <div className="th7-tldr"><div className="th-tldr-h">TL;DR</div>
            {p.lead && <p>{p.lead}</p>}
            {p.bullets.length > 0 && <ul>{p.bullets.map(b => <li key={b.text}><span className={`th-sdot ${DOT[b.tone]}`}/><span>{b.text}</span></li>)}</ul>}
          </div>}
        </div>
        <nav className="th7-jump" aria-label="On this page">
          <a href="#overview">Overview</a><a href="#play">Player feedback</a><a href="#reviews">Reviews</a><a href="#discussion">Discussion</a>
        </nav>
      </article>
      <FitCard id={p.id}/>
      <PollCard id={p.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }} question="Poll: would you buy it again?"/>
      <TraitVotes id={p.id} seed={traitSeed(niche.id, p.id)}/>
      {p.sim.length > 0 && <section className="th-card th-sec th-sec-sim"><h2 className="th-h3">{`Similar ${niche.words.many}`}</h2><div className="th-sim">{p.sim}</div></section>}
      {/* No sidebar under 1000px: its facts as a card (mid widths), and the buy button on every narrow screen. */}
      <section className="th-card th7-narrow-facts">{facts}</section>
      {buy && <section className="th-card th7-narrow-buy">{buy}</section>}
      <ReviewsV7b id={p.id} cards={p.cards} model={p.model}/>
      <Discussion page={`racket:${p.id}`} model={p.model}/>
      {p.also.length >= 2 && <section className="th-card th-sec"><h2 className="th-h2">{`${W.lovers} who loved this also loved`}</h2><div className="th-also">{p.also}</div></section>}
      {p.stories.length > 0 && <section className="th-card th-sec"><h2 className="th-h2">Stories mentioning this racket</h2>
        <ul className="th-stories sm">{p.stories.map(s => <li key={s.id}><a className="th-story-t" href={th(`/stories/${s.slug}`)}>{s.title}</a>
          <span className="th-story-by"><strong>{s.author.name}</strong><MemberMark/></span></li>)}</ul></section>}
      {p.line}
    </div>
    <aside className="th-side">
      <section className="th-card th-sbox"><div className="th-sbox-head">{`About this ${niche.words.one}`}</div>
        <div className="th-sbox-body pad th7-side">{facts}{buy}</div></section>
    </aside>
  </main>;
}
