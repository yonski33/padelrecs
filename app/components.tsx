import type { ReactNode } from "react";
import type { Catalog, Score as ScoreT } from "../db/data";
import { ProductArt, SentimentBar, positiveShare } from "./visual";
import { Score, ProductIcon, SourceIcon } from "./icons";
import { sourceLabel } from "../lib/source-label";
import { TagList, VariantPill } from "./tags";
import { niche, productHref, categoryPill } from "../lib/niche";
import { languageName } from "../lib/languages";
import { displayName } from "../lib/brand-name";
import { amazonPhoto } from "../lib/amazon-photos";
import { shopPhoto } from "../lib/shop-photos";
import type { ProfileField } from "../lib/niche/types";

type Racket = Catalog["rackets"][number];
type PlayerReview = Catalog["reviews"][number];
type WebReview = Catalog["external"][number];

const w = niche.words;

export function Stars({rating}: {rating:number}) { return <Score rating={rating}/>; }

export function shortDate(iso: string, withYear = false) {
  return new Date(iso).toLocaleDateString("en-GB", {day: "numeric", month: "short", ...(withYear ? {year: "numeric"} : {}), timeZone: "UTC"});
}
/** "Jul 2026": when a quoted source was written. The day adds nothing once the model year is in the title. */
export function monthYear(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {month: "short", year: "numeric", timeZone: "UTC"});
}

// Split "Bullpadel Vertex 05 2026" into brand + model when the name starts with the brand.
export function racketParts(racket: Racket, data: Catalog) {
  const brand = data.brands.find(b => b.id === racket.brandId)?.name ?? "";
  const model = brand && racket.name.toLowerCase().startsWith(brand.toLowerCase() + " ") ? racket.name.slice(brand.length + 1) : racket.name;
  return { brand, model };
}

// Where review cards show the product's category (categoryPaths niches). "brandline" (owner choice, 2026-10-30): in the
// muted line above the name, "Panasonic · Mirrorless", on a faint grey highlight. "pill": the outlined CategoryPill
// beside the name. Flip to restore.
const CATEGORY_STYLE: "brandline" | "pill" = "brandline";

function RacketHeading({racket, data, showCategory = true}: {racket: Racket; data: Catalog; showCategory?: boolean}) {
  const parts = racketParts(racket, data);
  const category = showCategory && CATEGORY_STYLE === "brandline" && niche.categoryPaths ? categoryPill(racket.shape)?.label : undefined;
  // The heading carries the full name with its brand; the small line above shows only the category, when there is one.
  const model = displayName(racket.name, parts.brand);
  return <a className="racket-link" href={productHref(racket)}>
    {category && <span className="brand"><span className="cat"><span className="sr-only">Category: </span>{category}</span></span>}
    <span className="model">{model}</span>
  </a>;
}

/** The card heading: product name, plus the category pill when CATEGORY_STYLE is "pill". */
function CardHeading({racket, data, showCategory}: {racket: Racket; data: Catalog; showCategory: boolean}) {
  return <div className="note-title"><RacketHeading racket={racket} data={data} showCategory={showCategory}/>{showCategory && CATEGORY_STYLE === "pill" && <CategoryPill shape={racket.shape}/>}</div>;
}

/** The product's category as a small text pill beside its name ("Budgeting app", "IEM"), linking to the type page, so a
 *  visitor knows what an unfamiliar product is. Only on niches whose product pages live under their type (categoryPaths). */
export function CategoryPill({shape}: {shape: string | null | undefined}) {
  const c = niche.categoryPaths ? categoryPill(shape) : undefined;
  if (!c) return null;
  return <a className="cat-pill" href={c.href}><span className="sr-only">Category: </span>{c.label}</a>;
}

function Thumb({racket, brand}: {racket: Racket; brand?: string | null}) {
  const own = shopPhoto(racket), photo = amazonPhoto(racket);
  if (own) return <a className="thumb own" href={productHref(racket)} aria-hidden="true" tabIndex={-1}><img src={own} alt="" loading="lazy"/></a>;
  if (photo) return <a className="thumb photo" href={productHref(racket)} aria-hidden="true" tabIndex={-1}><img src={photo.image} alt="" loading="lazy"/></a>;
  return <a className="thumb" href={productHref(racket)} aria-hidden="true" tabIndex={-1}><ProductIcon shape={racket.shape} brand={brand}/></a>;
}

function Avatar({alias}: {alias: string | null}) {
  if (!alias) return <span className="avatar anon" aria-hidden="true">?</span>;
  const tone = [...alias].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4;
  return <span className={`avatar${tone ? ` a${tone + 1}` : ""}`} aria-hidden="true">{alias.trim()[0]?.toUpperCase()}</span>;
}

// How a profile answer reads in a review byline: the option's display text if the niche gives one ("tried briefly", "oily skin").
function profileLabel(field: ProfileField, value: string) {
  const display = niche.profile[field].options.find(o => o.value === value)?.display;
  return display ?? (field === "playingSide" ? `${value}${niche.profile.sideSuffix}` : value);
}

const categories = niche.categories.map(c => [c.label, c.column] as const);

/** showCategory: false on a feed already filtered to one type, where every card would repeat it. */
export function Review({review: r, data, showRacket = true, showCategory = true}: {review: PlayerReview; data: Catalog; showRacket?: boolean; showCategory?: boolean}) {
  const racket = data.rackets.find(x => x.id === r.racketId)!;
  const details = [r.playerLevel && profileLabel("playerLevel", r.playerLevel), r.playingSide && profileLabel("playingSide", r.playingSide), r.playingStyle && !showRacket ? profileLabel("playingStyle", r.playingStyle) : null, r.timeWithRacket && profileLabel("timeWithRacket", r.timeWithRacket)].filter(Boolean);
  const scores = categories.filter(([, key]) => r[key] != null);
  return <article className={showRacket ? "note" : "note compact"}>
    {showRacket && <Thumb racket={racket} brand={racketParts(racket, data).brand}/>}
    <header className="note-head">
      {showRacket && <CardHeading racket={racket} data={data} showCategory={showCategory}/>}
      <Score rating={r.rating}/>
    </header>
    <ClampText id={`p-${r.id}`} text={r.reviewText}/>
    {/* Niches with variants: the one the player used (DiscGolfRecs: "Plastic Star"), at the end of the tag row. */}
    <TagList tags={r.tags} trail={niche.variants && r.variant && <VariantPill label={niche.variants.label} value={r.variant}/>}/>
    {!showRacket && scores.length > 0 && <div className="subscores-line">{scores.map(([label, key]) => <span key={key}>{label}<b>{r[key]}</b></span>)}</div>}
    <footer className="note-foot">
      <Avatar alias={r.alias}/>
      <span className="who"><b>{r.alias || "anonymous"}</b>{details.map(d => <span key={d}><span className="dot">·</span>{d}</span>)}</span>
      <time dateTime={r.createdAt}>{shortDate(r.createdAt)}</time>
    </footer>
  </article>;
}

/** Long review text shows its first lines, with "Read more" opening the rest (no JavaScript; the whole text is in the page). */
function ClampText({id, text}: {id: string; text: string}) {
  if (text.length < 320) return <p className="note-body">{text}</p>;
  return <div className="clamp"><input type="checkbox" id={`more-${id}`} className="clamp-toggle"/><p className="note-body clamped">{text}</p><label htmlFor={`more-${id}`} className="clamp-more">Read more</label></div>;
}

/** The source's words: verbatim when they're English; otherwise our English translation, labelled, with the original
 *  (the exact words) one click away. */
function SourceQuote({entry: e, bare = false}: {entry: WebReview; bare?: boolean}) {
  const from = e.sourceLanguage && e.sourceLanguage !== "en" ? languageName(e.sourceLanguage) : null;
  if (!from || !e.excerptTranslation) return bare ? <ClampText id={`w-${e.id}`} text={e.excerpt ?? ""}/> : <blockquote className="source-quote">“{e.excerpt}”</blockquote>;
  return <figure className="source-quote translated">
    <blockquote className={bare ? "note-body" : undefined}>“{e.excerptTranslation}”</blockquote>
    <details className="original"><summary>Translated from {from} · original</summary><blockquote lang={e.sourceLanguage!}>“{e.excerpt}”</blockquote></details>
  </figure>;
}

export { plainSummary } from "../lib/plain-summary";
import { plainSummary } from "../lib/plain-summary";

export function External({entry: e, data, showRacket = true, showCategory = true}: {entry: WebReview; data: Catalog; showRacket?: boolean; showCategory?: boolean}) {
  const racket = data.rackets.find(r => r.id === e.racketId)!;
  const label = sourceLabel(e);
  const source = <><SourceIcon platform={e.sourcePlatform}/><b>{label.platform}</b>{label.name && <span>{label.name}</span>}</>;
  return <article className={showRacket ? "note ext" : "note compact ext"}>
    {showRacket && <Thumb racket={racket} brand={racketParts(racket, data).brand}/>}
    {showRacket && <header className="note-head"><CardHeading racket={racket} data={data} showCategory={showCategory}/></header>}
    <div className="quote" style={showRacket ? undefined : {marginTop: 0}}>
      {e.summary ? <>
        {/* Our summary of the source's experience (written in the third person), then the source's exact words. */}
        <p className="note-body summary">{plainSummary(e.summary)}</p>
        {/* The summary is what readers scan; the source's exact words are one click away (and still in the page). */}
        {e.excerpt && <details className="quote-toggle"><summary>Show quote</summary><SourceQuote entry={e}/></details>}
      </> : <SourceQuote entry={e} bare/>}
      {/* Niches with variants: the one the source used (DiscGolfRecs: "Plastic Star"), at the end of the tag row. */}
      <TagList tags={e.tags} lead={e.sentiment && <SentimentBadge sentiment={e.sentiment}/>} trail={niche.variants && e.variant && <VariantPill label={niche.variants.label} value={e.variant}/>}/>
      <div className="cite">
        {/* The source name is the link to the original, so the row keeps room for the vote. */}
        {e.sourceUrl
          ? <a className="src-link" href={e.sourceUrl} target="_blank" rel="noopener noreferrer" title={`View the original on ${e.sourcePlatform}`}>{source}<span className="arr" aria-hidden="true">↗</span></a>
          : <>{source}<span className="pending-link">source link coming</span></>}
        {e.sourceDate && <><span className="dot">·</span><time dateTime={e.sourceDate} title={shortDate(e.sourceDate, true)}>{monthYear(e.sourceDate)}</time></>}
      </div>
    </div>
  </article>;
}

const sentimentLabel = { positive: "Positive", mixed: "Mixed", negative: "Negative" } as const;
// Shown first in the tag row, styled like a tag but in its own colour, so it reads as our label rather than the source's words.
/** Our reading of how the source felt overall, set when the comment was moderated. Kept apart from the source's words. */
export function SentimentBadge({sentiment}: {sentiment: keyof typeof sentimentLabel}) {
  return <span className={`tag sentiment s-${sentiment}`} title="How this comment feels about it overall">{sentimentLabel[sentiment].toLowerCase()}</span>;
}

/** Positive / mixed / negative share of a racket's web reviews, once there are enough judged ones to mean something. */
/** `period`, when given, names the window the entries were cut to (e.g. "last 12 months"). An empty `noun` hides the
 *  count and period (the product page already states its review total). */
export function WebSplit({entries, min = 3, period, label = "Around the web", noun = "comments"}: {entries: {sentiment: keyof typeof sentimentLabel | null}[]; min?: number; period?: string; label?: string; noun?: string}) {
  const judged = entries.flatMap(e => e.sentiment ? [e.sentiment] : []);
  if (judged.length < min) return null;
  const parts = (["positive", "mixed", "negative"] as const).map(s => ({ s, n: judged.filter(x => x === s).length })).filter(x => x.n > 0);
  // Whole percentages that always add up to 100 (largest remainder).
  const raw = parts.map(x => x.n / judged.length * 100), floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - floors[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { floors[i]++; left--; } });
  return <div className="web-split">
    <div className="lbl">{label}{noun && <span> · {judged.length} {noun}{period ? ` from the ${period}` : ""}</span>}</div>
    <div className="stack" role="img" aria-label={parts.map((x, i) => `${floors[i]}% ${sentimentLabel[x.s].toLowerCase()}`).join(", ")}>
      {parts.map(x => <i key={x.s} className={`s-${x.s}`} style={{width: `${x.n / judged.length * 100}%`}}/>)}
    </div>
    <div className="legend">{parts.map((x, i) => <span key={x.s} className={`s-${x.s}`}>{floors[i]}% {sentimentLabel[x.s].toLowerCase()}</span>)}</div>
  </div>;
}

/** Neutral line for a product with no user ratings yet: how many web reviews it has, or nothing. */
export const webReviewsLine = (web: number) => web ? `${web} ${web === 1 ? "review" : "reviews"} from the web` : "";

export function RacketRow({racket: r, brand, average, count, web = 0, positive = null, details}: {racket: Racket; brand?: string | null; average: string | null; count: number; web?: number; positive?: number | null; details: string}) {
  // Right column: the star average once there are enough user ratings, and the share positive (user and web reviews) once enough are judged.
  return <article className="racket-row">
    <Thumb racket={r} brand={brand}/>
    <div><h2><a href={productHref(r)}>{displayName(r.name, brand)}</a></h2>{details && <p className="small muted">{details}</p>}</div>
    <div className="racket-score">
      {average && <><Score rating={Number(average)} size="sm"/><span><b>{average}</b> · {count} {count === 1 ? "rating" : "ratings"}</span></>}
      {(web > 0 || positive !== null) && <span>{positive !== null && <><b className="pos-share">{positive}%</b> positive{web > 0 ? " · " : ""}</>}{web > 0 && `${web} ${web === 1 ? "review" : "reviews"}`}</span>}
    </div>
  </article>;
}

/** A product row in the catalogue, type and brand pages: photo, name, what people praise and complain about, how positive
 *  its reviews are and how many there are. */
export function ProductCard({racket: r, brand, count, web = 0, details, tags, score: s}: {racket: Racket; brand?: string | null; count: number; web?: number; details: string; tags?: {loved?: string; complaint?: string}; score?: ScoreT}) {
  const total = count + web, href = productHref(r), pos = s ? positiveShare(s) : null;
  return <article className="prow">
    <a className="prow-art" href={href} aria-hidden="true" tabIndex={-1}><ProductArt product={r} brand={brand}/></a>
    <div className="prow-main">
      <h2><a href={href}>{displayName(r.name, brand)}</a></h2>
      {details && <p className="prow-details">{details}</p>}
      {(tags?.loved || tags?.complaint) && <p className="prow-tags">{tags.loved && <span className="tag pos"><span className="sr-only">Loved: </span>{tags.loved}</span>}{tags.complaint && <span className="tag neg"><span className="sr-only">Complaint: </span>{tags.complaint}</span>}</p>}
    </div>
    <div className="prow-score">{s && pos !== null ? <><SentimentBar positive={s.positive} mixed={s.mixed} negative={s.negative}/><span><b>{pos}%</b> positive</span></> : <span className="prow-few">Not enough reviews to score yet</span>}</div>
    <a className="prow-count" href={`${href}#reviews`}><b>{total.toLocaleString("en-US")}</b><span>{total === 1 ? "review" : "reviews"}</span></a>
  </article>;
}

/** Catalogue rows shown at first, and rows in the HTML: the rest of those open with "Show more" (no JavaScript), so the
 *  page stays short while search engines still see them; later rows are real ?show= links. */
export const ROWS_SHOWN = 30, ROWS_IN_HTML = 50;
export const parseShow = (v: string | undefined) => Math.min(Math.max(ROWS_SHOWN, Math.ceil((Number(v) || ROWS_SHOWN) / ROWS_SHOWN) * ROWS_SHOWN), 3000);
export function Directory({rows, show, moreHref}: {rows: ReactNode[]; show: number; moreHref: (show: number) => string}) {
  const shown = rows.slice(0, show), hidden = show < ROWS_IN_HTML ? rows.slice(show, ROWS_IN_HTML) : [];
  const more = rows.length > shown.length + hidden.length && <div className="load-more"><a className="button ghost" href={moreHref(Math.max(show, ROWS_IN_HTML) + ROWS_SHOWN)}>Show more</a></div>;
  return <div className="directory-list">
    <div className="prow-list">{shown}</div>
    {hidden.length > 0 ? <>
      <input type="checkbox" id="more-rows" className="more-toggle"/>
      <div className="more-hidden"><div className="prow-list">{hidden}</div>{more}</div>
      <div className="load-more first"><label htmlFor="more-rows" className="button ghost">Show more</label></div>
    </> : more}
  </div>;
}

/** Notes (player + web) per racket since a cutoff, most first. */
export function activity(data: Catalog, sinceMs: number) {
  const counts = new Map<string, number>();
  for (const item of [...data.reviews, ...data.external]) {
    if (Date.parse(item.createdAt) >= sinceMs) counts.set(item.racketId, (counts.get(item.racketId) ?? 0) + 1);
  }
  return [...counts].map(([id, count]) => ({ racket: data.rackets.find(r => r.id === id)!, count }))
    .filter(x => x.racket).sort((a, b) => b.count - a.count || a.racket.name.localeCompare(b.racket.name));
}

/** `data` is what the home feed shows (recent reviews); `all` is the whole catalogue, for the running totals. */
const brandsPath = "/brands";
export function Sidebar({data, all = data, minYear = -Infinity}: {data: Catalog; all?: Catalog; minYear?: number}) {
  // Running totals rather than "this week" (owner decision 2026-10-26): a quiet week shouldn't make a site look empty.
  const totalReviews = all.reviews.length + all.external.length;
  const count = (n: number) => n.toLocaleString("en-US");

  // All-time counts (owner decision 2026-10-28): a 30-day window thins out as fewer new reviews come in.
  const discussed = activity(all, 0).slice(0, 5);

  const notesFor = (id: string) => data.reviews.filter(r => r.racketId === id).length + data.external.filter(e => e.racketId === id).length;
  // Racket suggestions skip models older than minYear (padel's feedMaxAgeYears); brand counts still cover every racket.
  const suggestable = data.listed.filter(r => r.year >= minYear);
  const recentlyAdded = [...suggestable].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const topBrands = data.listedBrands.map(b => ({ b, count: data.listed.filter(r => r.brandId === b.id).length,
    reviews: [...data.reviews, ...data.external].filter(n => data.listed.find(r => r.id === n.racketId)?.brandId === b.id).length }))
    .sort((a, b) => b.reviews - a.reviews).slice(0, 8);
  const notes = (n: number) => n === 0 ? "no reviews yet" : `${n} ${n === 1 ? "review" : "reviews"}`;

  return <aside className="database-sidebar">
    <section className="week">
      <h2 className="sr-only">In numbers</h2>
      <dl>
        <dt>{count(totalReviews)}</dt><dd>{totalReviews === 1 ? "review" : "reviews"}</dd>
        <dt>{count(all.rackets.length)}</dt><dd>{`${w.many} in the database`}</dd>
      </dl>
    </section>

    {discussed.length > 0 && <section>
      <h2>Most discussed</h2>
      <ol className="rank">{discussed.map(({racket, count}) => <li key={racket.id}><a href={productHref(racket)}>
        <span className="nm">{racket.name}</span><span className="ct">{count}</span>
        <span className="bar"><i style={{width: `${Math.round(count / discussed[0].count * 100)}%`}}/></span>
      </a></li>)}</ol>
    </section>}

    <section>
      <h2>Browse by brand</h2>
      {/* The eight most-reviewed brands; the full list is one click away. */}
      <div className="chip-links">{topBrands.map(({ b, count }) =>
        <a key={b.id} href={`/brands/${b.slug}`}>{b.name} <span>{count}</span></a>)}</div>
      <a className="more-link" href={brandsPath}>All brands →</a>
    </section>

    {recentlyAdded.length > 0 && <section>
      <h2>Recently added</h2>
      <ul className="mini">{recentlyAdded.map(r => <li key={r.id}><a href={productHref(r)}>
        <ProductIcon shape={r.shape} brand={racketParts(r, data).brand}/><span className="nm">{r.name}<span className="mt">{notes(notesFor(r.id))}</span></span><span className="end">{shortDate(r.createdAt)}</span>
      </a></li>)}</ul>
    </section>}

  </aside>;
}
