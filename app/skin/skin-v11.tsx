import "../rackets/[slug]/racket-fit.css";
import { NoBreak } from "../no-break";
import "../rackets/[slug]/v11.css";
import "../review-card.css";
import "./skin-product.css";
import "./skin-v11.css";
import Link from "next/link";
import { skinContext } from "./context";
import { wireOf } from "./payload";
import type { ProductInput, ItemWire } from "./product-view";
import type { SkinPeers } from "./skin-v11-view";
import { skinPage, sourceKinds, type SkinItem } from "../../lib/skin-page";
import { SkinV11Live } from "./skin-v11-live";
import { SKIN_TYPES, type SkinChoice } from "../../lib/skin-choice";
import { niche, catalogPath, productHref, typePageFor } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { shortLine } from "../../lib/short-lines";
import { voiceTagline } from "../../lib/voice-taglines";
import { listLine } from "../../lib/list-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { listShopLink } from "../../lib/amazon-offer";
import { onePerChannel, videoOf } from "../../lib/youtube-pick";
import { plainSummary } from "../../lib/plain-summary";
import { isComplete } from "../../lib/complete-text";
import { expertLine } from "../../lib/similar-picks";
import RacketReviews, { type ReviewCard } from "../rackets/[slug]/racket-reviews";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { V2Footer } from "../v2-footer";
import { scoreState } from "../../lib/score-view";
import { scoreTone } from "../../lib/score-tone";
import { insideOf, routineOf } from "../../lib/skin-inside";
import { rankedLists, listHref } from "../rankings/lists";
import { listYear } from "../../lib/top-lists";

/** The SkinRecs product page on the shared v11c page (owner 2026-11-18, grok/skin-v11c-mock-prompt.md): padel's v11c order
 *  and section style in the beauty look. 1 hero + skin check, 2 Better matches (under 60%), 3 the bottom line (before an
 *  answer), 4 Why yes / why not, 5 How it feels, What's inside + Where it goes (kept from the skin mock), 6 Other products (2
 *  cards), 7 What people say (the shared reviews section), 8 Still deciding?, 9 Explore the rankings, 10 the footer line.
 *  The skin check, its answers and the cards are worked out in the browser on a tap (skin-v11-live.tsx) from the data sent
 *  here, on the skin match engine (app/skin/rank.ts). Counts live only in the score and reviews rows, never under 5. */
const DAY = 864e5;
function ago(iso?: string | null) {
  if (!iso) return null; const d = Math.max(0, (Date.now() - Date.parse(iso)) / DAY); if (!Number.isFinite(d)) return null;
  return d < 1 ? "today" : d < 30 ? `${Math.floor(d)}d ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
}
/** The date n days back (YYYY-MM-DD), for "new this week". */
const isoDaysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString().slice(0, 10);
const unmd = (t: string) => t.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*\*|__/g, "");
/** Counts under 5 are never shown (owner rule). */
export const HIDE_UNDER = 5;

export default async function SkinV11({ productId, choice, buy, jsonLd }: { productId: string; choice: SkinChoice;
  buy: { url: string; label: string; rel: string } | null; jsonLd: object }) {
  const ctx = await skinContext(), { data } = ctx;
  const r = data.rackets.find(x => x.id === productId)!;
  const brandOf = (x: typeof r) => data.brands.find(b => b.id === x.brandId)?.name;
  const brand = data.brands.find(b => b.id === r.brandId);
  const name = displayName(r.name, brand?.name), title = brand && r.name.startsWith(brand.name) ? r.name.slice(brand.name.length).trim() : r.name;
  const a = ctx.attrs.get(r.id) ?? { scores: {}, facts: {} }, c = ctx.counts.get(r.id) ?? { n: 0, positive: 0, mixed: 0, negative: 0 };
  const photoOf = (x: typeof r) => photoHidden(x) ? null : shopPhoto(x) ?? amazonPhoto(x)?.image ?? null;
  const photo = photoOf(r), rated = c.positive + c.mixed + c.negative, isNew = scoreState(rated) === "new", signal = isNew ? null : ctx.signal(r.id);
  const type = typePageFor(r.shape), here = productHref(r);
  const ff = a.facts.fragrance_free, spf = a.facts.spf, price = typeof a.facts.price === "string" ? a.facts.price : null;
  const content = skinPage(r.slug);
  const firstSentence = (t?: string | null) => t ? t.split(/(?<=\.)\s/)[0] : null;
  // The tagline: the product's short line (as the earlier skin page); its bottom line's first sentence only when it has none.
  // The site-voice tagline leads (owner 2026-11-18, lib/voice-taglines.ts).
  const hook = voiceTagline(r.slug) ?? expertLine(shortLine(r)) ?? expertLine(listLine(r)) ?? expertLine(content?.bottom ? firstSentence(content.bottom) : null) ?? firstSentence(r.reviewSummary);
  // "Tri-Plus" → the short name for "than the …" lines: the product's name without the brand, up to 3 words.
  const ref = (title || name).split(/\s+/).slice(0, 3).join(" ").replace(/[,:]$/, "");

  // ── What the skin check needs in the browser (as the earlier skin page): this product, the others of its type, its written
  // content with each item's kinds of source and its try-instead product.
  const platform = new Map<string, string>([...data.external.map(e => [e.id, e.sourcePlatform] as const), ...data.reviews.map(x => [x.id, "SkinRecs"] as const)]);
  const wire = (it: SkinItem): ItemWire => {
    const alt = it.alt ? data.listed.find(x => x.slug === it.alt!.slug) : undefined;
    return { ...it, proof: sourceKinds(it.src, id => platform.get(id)),
      ...(alt ? { altCard: { name: displayName(alt.name, brandOf(alt)), href: productHref(alt) } } : { alt: undefined }) };
  };
  const peers = data.listed.filter(x => x.shape === r.shape && x.id !== r.id && x.slug !== r.slug && x.name !== r.name);
  const self = wireOf(ctx, [r])[0], peerWire = wireOf(ctx, peers);
  const input: ProductInput = {
    self, peers: peerWire,
    peerCards: Object.fromEntries(peers.map(x => [x.id, { short: displayName(x.name, brandOf(x)).replace(/^(\S+\s\S+\s\S+).*$/, "$1"), photo: photoOf(x), href: productHref(x), total: ctx.counts.get(x.id)?.n ?? 0 }])),
    here, type: type ? { slug: type.slug, label: type.label } : null, catalogPath, many: niche.words.many, counts: c,
    page: content ? { bottom: content.bottom, yes: content.yes.map(wire), no: content.no.map(wire) } : null,
  };

  // ── The other-product cards: every listed product of this type with enough reports to judge (the browser picks 2, or the
  // Better matches). Before an answer: close in feel, never far below this one's score (owner: "if this scores 96, don't
  // suggest a 66"), best liked first.
  const judged = (id: string) => { const k = ctx.counts.get(id); return !!k && k.positive + k.mixed + k.negative >= 10; };
  const pool = peers.filter(x => judged(x.id));
  const val = (id: string, k: string) => ctx.attrs.get(id)?.scores[k]?.score ?? null;
  const dist = (id: string) => ["texture", "finish", "hydration", "gentle"].reduce((d, k) => { const p = val(r.id, k), q = val(id, k); return p === null || q === null ? d + 25 : d + Math.abs(p - q); }, 0);
  const floor = signal === null ? null : signal - 10;
  const similar = pool.filter(x => { const s = ctx.signal(x.id); return s !== null && (floor === null || s >= floor); })
    .sort((p, q) => dist(p.id) - dist(q.id)).slice(0, 8).sort((p, q) => (ctx.signal(q.id) ?? -1) - (ctx.signal(p.id) ?? -1)).map(x => x.id);
  const peersP: SkinPeers = { self, peers: peerWire.filter(w => pool.some(x => x.id === w.id)), similar, ref,
    cards: Object.fromEntries(pool.map(x => [x.id, { id: x.id, name: displayName(x.name, brandOf(x)), href: productHref(x), pic: photoOf(x),
      line: voiceTagline(x.slug) ?? expertLine(firstSentence(skinPage(x.slug)?.bottom)) ?? shortLine(x) ?? listLine(x) ?? null, shop: listShopLink(x), score: scoreState((ctx.counts.get(x.id)?.positive ?? 0) + (ctx.counts.get(x.id)?.mixed ?? 0) + (ctx.counts.get(x.id)?.negative ?? 0)) === "new" ? null : ctx.signal(x.id) }])) };

  // ── Reviews (as padel's shipped section, racket-fit.tsx): our own, YouTube (one card per channel), blogs (one per site,
  // websites only) and up to 5 Reddit comments in the writer's exact words. Forum reports still count in the score.
  const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };
  const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
  const ytProducts = new Map<string, number>(), ytSeen = new Set<string>();
  for (const e of data.external) { if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) continue; const v = videoOf(e.sourceUrl);
    if (v && !ytSeen.has(`${v}|${e.racketId}`)) { ytSeen.add(`${v}|${e.racketId}`); ytProducts.set(v, (ytProducts.get(v) ?? 0) + 1); } }
  const mine = data.external.filter(e => e.racketId === r.id);
  const english = (t?: string | null) => !!t && /^[\x00-\x7F’‘“”–—…é]+$/.test(t);
  const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
  const SOCIAL = /(^|\.)(t\.me|telegram\.org|facebook\.com|instagram\.com|x\.com|twitter\.com|reddit\.com|tiktok\.com|discord\.(gg|com))$/;
  const blogSeen = new Set<string>();
  const blogs = mine.filter(e => e.sourcePlatform === "Blog" && !SOCIAL.test(host(e.sourceUrl))).map(e => {
    const text = e.summary ? unmd(plainSummary(e.summary)) : (!e.sourceLanguage || e.sourceLanguage === "en") && english(e.excerpt) && e.excerpt!.length >= 30 && e.excerpt!.length <= 320 && isComplete(unmd(e.excerpt!)) ? unmd(e.excerpt!) : "";
    return { e, text, verbatim: !e.summary };
  }).filter(x => x.text).sort((p, q) => (q.e.sourceDate ?? "").localeCompare(p.e.sourceDate ?? ""))
    .filter(({ e }) => { const k = host(e.sourceUrl) || e.sourceName.trim().toLowerCase(); if (blogSeen.has(k)) return false; blogSeen.add(k); return true; })
    .map(({ e, text, verbatim }) => ({ at: e.sourceDate ?? "", card: { id: e.id, kind: "blog" as const, who: e.sourceName, verdict: e.sentiment ?? null, when: ago(e.sourceDate), url: e.sourceUrl, tags: e.tags ?? [], text, verbatim } satisfies ReviewCard }));
  const okReddit = (t?: string | null) => !!t && t.length >= 60 && t.length <= 300 && english(t) && isComplete(unmd(t));
  const redditRows = mine.filter(e => e.sourcePlatform === "Reddit" && !e.adminEditedAt && (!e.sourceLanguage || e.sourceLanguage === "en") && okReddit(e.excerpt))
    .sort((p, q) => (q.sourceDate ?? "").localeCompare(p.sourceDate ?? ""));
  const redditPick = (["positive", "mixed", "negative"] as const).flatMap(v => redditRows.filter(e => e.sentiment === v).slice(0, 1));
  for (const e of redditRows) { if (redditPick.length >= 5) break; if (!redditPick.includes(e)) redditPick.push(e); }
  const reddit = redditPick.slice(0, 5).map(e => ({ at: e.sourceDate ?? "", card: { id: e.id, kind: "reddit" as const, who: "Reddit user", source: e.sourceUrl.match(/reddit\.com\/(r\/[A-Za-z0-9_]+)/)?.[1] ?? e.sourceName,
    verdict: e.sentiment ?? null, when: ago(e.sourceDate), url: e.sourceUrl, tags: e.tags ?? [], text: unmd(e.excerpt!), verbatim: true } satisfies ReviewCard }));
  const cards: ReviewCard[] = [
    ...data.reviews.filter(x => x.racketId === r.id).map(x => ({ at: x.createdAt, card: { id: x.id, kind: "player" as const, who: x.alias || "A SkinRecs user", meta: x.playerLevel ? `${x.playerLevel.toLowerCase()} skin` : null,
      tags: x.tags, verdict: (x.rating >= 4 ? "positive" : x.rating === 3 ? "mixed" : "negative") as ReviewCard["verdict"], when: ago(x.createdAt), text: unmd(x.reviewText), verbatim: false } satisfies ReviewCard })),
    ...onePerChannel(mine.filter(e => e.sourcePlatform === "YouTube"), v => ytProducts.get(v) ?? 1).map(e => { const text = unmd(e.summary ? plainSummary(e.summary) : e.excerpt ?? "");
      return { at: e.sourceDate ?? "", card: { id: e.id, kind: "youtube" as const, who: e.sourceName.replace(/^YouTube\s*[·:-]\s*/i, ""), verdict: e.sentiment ?? null, when: ago(e.sourceDate), url: e.sourceUrl, tags: e.tags ?? [],
        video: vid(e.sourceUrl), comment: /[?&]lc=/.test(e.sourceUrl), points: e.summary && !/[?&]lc=/.test(e.sourceUrl) ? sentences(text) : [text] } satisfies ReviewCard }; })
      .filter(x => !!x.card.points?.[0]),
    ...blogs, ...reddit,
  ].filter(x => x.card.kind === "youtube" || !!x.card.text).sort((p, q) => q.at.localeCompare(p.at)).map(x => x.card);
  // "N new this week", as padel: our own reviews and YouTube reports dated in the last 7 days.
  const weekAgo = isoDaysAgo(7);
  const fresh = data.reviews.filter(x => x.racketId === r.id && x.createdAt.slice(0, 10) >= weekAgo).length + mine.filter(e => e.sourcePlatform === "YouTube" && (e.sourceDate ?? "") >= weekAgo).length;
  const skinOpts = SKIN_TYPES.map(k => ({ value: k[0].toUpperCase() + k.slice(1), label: k }));

  // ── Explore the rankings: 6 tiles, as padel's.
  const tiles = (await rankedLists()).lists.filter((l, i, all) => l.entries.length > 0 && all.findIndex(x => x.list.slug === l.list.slug) === i).slice(0, 6).map(l => ({
    href: listHref(l.list.slug), title: l.list.maxAgeYears === 0 && !l.list.trait ? `Best of ${listYear(l.list)}` : l.list.label.replace(/\{year\}/, String(listYear(l.list))),
    sub: `${l.entries.length} ${niche.words.many}`, pics: l.entries.slice(0, 3).map(e => { const x = data.rackets.find(y => y.id === e.product.id); return x ? photoOf(x) : null; }) }));

  const inside = insideOf(r.slug, r.core, ff === "free"), routine = routineOf(r.slug, r.shape);
  const bar = <span className="sv-sbar" aria-hidden="true"><i className="p" style={{ flex: c.positive }}/><i className="m" style={{ flex: c.mixed }}/><i className="n" style={{ flex: c.negative }}/></span>;
  const scoreRow = <a className="sv-score" href="#reviews">
    {signal !== null ? <><b className={`sv-sq ${scoreTone(signal)}`}>{signal}</b><span className="sv-sm"><b>user score</b><small>{`${rated} rated`}</small></span>{bar}</>
      : <span className="sv-new">{rated >= HIDE_UNDER ? `New · ${rated} reviews so far` : "New · first reviews in"}</span>}
  </a>;

  return <><main className={`bp sv ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="bp-wrap sv-wrap">
      <SkinV11Live input={input} peers={peersP} choice={choice} summary={r.reviewSummary ?? null} buy={buy}
        self={{ name: title || name, pic: photo, score: signal, line: hook, slug: r.slug }}
        hero={<div key="hero" className="bp-id">
          <div className="bp-shot">{photo ? <img src={photo} alt={name} width={408} height={620} fetchPriority="high" decoding="async"/> : <span>{title || name}</span>}</div>
          <div className="bp-idt">
            <div className="bp-chips">{[r.shape?.toLowerCase(), ff === "free" ? "fragrance-free" : null, spf ? `SPF ${spf}` : null, price].filter(Boolean).map(x => <span key={x}>{x}</span>)}</div>
            {brand && <div className="bp-brand">{brand.name}</div>}
            <h1><NoBreak name={title || name}/></h1>
            {hook && <p className="bp-hook">{hook}</p>}
            {scoreRow}
            {buy && <div className="bp-buyrow"><a className="bp-btn" href={buy.url} target="_blank" rel={buy.rel}>{`${buy.label} ↗`}</a></div>}
            {buy && <p className="bp-aff">* affiliate link, it keeps the site running and doesn&apos;t change the verdict</p>}
          </div>
        </div>}
        inside={(inside.length > 0 || routine) && <section key="inside" id="inside" className="sv-inside" aria-labelledby="sv-inside-t">
          {inside.length > 0 && <><h2 id="sv-inside-t">What&apos;s inside, and what it means for you</h2>
            <div className="sv-igrid">{inside.map(x => <div key={x.name} className="sv-icard"><span className={`sv-ico ${x.icon}`} aria-hidden="true"><i/><i/><i/></span><b>{x.name}</b><span>{x.line}</span></div>)}</div></>}
          {routine && <div className="sv-route"><span className="sv-rk">where it goes</span>
            {routine.steps.map((s, i) => <span key={s.label} className="sv-rs"><span className={s.me ? "me" : undefined} aria-current={s.me ? "step" : undefined}>{s.label}</span>{i < routine.steps.length - 1 && <i aria-hidden="true">→</i>}</span>)}
            <span className="sv-rn">{routine.note}</span></div>}
        </section>}
        reviews={<section key="reviews" id="reviews" className="bp-rv rf sv-rv">
          <RacketReviews racketId={r.id} name={title || name} cards={cards} nicknames={niche.form.quickVote?.nicknames ?? []} total={c.n} hideUnder={HIDE_UNDER}
            v11c={{ fresh: fresh >= HIDE_UNDER ? fresh : 0, thin: rated < 10, tone: Object.fromEntries(niche.tags.map(t => [t.label, t.tone === "pos" ? "pos" : t.tone === "neg" ? "neg" : "neutral"])) }}
            mood={{ pos: c.positive, mix: c.mixed, neg: c.negative, score: signal }}
            words={{ levelLead: "My skin is", levels: skinOpts, score: "User score", ask: "Tried it?", people: "people", peopleTab: "people" }}/>
        </section>}
        tiles={tiles.length > 0 && <section key="tiles" className="sv-rt" aria-labelledby="sv-rt-t">
          <div className="sv-sh"><h2 id="sv-rt-t">Explore the rankings</h2><Link href="/rankings">all rankings →</Link></div>
          <div className="sv-rtgrid">{tiles.map(t => <Link key={t.href} href={t.href}><span className="t"><b>{t.title}<span aria-hidden="true"> →</span></b><em>{t.sub}</em></span>
            <span className="sv-rtpics" aria-hidden="true">{t.pics.map((p, j) => p && <img key={j} src={p} alt="" loading="lazy" decoding="async"/>)}</span></Link>)}</div>
        </section>}/>
      <p className="sv-foot">Built from forums, YouTube and reviews sent to us. No brand pays to be here. Spotted a mistake? <a href="/contact">Tell us →</a></p>
    </div>
  </main><V2Footer/></>;
}
