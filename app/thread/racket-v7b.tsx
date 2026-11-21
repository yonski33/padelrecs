// PadelRecs' racket page (owner mock "Racket Page", Head Extreme Motion example, owner OK 2026-11-21). A community page: no
// byline, no date and no Player score (SHOW_SCORE below rolls that back; the score is still worked out in code).
// Order: top card (photo, title, tags, one line, TL;DR, the strongest vote pill + the opinions bar, jump row) → Is this racket
// right for me? → poll → How does it play? → Similar rackets → Player reviews → Ask the community → also loved, then stories.
// Sidebar: About this racket (curated ranking rows, specs, Check price) and More from <brand>. Under 1000px there is no
// sidebar: Check price and the specs follow the top card; the ranking rows and More from <brand> follow the reviews.
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
import { MemberMark } from "./live/member-mark";
import type { RvCard } from "./racket-data";

/** Owner 2026-11-21: no Player score anywhere on the racket page. true brings the badge back (sidebar and phone tag row). */
export const SHOW_SCORE = false;

/** A curated ranking row in the sidebar: "#2 in Best for power", "Power rating 95 · PadelRecs pick". */
export type RankRow = { label: string; sub: string; href: string };
export type V7bProps = {
  id: string; title: string; model: string; crumbs: ReactNode; tags: string[]; lime: boolean; row: ThreadRow | null; judged: number;
  lead: string | null; bullets: { tone: "pos" | "mix" | "neg" | "catch"; text: string }[]; specs: [string, string][];
  shop: { url: string; rel: string } | null; cards: RvCard[]; sim: ThreadRow[]; also: ThreadRow[];
  brand: { name: string; slug: string } | null; line: ThreadRow[];
  /** The top card's vote pill (lib/thread/vote-pill.ts), or null. */ pill: string | null;
  /** At most two curated ranking rows, best place first. */ ranks: RankRow[];
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
  const ranks = p.ranks.length > 0 && <div className="th8-ranks">{p.ranks.map(k => <a key={k.href} className="th8-rank" href={th(k.href)}>
    <span><span>{k.label}</span><span aria-hidden="true">→</span></span><small>{k.sub}</small></a>)}</div>;
  const buy = p.shop && <div className="th7-buy th8-buy"><a href={p.shop.url} target="_blank" rel={p.shop.rel}>Check price ↗</a><small>{BUY_NOTE}</small></div>;
  const more = p.brand && p.line.length > 0 && <section className="th-card th-sbox th8-more"><div className="th-sbox-head">{`More from ${p.brand.name}`}</div>
    <div className="th8-more-l">{p.line.slice(0, 3).map(x => <a key={x.id} href={th(x.href)}><span>{named(x)}</span><span aria-hidden="true">→</span></a>)}
      <a href={th(`/brands/${p.brand.slug}`)}><span>{`All ${p.brand.name} ${niche.words.many}`}</span><span aria-hidden="true">→</span></a></div></section>;
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
      {/* No sidebar under 1000px: Check price, then the specs (owner 2026-11-21). */}
      {(buy || specs) && <section className="th-card th8-narrow">{buy}{specs && <div><span className="th8-cap">{`About this ${niche.words.one}`}</span>{specs}</div>}</section>}
      <FitCard id={p.id} title={`Is this ${niche.words.one} right for me?`} sub="Pick how you play and what you want, for a quick fit from community feedback."/>
      <div id="feedback" className="th8-anchor">
        <PollCard id={p.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }} question="Poll: would you buy it again?"
          sub={`Vote and see how other ${W.people} feel after using it.`} countsOnly/>
      </div>
      <TraitVotes id={p.id} seed={traitSeed(niche.id, p.id)} tieNone/>
      {p.sim.length > 0 && <section className="th-card th8-sec"><h2 className="th-h2">{`Similar ${niche.words.many}`}</h2>
        <div className="th8-grid">{p.sim.slice(0, 4).map(x => <RacketCard key={x.id} x={x}/>)}</div></section>}
      <ReviewsV7b id={p.id} cards={p.cards}/>
      {(ranks || more) && <div className="th8-narrow-after">{ranks && <section className="th-card th8-narrow-ranks">{ranks}</section>}{more}</div>}
      <Discussion page={`racket:${p.id}`} model={p.model} words={{ heading: "Ask the community", sub: `Questions, advice, and tips about the ${p.model}.` }}/>
      {p.also.length >= 2 && <section className="th-card th8-sec"><h2 className="th-h2">{`${W.lovers} who loved this also loved`}</h2>
        <div className="th8-grid">{p.also.slice(0, 4).map(x => <RacketCard key={x.id} x={x}/>)}</div></section>}
      {p.stories.length > 0 && <section className="th-card th-sec"><h2 className="th-h2">Stories mentioning this racket</h2>
        <ul className="th-stories sm">{p.stories.map(s => <li key={s.id}><a className="th-story-t" href={th(`/stories/${s.slug}`)}>{s.title}</a>
          <span className="th-story-by"><strong>{s.author.name}</strong><MemberMark/></span></li>)}</ul></section>}
    </div>
    <aside className="th-side">
      <section className="th-card th-sbox"><div className="th-sbox-head">{`About this ${niche.words.one}`}</div>
        <div className="th-sbox-body pad th8-side">{scoreEl}{ranks}{specs}{buy}</div></section>
      {more}
    </aside>
  </main>;
}
