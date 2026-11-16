import "../rackets/[slug]/racket-fit.css";
import "./skin-product.css";
import { skinContext } from "./context";
import { wireOf } from "./payload";
import type { ProductInput, ItemWire } from "./product-view";
import { skinPage, sourceKinds, type SkinItem } from "../../lib/skin-page";
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
import { SimilarSection, type SimilarItem, type SimilarTab } from "../similar-section";
import { routinePairs, tint, ROUTINE, expertLine, type SkinItem as PairItem } from "../../lib/similar-picks";
const SKIN_SUITS = ["suits_dry", "suits_oily", "suits_combination", "suits_normal", "suits_sensitive", "suits_acne"];
import { withModelYears, rankingHref } from "../../lib/top-lists";

/** The SkinRecs product page in the beauty design (owner 2026-11-16, Claude Design "SkinRecs product page"): hero with the
 *  user score; a skin check (1. skin type, 2. what you want it to do, optional "reacts easily") answered from people with your
 *  skin; the bottom line; Why yes / why not with "for your skin" tags; How it feels & compares (drops and sliders, tabs against
 *  close alternatives with "stay with this one / pick X if you…"); reviews; ingredients & details; a floating match card. Picks
 *  live in the URL (?skin=&goal=&sens=1), so each answer is a shareable page; the answers are worked out in the browser
 *  (app/skin/product-view.ts, app/skin/skin-product-live.tsx) from the data sent here. The advice is written per product
 *  (db/racket-page/skin.json) in the expert voice; counts appear only in the review header and the User score. */
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

  // What the skin check needs in the browser: this product, the others of its type (the alternatives), its written content
  // with each item's kinds of source and its try-instead product (dropped when that product isn't listed).
  const platform = new Map<string, string>([...data.external.map(e => [e.id, e.sourcePlatform] as const), ...data.reviews.map(x => [x.id, "SkinRecs"] as const)]);
  const content = skinPage(r.slug);
  const wire = (it: SkinItem): ItemWire => {
    const alt = it.alt ? data.listed.find(x => x.slug === it.alt!.slug) : undefined;
    return { ...it, proof: sourceKinds(it.src, id => platform.get(id)),
      ...(alt ? { altCard: { name: displayName(alt.name, data.brands.find(b => b.id === alt.brandId)?.name), href: productHref(alt) } } : { alt: undefined }) };
  };
  const peers = data.listed.filter(x => x.shape === r.shape && x.id !== r.id && x.slug !== r.slug && x.name !== r.name);
  const input: ProductInput = {
    self: wireOf(ctx, [r])[0], peers: wireOf(ctx, peers),
    peerCards: Object.fromEntries(peers.map(x => [x.id, { short: displayName(x.name, data.brands.find(bb => bb.id === x.brandId)?.name).replace(/^(\S+\s\S+\s\S+).*$/, "$1"), photo: photoOf(x), href: productHref(x), total: ctx.counts.get(x.id)?.n ?? 0 }])),
    here, type: type ? { slug: type.slug, label: type.label } : null, catalogPath, many: niche.words.many, counts: c,
    page: content ? { bottom: content.bottom, yes: content.yes.map(wire), no: content.no.map(wire) } : null,
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

  // "Similar products" (owner 2026-11-16, app/similar-section.tsx): the same type closest on texture, finish, hydration and
  // gentleness, and the routine steps that pair with it (lib/similar-picks.ts routinePairs), best liked first.
  const AXES = ["texture", "finish", "hydration", "gentle"] as const;
  const val = (id: string, k: string) => ctx.attrs.get(id)?.scores[k]?.score ?? null;
  const dist = (id: string) => AXES.reduce((d, k) => { const x = val(r.id, k), y = val(id, k); return x === null || y === null ? d + 25 : d + Math.abs(x - y); }, 0);
  const whyOf = (id: string) => {
    const gaps = AXES.map(k => { const x = val(r.id, k), y = val(id, k); return { k, g: x === null || y === null ? 0 : y - x }; }).sort((a, b) => Math.abs(b.g) - Math.abs(a.g))[0];
    if (!gaps || Math.abs(gaps.g) < 8) return "similar feel";
    return { texture: gaps.g > 0 ? "richer" : "lighter", finish: gaps.g > 0 ? "dewier" : "more matte", hydration: gaps.g > 0 ? "more hydrating" : "less hydrating", gentle: gaps.g > 0 ? "gentler" : "more active" }[gaps.k];
  };
  const TILE: Record<string, string> = { "Cleanser": "cleanse", "Toner": "toner", "Serum": "serum", "Moisturizer": "cream", "Balm & ointment": "balm", "Sunscreen": "SPF",
    "Eye cream": "eye", "Exfoliant": "exfol", "Mask": "mask", "Treatment": "treat" };
  const itemOf = (id: string, i: number, why: string | null): SimilarItem => {
    const x = data.rackets.find(y => y.id === id)!, b = data.brands.find(y => y.id === x.brandId)?.name, pr = ctx.attrs.get(id)?.facts.price;
    return { id, name: displayName(x.name, b), href: productHref(x), tag: TILE[x.shape ?? ""] ?? (x.shape ?? "").toLowerCase(), tint: tint(i), why,
      // The product's own words (lib/skin-page.ts, expert voice), else its short lines, never a line that says who said it.
      line: [skinPage(x.slug)?.bottom.split(/(?<=\.)\s/)[0], shortLine(x), listLine(x)].map(expertLine).find((t): t is string => !!t) ?? null, score: ctx.signal(id), price: typeof pr === "string" ? pr : null };
  };
  const counted = (id: string) => (ctx.counts.get(id)?.n ?? 0) >= 3;
  const sameType = data.listed.filter(x => x.shape === r.shape && x.id !== r.id && x.name !== r.name && counted(x.id))
    .sort((a, b) => dist(a.id) - dist(b.id)).slice(0, 4).sort((a, b) => (ctx.signal(b.id) ?? -1) - (ctx.signal(a.id) ?? -1));
  const skinItem = (id: string): PairItem => { const sc = ctx.attrs.get(id)?.scores ?? {}, x = data.rackets.find(y => y.id === id)!;
    return { id, type: x.shape, signal: ctx.signal(id), gentle: sc.gentle?.score ?? null, suits: Object.fromEntries(SKIN_SUITS.map(k => [k, sc[k]?.score ?? null])) }; };
  // In routine order: cleanse first, SPF last.
  const stepOf = (id: string) => ROUTINE[data.rackets.find(y => y.id === id)?.shape ?? ""]?.step ?? 9;
  const pairs = routinePairs(skinItem(r.id), data.listed.filter(x => counted(x.id)).map(x => skinItem(x.id))).sort((a, b) => stepOf(a.id) - stepOf(b.id));
  const typeMany = (type?.label ?? niche.words.many).toLowerCase();
  const rankList = withModelYears(niche.topLists ?? []).find(l => type && l.slug.includes(type.slug.replace(/s$/, ""))) ?? withModelYears(niche.topLists ?? [])[0];
  const gentleList = withModelYears(niche.topLists ?? []).find(l => /gentle|sensitive/.test(l.slug));
  const simTabs: SimilarTab[] = [
    { key: "sim", label: `similar ${typeMany}`, sub: `other ${typeMany} people compare it with`, items: sameType.map((x, i) => itemOf(x.id, i, whyOf(x.id))),
      more: rankList ? { href: rankingHref(rankList.slug), label: `all ${typeMany}, ranked →` } : null },
    { key: "pairs", label: niche.similar?.pairLabel ?? "pairs well with", sub: "what goes around it in a routine", items: pairs.map((p, i) => itemOf(p.id, i, p.why)),
      more: gentleList ? { href: rankingHref(gentleList.slug), label: `${gentleList.label.toLowerCase()}, ranked →` } : null },
  ];

  return <><main className={`bp ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}/>
    <div className="bp-wrap">
      <SkinProductLive input={input} choice={choice} summary={r.reviewSummary ?? null} photo={photo} buy={buy}
        hero={<div key="hero" className="bp-id">
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
        reviews={<section key="reviews" id="reviews" className="bp-col bp-rv rf">
          <RacketReviews racketId={r.id} name={title || name} cards={cards} nicknames={niche.form.quickVote?.nicknames ?? []} total={c.n}
            mood={{ pos: c.positive, mix: c.mixed, neg: c.negative, score: signal }}
            words={{ levelLead: "My skin is", levels: skinOpts, score: "User score", ask: "Tried it?", people: "people", peopleTab: "people" }}/>
        </section>}
        specs={specs.length > 0 && <section key="specs" className="bp-col"><details className="bp-specs"><summary><span>Ingredients &amp; details</span><i aria-hidden="true"/></summary>
          <div className="bp-speclist">{specs.map(([k, v]) => <span key={k}><em>{k}</em> {v}</span>)}</div></details></section>}/>
      <SimilarSection title="Also worth a look" tabs={simTabs} scoreLabel="user score" look={niche.similar?.look}/>
    </div>
  </main><V2Footer/></>;
}
