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
import { Fragment, type ReactNode } from "react";
import { Shell } from "./shell";
import { racketData } from "./racket-data";
import { threadRows, skinOf } from "./data";
import { plural } from "./ui";
import { niche } from "../../lib/niche";
import { withoutYear } from "../../lib/brand-name";
import { oneShape } from "../../lib/thread/shape";
import { amazonButton } from "../../lib/amazon-offer";
import { amazonPhoto } from "../../lib/amazon-photos";
import { websiteButton } from "../../lib/product-links";
import { JsonLd, crumbs } from "./seo";
import { catalogLabel, catalogPath, productHref } from "../../lib/niche";
import { STANCE_LABEL, lowestOffer, shortShop, usd, reviewLists, agreeChips, stanceLine, stanceCounts, howItPlays, langCode, platform, scoreText, takeaway,
  wordTone, howTitleFor, type CreatorReview } from "../../lib/thread/creators";
import { configAxisFor, configCell, configSite, textSlugs } from "../../lib/thread/creator-config";
import { creatorPage, creatorSlugs, creatorHome } from "../../lib/thread/creator-data";
import { threadTitle } from "../../lib/thread/web-sources";
import roundups from "../../db/creators/reddit-roundups.json";
import wrapups from "../../db/creators/reviewer-wrapups.json";
import tldrs from "../../db/creators/tldrs.json";
import compareLines from "../../db/creators/compare-lines.json";
import aliases from "../../db/creators/aliases.json";
import bestFor from "../../db/creators/best-for.json";
import { creatorPageFor, CREATOR_VIEW, CREATOR_MIN_REVIEWS, creatorPageOn, creatorPlainSite } from "../../lib/thread/sites";
import { Avatar, CreatorReviews } from "./live/creator-reviews";
import { MentionsProvider, type MentionTarget } from "./live/mention-links";
import { mentionIndex, namedIds, type MentionAliases } from "../../lib/thread/mention-links";
import { Comments } from "./live/comments";
import { th } from "../../lib/thread/look";
import { PollCard } from "./live/racket-v7b";
import { CompactFit } from "./live/creator-fit";
import { SkinCompactFit } from "./live/skin-match";
import { playersWord } from "../../lib/thread/web-sources";
import { StickyCol } from "./live/sticky-col";
import { TraitVotes } from "./live/trait-votes";
import { traitSeed } from "../../lib/thread/trait-seed";
import { creatorVoteGroups } from "../../lib/thread/creator-votes";
import { siteSentiment } from "../../lib/thread/site-sentiment";
import { W } from "../../lib/thread/words";
import { mentions } from "../../lib/thread/mentions";
import { padelOffers, newestCheck, type ShopOffer } from "../../lib/padel-offers";
import { followSite, storiesSite } from "../../lib/thread/sites";
import { FollowButton } from "./live/follow-button";
import { racketStories } from "./stories-data";
import { MemberMark } from "./live/member-mark";
import "./creators.css";



/** "YouTube, TikTok and blogs": the sources these reviews come from, in that order. */
const sourceList = (rs: { kind: string }[]) => { const k = new Set(rs.map(r => r.kind));
  const l = [k.has("youtube") && "YouTube", k.has("tiktok") && "TikTok", k.has("blog") && "blogs"].filter((x): x is string => !!x);
  return l.length > 1 ? `${l.slice(0, -1).join(", ")} and ${l.at(-1)}` : l[0] ?? "reviewers"; };
/** Rows the at-a-glance table shows before "Show all N reviews". */
const GLANCE = 15;
/** A row's key point (owner 2026-11-23): the stored short line (70 characters or fewer); without one, the summary's first
 *  sentence cut at a word to 70 characters. Never the longer summary. */
const KP_MAX = 70;
function keyPoint(x: { keyPoint?: string | null; short: string }): string {
  const k = x.keyPoint?.trim();
  if (k && k.length <= KP_MAX) return k;
  const t = (k || takeaway(x.short)).trim();
  return t.length <= KP_MAX ? t : `${t.slice(0, t.lastIndexOf(" ", KP_MAX - 1)).replace(/[,;:]$/, "")}…`;
}
/** "Nov 22": a price check's day, short. */
const shortDay = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const STYLE_WORD = { control: "Control", power: "Power", balance: "All-round" } as const;
const KEYS = ["pos", "mix", "neg"] as const;
/** SkinRecs (owner "Yes, Skin next" 2026-11-23): the same page in its own soft look (creators.css .th-skin block), its own
 *  tags, fit check (the skin engine, as on its product page) and vote groups (lib/thread/creator-votes.ts). */
const SKIN = niche.id === "skin";
/** LaptopRecs (2026-11-24): the creator page on a site that is not a Thread site, so without the Thread-only parts (the fit
 *  check runs on the padel-style engine, the vote boxes and the discussion on Thread tables). Its reviews carry the config
 *  each reviewer tested (lib/thread/creator-config.ts): a "Reviewed: ..." line per card, config chips, a Config column. */
const PLAIN = creatorPlainSite(niche.id);
const CONFIGS = configSite(niche.id);
/** PadelRecs (2026-11-24, onto this page from its v7b racket page): the padel shops' own prices in the price box (lib/padel-offers.ts,
 *  db/shop/padel-offers.json), the Follow button in the head and the member stories that name the racket. */
const PADEL = niche.id === "padel";

function Word({ w }: { w: CreatorReview["attrs"][keyof CreatorReview["attrs"]] }) {
  return w ? <span className={`thc-w ${wordTone(w)}`}>{w}</span> : <span className="thc-w none" aria-label="Not covered">–</span>;
}

/** The creator page for one product, or null when it has no creator data (the caller then shows the usual page). */
export async function CreatorProductBody({ slug }: { slug: string }) {
  const [page, d] = await Promise.all([creatorPage(niche.id, slug), racketData(slug)]);
  if (!page || !d) return null;
  // Reviews include the TikTok takes (owner 2026-11-22): `rs` counts one per reviewer, `feed` holds every card.
  const { feed: feed0, counted: rs } = reviewLists(page);
  // Best for, per review (db/creators/best-for.json): written from what each reviewer says the paddle suits.
  const bf = (bestFor as Record<string, Record<string, { who: string; why: string }>>)[niche.id] ?? {};
  const feed = feed0.map(x => bf[x.id] ? { ...x, bestFor: bf[x.id] } : x);
  // Under CREATOR_MIN_REVIEWS reviews the product keeps its usual page.
  if (rs.length < CREATOR_MIN_REVIEWS) return null;
  const { r, row, brand, style, sim, cards } = d;
  const [tales, shops] = await Promise.all([storiesSite(niche.id) ? racketStories(r.id) : [], PADEL ? padelOffers(slug) : []]);
  // The TL;DR sentence (owner 2026-11-23): the creator page's own line where it has one, else the same line the usual
  // product page shows (racketData: the written "In short" summary, the page content's tagline, the short or list line).
  // A written TL;DR for products whose creator import came without one (db/creators/tldrs.json, 2026-11-23).
  // A laptop staged under another slug keeps its text under that slug (lib/thread/creator-config.ts textSlugs).
  const textKeys = textSlugs(niche.id, slug), siteTldrs = (tldrs as Record<string, Record<string, string>>)[niche.id];
  const tldr = page.tldr || textKeys.map(k => siteTldrs?.[k]).find(Boolean) || (SKIN && d.lead ? playersWord(d.lead, "reviewer") : d.lead) || null;
  // The bar and its counts are the site's own players (lib/thread/site-sentiment.ts, owner 2026-11-22); the creator reviews
  // keep their cards and a praise line ("Praised for spin in 13 reviews").
  const votes = siteSentiment(row);
  const voteGroups = creatorVoteGroups(niche.id);
  // Similar paddles (the mock's section 8): the product page's similar list, current models only, filled up to four from the
  // other staged paddles (same shape first). A staged paddle shows its reviews' takes and its lowest price; others their votes.
  const home = await creatorHome(niche.id), staged = home?.paddles ?? {};
  const { all: allRows, rows: rowMap, ctx } = await threadRows();
  // SkinRecs' fit check and tags from its engine, the same inputs as its product page: this product's type only.
  const sk = SKIN ? skinOf(ctx) : null;
  const skinSame = sk ? sk.data.listed.filter(x => x.shape === r.shape && (x.id === r.id || rowMap.get(x.id)?.current)) : [];
  const skinWire = sk ? (await import("../skin/payload")).wireOf(sk, skinSame) : [];
  const skinLinks = Object.fromEntries(skinSame.flatMap(x => { const t = rowMap.get(x.id); return t ? [[x.id, { name: t.name, href: t.href }]] : []; }));
  const skinAttrs = sk?.attrs.get(r.id), tex = skinAttrs?.scores.texture;
  const skinTex = tex && tex.n >= 3 ? (tex.score >= 62 ? "Rich" : tex.score <= 38 ? "Light" : null) : null;
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
  // The written roundup of ALL the paddle's Reddit posts (pilot 2026-11-23, db/creators/reddit-roundups.json), where one exists.
  const siteWraps = (wrapups as Record<string, Record<string, Wrapup>>)[niche.id];
  const wrap = textKeys.map(k => siteWraps?.[k]).find(Boolean) ?? null;
  const rd = (roundups as Record<string, Record<string, Roundup>>)[niche.id]?.[slug] ?? null;
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
  // On a tie for the lowest price the button goes to Amazon, or another affiliate link (owner 2026-11-23: until the other
  // shops have affiliate codes); otherwise the first shop at that price.
  const top = low ? low.shops.find(o => o.shop === "Amazon" || o.affiliate) ?? low.shops[0]! : null;
  const cta = top ? { url: top.url, rel: relOf(top.affiliate || top.shop === "Amazon") } : shop;
  const how = howItPlays(rs), agree = agreeChips(rs);
  // The at-a-glance table (owner 2026-11-23): reviewer, take and the short key point only, in the reviews' own order.
  const glance = rs;
  const gRow = (x: (typeof rs)[number]) => <a key={x.id} className={`thc-g-row${CONFIGS ? " cfg" : ""}`} href={`#cr-${x.id}`}>
    <span className="thc-g-who"><Avatar name={x.creator} kind={x.kind} size="sm"/><span><strong>{x.creator}</strong>
      <span>{`${platform(x)} · ${langCode(x.lang)}`}{x.score && ` · ${scoreText(x.score)}`}</span></span></span>
    <span className={`thc-take sm ${x.stance}`}>{STANCE_LABEL[x.stance]}</span>
    {CONFIGS && <span className="cfg-l">{configCell(x.config)}</span>}
    <span className="kp">{keyPoint(x)}</span>
  </a>;
  const ld = { "@context": "https://schema.org", "@graph": [crumbs([{ name: catalogLabel, path: catalogPath },
    ...(brand ? [{ name: brand.name, path: `/brands/${brand.slug}` }] : []), { name: r.name, path: productHref(r) }])] };
  const pic = row?.pic ?? null;

  // The Hybrid v19 head (owner "exactly this mockup", 2026-11-22): tags, the TL;DR with one + and one - point, the praise
  // pill, the site's own vote bar; the fit check and a small Where to buy on the right.
  // The level tag from the catalogue's "best for" line: its first part, "intermediate → advanced" as "Intermediate to advanced".
  const level = row?.best?.split(",")[0]?.replace(/\s*(→|->)\s*/g, " to ").trim() ?? null;
  const tags = (SKIN ? [r.shape, skinAttrs?.facts.fragrance_free === "free" ? "Fragrance free" : null, skinTex ? `${skinTex} texture` : null]
    : PLAIN ? [r.shape]
    : [style ? STYLE_WORD[style] : null, row?.feel ? `${row.feel} feel` : null, level ? `${level[0]!.toUpperCase()}${level.slice(1)}` : null]).filter((x): x is string => !!x);
  // Two + points and one - point (owner 2026-11-22), the likes and concerns backed by 2+ reviews.
  const plus = agree.likes.slice(0, 2), minus = agree.concerns[0] ?? null;
  // Up to 3 shops (SkinRecs 4, owner 2026-11-23: "show few stores") in the price box.
  const n = stanceCounts(rs), buy = offers.filter(o => o.inStock).slice(0, SKIN ? 4 : 3);
  // The button's own shop is left out of the list under it; "In stock at N shops" still counts it.
  const listed = buy.filter(o => !(top && o.url === top.url));
  // Amazon's price carries its "as of" time (Amazon's rule), from the daily price job.
  const amzRow = buy.find(o => o.shop === "Amazon" && o.checkedAt);
  const amazonAsOf = amzRow ? new Date(amzRow.checkedAt!).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }) : null;
  // Similar paddles mentioned: other catalogue paddles the reviews name, with their lowest stored price.
  // Each one's line compares it with this paddle, from its own side (owner 2026-11-23, db/creators/compare-lines.json: written
  // from the review sentences that name both, checked by a second reader); with no real comparison, its usual one-liner.
  const cmp = (compareLines as Record<string, Record<string, Record<string, { line: string; n: number; by?: string[] }>>>)[niche.id]?.[slug] ?? {};
  // The reviewers behind each line, named and linked to their card on this page (owner 2026-11-23: "per PickleballStudio").
  const byId = new Map(feed.map(x => [x.id, x.creator]));
  const named = mentions(rs, allRows, r.id).map(m => { const c = cmp[m.row.slug];
    const by = (c?.by ?? []).filter(id => byId.has(id)).map(id => ({ id, name: byId.get(id)! })).filter((b, i, a) => a.findIndex(y => y.name === b.name) === i);
    return { ...m, href: m.row.href, price: staged[m.row.slug]?.price ?? null, vs: c?.line ?? null, vsN: c?.n ?? 0, by }; });
  // Paddles compared first; ones the reviews only name go under "Also mentioned" at the bottom (owner 2026-11-23).
  const namedVs = named.filter(m => m.vs), namedAlso = named.filter(m => !m.vs);

  // Paddle mentions as links in the review cards (owner 2026-11-23): the catalogue's unique names, only the ones these
  // reviews use (and this paddle's own, which claims its text but never links) go to the browser.
  const mxAll = mentionIndex(allRows, (aliases as unknown as Record<string, MentionAliases>)[niche.id] ?? {}), mxIds = namedIds(feed.flatMap(x => [x.summary, x.more, x.compared]), mxAll, r.id);
  const mxIndex = mxAll.filter(k => k.id === r.id || mxIds.includes(k.id));
  const mxTargets: Record<string, MentionTarget> = Object.fromEntries(mxIds.flatMap(id => { const x = allRows.find(y => y.id === id); if (!x) return [];
    const votes = x.pos + x.mix + x.neg;
    return [[id, { id, slug: x.slug, name: withoutYear(x.name), href: th(x.href), pic: x.pic ?? null, loved: votes ? Math.round(100 * x.pos / votes) : null, votes,
      price: staged[x.slug]?.price?.usd ?? null }]]; }));

  return <Shell active="rackets">
    <JsonLd data={ld}/>
    {/* The mock's third font (README tokens): JetBrains Mono for the small "check price ↗" links, this page only. */}
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap" precedence="default"/>
    {/* SkinRecs header 4a (owner handoff 2026-11-23): Inter 800 for the name, Barlow Condensed 800 for TL;DR and the price. */}
    {SKIN && <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Barlow+Condensed:wght@800&display=swap" precedence="default"/>}
    <div className="thc thc-v19">
      {/* Head (owner mock 2026-11-23): photo · name, tags, TL;DR with ✓ and ✗ points, the players' vote box · the price box. */}
      {/* Header 4a (owner handoffs 2026-11-23, skin then pickleball): one outlined panel, photo / main / prices columns (creators.css .thc-hd4). */}
      <header className="thc-head thc-hd3 thc-hd4">
        <div className="thc-photo">{pic ? <img src={pic} alt={name}/> : <span className="th-ph" aria-hidden="true"/>}</div>
        <div className="thc-head-m">
          <h1>{name}</h1>
          {tags.length > 0 && <span className="thc-tags">{tags.map((t, k) => <span key={t} className={k === 0 && (style || SKIN) ? "on" : undefined}>{t}</span>)}</span>}
          {followSite(niche.id) && <span className="thc-follow"><FollowButton id={r.id} name={name} place="hero"/></span>}
          {(tldr || plus.length > 0 || minus) && <div className="thc-tldr">
            <span className="thc-tldr-h"><b>TL;DR</b><span>{`From ${plural(rs.length, "review")}`}</span></span>
            {tldr && <span className="thc-tldr-t">{tldr}</span>}
            {(plus.length > 0 || minus) && <span className="thc-pts2">{plus.map(t => <span key={t} className="pos">{`✓ ${t}`}</span>)}{minus && <span className="neg">{`✕ ${minus}`}</span>}</span>}
          </div>}
          {/* The site's own players (owner 2026-11-22, #651): the bar and shares, never the creator reviews. */}
          <div className="thc-vbox">
            <span className="thc-vbox-h"><strong>{`${votes.total.toLocaleString("en-US")} ${W.person} ${votes.total === 1 ? "vote" : "votes"}`}</strong>{!PLAIN && <a href="#vote">Vote ↓</a>}</span>
            {votes.total > 0 ? <><span className="thc-vbar" aria-hidden="true">{KEYS.map(k => votes[k] > 0 && <i key={k} className={k} style={{ flex: votes[k] }}/>)}</span>
              {/* 4a: raw counts with colour dots, so the three add up to the total. */}
              <span className="thc-vcnt">{KEYS.map(k => <span key={k}><i className={k} aria-hidden="true"/>{`${votes[k].toLocaleString("en-US")} ${k === "pos" ? "loved" : k === "mix" ? "mixed" : "not for me"}`}</span>)}</span></>
              : <span className="thc-none">{PLAIN ? "No votes yet." : "No votes yet. Be the first."}</span>}
          </div>
        </div>
        {shops.length > 0 ? <div className="thc-head-r"><ShopBox offers={shops}/></div>
          : (buy.length > 0 || cta) && <div className="thc-head-r">
          {/* The price box: the lowest in-stock price, the page's one filled Check price button, the shops as quiet links. */}
          <section id="buy" className={`thc-box1 thc-pbox${SKIN && !low && !buy.length ? " empty" : ""}`}>
            {/* SkinRecs has no shop prices yet (owner 2026-11-23: prices later): a small Where to buy box, the shop link only. */}
            {low && <><span className="thc-pbox-l">Lowest price today</span><strong className="thc-pbox-p">{usd(low.price)}</strong>
              <span className="thc-pbox-s">{/* The shops listed below (owner 2026-11-23), not every in-stock offer. */}{buy.length > 0 && `In stock at ${plural(buy.length, "shop")}`}</span></>}
            {/* With a price shown (owner 2026-11-23) the button names its shop: the lowest in-stock shop ("Desert Paddles ›",
                its "(brand store)" note left off), or on SkinRecs "Amazon ›". */}
            {cta && <a className="thc-cta wide" href={cta.url} target="_blank" rel={cta.rel}>{top ? `${shortShop(top.shop)} ›` : SKIN && shop ? `${shop.where} ›` : "Check price ↗"}</a>}
            {/* The affiliate note under the shop button (owner 2026-11-23), linking to the site's disclosure page. */}
            {/* Every site (owner 2026-11-23: "place affiliate note below any amazon link"); skin also names the shop otherwise. */}
            {!low && shop && (SKIN || shop.rel.includes("sponsored")) && <span className="thc-pbox-on">{shop.rel.includes("sponsored")
              ? <>{`Affiliate link: ${niche.site.name} may earn a small commission. `}<a href={th("/affiliate-disclosure")}>Learn more</a></> : `on ${shop.where}`}</span>}

            {/* The button's own shop is not listed again below it (owner 2026-11-23). */}
            {listed.length > 0 && <div className="thc-pbox-list">{listed.map(o => <div key={o.shop} className="thc-shop2"><strong title={o.shop}>{shortShop(o.shop)}</strong>
              <span className="thc-price">{usd(o.price)}</span><a className="thc-mono" href={o.url} target="_blank" rel={relOf(o.affiliate)}>check ↗</a></div>)}</div>}
            {/* Back under the shops (owner 2026-11-23): the check date and, where any link is one, the affiliate note. */}
            {page.prices && buy.length > 0 && <span className="thc-note">{`Checked ${shortDay(page.prices.checked)}.${amazonAsOf ? ` Amazon price as of ${amazonAsOf} UTC.` : ""}${buy.some(o => o.affiliate || o.shop === "Amazon") ? " Some links are affiliate links." : ""}`}</span>}
          </section>
          {/* SkinRecs (owner mock 2026-11-23): the fit check sits under Check price, where one shop leaves room. */}
          {SKIN && !low && <SkinCompactFit id={r.id} wire={skinWire} links={skinLinks} side/>}
        </div>}
      </header>
      {/* Is this paddle right for me? as one row under the head (owner mock 2026-11-23). */}
      {/* SkinRecs with store prices (owner 2026-11-23): the price list fills the right column, so its fit check moves to
          this full-width row, as on PickleballRecs; Amazon-only products keep it under the button. */}
      {SKIN ? low && <div className="thc-fitrow"><SkinCompactFit id={r.id} wire={skinWire} links={skinLinks}/></div>
        : PLAIN ? null : <div className="thc-fitrow"><CompactFit id={r.id} title={`Is this ${niche.words.one} right for me?`} sub="Pick your level and style" bar/></div>}
      <div className="thc-rule"/>

      <main className="thc-body">
        {/* Side by side (owner choice): players on Reddit and forums, and the site's own vote. */}
        {/* LaptopRecs: the Reddit card alone, when there is one (no vote boxes there). */}
        {PLAIN ? (rd || reddit.length > 0) && <div className="thc-duo one">{rd ? <RedditBox rd={rd}/> : <RedditRoundup items={reddit}/>}</div>
        : <div className={`thc-duo${reddit.length ? "" : " one"}`}>
          {rd ? <RedditBox rd={rd}/> : reddit.length > 0 && <RedditRoundup items={reddit}/>}
          {/* Played it? Vote and rate it: the would-you-buy-it-again bars and six vote boxes (lib/thread/creator-votes.ts),
              the stored votes loading live, one tap, no account. */}
          <section id="vote" className="thc-box1 thc-vote">
            <PollCard id={r.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }} question={SKIN ? "Tried it? Vote and rate it." : "Played it? Vote and rate it."} countLine/>
            {voteGroups.length > 0 && <TraitVotes id={r.id} seed={traitSeed(niche.id, r.id)} groups={voteGroups} title={W.traitsTitle} tieNone {...(SKIN ? { of: d.judged } : {})}/>}
          </section>
        </div>}

        <div className="thc-web">
          <span className="thc-kick">From around the web</span>
          <h2>What reviewers are saying</h2>
          <p>{`The votes above are from ${niche.site.name} ${W.people}. Below is a summary of ${plural(rs.length, "review")} from ${sourceList(rs)}.`}</p>
        </div>

        {/* The short version: the reviews' own takes as count cards (no reviewer bar, owner choice), then likes and concerns. */}
        <section id="sentiment" className="thc-box1 thc-sent">
          <div className="thc-h"><strong>The short version</strong><span>{plural(rs.length, "review")}</span></div>
          {/* With a written wrap-up (pilot): the text first, then the count boxes and tags (owner 2026-11-23). */}
          {wrap && <Wrap w={wrap} n={rs.length}/>}
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
              <div className={`thc-g-row thc-g-head${CONFIGS ? " cfg" : ""}`}><span>Reviewer</span><span>Take</span>{CONFIGS && <span className="cfg-l">Config</span>}<span className="kp">Key point</span></div>
              {/* Graded rows first (owner 2026-11-22), 15 shown, the rest behind "Show all N reviews" (no script: a details box). */}
              {glance.slice(0, GLANCE).map(gRow)}
              {glance.length > GLANCE && <details className="thc-g-more"><summary>{`Show all ${rs.length} reviews`}</summary>{glance.slice(GLANCE).map(gRow)}</details>}
                          </section>
          </div>
          <StickyCol className="thc-row-r">
            {how.length > 0 && <section className="thc-box1 flush">
              <div className="thc-h rule"><strong>{howTitleFor(niche.id)}</strong><span>{`From all ${rs.length} reviews`}</span></div>
              {how.map(h => <div key={h.k} className="thc-grade"><span><strong>{h.label}</strong><Word w={h.word}/></span><span>{h.line}</span></div>)}
            </section>}
            {named.length > 0 && <section className="thc-box1 flush">
              <div className="thc-h rule"><strong>{`Similar ${niche.words.many} mentioned`}</strong><span>In these reviews</span></div>
              {/* A row: the photo and name link to the paddle; the reviewers' names link to their cards here. */}
              {[...namedVs, ...namedAlso].map((m, i) => <Fragment key={m.row.id}>
                {i === namedVs.length && namedVs.length > 0 && <div className="thc-men-also">Also mentioned</div>}
                <div className="thc-men">
                  <a className="thc-men-ph" href={th(m.href)} aria-hidden="true" tabIndex={-1}>{m.row.pic ? <img src={m.row.pic} alt="" loading="lazy"/> : null}</a>
                  <span><a className="thc-men-n" href={th(m.href)}><strong>{withoutYear(m.row.name)}</strong></a>
                    {m.vs ? <span>{m.vs}{m.by.length > 0 && <>{", per "}{m.by.map((b, j) => <Fragment key={b.id}>{j > 0 && (j === m.by.length - 1 ? " and " : ", ")}<a className="thc-men-by" href={`#cr-${b.id}`}>{b.name}</a></Fragment>)}{" ↓"}</>}</span>
                      : m.row.line && <span>{m.row.line}</span>}
                    <small>{`${m.vs ? `Compared in ${plural(m.by.length || m.vsN || m.n, "review")}` : `Mentioned in ${plural(m.n, "review")}`}${m.price ? ` · from ${usd(m.price.usd)}` : ""}`}</small></span>
                </div></Fragment>)}
            </section>}
          </StickyCol>
        </div>

        <MentionsProvider index={mxIndex} targets={mxTargets} selfId={r.id} selfSlug={slug} unit={W.people} noun={niche.words.one}>
          <CreatorReviews reviews={feed} count={rs.length} roundup={null} {...(CONFIGS ? { configs: true, axis: configAxisFor(niche.id, slug) } : {})}/>
        </MentionsProvider>

        {/* PadelRecs' member stories that name this racket (the pilot), as on its v7b racket page. */}
        {tales.length > 0 && <section className="thc-sec2">
          <div className="thc-sec2-h"><h2>{`Stories with the ${name}`}</h2><a href={th("/stories")}>All stories →</a></div>
          <ul className="th-stories sm">{tales.map(t => <li key={t.id}><a className="th-story-t" href={th(`/stories/${t.slug}`)}>{t.title}</a>
            <span className="th-story-by"><strong>{t.author.name}</strong><MemberMark/></span></li>)}</ul>
        </section>}
        {/* Comments (the mock's section 7): the site's own discussion for this paddle, the same thread as its product page. */}
        {!PLAIN && <section className="thc-sec2 thc-comments"><Comments page={`racket:${r.id}`} title="Discussion" avatars nicknames={niche.form.quickVote?.nicknames ?? []}/></section>}

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
                : <a href={th(href)}>{`See the ${niche.words.one} →`}</a>}</span>
            </div>; })}</div>
          {/* Under any affiliate price link here too (owner 2026-11-23). */}
          {similar.some(x => x.price?.rel.includes("sponsored")) && <span className="thc-note thc-sim-aff">{`Some price links are affiliate links: ${niche.site.name} may earn a small commission. `}<a href={th("/affiliate-disclosure")}>Learn more</a></span>}
        </section>}
      </main>
    </div>
  </Shell>;
}

/** PadelRecs' price box: the padel shops (#679 data), in stock and cheapest first. The first in-stock shop is the one filled
 *  button with its own price and currency above it; up to 3 more shops sit under it as quiet links, the rest under "All N
 *  shops". Prices are never converted, so the box says "From" and never "Lowest". Server-rendered, no client code. */
const SHOP_ROWS = 3;
function ShopBox({ offers }: { offers: ShopOffer[] }) {
  const inStock = offers.filter(o => o.inStock), top = inStock[0] ?? null;
  const rest = offers.filter(o => o !== top), listed = rest.slice(0, SHOP_ROWS), more = rest.slice(SHOP_ROWS), day = newestCheck(offers);
  const row = (o: ShopOffer) => <div key={o.href} className="thc-shop2"><strong title={o.shop}>{o.short}</strong>
    <span className="thc-price">{o.inStock ? o.price : "Sold out"}</span><a className="thc-mono" href={o.href} target="_blank" rel={o.rel}>check ↗</a></div>;
  return <section id="buy" className="thc-box1 thc-pbox">
    {top && <><span className="thc-pbox-l">From</span><strong className="thc-pbox-p">{top.price}</strong>
      <span className="thc-pbox-s">{`In stock at ${plural(inStock.length, "shop")}`}</span>
      <a className="thc-cta wide" href={top.href} target="_blank" rel={top.rel}>{`${top.short} ›`}</a></>}
    {!top && <span className="thc-pbox-l">Sold out at every shop listed</span>}
    {listed.length > 0 && <div className="thc-pbox-list">{listed.map(row)}</div>}
    {more.length > 0 && <details className="thc-pbox-more"><summary>{`All ${offers.length} shops`}</summary><div className="thc-pbox-list">{more.map(row)}</div></details>}
    <span className="thc-note">{`${day ? `Checked ${day}. ` : ""}Each shop's own price and currency; shipping varies.${offers.some(o => o.affiliate) ? " Some links are affiliate links." : ""}`}</span>
  </section>;
}

type Wrapup = { paras: string[]; highlights: { text: string; tone: "pos" | "neg" }[] };

/** "In more detail" (pilot, owner OK 2026-11-23): 2-3 sentences on what the counts and tags can't show (who it suits, where
 *  the mixed takes come from, what it's compared with), written from all the reviews and checked by a second reader. */
function Wrap({ w, n }: { w: Wrapup; n: number }) {
  const mark = (t: string) => { const out: ReactNode[] = []; let rest = t, k = 0;
    for (;;) { let best = -1, hi = -1;
      w.highlights.forEach((h, i) => { const at = rest.indexOf(h.text); if (at >= 0 && (best < 0 || at < best)) { best = at; hi = i; } });
      if (hi < 0) { out.push(rest); return out; }
      const h = w.highlights[hi];
      out.push(rest.slice(0, best), <mark key={k++} className={h.tone}>{h.text}</mark>);
      rest = rest.slice(best + h.text.length); } };
  // Under The short version title (owner 2026-11-23: one section), above the count boxes and tags.
  return <div className="thc-wrap">
    {w.paras.map((p, i) => <p key={i}>{mark(p)}</p>)}
    <a className="thc-wrap-all" href="#reviews">{`Read all ${n} summaries ↓`}</a>
  </div>;
}

type Roundup = { posts: number; threads: number; at: string | null; headline: string; tags: { tone: "pos" | "neg"; text: string; n: number }[];
  paras: string[]; highlights: { text: string; url: string }[] };

/** "Players on Reddit and forums", written from ALL the paddle's stored Reddit posts (pilot, owner OK 2026-11-23): a
 *  one-line headline, +/- tags each backed by 2+ posts, two short paragraphs (what players agree on, then what they raise
 *  that reviews don't), and 2-4 short real phrases marked with a numbered link to their post. Checked by a second reader. */
function RedditBox({ rd }: { rd: Roundup }) {
  const day = rd.at ? new Date(rd.at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
  // Mark each highlight where it sits in the paragraph, with its source number after it.
  const mark = (t: string) => { const out: ReactNode[] = []; let rest = t, k = 0;
    for (;;) { let best = -1, hi = -1;
      rd.highlights.forEach((h, i) => { const at = rest.indexOf(h.text); if (at >= 0 && (best < 0 || at < best)) { best = at; hi = i; } });
      if (hi < 0) { out.push(rest); return out; }
      const h = rd.highlights[hi];
      out.push(rest.slice(0, best), <mark key={k++}>{h.text}</mark>, <b key={k++} className="thc-num">{hi + 1}</b>);
      rest = rest.slice(best + h.text.length); } };
  return <article className="thc-card thc-rd">
    <div className="thc-card-b">
      <div className="thc-card-top"><span className="thc-av thc-rd-av" aria-hidden="true">r/</span>
        <span className="thc-name">{`${W.People} on Reddit and forums`}</span></div>
      <span className="thc-meta">{`${niche.site.name} summary of ${plural(rd.posts, `${W.person} post`)} in ${plural(rd.threads, "thread")}${day ? ` · ${day}` : ""}`}</span>
      <h3 className="thc-rd-h">{rd.headline}</h3>
      <div className="thc-rd-tags">{rd.tags.map(t => <span key={t.text} className={`thc-rd-tag ${t.tone}`}>
        <i aria-hidden="true">{t.tone === "pos" ? "+" : "−"}</i>{t.text}</span>)}</div>
      {rd.paras.map((p, i) => <p key={i} className="thc-sum">{mark(p)}</p>)}
      <div className="thc-rd-src">{rd.highlights.map((h, i) => <a key={h.url + i} href={h.url} target="_blank" rel="noopener nofollow">
        <strong>{`[${i + 1}]`}</strong><span>{`${threadTitle(h.url) ?? "View the thread"} ↗`}</span></a>)}</div>
    </div>
  </article>;
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
        <span className="thc-name">{`${W.People} on Reddit and forums`}</span></div>
      <span className="thc-meta">{`${niche.site.name} summary of ${plural(items.length, `${W.person} post`)} in ${plural(threads, "thread")}${day ? ` · ${day}` : ""}`}</span>
      <h3 className="thc-rd-h">{head}</h3>
      {paras.map((ps, k) => <p key={k} className="thc-sum">{ps.map(c => { const n = items.indexOf(c) + 1;
        return <span key={c.id}>{marked(c)}<b className="thc-num">{n}</b>{" "}</span>; })}</p>)}
      <div className="thc-rd-src">{items.map((c, i) => c.url && <a key={c.id} href={c.url} target="_blank" rel="noopener nofollow">
        <strong>{`[${i + 1}]`}</strong><span><b>{c.who}</b>{` · ${c.thread ?? threadTitle(c.url) ?? "View the thread"} ↗`}</span></a>)}</div>
    </div>
  </article>;
}
