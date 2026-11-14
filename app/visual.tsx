// Shared pieces of the visual layout (2026-11 redesign): product photos with a drawn placeholder, sentiment bars, short
// source-linked quote cards and image tiles. Every number and word comes from published reviews; nothing is filled in.
import AdminEdit from "./admin-edit";
import type { Catalog, Score as ScoreT } from "../db/data";
import { ProductIcon, SourceIcon } from "./icons";
import { amazonPhoto } from "../lib/amazon-photos";
import { shopPhoto } from "../lib/shop-photos";
import { sourceLabel, summaryKind, originalLinkLabel } from "../lib/source-label";
import { displayName } from "../lib/brand-name";
import { niche, productHref, catalogPath } from "../lib/niche";
const catalogPathOf = () => catalogPath;
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
    {/* The product name as alt text so image search can index the photo (owner, 2026-11-12); the wrapper stays hidden from screen readers, which read the name next to it. */}
    {photo ? <img src={photo.src} alt={displayName(product.name, brand ?? undefined)} loading={eager ? "eager" : "lazy"} decoding="async"/> : <ProductIcon shape={product.shape} brand={brand}/>}
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
    {e.summary ? <p className="qcard-text summary"><span className="qcard-kind">{`Summary of a ${summaryKind(e)}`}</span>{quoteText(e)}</p>
      : <blockquote className="qcard-text verbatim">{quoteText(e)}</blockquote>}
    <footer className="qcard-foot">
      <a className="qcard-src" href={e.sourceUrl} target="_blank" rel="noopener noreferrer" title={`Read the original on ${e.sourcePlatform}`}>
        <SourceIcon platform={e.sourcePlatform}/><b>{label.platform}</b>{e.sourceDate && <span>{monthYear(e.sourceDate)}</span>}<span className="arr" aria-hidden="true">↗</span>
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
/** textFirst (product pages, owner 2026-11-12): the review leads, larger and airier, with the verdict, source and date
 *  on one quiet line under it. The home feed keeps the source on top, under the product's name. */
export function Voice(props: ({ review: PlayerReview } | { entry: WebReview }) & { textFirst?: boolean; light?: boolean }) {
  const tf = !!props.textFirst;
  if (props.light) return <LightVoice {...props}/>;
  if ("review" in props) {
    const r = props.review, v = verdictOf(r.rating);
    const src = <span className="voice-src"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12v7H7l-3 2.5v-2.5H2z" fill="currentColor"/></svg><b>{`${niche.people.One} review`}</b><span className="vdate">{fullDate(r.createdAt)}</span></span>;
    const by = [r.alias || "Anonymous", r.playerLevel].filter(Boolean).join(" · ");
    if (tf) return <article className="voice tf">
      {/* Product pages show the whole review, no "Read more" (owner, 2026-11-12). */}
      <p className="voice-text">{r.reviewText}</p>
      <footer className="voice-meta"><span className={`spill s-${v}`}>{sentimentWord[v]}</span>{src}<span className="voice-by">{by}</span><AdminEdit type="player" id={r.id}/></footer>
    </article>;
    return <article className="voice">
      <header>{src}<span className={`spill s-${v}`}>{sentimentWord[v]}</span></header>
      <Clamp id={`p-${r.id}`} text={r.reviewText}/>
      <footer className="voice-by">{by}<AdminEdit type="player" id={r.id}/></footer>
    </article>;
  }
  const e = props.entry, label = sourceLabel(e);
  // Quoted reviews are our summaries, said as much on the card (owner, 2026-11-12, UX audit), not styled as quotes.
  const src = <a className="voice-src" href={e.sourceUrl} target="_blank" rel="noopener noreferrer" title={`Read the original on ${e.sourcePlatform}`}><SourceIcon platform={e.sourcePlatform}/><span className="vsum">Summary of a review on</span><b>{label.platform}</b>{label.name && <span>{label.name}</span>}{e.sourceDate && <span className="vdate">{fullDate(e.sourceDate)}</span>}<span className="arr" aria-hidden="true">↗</span></a>;
  const pill = e.sentiment && <span className={`spill s-${e.sentiment}`}>{sentimentWord[e.sentiment]}</span>;
  if (tf) return <article className="voice tf">
    <p className="voice-text">{quoteText(e)}</p>
    <footer className="voice-meta">{pill}{src}<AdminEdit type="web" id={e.id}/></footer>
  </article>;
  return <article className="voice">
    <header>{src}{pill}</header>
    <Clamp id={`w-${e.id}`} text={quoteText(e)}/>
    <a className="voice-orig m-only" href={e.sourceUrl} target="_blank" rel="noopener noreferrer">View original source <span aria-hidden="true">↗</span></a>
    <AdminEdit type="web" id={e.id}/>
  </article>;
}

/** The light product page's review (owner's mockup, 2026-11-12): a round source icon at the left, the source and date on
 *  top with the verdict in the corner, what kind of summary it is, the words, then a link to the original. */
function LightVoice(props: ({ review: PlayerReview } | { entry: WebReview })) {
  if ("review" in props) {
    const r = props.review, v = verdictOf(r.rating);
    return <article className="lv">
      <span className="lv-icon lv-own" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="10" cy="7" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M4 17c.8-3.2 3.2-5 6-5s5.2 1.8 6 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
      <div className="lv-body">
        <header><p className="lv-src"><b>{`${niche.people.One} review`}</b>{[r.alias || "Anonymous", r.playerLevel, fullDate(r.createdAt)].filter(Boolean).map(x => ` · ${x}`).join("")}</p><span className={`spill s-${v}`}>{sentimentWord[v]}</span></header>
        <p className="lv-text">{r.reviewText}</p>
        <footer><AdminEdit type="player" id={r.id}/></footer>
      </div>
    </article>;
  }
  const e = props.entry, label = sourceLabel(e), kind = summaryKind(e);
  return <article className="lv">
    <span className="lv-icon" aria-hidden="true"><SourceIcon platform={e.sourcePlatform}/></span>
    <div className="lv-body">
      {/* Source, where, when and "summarized" on one line (owner's audit, 2026-11-13); the kind of source is in the hover title. */}
      <header><p className="lv-src" title={`Summary of a ${kind}`}><b>{label.platform}</b>{[label.name, e.sourceDate && fullDate(e.sourceDate)].filter(Boolean).map(x => ` · ${x}`).join("")}{e.summary ? " · summarized" : ""}</p>{e.sentiment && <span className={`spill s-${e.sentiment}`}>{sentimentWord[e.sentiment]}</span>}</header>
      <p className="lv-text">{quoteText(e)}</p>
      <footer><a className="lv-orig" href={e.sourceUrl} target="_blank" rel="noopener noreferrer">{originalLinkLabel(e)} <span aria-hidden="true">↗</span></a><AdminEdit type="web" id={e.id}/></footer>
    </div>
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

/** "How the signal works" as a small pop-up with the short explanation (owner, 2026-11-13), instead of a trip to the
 *  About page. No JavaScript. */
export function SignalPop({ label = "How the signal works", align = "left" }: { label?: string; align?: "left" | "right" }) {
  return <details className={`sig-pop${align === "right" ? " sig-pop-right" : ""}`}><summary>{label}<span aria-hidden="true"> ⓘ</span></summary>
    <div className="sig-pop-card" role="note">
      <b>The signal score</b>
      <p>A score out of 100 for how well reviewed a product is next to others of its kind. It rises with positive reviews and with how many there are; negative and mixed reviews take points off.</p>
      <p>So a handful of glowing reviews can’t beat a product lots of people like. No sponsored placements.</p>
    </div>
  </details>;
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

/** Category tabs above a product list (2026-11 redesign, like the rankings tabs): "All" plus the niche's product types,
 *  each its own page, or, on niches without type pages, the shape filter as ?shape= links. */
export function CategoryTabs({ current, shapes = [], query = {} }: { current?: string; shapes?: string[]; query?: Record<string, string | undefined> }) {
  const types = niche.typePages ?? [];
  const keep = (shape?: string) => { const q = new URLSearchParams(Object.entries({ ...query, shape, show: undefined }).filter(([, v]) => v) as [string, string][]); return q.size ? `${catalogPathOf()}?${q}` : catalogPathOf(); };
  const tabs = types.length
    ? [{ key: "", label: "All", href: catalogPathOf() }, ...types.map(t => ({ key: t.slug, label: t.label, href: `/${t.slug}` }))]
    : niche.shapeTabs?.length ? [{ key: "", label: "All", href: keep() }, ...niche.shapeTabs.map(t => ({ key: t.key, label: t.label, href: keep(t.key) }))]
    : shapes.length > 1 ? [{ key: "", label: "All", href: keep() }, ...shapes.map(x => ({ key: x, label: x, href: keep(x) }))] : [];
  if (!tabs.length) return null;
  return <nav className="rank-tabs cat-tabs" aria-label={`${niche.words.One} types`}>{tabs.map(t => <a key={t.key || "all"} href={t.href} aria-current={(current ?? "") === t.key ? "page" : undefined}>{t.label}</a>)}</nav>;
}

/** The signal score's one-line explanation behind an "i", with a link to the full method on the About page (owner,
 *  2026-11-12, UX audit). No JavaScript. `align` opens it leftwards where it sits near the right edge. */
export function SignalInfo({ align = "left" }: { align?: "left" | "right" }) {
  return <details className={`sig-info${align === "right" ? " sig-right" : ""}`}><summary aria-label="What is the signal score?">i</summary>
    <p>A score out of 100. Negative and mixed reviews take points off, and so does having only a few reviews, so a handful of glowing reviews can’t beat a product many people like. <a href="/about#signal">How it works</a></p></details>;
}

/** A short review card for the home page's "Recent reviews" preview (owner's mockup, 2026-11-13): photo, product, where
 *  and when, the verdict and the words, clamped to a few lines. The full feed stays one click away. */
export function RecentCard(props: { data: Catalog; now?: number } & ({ review: PlayerReview } | { entry: WebReview })) {
  const id = "review" in props ? props.review.racketId : props.entry.racketId;
  const r = props.data.rackets.find(x => x.id === id);
  if (!r) return null;
  const brand = props.data.brands.find(b => b.id === r.brandId)?.name;
  // "Reddit · r/SkincareAddiction · Added 12 min ago" (owner's mockup, 2026-11-13): where it's from and when it was added here.
  const added = (iso: string) => { const m = Math.max(0, Math.floor(((props.now ?? Date.now()) - Date.parse(iso)) / 60000));
    return m < 60 ? `Added ${Math.max(1, m)} min ago` : m < 1440 ? `Added ${Math.floor(m / 60)} h ago` : m < 2880 ? "Added yesterday" : `Added ${Math.floor(m / 1440)} days ago`; };
  const [src, verdict, text] = "review" in props
    ? [[`${niche.site.name} ${niche.people.one}`, added(props.review.createdAt)], verdictOf(props.review.rating), props.review.reviewText]
    : (() => { const e = props.entry, l = sourceLabel(e); return [[l.platform, l.name, added(e.createdAt)].filter(Boolean), e.sentiment, quoteText(e)] as const; })();
  return <article className="rc-card">
    <a className="rc-art" href={productHref(r)} aria-hidden="true" tabIndex={-1}><ProductArt product={r} brand={brand}/></a>
    <div className="rc-body">
      <header><a className="rc-name" href={productHref(r)}>{displayName(r.name, brand)}</a>{verdict && <span className={`spill s-${verdict}`}>{sentimentWord[verdict as keyof typeof sentimentWord]}</span>}</header>
      <p className="rc-src">{(src as string[]).join(" · ")}</p>
      <p className="rc-text">{String(text)}</p>
      <a className="rc-more" href={`${productHref(r)}#reviews`}>Read reviews <span aria-hidden="true">→</span></a>
    </div>
  </article>;
}
