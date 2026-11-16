import "../rackets/[slug]/racket-fit.css";
import "./skin-product.css";
import { skinContext } from "./context";
import { wireOf } from "./payload";
import { QUOTE_KEYS, type ProductInput } from "./product-view";
import { SkinProductLive } from "./skin-product-live";
import { SKIN_TYPES, type SkinChoice } from "../../lib/skin-choice";
import { niche, catalogPath, productHref, typePageFor } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { shortLine } from "../../lib/short-lines";
import { listLine } from "../../lib/list-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { onePerChannel, videoOf } from "../../lib/youtube-pick";
import { plainSummary } from "../../lib/plain-summary";
import RacketReviews, { type ReviewCard } from "../rackets/[slug]/racket-reviews";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { V2Footer } from "../v2-footer";

/** The SkinRecs product page in the beauty design (owner 2026-11-16, Claude Design "SkinRecs product page"): hero with the
 *  user score; a skin check (1. skin type, 2. what you want it to do, optional "reacts easily") answered from people with your
 *  skin; the bottom line; Why yes / why not with "for your skin" tags; How it feels & compares (drops and sliders, tabs against
 *  close alternatives with "stay with this one / pick X if you…"); reviews; ingredients & details; a floating match card. Picks
 *  live in the URL (?skin=&goal=&sens=1), so each answer is a shareable page; the answers are worked out in the browser
 *  (app/skin/product-view.ts, app/skin/skin-product-live.tsx) from the data sent here. Every number is a real count. */
const DAY = 864e5;
function agoShort(iso?: string | null) {
  if (!iso) return null; const d = Math.max(0, (Date.now() - Date.parse(iso)) / DAY); if (!Number.isFinite(d)) return null;
  return d < 1 ? "today" : d < 30 ? `${Math.floor(d)}d ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
}

export default async function SkinProduct({ productId, choice, buy, jsonLd }: { productId: string; choice: SkinChoice;
  buy: { url: string; label: string; rel: string } | null; jsonLd: object }) {
  const ctx = await skinContext(), { data } = ctx;
  const r = data.rackets.find(x => x.id === productId)!;
  const brand = data.brands.find(b => b.id === r.brandId);
  const name = displayName(r.name, brand?.name), title = brand && r.name.startsWith(brand.name) ? r.name.slice(brand.name.length).trim() : r.name;
  const a = ctx.attrs.get(r.id) ?? { scores: {}, facts: {} }, c = ctx.counts.get(r.id) ?? { n: 0, positive: 0, mixed: 0, negative: 0 };
  const photoOf = (x: typeof r) => photoHidden(x) ? null : shopPhoto(x) ?? amazonPhoto(x)?.image ?? null;
  const photo = photoOf(r), signal = ctx.signal(r.id), rated = c.positive + c.mixed + c.negative;
  const type = typePageFor(r.shape), here = productHref(r);
  const ff = a.facts.fragrance_free, spf = a.facts.spf, price = typeof a.facts.price === "string" ? a.facts.price : null;
  const hook = shortLine(r) ?? listLine(r) ?? (r.reviewSummary ? r.reviewSummary.split(/(?<=\.)\s/)[0] : null);

  // What the skin check needs in the browser: this product, the others of its type (the alternatives), a reader's words per score.
  const quotes = ctx.quotes.get(r.id) ?? [];
  const quoteFor = (attr: string, sign: 1 | -1) => quotes.filter(q => q.attribute === attr && Math.sign(q.value ?? 0) === sign && q.quote && q.quote.length >= 14 && q.quote.length <= 110)
    .sort((x, y) => y.strength - x.strength || (y.saidAt ?? "").localeCompare(x.saidAt ?? ""))[0]?.quote ?? null;
  const peers = data.listed.filter(x => x.shape === r.shape && x.id !== r.id && x.slug !== r.slug && x.name !== r.name);
  const input: ProductInput = {
    self: wireOf(ctx, [r])[0], peers: wireOf(ctx, peers),
    peerCards: Object.fromEntries(peers.map(x => [x.id, { short: displayName(x.name, data.brands.find(bb => bb.id === x.brandId)?.name).replace(/^(\S+\s\S+\s\S+).*$/, "$1"), photo: photoOf(x), href: productHref(x), total: ctx.counts.get(x.id)?.n ?? 0 }])),
    here, type: type ? { slug: type.slug, label: type.label } : null, catalogPath, many: niche.words.many, counts: c,
    quotes: Object.fromEntries(QUOTE_KEYS.flatMap(k => ([1, -1] as const).map(sign => [`${k}:${sign}`, quoteFor(k, sign)]))),
  };

  // ── Reviews: our own, YouTube (one card per channel) and beauty blogs; forum reports count in the scores but aren't listed.
  const vid = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };
  const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
  const ytProducts = new Map<string, number>(), ytSeen = new Set<string>();
  for (const e of data.external) { if (e.sourcePlatform !== "YouTube" || /[?&]lc=/.test(e.sourceUrl)) continue; const v = videoOf(e.sourceUrl);
    if (v && !ytSeen.has(`${v}|${e.racketId}`)) { ytSeen.add(`${v}|${e.racketId}`); ytProducts.set(v, (ytProducts.get(v) ?? 0) + 1); } }
  const mine = data.external.filter(e => e.racketId === r.id);
  const cards: ReviewCard[] = [
    ...data.reviews.filter(x => x.racketId === r.id).map(x => ({ at: x.createdAt, card: { id: x.id, kind: "player" as const, who: x.alias || "A SkinRecs user", meta: x.playerLevel?.toLowerCase() ?? null, verdict: (x.rating >= 4 ? "positive" : x.rating === 3 ? "mixed" : "negative") as ReviewCard["verdict"], when: agoShort(x.createdAt), text: x.reviewText, verbatim: true } })),
    ...onePerChannel(mine.filter(e => e.sourcePlatform === "YouTube"), v => ytProducts.get(v) ?? 1).map(e => { const text = e.summary ? plainSummary(e.summary) : e.excerpt ?? "";
      return { at: e.sourceDate ?? "", card: { id: e.id, kind: "youtube" as const, who: e.sourceName, verdict: e.sentiment ?? null, when: agoShort(e.sourceDate), url: e.sourceUrl, video: vid(e.sourceUrl), comment: /[?&]lc=/.test(e.sourceUrl), points: e.summary && !/[?&]lc=/.test(e.sourceUrl) ? sentences(text).slice(0, 4) : [text] } }; }),
    ...mine.filter(e => e.sourcePlatform === "Blog").map(e => ({ at: e.sourceDate ?? "", card: { id: e.id, kind: "player" as const, who: e.sourceName, initial: (e.sourceName[0] ?? "B").toUpperCase(), meta: null, source: "blog",
      verdict: e.sentiment ?? null, when: agoShort(e.sourceDate), url: e.sourceUrl, text: e.summary ? plainSummary(e.summary) : e.excerpt ?? "", verbatim: !e.summary } })),
  ].filter(x => x.card.kind === "youtube" ? !!x.card.points?.[0] : !!x.card.text).sort((x, y) => y.at.localeCompare(x.at)).map(x => x.card);
  const skinOpts = SKIN_TYPES.map(k => ({ value: k[0].toUpperCase() + k.slice(1), label: k }));
  const specs = [["type", r.shape?.toLowerCase()], ["size", r.weight], ["key ingredients", r.core], ["maker says", r.surface],
    ["fragrance", ff === "free" ? "none" : ff === "oils" ? "no added fragrance, essential oils" : ff ? "contains fragrance" : null], ["SPF", spf ? String(spf) : null], ["price", price]].filter((x): x is [string, string] => !!x[1]);
  const bar = (h: number) => <span className="bp-mood" style={{ height: h }} aria-hidden="true"><i className="p" style={{ flex: c.positive }}/><i className="m" style={{ flex: c.mixed }}/><i className="n" style={{ flex: c.negative }}/></span>;

  return <><main className={`bp ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="bp-wrap">
      <SkinProductLive input={input} choice={choice} summary={r.reviewSummary ?? null} photo={photo} buy={buy}
        hero={<div className="bp-id">
          <div className="bp-shot">{photo ? <img src={photo} alt={name} width={408} height={620} fetchPriority="high" decoding="async"/> : <span>product photo</span>}</div>
          <div className="bp-idt">
            <div className="bp-chips">{[r.shape?.toLowerCase(), ff === "free" ? "fragrance-free" : null, spf ? `SPF ${spf}` : null, price].filter(Boolean).map(x => <span key={x}>{x}</span>)}</div>
            {brand && <div className="bp-brand">{brand.name}</div>}
            <h1>{title || name}</h1>
            {hook && <p className="bp-hook">{hook}</p>}
            <a className="bp-score" href="#reviews"><span>{signal !== null && <strong>{signal}</strong>}{`${signal !== null ? " user score · " : ""}${rated} rated`}</span>{rated > 0 && bar(6)}</a>
            {buy && <div className="bp-buyrow"><a className="bp-btn" href={buy.url} target="_blank" rel={buy.rel}>{`${buy.label} ↗`}</a></div>}
            {buy && <p className="bp-aff">* affiliate link, it keeps the site running and doesn&apos;t change our take</p>}
          </div>
        </div>}
        reviews={<section id="reviews" className="bp-col bp-rv rf">
          <RacketReviews racketId={r.id} name={title || name} cards={cards} nicknames={niche.form.quickVote?.nicknames ?? []} total={c.n}
            mood={{ pos: c.positive, mix: c.mixed, neg: c.negative, score: signal }}
            words={{ levelLead: "My skin is", levels: skinOpts, score: "User score", ask: "Tried it?", people: "people", peopleTab: "people" }}/>
        </section>}
        specs={specs.length > 0 && <section className="bp-col"><details className="bp-specs"><summary><span>Ingredients &amp; details</span><i aria-hidden="true"/></summary>
          <div className="bp-speclist">{specs.map(([k, v]) => <span key={k}><em>{k}</em> {v}</span>)}</div></details></section>}/>
    </div>
  </main><V2Footer/></>;
}
