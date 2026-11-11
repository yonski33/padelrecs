// Shared pieces of the visual layout (2026-11 redesign): product photos with a drawn placeholder, sentiment bars, short
// source-linked quote cards and image tiles. Every number and word comes from published reviews; nothing is filled in.
import type { Catalog, Score as ScoreT } from "../db/data";
import { ProductIcon, SourceIcon } from "./icons";
import { amazonPhoto } from "../lib/amazon-photos";
import { shopPhoto } from "../lib/shop-photos";
import { sourceLabel } from "../lib/source-label";
import { displayName } from "../lib/brand-name";
import { niche, productHref } from "../lib/niche";
import { plainSummary } from "../lib/plain-summary";

const monthYear = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

type Product = Catalog["rackets"][number];
type WebReview = Catalog["external"][number];

/** The photo we may show on list pages: one we host (shop or upload), else Amazon's stored photo. Null: draw the placeholder. */
export function productPhoto(r: Product) {
  const own = shopPhoto(r);
  if (own) return { src: own, kind: "own" as const };
  const a = amazonPhoto(r);
  return a ? { src: a.image, kind: "amazon" as const } : null;
}

/** A product's picture in a tinted tile: its photo, or the niche's drawing when there is none. Decorative (the name is beside it). */
export function ProductArt({ product, brand, className = "", eager = false }: { product: Product; brand?: string | null; className?: string; eager?: boolean }) {
  const photo = productPhoto(product);
  return <span className={`art ${photo ? `art-${photo.kind}` : "art-none"} ${className}`} aria-hidden="true">
    {photo ? <img src={photo.src} alt="" loading={eager ? "eager" : "lazy"} decoding="async"/> : <ProductIcon shape={product.shape} brand={brand}/>}
  </span>;
}

/** Whole-number shares that add up to 100 (largest remainder). */
export function shares(parts: number[]) {
  const total = parts.reduce((a, b) => a + b, 0);
  if (!total) return parts.map(() => 0);
  const raw = parts.map(n => n / total * 100), out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - out[i], i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out;
}

/** "% positive" once at least three reviews are judged; null below that, so one review never reads as a verdict. */
export const positiveShare = (s: Pick<ScoreT, "positive" | "judged">) => s.judged >= 3 ? Math.round(s.positive / s.judged * 100) : null;

/** Positive / mixed / negative as one bar. `legend` adds the three shares under it. */
export function SentimentBar({ positive, mixed, negative, legend = false, className = "" }: { positive: number; mixed: number; negative: number; legend?: boolean; className?: string }) {
  const total = positive + mixed + negative;
  if (!total) return null;
  const [p, m, n] = shares([positive, mixed, negative]);
  const label = `${p}% positive, ${m}% mixed, ${n}% negative`;
  return <span className={`sbar ${className}`}>
    <span className="sbar-track" role="img" aria-label={label}>
      {positive > 0 && <i className="s-positive" style={{ width: `${positive / total * 100}%` }}/>}
      {mixed > 0 && <i className="s-mixed" style={{ width: `${mixed / total * 100}%` }}/>}
      {negative > 0 && <i className="s-negative" style={{ width: `${negative / total * 100}%` }}/>}
    </span>
    {legend && <span className="sbar-legend" aria-hidden="true"><span className="s-positive">{p}% positive</span><span className="s-mixed">{m}% mixed</span><span className="s-negative">{n}% negative</span></span>}
  </span>;
}

/** What a web review says, in the words a card shows: our summary when there is one, else the source's (translated) words. */
export function quoteText(e: WebReview) {
  return e.summary ? plainSummary(e.summary) : (e.sourceLanguage && e.sourceLanguage !== "en" && e.excerptTranslation) || e.excerpt || "";
}

/** Short quotes for "In their words": judged web reviews whose card text is short, one per product, most helpful and newest first. */
export function shortQuotes(external: WebReview[], n: number, { min = 50, max = 170, exclude = new Set<string>() } = {}) {
  const seen = new Set<string>(exclude), out: WebReview[] = [];
  const pool = external.filter(e => e.sentiment && e.sourceUrl && quoteText(e).length >= min && quoteText(e).length <= max)
    .sort((a, b) => (b.helpful ?? 0) - (a.helpful ?? 0) || (b.sourceDate || b.createdAt).localeCompare(a.sourceDate || a.createdAt));
  for (const e of pool) { if (out.length >= n) break; if (!seen.has(e.racketId)) { seen.add(e.racketId); out.push(e); } }
  return out;
}

const sentimentWord = { positive: "Positive", mixed: "Mixed", negative: "Negative" } as const;

/** A short, source-linked quote card: what the source said, where and when, and how it felt. With `product`, its photo and name lead. */
export function QuoteCard({ entry: e, data, product = true }: { entry: WebReview; data: Catalog; product?: boolean }) {
  const r = data.rackets.find(x => x.id === e.racketId);
  const brand = r && data.brands.find(b => b.id === r.brandId)?.name;
  const label = sourceLabel(e);
  return <article className="qcard">
    {product && r && <a className="qcard-product" href={productHref(r)}><ProductArt product={r} brand={brand}/><span>{displayName(r.name, brand)}</span></a>}
    {e.summary ? <p className="qcard-text summary"><span className="qcard-kind">{`Summary of a ${label.platform === "Other" ? "web" : label.platform} post`}</span>{quoteText(e)}</p>
      : <blockquote className="qcard-text verbatim">{quoteText(e)}</blockquote>}
    <footer className="qcard-foot">
      <a className="qcard-src" href={e.sourceUrl} target="_blank" rel="noopener noreferrer" title={`Read the original on ${e.sourcePlatform}`}>
        <SourceIcon platform={e.sourcePlatform}/><b>{label.platform === "Other" ? label.name ?? "Web" : label.platform}</b>{e.sourceDate && <span>{monthYear(e.sourceDate)}</span>}<span className="arr" aria-hidden="true">↗</span>
      </a>
      {e.sentiment && <span className={`spill s-${e.sentiment}`}>{sentimentWord[e.sentiment]}</span>}
    </footer>
  </article>;
}

/** Image tiles to browse by: the niche's product types (SkinRecs: Serums, Sunscreens…) with the most-reviewed photographed
 *  products of each, or, on niches without types, its ranking lists with their leaders. */
export function browseTiles(data: Catalog, lists: { list: { slug: string; label: string }; entries: { product: { id: string } }[] }[], reviewCount: (id: string) => number, skip = 1) {
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const leads = (products: Product[]) => [...products].sort((a, b) => Number(!!productPhoto(b)) - Number(!!productPhoto(a)) || reviewCount(b.id) - reviewCount(a.id)).slice(0, 3);
  if (niche.typePages?.length) return niche.typePages.map(t => {
    const of = data.listed.filter(r => r.shape?.toLowerCase() === t.shape.toLowerCase());
    return { key: t.slug, href: `/${t.slug}`, label: t.label, note: `${of.length} ${of.length === 1 ? niche.words.one : niche.words.many}`, products: leads(of) };
  }).filter(t => t.products.length);
  return lists.slice(skip).map(l => ({ key: l.list.slug, href: `/rankings/${l.list.slug}`, label: l.list.label, note: `${l.entries.length} ranked`,
    products: leads(l.entries.slice(0, 5).map(e => byId.get(e.product.id)!).filter(Boolean)) })).filter(t => t.products.length);
}

/** A big image tile: up to three of the type's products, largest in front, with the type's name over the bottom. */
export function BrowseTile({ tile, data }: { tile: ReturnType<typeof browseTiles>[number]; data: Catalog }) {
  const brand = (p: Product) => data.brands.find(b => b.id === p.brandId)?.name;
  const [first, ...rest] = tile.products;
  return <a className="btile" href={tile.href}>
    <span className={`btile-stage n${tile.products.length}`}>
      {rest.map((p, i) => <ProductArt key={p.id} product={p} brand={brand(p)} className={`side s${i + 1}`}/>)}
      <ProductArt product={first} brand={brand(first)} className="front"/>
    </span>
    <span className="btile-label"><b>{tile.label}</b><span>{tile.note}</span></span>
    <span className="btile-arrow" aria-hidden="true">→</span>
  </a>;
}

export function Arrow() { return <span className="arrow" aria-hidden="true">→</span>; }

type PlayerReview = Catalog["reviews"][number];
const fullDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const verdictOf = (rating: number) => rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";

/** Long text shows its first lines with "Read more" (no JavaScript; the whole text stays in the page). */
function Clamp({ id, text }: { id: string; text: string }) {
  if (text.length < 220) return <p className="voice-text">{text}</p>;
  return <div className="clamp"><input type="checkbox" id={`v-${id}`} className="clamp-toggle"/><p className="voice-text clamped3">{text}</p><label htmlFor={`v-${id}`} className="clamp-more">Read more</label></div>;
}

/** A review on the product page, as a short quote card: where it was said and when, how it felt, and its words. */
export function Voice(props: { review: PlayerReview } | { entry: WebReview }) {
  if ("review" in props) {
    const r = props.review, v = verdictOf(r.rating);
    return <article className="voice">
      <header><span className="voice-src"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12v7H7l-3 2.5v-2.5H2z" fill="currentColor"/></svg><b>{`${niche.people.One} review`}</b><span>{fullDate(r.createdAt)}</span></span><span className={`spill s-${v}`}>{sentimentWord[v]}</span></header>
      <Clamp id={`p-${r.id}`} text={r.reviewText}/>
      <footer className="voice-by">{[r.alias || "Anonymous", r.playerLevel].filter(Boolean).join(" · ")}<span className="sr-only">{`, rated ${r.rating} out of 5`}</span></footer>
    </article>;
  }
  const e = props.entry, label = sourceLabel(e);
  return <article className="voice">
    <header>
      <a className="voice-src" href={e.sourceUrl} target="_blank" rel="noopener noreferrer" title={`Read the original on ${e.sourcePlatform}`}><SourceIcon platform={e.sourcePlatform}/><b>{label.platform === "Other" ? label.name ?? "Web" : label.platform}</b>{label.name && label.platform !== "Other" && <span>{label.name}</span>}{e.sourceDate && <span>{fullDate(e.sourceDate)}</span>}<span className="arr" aria-hidden="true">↗</span></a>
      {e.sentiment && <span className={`spill s-${e.sentiment}`}>{sentimentWord[e.sentiment]}</span>}
    </header>
    <Clamp id={`w-${e.id}`} text={quoteText(e)}/>
    <a className="voice-orig m-only" href={e.sourceUrl} target="_blank" rel="noopener noreferrer">View original source <span aria-hidden="true">↗</span></a>
  </article>;
}

/** The product page's sentiment bar: one thick bar with each share written inside its segment when there is room. */
export function SentimentBand({ positive, mixed, negative }: { positive: number; mixed: number; negative: number }) {
  const total = positive + mixed + negative;
  if (!total) return null;
  const [p, m, n] = shares([positive, mixed, negative]);
  const parts = [["positive", positive, p, "Positive"], ["mixed", mixed, m, "Mixed"], ["negative", negative, n, "Negative"]] as const;
  return <div className="sband" role="img" aria-label={`${p}% positive, ${m}% mixed, ${n}% negative`}>
    {parts.map(([k, count, pct, word]) => count > 0 && <i key={k} className={`s-${k}`} style={{ width: `${count / total * 100}%` }}>{pct >= 14 ? `${pct}% ${word}` : pct >= 7 ? `${pct}%` : ""}</i>)}
  </div>;
}

/** A review in the home feed: the product's photo and name, then the same short quote card as the product page. */
export function FeedCard(props: { data: Catalog } & ({ review: PlayerReview } | { entry: WebReview })) {
  const id = "review" in props ? props.review.racketId : props.entry.racketId;
  const r = props.data.rackets.find(x => x.id === id);
  if (!r) return null;
  const brand = props.data.brands.find(b => b.id === r.brandId)?.name;
  return <div className="feed-card">
    <a className="feed-product" href={productHref(r)}><ProductArt product={r} brand={brand}/><span>{displayName(r.name, brand)}</span></a>
    {"review" in props ? <Voice review={props.review}/> : <Voice entry={props.entry}/>}
  </div>;
}
