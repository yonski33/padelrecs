// PadelRecs' racket page (owner mock "Racket Page", Head Extreme Motion example, owner OK 2026-11-21). A community page: no
// byline, no date and no Player score (SHOW_SCORE below rolls that back; the score is still worked out in code).
// Order: top card (photo, title, tags, one line, TL;DR, the strongest vote pill + the opinions bar, jump row) → Is this racket
// right for me? → poll → How does it play? → Similar rackets → Player reviews → Ask the community → also loved, then stories.
// Sidebar (owner OK 2026-11-21, a community feel, not a shop): this week's counts, the latest question, who plays it, often
// compared with, then the basics (specs, an outlined Where to buy). Plain headings, no black bars, no curated ranking box and
// no More from <brand>. Under 1000px there is no sidebar: Where to buy and the basics follow the top card; the community
// cards follow "How does it play?".
// app/thread/rackets/[slug]/page.tsx renders this on padel only; every other site keeps its own layout there.
import type { ReactNode } from "react";
import { Photo, SBar, tone, plural, type ThreadRow } from "./ui";
import { th } from "../../lib/thread/look";
import { W } from "../../lib/thread/words";
import { traitSeed } from "../../lib/thread/trait-seed";
import { withoutYear } from "../../lib/brand-name";
import { niche } from "../../lib/niche";
import { TraitVotes } from "./live/trait-votes";
import { FitCard, PollCard, ReviewsV7b } from "./live/racket-v7b";
import { Discussion } from "./live/discussion";
import { Ago } from "./live/ago";
import type { WhoRow } from "../../lib/thread/community";
import type { LatestQuestion } from "./community-data";
import { MemberMark } from "./live/member-mark";
import type { RvCard } from "./racket-data";

/** Owner 2026-11-21: no Player score anywhere on the racket page. true brings the badge back (sidebar and phone tag row). */
export const SHOW_SCORE = false;

export type V7bProps = {
  id: string; title: string; model: string; crumbs: ReactNode; tags: string[]; lime: boolean; row: ThreadRow | null; judged: number;
  lead: string | null; bullets: { tone: "pos" | "mix" | "neg" | "catch"; text: string }[]; specs: [string, string][];
  shop: { url: string; rel: string } | null; cards: RvCard[]; also: ThreadRow[];
  brand: { name: string; slug: string } | null;
  /** The top card's vote pill (lib/thread/vote-pill.ts), or null. */ pill: string | null;
  /** "3 new opinions · 2 questions this week", or null. */ week: string | null;
  /** The newest Ask the community question. */ latest: LatestQuestion | null;
  /** Who plays it, from votes only (lib/thread/community.ts). */ who: { headline: string; rows: WhoRow[] } | null;
  /** Often compared with: up to 3 rackets and their compare page. */ compared: { row: ThreadRow; href: string }[];
  stories: { id: string; slug: string; title: string; author: { name: string } }[];
};
/** Two TL;DR bullets: the first praise and the first catch, so a downside always shows. */
const two = <B extends { tone: string }>(bs: B[]) => { const pos = bs.find(b => b.tone === "pos"), neg = bs.find(b => b.tone !== "pos");
  return pos && neg ? [pos, neg] : bs.slice(0, 2); };
/** The mock's dots: green praise, orange mixed (the catch colour), red complaint. */
const DOT = { pos: "pos", mix: "catch", catch: "catch", neg: "neg" } as const;
/** Owner 2026-11-20: this exact note under Check price. */
const BUY_NOTE = "Affiliate link - price stays the same";
/** "Head Extreme Pro (2026)", as the page's own title. */
const named = (x: ThreadRow) => { const b = withoutYear(x.name); return x.year && b !== x.name ? `${b} (${x.year})` : x.name; };

/** Similar rackets and also loved: photo, name, its short line, the opinions count and bar (no score). */
function RacketCard({ x }: { x: ThreadRow }) {
  const n = x.pos + x.mix + x.neg;
  return <a className="th8-rc" href={th(x.href)}>
    <span className="th8-rc-ph">{x.pic ? <img src={x.pic} alt="" loading="lazy"/> : <span className="th-ph" aria-hidden="true"/>}</span>
    <span className="th8-rc-t"><strong>{named(x)}</strong>{(x.line || x.best) && <span>{x.line ?? `Best for ${x.best}.`}</span>}</span>
    {n > 0 && <span className="th8-rc-n"><b>{plural(n, W.opinions.replace(/s$/, ""), W.opinions)}</b><SBar pos={x.pos} mix={x.mix} neg={x.neg}/></span>}
  </a>;
}

export function RacketV7b(p: V7bProps) {
  const { row, judged } = p, score = SHOW_SCORE ? row?.score ?? null : null;
  const badge = (size?: string) => score != null ? <span className={`th-badge ${tone(score)}${size ? ` ${size}` : ""}`}>{score}</span> : <span className="th-badge new">New</span>;
  const scoreEl = SHOW_SCORE && <div className="th7-score">{badge()}<span><span>{score != null ? W.Score : judged > 0 ? `${plural(judged, W.opinions.replace(/s$/, ""), W.opinions)} so far` : "No votes yet"}</span>
    {judged > 0 && <SBar lg pos={row!.pos} mix={row!.mix} neg={row!.neg}/>}</span></div>;
  const specs = p.specs.length > 0 && <div className="th8-specs">{p.specs.map(([k, v]) => <span key={k} className="th8-kv"><span>{k}</span><strong>{v}</strong></span>)}</div>;
  const buy = p.shop && <div className="th8-buy"><a href={p.shop.url} target="_blank" rel={p.shop.rel}>Where to buy ↗</a><small>{BUY_NOTE}</small></div>;
  const week = p.week && <section className="th-card th8-box th8-week"><span className="th8-live" aria-hidden="true"/>{p.week}</section>;
  const latest = p.latest && <section className="th-card th8-box"><h2 className="th8-bh">Latest from the community</h2>
    <span className="th8-q-by"><strong>{p.latest.name}</strong><span>·</span><Ago at={p.latest.at} initial=""/></span>
    <p className="th8-q">{p.latest.text}</p>
    <span className="th8-q-foot"><span>{plural(p.latest.replies, "reply", "replies")}</span><a href="#discussion">Join in →</a></span></section>;
  const who = p.who && <section className="th-card th8-box"><h2 className="th8-bh">Who plays it</h2><strong className="th8-who-h">{p.who.headline}</strong>
    <div className="th8-who">{p.who.rows.map(w => <span key={w.title} className="th8-who-r"><small>{w.title}</small><span className="th8-mini"><i style={{ width: `${Math.round(w.share * 100)}%` }}/></span>
      <b>{w.label}</b><em>{w.n}</em></span>)}</div>
    <small className="th8-cap2">From player votes in How does it play?</small></section>;
  const compared = p.compared.length > 0 && <section className="th-card th8-box"><h2 className="th8-bh">Often compared with</h2>
    <div className="th8-cmp">{p.compared.map(({ row: x, href }) => <span key={x.id} className="th8-cmp-r">
      <a className="th8-cmp-ph" href={th(x.href)} tabIndex={-1} aria-hidden="true">{x.pic ? <img src={x.pic} alt="" loading="lazy"/> : <span className="th-ph"/>}</a>
      <span className="th8-cmp-t"><a href={th(x.href)}>{named(x)}</a>{x.pos + x.mix + x.neg > 0 && <SBar pos={x.pos} mix={x.mix} neg={x.neg}/>}</span>
      <a className="th8-cmp-go" href={href}>Compare</a></span>)}</div>
    {p.brand && <a className="th8-all" href={th(`/brands/${p.brand.slug}`)}>{`All ${p.brand.name} ${niche.words.many} →`}</a>}</section>;
  const community = (week || latest || who || compared) && <>{week}{latest}{who}{compared}</>;
  const basics = (specs || buy) && <section className="th-card th8-box"><h2 className="th8-bh">The basics</h2>{specs}{buy}</section>;
  const one = row?.line && row.line !== p.lead ? row.line : null;
  return <main className="th-main th7 th8">
    <div className="th-col">
      {p.crumbs}
      <article id="overview" className="th-card th8-top">
        <div className="th8-hero">
          <Photo src={row?.pic ?? null} className="th-bigphoto th8-photo"/>
          <div className="th8-hero-r">
            <h1 className="th-h1">{p.title}</h1>
            <div className="th-tags">
              {p.tags.map((t, i) => <span key={t} className={`th-pill${i === 0 && p.lime ? " lime" : ""}`}>{t}</span>)}
              {SHOW_SCORE && <span className="th7-tag-score">{score != null ? <>{badge("xs")}{W.score}</> : "New, not enough votes yet"}</span>}
            </div>
            {one && <p className="th8-one">{one}</p>}
            {(p.lead || p.bullets.length > 0) && <div className="th7-tldr th8-tldr"><div className="th-tldr-h">TL;DR</div>
              {p.lead && <p>{p.lead}</p>}
              {p.bullets.length > 0 && <ul>{two(p.bullets).map(b => <li key={b.text}><span className={`th-sdot ${DOT[b.tone]}`}/><span>{b.text}</span></li>)}</ul>}
            </div>}
            {(p.pill || judged > 0) && <div className="th8-sum">
              {p.pill && <span className="th8-pill">{p.pill}</span>}
              {judged > 0 && <span className="th8-sent"><SBar pos={row!.pos} mix={row!.mix} neg={row!.neg}/><span>{`${row!.pos} loved · ${row!.mix} mixed · ${row!.neg} not for me`}</span></span>}
            </div>}
          </div>
        </div>
        <nav className="th7-jump th8-jump" aria-label="On this page">
          <a href="#overview" aria-current="true">Overview</a><a href="#feedback">Player feedback</a><a href="#reviews">Reviews</a><a href="#discussion">Ask the community</a>
        </nav>
      </article>
      {/* No sidebar under 1000px: Where to buy and the basics, compact (owner 2026-11-21). */}
      {basics && <div className="th8-narrow th8-narrow-basics">{basics}</div>}
      <FitCard id={p.id} title={`Is this ${niche.words.one} right for me?`} sub="Pick how you play and what you want, for a quick fit from community feedback."/>
      <div id="feedback" className="th8-anchor">
        <PollCard id={p.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }} question="Poll: would you buy it again?"
          sub={`Vote and see how other ${W.people} feel after using it.`} countsOnly/>
      </div>
      <TraitVotes id={p.id} seed={traitSeed(niche.id, p.id)} tieNone/>
      {/* "Similar rackets" is gone: Often compared with (sidebar, and here on narrow screens) lists them. */}
      {community && <div className="th8-narrow th8-narrow-after">{community}</div>}
      <ReviewsV7b id={p.id} cards={p.cards}/>
      <Discussion page={`racket:${p.id}`} model={p.model} words={{ heading: "Ask the community", sub: `Questions, advice, and tips about the ${p.model}.` }}/>
      {p.also.length >= 2 && <section className="th-card th8-sec"><h2 className="th-h2">{`${W.lovers} who loved this also loved`}</h2>
        <div className="th8-grid">{p.also.slice(0, 4).map(x => <RacketCard key={x.id} x={x}/>)}</div></section>}
      {p.stories.length > 0 && <section className="th-card th-sec"><h2 className="th-h2">Stories mentioning this racket</h2>
        <ul className="th-stories sm">{p.stories.map(s => <li key={s.id}><a className="th-story-t" href={th(`/stories/${s.slug}`)}>{s.title}</a>
          <span className="th-story-by"><strong>{s.author.name}</strong><MemberMark/></span></li>)}</ul></section>}
    </div>
    <aside className="th-side th8-aside">{scoreEl && <section className="th-card th8-box">{scoreEl}</section>}{community}{basics}</aside>
  </main>;
}
