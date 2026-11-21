// PadelRecs' racket page (owner mock "Racket Page", Head Extreme Motion example, owner OK 2026-11-21). A community page: no
// byline, no date and no Player score (SHOW_SCORE below rolls that back; the score is still worked out in code).
// Order: top card (photo, title, tags, TL;DR, the strongest vote pill + the opinions bar, jump row) → Is this racket
// right for me? → poll → How does it play? → Similar rackets → Player reviews → Ask the community → also loved, then stories.
// Sidebar (owner OK 2026-11-21, a community feel, not a shop): this week's counts, the latest question, who plays it, often
// compared with, then the basics (specs, a lime Check price). Plain headings, no black bars, no curated ranking box and
// no More from <brand>. Under 1000px there is no sidebar: Check price and the basics follow the top card; the community
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
import { FitCard, PollCard } from "./live/racket-v7b";
import { CommunityFeed } from "./live/feed-v7b";
import { splitSources } from "../../lib/thread/web-sources";
import { Ago } from "./live/ago";
import type { WhoRow } from "../../lib/thread/community";
import type { LatestQuestion } from "./community-data";
import { MemberMark } from "./live/member-mark";
import { FollowButton } from "./live/follow-button";
import { followSite } from "../../lib/thread/sites";
import type { RvCard } from "./racket-data";
import type { TraitGroup } from "../../lib/thread/traits";

/** Owner 2026-11-21: no Player score anywhere on the racket page. true brings the badge back (sidebar and phone tag row). */
export const SHOW_SCORE = false;

export type V7bProps = {
  id: string; title: string; model: string; crumbs: ReactNode; tags: string[]; lime: boolean; row: ThreadRow | null; judged: number;
  lead: string | null; bullets: { tone: "pos" | "mix" | "neg" | "catch"; text: string }[]; specs: [string, string][];
  shop: { url: string; rel: string } | null; cards: RvCard[]; also: ThreadRow[];
  /** Similar rackets: up to four current models, none already in Often compared with (lib/thread/similar-pick.ts). */ sim: ThreadRow[];
  brand: { name: string; slug: string } | null;
  /** The top card's vote pill (lib/thread/vote-pill.ts), or null. */ pill: string | null;
  /** "3 new opinions · 2 posts this week", or null. */ week: string | null;
  /** The newest Ask the community question. */ latest: LatestQuestion | null;
  /** Who plays it, from votes only (lib/thread/community.ts). */ who: { headline: string; rows: WhoRow[] } | null;
  /** The card's heading (SimRacingRecs: "Who races with it"); padel's when left out. */ whoTitle?: string;
  /** Often compared with: up to 3 rackets and their compare page. */ compared: { row: ThreadRow; href: string }[];
  stories: { id: string; slug: string; title: string; author: { name: string } }[];
  /** AudioRecs (V3-ROLLOUT-BRIEF): its own fit card and its kind's vote groups. Padel: absent. */ fit?: ReactNode; groups?: TraitGroup[];
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
  const src = splitSources(p.cards);
  const badge = (size?: string) => score != null ? <span className={`th-badge ${tone(score)}${size ? ` ${size}` : ""}`}>{score}</span> : <span className="th-badge new">New</span>;
  const scoreEl = SHOW_SCORE && <div className="th7-score">{badge()}<span><span>{score != null ? W.Score : judged > 0 ? `${plural(judged, W.opinions.replace(/s$/, ""), W.opinions)} so far` : "No votes yet"}</span>
    {judged > 0 && <SBar lg pos={row!.pos} mix={row!.mix} neg={row!.neg}/>}</span></div>;
  const specs = p.specs.length > 0 && <div className="th8-specs">{p.specs.map(([k, v]) => <span key={k} className="th8-kv"><span>{k}</span><strong>{v}</strong></span>)}</div>;
  const buy = p.shop && <div className="th8-buy"><a href={p.shop.url} target="_blank" rel={p.shop.rel}>Check price ↗</a><small>{BUY_NOTE}</small></div>;
  const week = p.week && <section className="th-card th8-box th8-week"><span className="th8-live" aria-hidden="true"/>{p.week}</section>;
  const latest = p.latest && <section className="th-card th8-box"><h2 className="th8-bh">Latest from the community</h2>
    <span className="th8-q-by"><strong>{p.latest.name}</strong><span>·</span><Ago at={p.latest.at} initial=""/></span>
    <p className="th8-q">{p.latest.text}</p>
    <span className="th8-q-foot"><a href="#discussion">Join in →</a></span></section>;
  const who = p.who && <section className="th-card th8-box"><h2 className="th8-bh">{p.whoTitle ?? "Who plays it"}</h2><strong className="th8-who-h">{p.who.headline}</strong>
    <div className="th8-who">{p.who.rows.map(w => <span key={w.title} className="th8-who-r"><small>{w.title}</small><span className="th8-mini"><i style={{ width: `${Math.round(w.share * 100)}%` }}/></span>
      <b>{w.label}</b><em>{w.n}</em></span>)}</div>
    <small className="th8-cap2">{`From ${W.person} votes in ${W.traitsTitle}`}</small></section>;
  const compared = p.compared.length > 0 && <section className="th-card th8-box"><h2 className="th8-bh">Often compared with</h2>
    <div className="th8-cmp">{p.compared.map(({ row: x, href }) => <span key={x.id} className="th8-cmp-r">
      <a className="th8-cmp-ph" href={th(x.href)} tabIndex={-1} aria-hidden="true">{x.pic ? <img src={x.pic} alt="" loading="lazy"/> : <span className="th-ph"/>}</a>
      <span className="th8-cmp-t"><a href={th(x.href)}>{named(x)}</a>{x.pos + x.mix + x.neg > 0 && <SBar pos={x.pos} mix={x.mix} neg={x.neg}/>}</span>
      <a className="th8-cmp-go" href={href}>Compare</a></span>)}</div>
    {p.brand && <a className="th8-all" href={th(`/brands/${p.brand.slug}`)}>{`All ${p.brand.name} ${niche.words.many} →`}</a>}</section>;
  const community = (week || latest || who || compared) && <>{week}{latest}{who}{compared}</>;
  const basics = (specs || buy) && <section className="th-card th8-box"><h2 className="th8-bh">The basics</h2>{specs}{buy}</section>;
  // The one-line tagline is no longer shown here (owner 2026-11-21: it repeats the TL;DR); meta and OG text keep using it.
  const votes = row ? row.pos + row.mix + row.neg : 0;
  return <main className="th-main th7 th8">
    <div className="th-col">
      {p.crumbs}
      <article id="overview" className="th-card th8-top">
        <div className="th8-hero">
          <Photo src={row?.pic ?? null} className="th-bigphoto th8-photo"/>
          <div className="th8-hero-r">
            <h1 className="th-h1">{p.title}</h1>
            {followSite(niche.id) && <FollowButton id={p.id} name={p.model} place="hero"/>}
            <div className="th-tags">
              {p.tags.map((t, i) => <span key={t} className={`th-pill${i === 0 && p.lime ? " lime" : ""}`}>{t}</span>)}
              {SHOW_SCORE && <span className="th7-tag-score">{score != null ? <>{badge("xs")}{W.score}</> : "New, not enough votes yet"}</span>}
            </div>
            {(p.lead || p.bullets.length > 0) && <div className="th7-tldr th8-tldr"><div className="th-tldr-h">TL;DR</div>
              {p.lead && <p>{p.lead}</p>}
              {p.bullets.length > 0 && <ul>{two(p.bullets).map(b => <li key={b.text}><span className={`th-sdot ${DOT[b.tone]}`}/><span>{b.text}</span></li>)}</ul>}
            </div>}
            {p.pill && <div className="th8-sum"><span className="th8-pill">{p.pill}</span></div>}
            {/* The opinions block (owner 2026-11-21: the main community signal, bigger): N opinions, a full-width bar, raw
                counts with colour dots (never %), all linking to the poll. */}
            {votes > 0 && <a className="th8-op" href="#feedback">
              <strong>{plural(votes, "opinion", "opinions")}</strong>
              <SBar pos={row!.pos} mix={row!.mix} neg={row!.neg}/>
              <span className="th8-op-n">{([["pos", row!.pos, "loved"], ["mix", row!.mix, "mixed"], ["neg", row!.neg, "not for me"]] as const)
                .map(([k, n, w]) => <span key={k}><span className={`th-sdot ${k}`}/>{`${n} ${w}`}</span>)}</span>
            </a>}
          </div>
        </div>
        <nav className="th7-jump th8-jump" aria-label="On this page">
          <a href="#overview" aria-current="true">Overview</a><a href="#feedback">{`${W.Person} feedback`}</a><a href="#reviews">{W.People}</a><a href="#web">From around the web</a>
        </nav>
      </article>
      {/* No sidebar under 1000px: Check price and the basics, compact (owner 2026-11-21). */}
      {basics && <div className="th8-narrow th8-narrow-basics">{basics}</div>}
      {p.fit ?? <FitCard id={p.id} title={`Is this ${niche.words.one} right for me?`} sub="Pick how you play and what you want, for a quick fit from community feedback."/>}
      <div id="feedback" className="th8-anchor">
        <PollCard id={p.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }} question="Poll: would you buy it again?"
          sub={`Vote and see how other ${W.people} feel after using it.`} countsOnly/>
      </div>
      <TraitVotes id={p.id} seed={traitSeed(niche.id, p.id)} tieNone {...(p.groups ? { groups: p.groups } : {})}/>
      {/* Similar rackets (owner bug 2026-11-21): four current models, none from Often compared with (lib/thread/similar-pick.ts),
          as a row of tiles across the column on desktop and a stack on phones. */}
      {p.sim.length > 0 && <section className="th-card th8-sec"><div className="th8-sec-h"><h2 className="th-h2">{`Similar ${niche.words.many}`}</h2>
        {p.brand && <a className="th8-all" href={th(`/brands/${p.brand.slug}`)}>{`All ${p.brand.name} ${niche.words.many} →`}</a>}</div>
        <div className="th8-grid th8-sim">{p.sim.slice(0, 4).map(x => <RacketCard key={x.id} x={x}/>)}</div></section>}
      {community && <div className="th8-narrow th8-narrow-after">{community}</div>}
      {/* Player reviews, then outside sources in their own box (owner mock 2026-11-21, lib/thread/web-sources.ts). */}
      {/* One community feed (owner OK 2026-11-21): player reviews and discussion posts together, "Players on the <model>",
          then From around the web; lib/thread/feed.ts. Replaces Player reviews and Ask the community. */}
      <CommunityFeed id={p.id} model={p.model} cards={src.players} web={src.web}/>
      {p.also.length >= 2 && <section className="th-card th8-sec"><h2 className="th-h2">{`${W.lovers} who loved this also loved`}</h2>
        <div className="th8-grid">{p.also.slice(0, 4).map(x => <RacketCard key={x.id} x={x}/>)}</div></section>}
      {p.stories.length > 0 && <section className="th-card th-sec"><h2 className="th-h2">{`Stories mentioning this ${niche.words.one}`}</h2>
        <ul className="th-stories sm">{p.stories.map(s => <li key={s.id}><a className="th-story-t" href={th(`/stories/${s.slug}`)}>{s.title}</a>
          <span className="th-story-by"><strong>{s.author.name}</strong><MemberMark/></span></li>)}</ul></section>}
    </div>
    <aside className="th-side th8-aside">{scoreEl && <section className="th-card th8-box">{scoreEl}</section>}{community}{basics}</aside>
  </main>;
}
