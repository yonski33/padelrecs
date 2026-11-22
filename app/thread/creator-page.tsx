// The creator-centred product page, built to the owner's creator-page mockup (2026-11-22, its source unpacked in the
// shared notes: spacing, type scale, colours, card structure and section order copied from it). Owner direction: an
// iemranking-style page of what YouTube and blog creators said. A preview: proxy.ts serves it for ?view=creators on a
// product with creator data (lib/thread/sites.ts creatorPageFor); the live product page is unchanged. Cached like the live
// product pages (ISR); the cards' filter, sort, Read more and Show more run in the browser (live/creator-reviews.tsx).
// Order, as the mock: the head (photo · name, TL;DR "from N creator reviews", Check price · Specs) → a rule → Creator
// What reviewers agree on (stance bar, cards, likes and concerns) → the at-a-glance table beside How it plays and Where to buy → Creator reviews.
// Data: db/creators/<site>.json (lib/thread/creator-data.ts), a static demo fixture; the photo, specs and shop link are the
// product's own (racketData). Words, never invented scores; a number only where the creator published one; no prices
// (none are stored yet); no Reddit card (no Reddit data staged for these paddles yet).
import { Shell } from "./shell";
import { racketData } from "./racket-data";
import { threadRows } from "./data";
import { plural } from "./ui";
import { niche } from "../../lib/niche";
import { withoutYear } from "../../lib/brand-name";
import { oneShape } from "../../lib/thread/shape";
import { amazonButton } from "../../lib/amazon-offer";
import { amazonPhoto } from "../../lib/amazon-photos";
import { websiteButton } from "../../lib/product-links";
import { JsonLd, crumbs } from "./seo";
import { catalogLabel, catalogPath, productHref } from "../../lib/niche";
import { ATTRS, STANCE_LABEL, TABLE_ATTRS, checkedDay, lowestOffer, usd, reviewLists, agreeChips, stanceLine, howItPlays, langCode, platform, scoreText, stanceCounts, takeaway,
  wordTone, type CreatorReview } from "../../lib/thread/creators";
import { creatorPage, creatorSlugs, creatorHome } from "../../lib/thread/creator-data";
import { threadTitle } from "../../lib/thread/web-sources";
import { creatorPageFor, CREATOR_VIEW, CREATOR_MIN_REVIEWS, creatorPageOn } from "../../lib/thread/sites";
import { Avatar, CreatorReviews } from "./live/creator-reviews";
import { Comments } from "./live/comments";
import { th } from "../../lib/thread/look";
import { PollCard } from "./live/racket-v7b";
import { TraitVotes } from "./live/trait-votes";
import { traitSeed } from "../../lib/thread/trait-seed";
import { creatorVoteGroups } from "../../lib/thread/creator-votes";
import "./creators.css";



const STYLE_WORD = { control: "Control", power: "Power", balance: "All-round" } as const;
const KEYS = ["pos", "mix", "neg"] as const;
const label = (k: (typeof ATTRS)[number][0]) => ATTRS.find(a => a[0] === k)![1];

function Word({ w }: { w: CreatorReview["attrs"][keyof CreatorReview["attrs"]] }) {
  return w ? <span className={`thc-w ${wordTone(w)}`}>{w}</span> : <span className="thc-w none" aria-label="Not covered">–</span>;
}

/** The creator page for one product, or null when it has no creator data (the caller then shows the usual page). */
export async function CreatorProductBody({ slug }: { slug: string }) {
  const [page, d] = await Promise.all([creatorPage(niche.id, slug), racketData(slug)]);
  if (!page || !d) return null;
  // Reviews include the TikTok takes (owner 2026-11-22): `rs` counts one per reviewer, `feed` holds every card.
  const { feed, counted: rs } = reviewLists(page), n = stanceCounts(rs);
  // Under CREATOR_MIN_REVIEWS reviews the product keeps its usual page.
  if (rs.length < CREATOR_MIN_REVIEWS) return null;
  const { r, row, brand, style, sim, cards } = d;
  const voteGroups = creatorVoteGroups(niche.id);
  // Similar paddles (the mock's section 8): the product page's similar list, current models only, filled up to four from the
  // other staged paddles (same shape first). A staged paddle shows its reviews' takes and its lowest price; others their votes.
  const home = await creatorHome(niche.id), staged = home?.paddles ?? {};
  const { all: allRows } = await threadRows();
  const bySlug = new Map(allRows.map(x => [x.slug, x]));
  const sims = sim.filter(x => x.id !== r.id && x.current !== false);
  for (const s of Object.keys(staged).sort((a, b) => Number(bySlug.get(b)?.shape === r.shape) - Number(bySlug.get(a)?.shape === r.shape))) {
    if (sims.length >= 4) break;
    const x = bySlug.get(s); if (x && x.id !== r.id && !sims.some(y => y.id === x.id)) sims.push(x);
  }
  const similar = sims.slice(0, 4).map(x => { const p = staged[x.slug];
    return { x, href: !creatorPageOn(niche.id) && creatorPageFor(niche.id, x.slug) ? `${x.href}?view=${CREATOR_VIEW}` : x.href,
      pos: p ? p.pos : x.pos, mix: p ? p.mix : x.mix, neg: p ? p.neg : x.neg, unit: p ? "reviews" : "players",
      price: p?.price ? { label: `from ${usd(p.price.usd)} · check price ↗`, url: p.price.url, rel: p.price.affiliate ? "sponsored nofollow noopener" : "nofollow noopener" } : null }; });
  // "Players on Reddit and forums" (the mock's roundup card): the live page's Reddit summaries for this paddle, as one card in
  // the feed. Never counted as a review (not in N reviews, the table or the sentiment bar). Real short quotes only.
  const reddit = cards.filter(c => c.kind === "reddit").slice(0, 4);
  const name = withoutYear(row?.name ?? r.name);
  // The live page's buy link, the same logic (app/thread/rackets/[slug]/page.tsx): the Amazon lookup, the saved listing when
  // the two disagree, else the product's own site. No prices: none are stored yet.
  const live = await amazonButton({ name: r.name, brand: brand?.name }), saved = amazonPhoto(r);
  const amazon = live && saved && live.asin !== (r as { amazonAsin?: string | null }).amazonAsin ? { url: saved.url } : live;
  const site = websiteButton(r);
  const shop = amazon ? { url: amazon.url, rel: "sponsored nofollow noopener", where: "Amazon" }
    : site ? { url: site.url, rel: site.affiliate ? "sponsored nofollow noopener" : "noopener", where: brand?.name ?? "The maker" } : null;
  // Where to buy (the mock's shop list): the price sweep's offers when there are any. The Amazon row uses the site's own
  // tagged link (the same as the live page's Check price); other shops are plain links (no affiliate deals yet).
  const offers = (page.prices?.offers ?? []).map(o => o.shop === "Amazon" && shop?.where === "Amazon" ? { ...o, url: shop.url } : o);
  const low = lowestOffer(offers);
  const relOf = (aff: boolean) => aff ? "sponsored nofollow noopener" : "nofollow noopener";
  // The one filled Check price button (README rule) goes to a lowest in-stock shop; without prices, to the live page's link.
  const cta = low ? { url: low.shops[0]!.url, rel: relOf(low.shops[0]!.affiliate) } : shop;
  const released = r.name.match(/\b(20\d\d)\b/)?.[1] ?? (r.year ? String(r.year) : null);
  const specs = ([...niche.specs.map(s => [s.label, r[s.column]]), ["Released", released]] as [string, string | null][])
    .filter((x): x is [string, string] => !!x[1]);
  const sub = [style ? STYLE_WORD[style] : null, oneShape(r.shape)?.toLowerCase()].filter(Boolean).join(", ");
  const how = howItPlays(rs), agree = agreeChips(rs);
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: catalogLabel, path: catalogPath },
    ...(brand ? [{ name: brand.name, path: `/brands/${brand.slug}` }] : []), { name: r.name, path: productHref(r) }])] };
  const pic = row?.pic ?? null;

  return <Shell active="rackets">
    <JsonLd data={ld}/>
    {/* The mock's third font (README tokens): JetBrains Mono for the small "check price ↗" links, this page only. */}
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap" precedence="default"/>
    <div className="thc">
      <header className="thc-head">
        <div className="thc-photo">{pic ? <img src={pic} alt={name}/> : <span className="th-ph" aria-hidden="true"/>}</div>
        <div className="thc-head-m">
          <h1>{name}</h1>
          {sub && <span className="thc-lede">{`${sub[0]!.toUpperCase()}${sub.slice(1)} paddle${brand ? ` from ${brand.name}` : ""}.`}</span>}
          <div className="thc-tldr">
            <span className="thc-tldr-h"><b>TL;DR</b><span>{`from ${plural(rs.length, "review")}`}</span></span>
            {page.tldr && <strong>{page.tldr}</strong>}
            <span className="thc-tldr-s">{`${n.pos} of ${rs.length} reviews loved it${n.mix ? `, ${n.mix} were mixed` : ""}${n.neg ? ` and ${n.neg} found it not for them` : ""}.`}</span>
            {/* A price only where one is stored; with none, the shop link alone; with neither, no row. */}
            {(low || cta) && <span className="thc-tldr-f">{low ? <span><strong>{usd(low.price)}</strong>{` lowest today${low.shops.length > 1 ? ` at ${low.shops.length} shops` : ""}`}</span> : <span/>}
              {cta && <a className="thc-cta" href={cta.url} target="_blank" rel={cta.rel}>Check price ↗</a>}</span>}
          </div>
        </div>
        {specs.length > 0 && <div className="thc-specs"><strong>Specs</strong>
          {specs.map(([k, v]) => <span key={k}><span>{k}</span><strong>{v}</strong></span>)}</div>}
      </header>
      <div className="thc-rule"/>

      <main className="thc-body">
        {/* What reviewers agree on (owner 2026-11-22, the padel design): the stance bar, the three stance cards and what
            reviewers like and worry about, in one box. Chips are phrases backed by 2+ reviews (lib/thread/creators.ts agreeChips). */}
        <section id="sentiment" className="thc-box1 thc-sent">
          <div className="thc-h"><strong>What reviewers agree on</strong><span>{plural(rs.length, "review")}</span></div>
          <div className="thc-sbar">{KEYS.map(k => n[k] > 0 && <span key={k} className={k} style={{ flex: n[k] }}>{k === "pos" ? `${n[k]} loved it` : n[k]}</span>)}</div>
          <div className="thc-sent-g">{KEYS.map(k => <div key={k}>
            <span className="thc-sent-h"><span><span className={`thc-dot ${k}`}>●</span>{STANCE_LABEL[k]}</span><strong>{n[k]}</strong></span>
            <span className="thc-sent-x">{n[k] ? page.groups[k] || stanceLine(rs, k) : "None of the reviews."}</span></div>)}</div>
          {(agree.likes.length > 0 || agree.concerns.length > 0) && <div className="thc-big in">
            <div><strong className="pos">What reviewers like</strong><span className="thc-chips">{agree.likes.length ? agree.likes.map(t => <span key={t} className="thc-pm pos lg">{`+ ${t}`}</span>)
              : <span className="thc-none">Nothing drew praise from 2 or more reviews.</span>}</span></div>
            <div><strong className="neg">Common concerns</strong><span className="thc-chips">{agree.concerns.length ? agree.concerns.map(t => <span key={t} className="thc-pm neg lg">{`− ${t}`}</span>)
              : <span className="thc-none">No concern came up in 2 or more reviews.</span>}</span></div>
          </div>}
        </section>

        <div className="thc-row">
          <div className="thc-row-l">
            <section id="creators" className="thc-box1 flush thc-glance">
              <div className="thc-h rule"><strong>{`All ${rs.length} reviews at a glance`}</strong><span>Tap a row to jump to the full summary</span></div>
              <div className="thc-g-row thc-g-head"><span>Reviewer</span><span>Take</span><span className="kp">Key point</span>{TABLE_ATTRS.map(k => <span key={k}>{label(k)}</span>)}</div>
              {rs.map(x => <a key={x.id} className="thc-g-row" href={`#cr-${x.id}`}>
                <span className="thc-g-who"><Avatar name={x.creator} kind={x.kind} size="sm"/><span><strong>{x.creator}</strong>
                  <span>{`${platform(x)} · ${langCode(x.lang)}`}{x.score && ` · ${scoreText(x.score)}`}</span></span></span>
                <span className={`thc-take sm ${x.stance}`}>{STANCE_LABEL[x.stance]}</span>
                <span className={`kp${x.keyPoint ? "" : " clamp"}`} title={x.keyPoint ? undefined : takeaway(x.short)}>{x.keyPoint || takeaway(x.short)}</span>
                {TABLE_ATTRS.map(k => <span key={k} className="thc-g-w" data-l={label(k)}><Word w={x.attrs[k]}/></span>)}
              </a>)}
              <span className="thc-note">Words come from what each reviewer said in their own review. A number shows only where the reviewer published one.</span>
            </section>
          </div>
          <div className="thc-row-r">
            {how.length > 0 && <section className="thc-box1 flush">
              <div className="thc-h rule"><strong>How it plays</strong><span>{`From all ${rs.length} reviews`}</span></div>
              {how.map(h => <div key={h.k} className="thc-grade"><span><strong>{h.label}</strong><Word w={h.word}/></span><span>{h.line}</span></div>)}
            </section>}
            {/* Where to buy only with stored prices (owner 2026-11-22); no empty box. */}
            {offers.length > 0 && <section id="buy" className="thc-box1 flush">
              <div className="thc-h rule"><strong>Where to buy</strong>{offers.length > 1 && <span>Lowest first</span>}</div>
              {offers.map(o => <div key={o.shop} className={`thc-shop${o.inStock ? "" : " out"}`}>
                <span><span className="thc-shop-n"><strong>{o.shop}</strong>{o.inStock && low && o.price === low.price && <span className="thc-low">Lowest today</span>}</span>
                  <span className={o.inStock ? "in" : "gone"}>{[o.inStock ? "In stock" : "Sold out", o.edition].filter(Boolean).join(" · ")}</span></span>
                <strong className="thc-price">{usd(o.price)}</strong>
                <a className="thc-mono" href={o.url} target="_blank" rel={relOf(o.affiliate)}>check price ↗</a></div>)}
              <span className="thc-note">{`Prices checked ${checkedDay(page.prices!.checked)}, new paddles from US shops.${offers.some(o => o.affiliate) ? " Some links are affiliate links." : ""}`}</span>
            </section>}
          </div>
        </div>

        <CreatorReviews reviews={feed} count={rs.length} roundup={reddit.length > 0 ? <RedditRoundup items={reddit}/> : null}/>

        {/* Played it? Vote and rate it (owner OK 2026-11-22): the padel page's poll and vote grid, asking this site's ranking
            categories (lib/thread/creator-votes.ts). Its own player reviews count in the poll, as on the usual page; the votes
            already stored (product_votes, trait votes) load live, one tap, no account. */}
        <section id="vote" className="thc-sec2 thc-vote">
          <div className="thc-sec2-h"><h2>Played it? Vote and rate it</h2><span>One tap, no account</span></div>
          <PollCard id={r.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }} question="" countLine/>
          {voteGroups.length > 0 && <TraitVotes id={r.id} seed={traitSeed(niche.id, r.id)} groups={voteGroups} title="" tieNone/>}
        </section>

        {/* Comments (the mock's section 7): the site's own discussion for this paddle, the same thread as its product page. */}
        <section className="thc-sec2 thc-comments"><Comments page={`racket:${r.id}`} nicknames={niche.form.quickVote?.nicknames ?? []}/></section>

        {similar.length > 0 && <section className="thc-sec2">
          <div className="thc-sec2-h"><h2>{`Similar ${niche.words.many}`}</h2>
            {brand && <a href={th(`/brands/${brand.slug}`)}>{`All ${brand.name} ${niche.words.many} →`}</a>}</div>
          <div className="thc-sim">{similar.map(({ x, href, pos, mix, neg, unit, price }) => { const t = pos + mix + neg;
            return <div key={x.id} className="thc-sim-c">
              <a className="thc-sim-ph" href={th(href)} tabIndex={-1} aria-hidden="true">{x.pic ? <img src={x.pic} alt="" loading="lazy"/> : null}</a>
              <a className="thc-sim-n" href={th(href)}>{withoutYear(x.name)}</a>
              {(x.line || x.best) && <span className="thc-sim-l">{x.line ?? `Best for ${x.best}.`}</span>}
              {t > 0 && <span className="thc-sim-s"><span className="thc-sim-bar" aria-hidden="true"><i className="pos" style={{ flex: pos }}/><i className="mix" style={{ flex: mix }}/><i className="neg" style={{ flex: neg }}/></span>
                <span>{`${pos} of ${t} ${unit} loved it`}</span></span>}
              <span className="thc-sim-f">{price ? <a className="thc-mono" href={price.url} target="_blank" rel={price.rel}>{price.label}</a>
                : <a href={th(href)}>See the paddle →</a>}</span>
            </div>; })}</div>
        </section>}
      </main>
    </div>
  </Shell>;
}

/** "Players on Reddit and forums" (the mock's roundup card): one card in the feed with up to four short lines from the live
 *  page's Reddit summaries (a real short quote where one is stored, else the summary's first sentence) and numbered thread
 *  links. Not a review: never counted. */
function RedditRoundup({ items }: { items: import("./racket-data").RvCard[] }) {
  const first = (t: string) => (t.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? t).trim();
  const threads = new Set(items.map(c => c.url?.match(/\/comments\/([a-z0-9]+)/i)?.[1] ?? c.id)).size;
  return <article className="thc-card thc-rd">
    <div className="thc-card-b">
      <div className="thc-card-top"><span className="thc-av thc-rd-av" aria-hidden="true">r/</span>
        <span className="thc-name">Players on Reddit and forums</span>
        <span className="thc-meta">{`· ${items.length} ${items.length === 1 ? "post" : "posts"} in ${threads} ${threads === 1 ? "thread" : "threads"}`}</span>
        <span className="thc-rd-pill">Not counted as a review</span></div>
      <ul className="thc-rd-l">{items.map((c, i) => <li key={c.id}>{c.head ? `“${c.head}”` : first(c.text)}<sup>{`[${i + 1}]`}</sup></li>)}</ul>
      <div className="thc-rd-src">{items.map((c, i) => c.url && <a key={c.id} href={c.url} target="_blank" rel="noopener nofollow">
        <strong>{`[${i + 1}]`}</strong><span><b>{c.who}</b>{` · ${c.thread ?? threadTitle(c.url) ?? "View the thread"} ↗`}</span></a>)}</div>
    </div>
  </article>;
}
