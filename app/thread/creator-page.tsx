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
import { racketData, type RvCard } from "./racket-data";
import { threadRows, skinOf, traitCounts, traitGroup } from "./data";
import { styleTag, reviewerLean, voteLean, levelTag } from "../../lib/thread/style-tag";
import { plural } from "./ui";
import { niche } from "../../lib/niche";
import { withoutYear } from "../../lib/brand-name";
import { oneShape } from "../../lib/thread/shape";
import { amazonButton } from "../../lib/amazon-offer";
import { amazonPhoto } from "../../lib/amazon-photos";
import { websiteButton } from "../../lib/product-links";
import { JsonLd, crumbs } from "./seo";
import { catalogLabel, catalogPath, productHref } from "../../lib/niche";
import { STANCE_LABEL, lowestOffer, shortShop, usd, reviewLists, cardList, agreeChips, stanceLine, stanceCounts, howItPlays, howMinFor, langCode, platform, scoreText, takeaway,
  wordTone, howTitleFor, attrSummary, type AttrKey, type CreatorReview, type CreatorPage, type ReviewEntry } from "../../lib/thread/creators";
import { LaptopFitCard } from "./live/laptop-match";
import { NewerVersion } from "./newer-version";
import { padelListData } from "./padel-list-data";
import { configAxisFor, configCell, configSite, textSlugs } from "../../lib/thread/creator-config";
import { creatorPage, creatorSlugs, creatorHome, thinCreatorPage } from "../../lib/thread/creator-data";
import { threadTitle } from "../../lib/thread/web-sources";
import roundups from "../../db/creators/reddit-roundups.json";
import wrapups from "../../db/creators/reviewer-wrapups.json";
import tldrs from "../../db/creators/tldrs.json";
import aliases from "../../db/creators/aliases.json";
import bestFor from "../../db/creators/best-for.json";
import { expertPicks, outletKey, placeText, badgeOf, picksSummary, type ShownPick } from "../../lib/thread/expert-lists";
import { creatorPageFor, CREATOR_VIEW, CREATOR_MIN_REVIEWS, creatorPageOn, creatorPlainSite, thinCreatorPageOn } from "../../lib/thread/sites";
import { Avatar, CreatorReviews } from "./live/creator-reviews";
import { MentionsProvider, MentionText, type MentionTarget } from "./live/mention-links";
import padelMentions from "../../db/creators/padel-mentions.json";
import { selfFamily, yearContext, type MentionYears } from "../../lib/thread/mention-years";
import { mentionIndex, namedIds, selfRefKeys, type MentionAliases } from "../../lib/thread/mention-links";
import { Comments } from "./live/comments";
import { th } from "../../lib/thread/look";
import { PollCard } from "./live/racket-v7b";
import { CompactFit } from "./live/creator-fit";
import { SkinCompactFit } from "./live/skin-match";
import { playersWord } from "../../lib/thread/web-sources";
import { StickyPrice } from "./live/sticky-price";
import { GlanceTable } from "./live/glance-table";
import { TraitVotes } from "./live/trait-votes";
import { traitSeed } from "../../lib/thread/trait-seed";
import { creatorVoteGroups } from "../../lib/thread/creator-votes";
import { siteSentiment } from "../../lib/thread/site-sentiment";
import { W } from "../../lib/thread/words";
import { mentions } from "../../lib/thread/mentions";
import { padelOffers, newestCheck, type ShopOffer } from "../../lib/padel-offers";
import { storiesSite, VOTE_SOURCE_NOTE } from "../../lib/thread/sites";
import { specPills } from "../../lib/thread/spec-pills";
import { racketStories } from "./stories-data";
import { MemberMark } from "./live/member-mark";
import { reviewerHrefs } from "./reviewers-data";
import "./creators.css";



/** "YouTube, TikTok and blogs": the sources these reviews come from, in that order. */
const sourceList = (rs: { kind: string }[]) => { const k = new Set(rs.map(r => r.kind));
  const l = [k.has("youtube") && "YouTube", k.has("tiktok") && "TikTok", k.has("blog") && "blogs"].filter((x): x is string => !!x);
  return l.length > 1 ? `${l.slice(0, -1).join(", ")} and ${l.at(-1)}` : l[0] ?? "reviewers"; };
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
/** The fewest stored Reddit posts a paddle needs before either Reddit box shows (owner via PM 2026-11-24: "about 5"). */
export const REDDIT_MIN_POSTS = 5;
/** SkinRecs (owner "Yes, Skin next" 2026-11-23): the same page in its own soft look (creators.css .th-skin block), its own
 *  tags, fit check (the skin engine, as on its product page) and vote groups (lib/thread/creator-votes.ts). */
const SKIN = niche.id === "skin";
/** LaptopRecs (2026-11-24): the creator page on a site that is not a Thread site, so without the Thread-only parts (the fit
 *  check runs on the padel-style engine, the vote boxes and the discussion on Thread tables). Its reviews carry the config
 *  each reviewer tested (lib/thread/creator-config.ts): a "Reviewed: ..." line per card, config chips, a Config column. */
const PLAIN = creatorPlainSite(niche.id);
/** LaptopRecs on the Thread pages (2026-11-24): its own fit check (live/laptop-match.tsx) in place of the padel-style one. */
const LT = niche.id === "laptop";
const CONFIGS = configSite(niche.id);
/** PadelRecs (2026-11-24, onto this page from its v7b racket page): the padel shops' own prices in the price box (lib/padel-offers.ts, from
 *  padelrecs.creator_prices since 2026-11-26), the Follow button in the head and the member stories that name the racket. */
const PADEL = niche.id === "padel";
/** The shown name: PadelRecs keeps the model year in brackets ("Bullpadel Vertex 05 (2026)", owner 2026-11-25, as on its
 *  other pages, padel-list named()); the other sites drop it (one row per model, no years in their names). */
const shown = (name: string, year?: number | null) => { const b = withoutYear(name); return PADEL && year && b !== name ? `${b} (${year})` : PADEL ? name : b; };

/** The older YouTube summaries (the earlier lane's web reviews, one per channel, racketData cards) as review cards on a thin
 *  page (owner 2026-11-27: "dont hide them"). Same card look; never counted as reviews (no TL;DR, table or count uses them).
 *  A video that already has a checked creator review on this product is left out (db/data.ts drops those rows too). */
function oldYouTubeCards(cards: RvCard[], have: ReviewEntry[]): ReviewEntry[] {
  const seen = new Set(have.map(x => x.video).filter(Boolean));
  const stance = (v: RvCard["verdict"]) => v === "positive" ? "pos" : v === "negative" ? "neg" : "mix";
  return cards.filter(c => c.kind === "youtube" && c.url && !(c.video && seen.has(c.video))).map(c => ({
    id: c.id, creator: c.who, kind: "youtube", type: "review", url: c.url!, channel: c.url!, lang: "en", date: c.at, video: c.video,
    len: c.len ?? null, chapters: c.chips ?? [], quote: null, quoteAt: null, stance: stance(c.verdict), summary: c.text, more: null,
    highlights: [], short: c.text, keyPoint: null, attrs: {}, score: null, measured: {}, alsoUrl: null, version: null, note: null,
    tie: null, stood: null, trade: null, compared: null }));
}

/** The creator page for one product, or null when it has no creator data (the caller then shows the usual page). */
export async function CreatorProductBody({ slug }: { slug: string }) {
  const [page0, d] = await Promise.all([creatorPage(niche.id, slug), racketData(slug)]);
  // Thin pages (lib/thread/sites.ts THIN_CREATOR_PAGE): a live product without a creator page still gets this design, with
  // the reviews and prices it has (lib/thread/creator-data.ts thinCreatorPage).
  const THIN_ON = thinCreatorPageOn(niche.id);
  const page: CreatorPage | null = page0 ?? (THIN_ON && d ? await thinCreatorPage(niche.id, slug) : null);
  if (!page || !d) return null;
  // Reviews include the TikTok takes (owner 2026-11-22): `rs` counts one per reviewer, `feed` holds every card.
  // Paddle page v3 (owner handoff 2026-11-26: every review count on the page agrees): one card per counted review, a TikTok
  // channel's older takes linked from its newest card (lib/thread/creators.ts cardList).
  const { counted: rs } = reviewLists(page), feed0 = cardList(page);
  // Best for, per review (db/creators/best-for.json): written from what each reviewer says the paddle suits.
  const bf = (bestFor as Record<string, Record<string, { who: string; why: string }>>)[niche.id] ?? {};
  // Expert "best X" lists (owner 2026-11-26, lib/thread/expert-lists.ts): where the outlet's full review is a card here, the
  // card carries its place as a badge; the other outlets go in the small "Picked in expert lists" box.
  const picks = expertPicks(niche.id, slug), byOutlet = new Map(picks.map(p => [outletKey(p.l.outlet), p]));
  const carded = new Set<string>();
  const feed = feed0.map(x => { const p = byOutlet.get(outletKey(x.creator)); if (p) carded.add(outletKey(x.creator));
    const y = bf[x.id] ? { ...x, bestFor: bf[x.id] } : x; return p ? { ...y, badge: p.label ? `${p.label} · ${p.l.title}` : placeText(p) } : y; });
  const listPicks = picks.filter(p => !carded.has(outletKey(p.l.outlet)));
  // Under CREATOR_MIN_REVIEWS reviews the product keeps its usual page, or (THIN_CREATOR_PAGE sites) gets the thin version
  // of this one: no TL;DR, no consensus, no at-a-glance table, only the cards it has.
  const thin = rs.length < CREATOR_MIN_REVIEWS;
  if (thin && !THIN_ON) return null;
  const { r, row, brand, style, sim, cards } = d;
  // Thin pages also show the older YouTube summaries as cards (oldYouTubeCards), after the checked reviews.
  // A creator with their own page (5+ reviews, lib/thread/reviewers.ts) links there by name; the rest keep the channel link.
  const profiles = await reviewerHrefs();
  const shownFeed = (thin ? [...feed, ...oldYouTubeCards(cards, feed)] : feed).map(x => { const p = profiles.get(x.creator); return p ? { ...x, profile: p.href, avatar: p.avatar } : x; });
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
  // LaptopRecs' fit check: the laptops of this one's category (padelListData's quick match inputs).
  const ltWire = LT ? ((await padelListData()).laptop ?? []).filter(w => w.category === r.shape && (w.id === r.id || rowMap.get(w.id)?.current !== false)) : [];
  const ltLinks = Object.fromEntries(ltWire.flatMap(w => { const t = rowMap.get(w.id); return t ? [[w.id, { name: t.name, href: t.href }]] : []; }));
  const sims = sim.filter(x => x.id !== r.id && x.current !== false);
  for (const s of Object.keys(staged).sort((a, b) => Number(bySlug.get(b)?.shape === r.shape) - Number(bySlug.get(a)?.shape === r.shape))) {
    if (sims.length >= 4) break;
    // Current models only here too (Grok audit 2026-11-24, PickleballRecs; LaptopRecs: current generations).
    const x = bySlug.get(s); if (x && x.id !== r.id && !sims.some(y => y.id === x.id) && (!LT || x.current) && (niche.id !== "pickleball" || x.current !== false)) sims.push(x);
  }
  // Paddle page v3: the paddles the reviews mention lead Similar paddles (the separate "mentioned" box is gone), each with
  // a "Mentioned in N reviews" tag; the product page's similar list fills the rest. Current models only.
  const menN = new Map(mentions(rs, LT ? allRows.filter(x => x.current) : allRows, r.id).map(m => [m.row.id, m.n]));
  const menRows = [...menN.keys()].map(id => allRows.find(x => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x && x.id !== r.id && x.current !== false && (!LT || !!x.current))
    .sort((a, b) => (menN.get(b.id) ?? 0) - (menN.get(a.id) ?? 0));
  const simRows = [...menRows, ...sims.filter(x => !menN.has(x.id))];
  const similar = simRows.slice(0, 4).map(x => { const p = staged[x.slug];
    return { x, href: !creatorPageOn(niche.id) && creatorPageFor(niche.id, x.slug) ? `${x.href}?view=${CREATOR_VIEW}` : x.href,
      pos: x.pos, mix: x.mix, neg: x.neg, unit: W.people, men: menN.get(x.id) ?? 0,
      price: p?.price ? { label: `from ${usd(p.price.usd)} · check price ↗`, url: p.price.url, rel: p.price.affiliate ? "sponsored nofollow noopener" : "nofollow noopener" } : null }; });
  // "Players on Reddit and forums" (the mock's roundup card): the live page's Reddit summaries for this paddle, as one card in
  // the feed. Never counted as a review (not in N reviews, the table or the sentiment bar). Real short quotes only.
  // Either Reddit box only from REDDIT_MIN_POSTS or more stored posts (Grok audit 2026-11-24: a box built from one post read
  // "Players are split on it", and that one post was about another paddle).
  const redditPosts = ctx ? ctx.data.external.filter(e => e.racketId === r.id && e.sourcePlatform === "Reddit").length : 0;
  const enoughReddit = redditPosts >= REDDIT_MIN_POSTS;
  const reddit = enoughReddit ? cards.filter(c => c.kind === "reddit").slice(0, 6) : [];
  // The written roundup of ALL the paddle's Reddit posts (pilot 2026-11-23, db/creators/reddit-roundups.json), where one exists.
  const siteWraps = (wrapups as Record<string, Record<string, Wrapup>>)[niche.id];
  const wrap = textKeys.map(k => siteWraps?.[k]).find(Boolean) ?? null;
  const rd = enoughReddit ? (roundups as Record<string, Record<string, Roundup>>)[niche.id]?.[slug] ?? null : null;
  const name = shown(row?.name ?? r.name, r.year);
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
  // SkinRecs and PickleballRecs (owner 2026-11-25): Amazon is the site's only affiliate, so its button always leads, whatever
  // the other shops charge: Amazon's own in-stock offer when the sweep has one, else the Amazon link (the product, or a search
  // for its name). The other shops stay listed under it.
  const amazonFirst = (SKIN || niche.id === "pickleball") && shop?.where === "Amazon";
  const top = amazonFirst ? offers.find(o => o.shop === "Amazon" && o.inStock) ?? null
    : low ? low.shops.find(o => o.shop === "Amazon" || o.affiliate) ?? low.shops[0]! : null;
  const cta = top ? { url: top.url, rel: relOf(top.affiliate || top.shop === "Amazon") } : shop;
  const ctaText = top ? `${shortShop(top.shop)} ›` : (SKIN || amazonFirst) && shop ? `${shop.where} ›` : "Check price ↗";
  const how = howItPlays(rs, howMinFor(niche.id)), agree = agreeChips(rs);
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
  // The sticky bar's price and button: the head's own (padel's first in-stock shop, else the lowest price and the CTA).
  const padelTop = shops.find(o => o.inStock) ?? null;
  const stick = shops.length > 0 ? padelTop ? { price: padelTop.price, word: "from", cta: { url: padelTop.href, rel: padelTop.rel, text: `${padelTop.short} ›` } } : null
    : cta ? { price: low ? usd(low.price) : null, word: "lowest", cta: { url: cta.url, rel: cta.rel, text: ctaText } } : null;
  // The review sources line ("11 YouTube reviews · 5 blog reviews · 2 TikToks"), from the counted reviews.
  const srcN = { youtube: rs.filter(x => x.kind === "youtube").length, blog: rs.filter(x => x.kind === "blog").length, tiktok: rs.filter(x => x.kind === "tiktok").length };

  // The Hybrid v19 head (owner "exactly this mockup", 2026-11-22): tags, the TL;DR with one + and one - point, the praise
  // pill, the site's own vote bar; the fit check and a small Where to buy on the right.
  // The level tag from the catalogue's "best for" line: its first part, "intermediate → advanced" as "Intermediate to advanced".
  // PickleballRecs (Grok audit 2026-11-24): the style tag agrees with this page's creator reviews or is left out
  // (lib/thread/style-tag.ts), and the level tag shows a level only, never "Control players".
  const PB = niche.id === "pickleball";
  const shownStyle = PB ? styleTag(style, reviewerLean(attrSummary(rs, "power" as AttrKey), attrSummary(rs, "control" as AttrKey)),
    voteLean(traitGroup(await traitCounts(), r.id, "plays_like"))) : style;
  const level = PB ? levelTag(row?.best) : row?.best?.split(",")[0]?.replace(/\s*(→|->)\s*/g, " to ").trim() ?? null;
  const tags = (SKIN ? [r.shape, skinAttrs?.facts.fragrance_free === "free" ? "Fragrance free" : null, skinTex ? `${skinTex} texture` : null]
    : PLAIN || LT ? [r.shape]
    : [shownStyle ? STYLE_WORD[shownStyle] : null, row?.feel ? `${row.feel} feel` : null, level ? `${level[0]!.toUpperCase()}${level.slice(1)}` : null]).filter((x): x is string => !!x);
  // The catalogue's specs as a plain grey line under the tags (owner 2026-11-24, padel and pickleball).
  const specs = specPills(niche.id, r);
  // Two + points and one - point (owner 2026-11-22), the likes and concerns backed by 2+ reviews.
  const plus = agree.likes.slice(0, 2), minus = agree.concerns[0] ?? null;
  // Up to 3 shops (SkinRecs 4, owner 2026-11-23: "show few stores") in the price box.
  const n = stanceCounts(rs), buy = offers.filter(o => o.inStock).slice(0, SKIN ? 4 : 3);
  // The button's own shop is left out of the list under it; "In stock at N shops" still counts it.
  const listed = buy.filter(o => !(top && o.url === top.url));
  // Amazon's price carries its "as of" time (Amazon's rule), from the daily price job.
  const amzRow = buy.find(o => o.shop === "Amazon" && o.checkedAt);
  const amazonAsOf = amzRow ? new Date(amzRow.checkedAt!).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }) : null;

  // LaptopRecs: only current models are named or linked (older generations never list, lib/thread/laptop-lines.ts).
  const listRows = LT ? allRows.filter(x => x.current) : allRows;
  // Paddle mentions as links in the review cards (owner 2026-11-23): the catalogue's unique names, only the ones these
  // reviews use (and this paddle's own, which claims its text but never links) go to the browser.
  // PadelRecs (owner 2026-11-24): one catalogue row per model year, so names resolve by this racket's season first
  // (lib/thread/mention-years.ts, db/creators/padel-mentions.json); the TL;DR and In more detail link too.
  const yc = PADEL ? yearContext(allRows, slug, r.year ?? new Date().getUTCFullYear(), padelMentions as unknown as MentionYears) : null;
  const mxAll = yc ? [...mentionIndex(yc.rows, yc.extra, allRows), ...selfRefKeys(allRows.find(x => x.slug === slug)!, selfFamily(allRows, slug, padelMentions as unknown as MentionYears))] : mentionIndex(listRows, (aliases as unknown as Record<string, MentionAliases>)[niche.id] ?? {});
  const mxIds = namedIds([...feed.flatMap(x => [x.summary, x.more, x.compared]), ...(yc ? [tldr, ...(wrap?.paras ?? [])] : [])], mxAll, r.id);
  const mxIndex = mxAll.filter(k => k.id === r.id || mxIds.includes(k.id));
  const mxTargets: Record<string, MentionTarget> = Object.fromEntries(mxIds.flatMap(id => { const x = allRows.find(y => y.id === id); if (!x) return [];
    const votes = x.pos + x.mix + x.neg;
    return [[id, { id, slug: x.slug, name: shown(x.name, x.year), href: th(x.href), pic: x.pic ?? null, loved: votes ? Math.round(100 * x.pos / votes) : null, votes,
      price: staged[x.slug]?.price?.usd ?? null }]]; }));
  const mxProps = { index: mxIndex, targets: mxTargets, selfId: r.id, selfSlug: slug, unit: W.people, noun: niche.words.one };

  return <Shell active="rackets">
    <JsonLd data={ld}/>
    {/* The mock's third font (README tokens): JetBrains Mono for the small "check price ↗" links, this page only. */}
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap" precedence="default"/>
    {/* SkinRecs header 4a (owner handoff 2026-11-23): Inter 800 for the name, Barlow Condensed 800 for TL;DR and the price. */}
    {SKIN && <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Barlow+Condensed:wght@800&display=swap" precedence="default"/>}
    <div className="thc thc-v19">
      {/* Head (owner mock 2026-11-23): photo · name, tags, TL;DR with ✓ and ✗ points, the players' vote box · the price box. */}
      {/* Header 4a (owner handoffs 2026-11-23, skin then pickleball): one outlined panel, photo / main / prices columns (creators.css .thc-hd4). */}
      <header id="thc-top" className="thc-head thc-hd3 thc-hd4">
        <div className="thc-photo">{pic ? <img src={pic} alt={name}/> : <span className="th-ph" aria-hidden="true"/>}</div>
        <div className="thc-head-m">
          <h1>{name}</h1>
          {tags.length > 0 && <span className="thc-tags">{tags.map((t, k) => <span key={t} className={k === 0 && (shownStyle || SKIN) ? "on" : undefined}>{t}</span>)}</span>}
          {/* The catalogue's specs as one plain grey line under the tags (owner 2026-11-24: pills were too busy). */}
          {specs.length > 0 && <span className="thc-specline">{specs.join(" · ")}</span>}
          {/* A previous model says so and links the one that replaced it (Grok audit 2026-11-24, PickleballRecs). */}
          {row?.newer && <span className="thc-specline">{"Previous model. Replaced by the "}<a href={th(row.newer.href)}>{withoutYear(row.newer.name)}</a>{"."}</span>}
          {/* LaptopRecs: an older generation links to the newest of its line (app/thread/newer-version.tsx). */}
          {LT && <NewerVersion slug={slug} className="thc-newer"/>}
          {!thin && (tldr || plus.length > 0 || minus) && <div className="thc-tldr">
            <span className="thc-tldr-h"><b>TL;DR</b><span>{`From ${plural(rs.length, "review")}`}</span></span>
            {tldr && <span className="thc-tldr-t">{yc ? <MentionsProvider {...mxProps}><MentionText text={tldr}/></MentionsProvider> : tldr}</span>}
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
            {cta && <a className="thc-cta wide" href={cta.url} target="_blank" rel={cta.rel}>{ctaText}</a>}
            {/* The affiliate note under the shop button (owner 2026-11-23), linking to the site's disclosure page. */}
            {/* Every site (owner 2026-11-23: "place affiliate note below any amazon link"); skin also names the shop otherwise. */}
            {(!low || (amazonFirst && !top)) && shop && (SKIN || shop.rel.includes("sponsored")) && <span className="thc-pbox-on">{shop.rel.includes("sponsored")
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
        : PLAIN ? null : LT ? ltWire.length > 0 && <div className="thc-fitrow"><LaptopFitCard id={r.id} wire={ltWire} links={ltLinks} compact/></div>
        : <div className="thc-fitrow"><CompactFit id={r.id} title={`Is this ${niche.words.one} right for me?`} sub="Pick your level and style" bar/></div>}
      <div className="thc-rule"/>
      {/* The quiet sticky price bar (paddle page v3): the same price and button as the head, once the head is off screen. */}
      {stick && <StickyPrice name={name} pic={pic} price={stick.price} priceWord={stick.word} cta={stick.cta}/>}

      <main className="thc-body">
        {/* From players (paddle page v3): what players say on Reddit and forums, and the site's own vote, side by side. */}
        {(!PLAIN || rd || reddit.length > 0) && <div className="thc-sech">
          <h2>{`From ${W.people}`}</h2>
          <span>{rd || reddit.length > 0 ? `What ${W.people} say on Reddit and forums${PLAIN ? "." : `, and how ${niche.site.name} ${W.people} vote.`}` : `How ${niche.site.name} ${W.people} vote.`}</span>
        </div>}
        {/* LaptopRecs: the Reddit card alone, when there is one (no vote boxes there). */}
        {PLAIN ? (rd || reddit.length > 0) && <div className="thc-duo one">{rd ? <RedditBox rd={rd}/> : <RedditRoundup items={reddit}/>}</div>
        : <div className={`thc-duo${rd || reddit.length ? "" : " one"}`}>
          {rd ? <RedditBox rd={rd}/> : reddit.length > 0 && <RedditRoundup items={reddit}/>}
          {/* Played it? Vote and rate it: the would-you-buy-it-again bars and the site's vote boxes (lib/thread/creator-votes.ts;
              PickleballRecs four), the stored votes loading live, one tap, no account. */}
          <section id="vote" className="thc-box1 thc-vote">
            <PollCard id={r.id} reviews={{ positive: row?.pos ?? 0, mixed: row?.mix ?? 0, negative: row?.neg ?? 0 }} question={SKIN ? "Tried it? Vote and rate it." : LT ? `${W.usedIt} Vote and rate it.` : "Played it? Vote and rate it."} countLine/>
            {voteGroups.length > 0 && <TraitVotes id={r.id} seed={traitSeed(niche.id, r.id)} groups={voteGroups} title={W.traitsTitle} tieNone {...(SKIN ? { of: d.judged } : {})}/>}
            {VOTE_SOURCE_NOTE[niche.id] && <p className="thc-vote-note">{VOTE_SOURCE_NOTE[niche.id]}</p>}
          </section>
        </div>}

        {/* Reviews from around the web: the heading and where the reviews come from (the counted reviews, so the parts add
            up to every other "N reviews" on the page). */}
        <div className="thc-web">
          <h2>Reviews from around the web</h2>
          <span className="thc-srcs">{([["youtube", srcN.youtube, plural(srcN.youtube, "YouTube review")], ["blog", srcN.blog, plural(srcN.blog, "blog review")],
            ["tiktok", srcN.tiktok, plural(srcN.tiktok, "TikTok")]] as const).filter(x => x[1] > 0).map(([k, , t], i) => <Fragment key={k}>
            {i > 0 && <span className="thc-srcs-dot" aria-hidden="true">·</span>}
            <span>{k === "youtube" ? <span className="thc-yt" aria-hidden="true"/> : k === "blog" ? <span className="thc-blog-ic" aria-hidden="true"/> : <span className="thc-tt-i" aria-hidden="true">♪</span>}{t}</span></Fragment>)}</span>
        </div>

        {/* Review consensus (paddle page v3, in place of The short version and How it plays): the written wrap-up with its
            yellow (pros) and pink (cons) marks, or the stance lines where none is written; the takes and their bar; How it
            plays in words along the bottom. No +/- lines here (the TL;DR has them). */}
        {thin ? shownFeed.length === 0 && <p className="thc-none thc-thin-empty">{`No ${niche.words.one} reviews summarized here yet.`}</p>
        : <section id="sentiment" className="thc-box1 flush thc-cons">
          <div className="thc-cons-top">
            <div className="thc-cons-l">
              <strong className="thc-cons-t">Review consensus</strong>
              {wrap ? (yc ? <MentionsProvider {...mxProps}><Wrap w={wrap} links/></MentionsProvider> : <Wrap w={wrap}/>)
                : <div className="thc-wrap">{KEYS.filter(k => n[k] > 0).map(k => <p key={k}><strong>{`${STANCE_LABEL[k]}. `}</strong>{page.groups[k] || stanceLine(rs, k)}</p>)}</div>}
            </div>
            <div className="thc-cons-r">
              <span className="thc-cons-n"><span className="pos">{`${n.pos} loved it`}</span><span className="mix">{`${n.mix} mixed`}</span><span className="neg">{`${n.neg} not for me`}</span></span>
              <span className="thc-vbar" aria-hidden="true">{KEYS.map(k => n[k] > 0 && <i key={k} className={k} style={{ flex: n[k] }}/>)}</span>
              <a className="thc-wrap-all" href="#reviews">{`Read all ${rs.length} summaries ↓`}</a>
            </div>
          </div>
          {how.length > 0 && <div className="thc-cons-g" aria-label={howTitleFor(niche.id)}>{how.map(h => <span key={h.k} title={h.line}>
            <span>{h.label}</span><strong className={h.word ? wordTone(h.word) : "none"}>{h.word ?? "–"}</strong></span>)}</div>}
        </section>}

        {/* Picked in expert lists (owner mockup 2026-11-26): under the consensus, above the table. */}
        {listPicks.length > 0 && <ExpertPicks picks={listPicks}/>}

        {/* N reviews at a glance: three rows, then Show all N (live/glance-table.tsx). */}
        {!thin && <GlanceTable title={`${plural(rs.length, "review")} at a glance`} sub="Tap a row to jump to the full summary"
          head={<div className={`thc-g-row thc-g-head${CONFIGS ? " cfg" : ""}`}><span>Reviewer</span><span>Take</span>{CONFIGS && <span className="cfg-l">Config</span>}<span className="kp">Key point</span></div>}
          rows={glance.map(gRow)}/>}

        <MentionsProvider {...mxProps}>
          {shownFeed.length > 0 && <CreatorReviews reviews={shownFeed} count={rs.length} roundup={null} {...(CONFIGS ? { configs: true, axis: configAxisFor(niche.id, slug) } : {})}/>}
        </MentionsProvider>

        {/* PadelRecs' member stories that name this racket (the pilot), as on its v7b racket page. */}
        {tales.length > 0 && <section className="thc-sec2">
          <div className="thc-sec2-h"><h2>{`Stories with the ${name}`}</h2><a href={th("/stories")}>All stories →</a></div>
          <ul className="th-stories sm">{tales.map(t => <li key={t.id}><a className="th-story-t" href={th(`/stories/${t.slug}`)}>{t.title}</a>
            <span className="th-story-by"><strong>{t.author.name}</strong><MemberMark/></span></li>)}</ul>
        </section>}

        {/* Similar paddles, above the comments now (paddle page v3): the ones reviewers mention first, tagged. */}
        {similar.length > 0 && <section className="thc-sec2">
          <div className="thc-sec2-h"><h2>{`Similar ${niche.words.many}`}</h2>
            {brand && <a href={th(`/brands/${brand.slug}`)}>{`All ${brand.name} ${niche.words.many} →`}</a>}</div>
          <div className="thc-sim">{similar.map(({ x, href, pos, mix, neg, unit, price, men }) => { const t = pos + mix + neg;
            return <div key={x.id} className="thc-sim-c">
              <a className="thc-sim-ph" href={th(href)} tabIndex={-1} aria-hidden="true">{x.pic ? <img src={x.pic} alt={x.name} loading="lazy"/> : null}</a>
              <a className="thc-sim-n" href={th(href)}>{shown(x.name, x.year)}</a>
              {(x.line || x.best) && <span className="thc-sim-l">{x.line ?? `Best for ${x.best}.`}</span>}
              {men > 0 && <span className="thc-sim-men">{`Mentioned in ${plural(men, "review")}`}</span>}
              {t > 0 && <span className="thc-sim-s"><span className="thc-sim-bar" aria-hidden="true"><i className="pos" style={{ flex: pos }}/><i className="mix" style={{ flex: mix }}/><i className="neg" style={{ flex: neg }}/></span>
                <span>{`${pos} of ${t} ${unit} loved it`}</span></span>}
              <span className="thc-sim-f">{price ? <a className="thc-mono" href={price.url} target="_blank" rel={price.rel}>{price.label}</a>
                : <a href={th(href)}>{`See the ${niche.words.one} →`}</a>}</span>
            </div>; })}</div>
          {/* Under any affiliate price link here too (owner 2026-11-23). */}
          {similar.some(x => x.price?.rel.includes("sponsored")) && <span className="thc-note thc-sim-aff">{`Some price links are affiliate links: ${niche.site.name} may earn a small commission. `}<a href={th("/affiliate-disclosure")}>Learn more</a></span>}
        </section>}

        {/* Comments (the mock's last section): the site's own discussion for this paddle, the same thread as its product page. */}
        {!PLAIN && <section className="thc-sec2 thc-comments"><Comments page={`racket:${r.id}`} title="Discussion" avatars nicknames={niche.form.quickVote?.nicknames ?? []}/></section>}
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
function Wrap({ w, links = false }: { w: Wrapup; /** PadelRecs: racket names in the plain text link. */ links?: boolean }) {
  let pk = 0;
  const plain = (t: string): ReactNode => links && t ? <MentionText key={`t${pk++}`} text={t}/> : t;
  const mark = (t: string) => { const out: ReactNode[] = []; let rest = t, k = 0;
    for (;;) { let best = -1, hi = -1;
      w.highlights.forEach((h, i) => { const at = rest.indexOf(h.text); if (at >= 0 && (best < 0 || at < best)) { best = at; hi = i; } });
      if (hi < 0) { out.push(plain(rest)); return out; }
      const h = w.highlights[hi];
      out.push(plain(rest.slice(0, best)), <mark key={k++} className={h.tone}>{h.text}</mark>);
      rest = rest.slice(best + h.text.length); } };
  // Under The short version title (owner 2026-11-23: one section), above the count boxes and tags.
  return <div className="thc-wrap">
    {w.paras.map((p, i) => <p key={i}>{mark(p)}</p>)}
  </div>;
}

// No post or thread counts (owner 2026-11-24, every site): the box says "summary of player posts", never how many.
type Roundup = { at: string | null; headline: string; tags: { tone: "pos" | "neg"; text: string; n?: number }[];
  paras: string[]; highlights: { text: string; url: string }[] };

/** "Players on Reddit and forums", written from ALL the paddle's stored Reddit posts (pilot, owner OK 2026-11-23): a
 *  one-line headline, +/- tags each backed by 2+ posts, two short paragraphs (what players agree on, then what they raise
 *  that reviews don't), and 2-4 short real phrases marked with a numbered link to their post. Checked by a second reader. */
/** "Picked in expert lists" (owner mockup 2026-11-26: the full-width rows took too much room): a two-column grid of compact
 *  cards (one column on phones). Each card: a square badge with the place or award (lib/thread/expert-lists.ts badgeOf), the
 *  outlet, Watch or Read, a grey line with the award or the list's name, and one short reason. Six shown, the rest behind
 *  Show all N (a details box, no script). Server-rendered. */
const XP_FIRST = 6;
function ExpertPicks({ picks }: { picks: ShownPick[] }) {
  const card = (p: ShownPick) => { const b = badgeOf(p);
    return <li key={p.l.url + p.list} className="thc-xp-c">
      <span className={`thc-xp-b ${b.tone}${b.text.length > 3 ? " word" : ""}`} title={placeText(p)}>{b.text}</span>
      <span className="thc-xp-m">
        <span className="thc-xp-top"><strong>{p.l.outlet}</strong>
          <a className="thc-mono" href={p.l.url} target="_blank" rel="nofollow noopener">{`${p.l.platform === "youtube" ? "Watch" : "Read"} ↗`}</a></span>
        <span className="thc-xp-sub" title={p.l.title}>{p.label ?? p.l.title}</span>
        <span className="thc-xp-r">{p.reason}</span>
      </span>
    </li>; };
  return <section id="expert-lists" className="thc-box1 thc-xp">
    <div className="thc-h"><strong>Picked in expert lists</strong><span>{picksSummary(picks)}</span></div>
    <ul className="thc-xp-g">{picks.slice(0, XP_FIRST).map(card)}</ul>
    {picks.length > XP_FIRST && <details className="thc-xp-more"><summary>{`Show all ${picks.length}`}</summary><ul className="thc-xp-g">{picks.slice(XP_FIRST).map(card)}</ul></details>}
  </section>;
}

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
      <span className="thc-meta">{`${niche.site.name} summary of ${W.person} posts${day ? ` · ${day}` : ""}`}</span>
      <h3 className="thc-rd-h">{rd.headline}</h3>
      <div className="thc-rd-tags">{rd.tags.map(t => <span key={t.text} className={`thc-rd-tag ${t.tone}`}>
        <i aria-hidden="true">{t.tone === "pos" ? "+" : "−"}</i>{t.text}</span>)}</div>
      {rd.paras.map((p, i) => <p key={i} className="thc-sum">{mark(p)}</p>)}
      {rd.highlights.length > 0 && <Sources n={rd.highlights.length}>{rd.highlights.map((h, i) => <a key={h.url + i} href={h.url} target="_blank" rel="noopener nofollow">
        <strong>{`[${i + 1}]`}</strong><span>{`${threadTitle(h.url) ?? "View the thread"} ↗`}</span></a>)}</Sources>}
    </div>
  </article>;
}

/** "Players on Reddit and forums" (Hybrid v19 mockup, owner 2026-11-22: fill the box like the mock). Real data only: the
 *  paddle's Reddit summaries (PickleballRecs summaries of each post). A headline from the posts' own takes, each summary in
 *  full with its short real quote marked and a numbered source chip, then the numbered thread links. Never counted as a review. */
function RedditRoundup({ items }: { items: import("./racket-data").RvCard[] }) {
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
      <span className="thc-meta">{`${niche.site.name} summary of ${W.person} posts${day ? ` · ${day}` : ""}`}</span>
      <h3 className="thc-rd-h">{head}</h3>
      {paras.map((ps, k) => <p key={k} className="thc-sum">{ps.map(c => { const n = items.indexOf(c) + 1;
        return <span key={c.id}>{marked(c)}<b className="thc-num">{n}</b>{" "}</span>; })}</p>)}
      {items.some(c => c.url) && <Sources n={items.filter(c => c.url).length}>{items.map((c, i) => c.url && <a key={c.id} href={c.url} target="_blank" rel="noopener nofollow">
        <strong>{`[${i + 1}]`}</strong><span><b>{c.who}</b>{` · ${c.thread ?? threadTitle(c.url) ?? "View the thread"} ↗`}</span></a>)}</Sources>}
    </div>
  </article>;
}

/** The Reddit box's numbered sources, collapsed behind "N sources ▾" (paddle page v3); a details box, no script. */
function Sources({ n, children }: { n: number; children: ReactNode }) {
  return <details className="thc-rd-more">
    <summary><span className="c">{`${plural(n, "source")} ▾`}</span><span className="o">Hide sources ▴</span></summary>
    <div className="thc-rd-src">{children}</div>
  </details>;
}
