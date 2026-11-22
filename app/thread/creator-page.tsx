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
import { ATTRS, STANCE_LABEL, TABLE_ATTRS, lowestOffer, usd, reviewLists, agreeChips, stanceLine, stanceCounts, howItPlays, langCode, platform, scoreText, takeaway,
  wordTone, type CreatorReview } from "../../lib/thread/creators";
import { creatorPage, creatorSlugs, creatorHome } from "../../lib/thread/creator-data";
import { threadTitle } from "../../lib/thread/web-sources";
import { creatorPageFor, CREATOR_VIEW, CREATOR_MIN_REVIEWS, creatorPageOn } from "../../lib/thread/sites";
import { Avatar, CreatorReviews } from "./live/creator-reviews";
import { Comments } from "./live/comments";
import { th } from "../../lib/thread/look";
import { PollCard } from "./live/racket-v7b";
import { CompactFit } from "./live/creator-fit";
import { StickyCol } from "./live/sticky-col";
import { TraitVotes } from "./live/trait-votes";
import { traitSeed } from "../../lib/thread/trait-seed";
import { creatorVoteGroups } from "../../lib/thread/creator-votes";
import { siteSentiment } from "../../lib/thread/site-sentiment";
import { homePaddle, praiseLine } from "../../lib/thread/creator-home";
import { W } from "../../lib/thread/words";
import { mentions } from "../../lib/thread/mentions";
import "./creators.css";



/** "YouTube, TikTok and blogs": the sources these reviews come from, in that order. */
const sourceList = (rs: { kind: string }[]) => { const k = new Set(rs.map(r => r.kind));
  const l = [k.has("youtube") && "YouTube", k.has("tiktok") && "TikTok", k.has("blog") && "blogs"].filter((x): x is string => !!x);
  return l.length > 1 ? `${l.slice(0, -1).join(", ")} and ${l.at(-1)}` : l[0] ?? "reviewers"; };
/** "Nov 22": a price check's day, short, for the Where to buy header. */
const shortDay = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
/** Rows the at-a-glance table shows before "Show all N reviews". */
const GLANCE = 13;
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
  const { feed, counted: rs } = reviewLists(page);
  // Under CREATOR_MIN_REVIEWS reviews the product keeps its usual page.
  if (rs.length < CREATOR_MIN_REVIEWS) return null;
  const { r, row, brand, style, sim, cards } = d;
  // The bar and its counts are the site's own players (lib/thread/site-sentiment.ts, owner 2026-11-22); the creator reviews
  // keep their cards and a praise line ("Praised for spin in 13 reviews").
  const votes = siteSentiment(row), praise = praiseLine(homePaddle(page));
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
      pos: x.pos, mix: x.mix, neg: x.neg, unit: W.people,
      price: p?.price ? { label: `from ${usd(p.price.usd)} · check price ↗`, url: p.price.url, rel: p.price.affiliate ? "sponsored nofollow noopener" : "nofollow noopener" } : null }; });
  // "Players on Reddit and forums" (the mock's roundup card): the live page's Reddit summaries for this paddle, as one card in
  // the feed. Never counted as a review (not in N reviews, the table or the sentiment bar). Real short quotes only.
  const reddit = cards.filter(c => c.kind === "reddit").slice(0, 6);
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
  const how = howItPlays(rs), agree = agreeChips(rs);
  // The at-a-glance table: rows with a word in a table column first, otherwise the reviews' own order.
  const graded = (x: (typeof rs)[number]) => TABLE_ATTRS.some(k => !!x.attrs[k]);
  const glance = [...rs.filter(graded), ...rs.filter(x => !graded(x))];
  const gRow = (x: (typeof rs)[number]) => <a key={x.id} className="thc-g-row" href={`#cr-${x.id}`}>
    <span className="thc-g-who"><Avatar name={x.creator} kind={x.kind} size="sm"/><span><strong>{x.creator}</strong>
      <span>{`${platform(x)} · ${langCode(x.lang)}`}{x.score && ` · ${scoreText(x.score)}`}</span></span></span>
    <span className={`thc-take sm ${x.stance}`}>{STANCE_LABEL[x.stance]}</span>
    <span className={`kp${x.keyPoint ? "" : " clamp"}`} title={x.keyPoint ? undefined : takeaway(x.short)}>{x.keyPoint || takeaway(x.short)}</span>
    {TABLE_ATTRS.map(k => <span key={k} className="thc-g-w" data-l={label(k)}><Word w={x.attrs[k]}/></span>)}
  </a>;
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: catalogLabel, path: catalogPath },
    ...(brand ? [{ name: brand.name, path: `/brands/${brand.slug}` }] : []), { name: r.name, path: productHref(r) }])] };
  const pic = row?.pic ?? null;

  // The Hybrid v19 head (owner "exactly this mockup", 2026-11-22): tags, the TL;DR with one + and one - point, the praise
  // pill, the site's own vote bar; the fit check and a small Where to buy on the right.
  // The level tag from the catalogue's "best for" line: its first part, "intermediate → advanced" as "Intermediate to advanced".
  const level = row?.best?.split(",")[0]?.replace(/\s*(→|->)\s*/g, " to ").trim() ?? null;
  const tags = [style ? STYLE_WORD[style] : null, row?.feel ? `${row.feel} feel` : null, level ? `${level[0]!.toUpperCase()}${level.slice(1)}` : null].filter((x): x is string => !!x);
  const plus = agree.likes[0] ?? null, minus = agree.concerns[0] ?? null;
  const n = stanceCounts(rs), buy = offers.filter(o => o.inStock).slice(0, 3);
  // Similar paddles mentioned: other catalogue paddles the reviews name, with their lowest stored price.
  const named = mentions(rs, allRows, r.id).map(m => ({ ...m, href: m.row.href, price: staged[m.row.slug]?.price ?? null }));

  return <Shell active="rackets">
    <JsonLd data={ld}/>
    {/* The mock's third font (README tokens): JetBrains Mono for the small "check price ↗" links, this page only. */}
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap" precedence="default"/>
    <div className="thc thc-v19">
      <header className="thc-head">
        <div className="thc-photo">{pic ? <img src={pic} alt={name}/> : <span className="th-ph" aria-hidden="true"/>}</div>
        <div className="thc-head-m">
          <h1>{name}</h1>
          {tags.length > 0 && <span className="thc-tags">{tags.map((t, k) => <span key={t} className={k === 0 && style ? "on" : undefined}>{t}</span>)}</span>}
          {(page.tldr || plus || minus) && <div className="thc-tldr">
            <span className="thc-tldr-h"><b>TL;DR</b></span>
            {page.tldr && <span className="thc-tldr-t">{page.tldr}</span>}
            {(plus || minus) && <ul className="thc-pts">{plus && <li className="pos">{plus}</li>}{minus && <li className="neg">{minus}</li>}</ul>}
          </div>}
          {praise && <a className="thc-pill" href="#reviews">{praise}</a>}
          {/* The site's own players (owner 2026-11-22, #651): the bar and counts, never the creator reviews. */}
          <div className="thc-votes"><strong>{`${votes.total.toLocaleString("en-US")} ${W.person} ${votes.total === 1 ? "vote" : "votes"}`}</strong>
            {votes.total > 0 ? <><span className="thc-vbar" aria-hidden="true">{KEYS.map(k => votes[k] > 0 && <i key={k} className={k} style={{ flex: votes[k] }}/>)}</span>
              <span className="thc-vcounts">{KEYS.map(k => <span key={k}><span className={`thc-dot ${k}`}>●</span>{`${votes[k]} ${k === "pos" ? "loved" : k === "mix" ? "mixed" : "not for me"}`}</span>)}</span></>
              : <span className="thc-none"><a href="#vote">Be the first to vote</a></span>}</div>
        </div>
        <div className="thc-head-r">
          <CompactFit id={r.id} title={`Is this ${niche.words.one} right for me?`} sub="Pick your level and style"/>
          {/* Where to buy (owner 2026-11-22): the 3 cheapest in-stock shops as quiet links, no filled button; the check date in
              the header; "Lowest" only when one shop is cheapest. No stored price: the usual shop link as one quiet row. */}
          {(buy.length > 0 || cta) && <section id="buy" className="thc-box1 thc-buy">
            <div className="thc-h"><strong>Where to buy</strong>{buy.length > 0 && <span>{[buy.length > 1 ? "Lowest first" : null, page.prices ? shortDay(page.prices.checked) : null].filter(Boolean).join(" · ")}</span>}</div>
            {buy.map((o, i) => <div key={o.shop} className="thc-shop2"><strong>{o.shop}</strong>{i === 0 && buy.length > 1 && buy[1]!.price > o.price && <span className="thc-low">Lowest</span>}
              <span className="thc-price">{usd(o.price)}</span><a className="thc-mono" href={o.url} target="_blank" rel={relOf(o.affiliate)}>check ↗</a></div>)}
            {buy.length === 0 && cta && <div className="thc-shop2"><strong>{shop?.where ?? "Shop"}</strong><a className="thc-mono" href={cta.url} target="_blank" rel={cta.rel}>check price ↗</a></div>}
            {buy.some(o => o.affiliate) && <span className="thc-note">Some links are affiliate links.</span>}
          </section>}
        </div>
      </header>
      <div className="thc-rule"/>

      <main className="thc-body">
        {/* Side by side (owner choice): players on Reddit and forums, and the site's own vote. */}
        <div className={`thc-duo${reddit.length ? "" : " one"}`}>
          {reddit.length > 0 && <RedditRoundup items={reddit}/>}
          {/* Played it? Vote and rate it: the would-you-buy-it-again bars and six vote boxes (lib/thread/creator-votes.ts),
              the stored votes loading live, one tap, no account. */}
          <section id="vote" className="thc-box1 thc-vote">
            <PollCard id={r.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }} question="Played it? Vote and rate it." countLine/>
            {voteGroups.length > 0 && <TraitVotes id={r.id} seed={traitSeed(niche.id, r.id)} groups={voteGroups} title={W.traitsTitle} tieNone/>}
          </section>
        </div>

        <div className="thc-web">
          <span className="thc-kick">From around the web</span>
          <h2>What reviewers are saying</h2>
          <p>{`The votes above are from ${niche.site.name} ${W.people}. Below is a summary of ${plural(rs.length, "review")} from ${sourceList(rs)}.`}</p>
        </div>

        {/* The short version: the reviews' own takes as count cards (no reviewer bar, owner choice), then likes and concerns. */}
        <section id="sentiment" className="thc-box1 thc-sent">
          <div className="thc-h"><strong>The short version</strong><span>{plural(rs.length, "review")}</span></div>
          <div className="thc-sent-g">{KEYS.map(k => <div key={k}>
            <span className="thc-sent-h"><span><span className={`thc-dot ${k}`}>●</span>{STANCE_LABEL[k]}</span><strong>{n[k]}</strong></span>
            <span className="thc-sent-x">{n[k] ? page.groups[k] || stanceLine(rs, k) : "None of the reviews."}</span></div>)}</div>
          {(agree.likes.length > 0 || agree.concerns.length > 0) && <div className="thc-big in">
            <div><strong className="pos">What reviews like</strong><span className="thc-chips">{agree.likes.length ? agree.likes.map(t => <span key={t} className="thc-pm pos lg">{`+ ${t}`}</span>)
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
              {/* Graded rows first (owner 2026-11-22), 13 shown, the rest behind "Show all N reviews" (no script: a details box). */}
              {glance.slice(0, GLANCE).map(gRow)}
              {glance.length > GLANCE && <details className="thc-g-more"><summary>{`Show all ${rs.length} reviews`}</summary>{glance.slice(GLANCE).map(gRow)}</details>}
              <span className="thc-note">Words come from what each reviewer said in their own review.</span>
            </section>
          </div>
          <StickyCol className="thc-row-r">
            {how.length > 0 && <section className="thc-box1 flush">
              <div className="thc-h rule"><strong>How it plays</strong><span>{`From all ${rs.length} reviews`}</span></div>
              {how.map(h => <div key={h.k} className="thc-grade"><span><strong>{h.label}</strong><Word w={h.word}/></span><span>{h.line}</span></div>)}
            </section>}
            {named.length > 0 && <section className="thc-box1 flush">
              <div className="thc-h rule"><strong>{`Similar ${niche.words.many} mentioned`}</strong><span>In these reviews</span></div>
              {named.map(m => <a key={m.row.id} className="thc-men" href={th(m.href)}>
                <span className="thc-men-ph">{m.row.pic ? <img src={m.row.pic} alt="" loading="lazy"/> : null}</span>
                <span><strong>{withoutYear(m.row.name)}</strong>{m.row.line && <span>{m.row.line}</span>}
                  <small>{`Mentioned in ${plural(m.n, "review")}${m.price ? ` · from ${usd(m.price.usd)}` : ""}`}</small></span></a>)}
            </section>}
          </StickyCol>
        </div>

        <CreatorReviews reviews={feed} count={rs.length} roundup={null}/>

        {/* Comments (the mock's section 7): the site's own discussion for this paddle, the same thread as its product page. */}
        <section className="thc-sec2 thc-comments"><Comments page={`racket:${r.id}`} title="Discussion" avatars nicknames={niche.form.quickVote?.nicknames ?? []}/></section>

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

/** "Players on Reddit and forums" (Hybrid v19 mockup, owner 2026-11-22: fill the box like the mock). Real data only: the
 *  paddle's Reddit summaries (PickleballRecs summaries of each post). A headline from the posts' own takes, each summary in
 *  full with its short real quote marked and a numbered source chip, then the numbered thread links. Never counted as a review. */
function RedditRoundup({ items }: { items: import("./racket-data").RvCard[] }) {
  const threads = new Set(items.map(c => c.url?.match(/\/comments\/([a-z0-9]+)/i)?.[1] ?? c.id)).size;
  const pos = items.filter(c => c.verdict === "positive").length, neg = items.filter(c => c.verdict === "negative").length;
  const head = pos * 2 > items.length ? `${W.People} mostly like it.` : neg * 2 > items.length ? `${W.People} mostly have doubts.` : `${W.People} are split on it.`;
  const newest = items.map(c => c.at).filter(Boolean).sort().pop();
  const day = newest ? new Date(newest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
  // The post's short real quote, marked where it sits in its summary (the mock's yellow marker).
  const marked = (c: (typeof items)[number]) => { const q = c.head?.replace(/^[“"]|[”"]$/g, "").trim(), at = q ? c.text.indexOf(q) : -1;
    // Not in the summary: the quote follows it, marked, in the player's own words.
    return at >= 0 ? [c.text.slice(0, at), <mark key="m">{q}</mark>, c.text.slice(at + q!.length)] : q ? [c.text, " ", <mark key="m">{`“${q}”`}</mark>] : [c.text]; };
  const half = Math.ceil(items.length / 2), paras = [items.slice(0, half), items.slice(half)].filter(x => x.length);
  return <article className="thc-card thc-rd">
    <div className="thc-card-b">
      <div className="thc-card-top"><span className="thc-av thc-rd-av" aria-hidden="true">r/</span>
        <span className="thc-name">Players on Reddit and forums</span></div>
      <span className="thc-meta">{`${niche.site.name} summary of ${plural(items.length, `${W.person} post`)} in ${plural(threads, "thread")}${day ? ` · ${day}` : ""}`}</span>
      <h3 className="thc-rd-h">{head}</h3>
      {paras.map((ps, k) => <p key={k} className="thc-sum">{ps.map(c => { const n = items.indexOf(c) + 1;
        return <span key={c.id}>{marked(c)}<b className="thc-num">{n}</b>{" "}</span>; })}</p>)}
      <div className="thc-rd-src">{items.map((c, i) => c.url && <a key={c.id} href={c.url} target="_blank" rel="noopener nofollow">
        <strong>{`[${i + 1}]`}</strong><span><b>{c.who}</b>{` · ${c.thread ?? threadTitle(c.url) ?? "View the thread"} ↗`}</span></a>)}</div>
      <span className="thc-note">Not counted as a review.</span>
    </div>
  </article>;
}
