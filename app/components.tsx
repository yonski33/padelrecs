import type { Catalog } from "../db/data";
import { Score, ProductIcon, SourceIcon } from "./icons";
import { TagList } from "./tags";
import { HelpfulButton } from "./helpful-button";
import { niche, catalogPath } from "../lib/niche";
import type { ProfileField } from "../lib/niche/types";

type Racket = Catalog["rackets"][number];
type PlayerReview = Catalog["reviews"][number];
type WebReview = Catalog["external"][number];

const DAY = 86_400_000;
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

function RacketHeading({racket, data}: {racket: Racket; data: Catalog}) {
  const { brand, model } = racketParts(racket, data);
  return <a className="racket-link" href={`${catalogPath}/${racket.slug}`}>{brand && <span className="brand">{brand}</span>}<span className="model">{model}</span></a>;
}

function Thumb({racket, brand}: {racket: Racket; brand?: string | null}) {
  return <a className="thumb" href={`${catalogPath}/${racket.slug}`} aria-hidden="true" tabIndex={-1}><ProductIcon shape={racket.shape} brand={brand}/></a>;
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

export function Review({review: r, data, showRacket = true}: {review: PlayerReview; data: Catalog; showRacket?: boolean}) {
  const racket = data.rackets.find(x => x.id === r.racketId)!;
  const details = [r.playerLevel && profileLabel("playerLevel", r.playerLevel), r.playingSide && profileLabel("playingSide", r.playingSide), r.playingStyle && !showRacket ? profileLabel("playingStyle", r.playingStyle) : null, r.timeWithRacket && profileLabel("timeWithRacket", r.timeWithRacket)].filter(Boolean);
  const scores = categories.filter(([, key]) => r[key] != null);
  return <article className={showRacket ? "note" : "note compact"}>
    {showRacket && <Thumb racket={racket} brand={racketParts(racket, data).brand}/>}
    <header className="note-head">
      {showRacket && <RacketHeading racket={racket} data={data}/>}
      <Score rating={r.rating}/>
    </header>
    <p className="note-body">{r.reviewText}</p>
    <TagList tags={r.tags}/>
    {!showRacket && scores.length > 0 && <div className="subscores-line">{scores.map(([label, key]) => <span key={key}>{label}<b>{r[key]}</b></span>)}</div>}
    <footer className="note-foot">
      <Avatar alias={r.alias}/>
      <span className="who"><b>{r.alias || "anonymous"}</b>{details.map(d => <span key={d}><span className="dot">·</span>{d}</span>)}</span>
      <time dateTime={r.createdAt}>{shortDate(r.createdAt)}</time>
      <HelpfulButton type="player" id={r.id} count={r.helpful}/>
    </footer>
  </article>;
}

export function External({entry: e, data, showRacket = true}: {entry: WebReview; data: Catalog; showRacket?: boolean}) {
  const racket = data.rackets.find(r => r.id === e.racketId)!;
  const source = <><SourceIcon platform={e.sourcePlatform}/><b>{e.sourcePlatform}</b>{e.sourceName && e.sourceName !== e.sourcePlatform && <span>{e.sourceName}</span>}</>;
  return <article className={showRacket ? "note ext" : "note compact ext"}>
    {showRacket && <Thumb racket={racket} brand={racketParts(racket, data).brand}/>}
    {showRacket && <header className="note-head"><RacketHeading racket={racket} data={data}/></header>}
    <div className="quote" style={showRacket ? undefined : {marginTop: 0}}>
      {e.summary ? <>
        {/* Our summary of the source's experience (written in the third person), then the source's exact words. */}
        <p className="note-body summary">{e.summary}</p>
        {e.excerpt && <blockquote className="source-quote">“{e.excerpt}”</blockquote>}
      </> : <p className="note-body">{e.excerpt}</p>}
      <TagList tags={e.tags} lead={e.sentiment && <SentimentBadge sentiment={e.sentiment}/>}/>
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
export function WebSplit({entries, min = 3}: {entries: {sentiment: keyof typeof sentimentLabel | null}[]; min?: number}) {
  const judged = entries.flatMap(e => e.sentiment ? [e.sentiment] : []);
  if (judged.length < min) return null;
  const parts = (["positive", "mixed", "negative"] as const).map(s => ({ s, n: judged.filter(x => x === s).length })).filter(x => x.n > 0);
  // Whole percentages that always add up to 100 (largest remainder).
  const raw = parts.map(x => x.n / judged.length * 100), floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - floors[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { floors[i]++; left--; } });
  return <div className="web-split">
    <div className="lbl">Around the web <span>· {judged.length} comments</span></div>
    <div className="stack" role="img" aria-label={parts.map((x, i) => `${floors[i]}% ${sentimentLabel[x.s].toLowerCase()}`).join(", ")}>
      {parts.map(x => <i key={x.s} className={`s-${x.s}`} style={{width: `${x.n / judged.length * 100}%`}}/>)}
    </div>
    <div className="legend">{parts.map((x, i) => <span key={x.s} className={`s-${x.s}`}>{floors[i]}% {sentimentLabel[x.s].toLowerCase()}</span>)}</div>
  </div>;
}

/** Neutral line for a product with no user ratings yet: how many web reviews it has, or nothing. */
export const webReviewsLine = (web: number) => web ? `${web} ${web === 1 ? "review" : "reviews"} from the web` : "";

export function RacketRow({racket: r, brand, average, count, web = 0, positive = null, details}: {racket: Racket; brand?: string | null; average: string | null; count: number; web?: number; positive?: number | null; details: string}) {
  // Right column: the user rating when there is one, and the web picture (share positive once there are enough judged reviews).
  return <article className="racket-row">
    <Thumb racket={r} brand={brand}/>
    <div><h2><a href={`${catalogPath}/${r.slug}`}>{r.name}</a></h2>{details && <p className="small muted">{details}</p>}</div>
    <div className="racket-score">
      {average && <><Score rating={Number(average)} size="sm"/><span><b>{average}</b> · {count} {count === 1 ? "rating" : "ratings"}</span></>}
      {web > 0 && <span>{positive !== null && <><b className="pos-share">{positive}%</b> positive · </>}{webReviewsLine(web)}</span>}
    </div>
  </article>;
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

export function Sidebar({data}: {data: Catalog}) {
  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const weekPlayers = data.reviews.filter(r => Date.parse(r.createdAt) >= weekAgo).length;
  const weekWeb = data.external.filter(e => Date.parse(e.createdAt) >= weekAgo).length;
  const weekRackets = activity(data, weekAgo).length;

  const recent = activity(data, now - 30 * DAY);
  const discussed = (recent.length >= 3 ? recent : activity(data, 0)).slice(0, 5);
  const discussedLabel = recent.length >= 3 ? "30 days" : "all time";

  const notesFor = (id: string) => data.reviews.filter(r => r.racketId === id).length + data.external.filter(e => e.racketId === id).length;
  const recentlyAdded = [...data.rackets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const lonely = data.rackets.map(r => ({ racket: r, count: notesFor(r.id) })).filter(x => x.count <= 2)
    .sort((a, b) => a.count - b.count || b.racket.createdAt.localeCompare(a.racket.createdAt)).slice(0, 3);
  const notes = (n: number) => n === 0 ? "no reviews yet" : `${n} ${n === 1 ? "review" : "reviews"}`;

  return <aside className="database-sidebar">
    <section className="week">
      {weekPlayers + weekWeb > 0 ? <>
        <h2>This week <small>last 7 days</small></h2>
        <dl>
          <dt>{weekPlayers + weekWeb}</dt><dd>new {weekPlayers + weekWeb === 1 ? "review" : "reviews"}, {weekPlayers}{` from ${niche.people.many}`}</dd>
          <dt>{weekRackets}</dt><dd>{weekRackets === 1 ? w.one : w.many} talked about</dd>
          <dt>{data.rackets.length}</dt><dd>{`${w.many} in the database`}</dd>
        </dl>
      </> : <>
        <h2>So far</h2>
        <dl>
          <dt>{data.reviews.length}</dt><dd>{`reviews from ${niche.people.many}`}</dd>
          <dt>{data.external.length}</dt><dd>quoted from around the web</dd>
          <dt>{data.rackets.length}</dt><dd>{`${w.many} in the database`}</dd>
        </dl>
      </>}
    </section>

    {discussed.length > 0 && <section>
      <h2>Most discussed <small>{discussedLabel}</small></h2>
      <ol className="rank">{discussed.map(({racket, count}) => <li key={racket.id}><a href={`${catalogPath}/${racket.slug}`}>
        <span className="nm">{racket.name}</span><span className="ct">{count}</span>
        <span className="bar"><i style={{width: `${Math.round(count / discussed[0].count * 100)}%`}}/></span>
      </a></li>)}</ol>
    </section>}

    <section>
      <h2>Browse by brand</h2>
      <div className="chip-links">{data.brands.map(b => {
        const count = data.rackets.filter(r => r.brandId === b.id).length;
        return <a key={b.id} href={`/brands/${b.slug}`}>{b.name} <span>{count}</span></a>;
      })}</div>
      <a className="more-link" href={catalogPath}>{`All ${w.many} →`}</a>
    </section>

    {recentlyAdded.length > 0 && <section>
      <h2>Recently added</h2>
      <ul className="mini">{recentlyAdded.map(r => <li key={r.id}><a href={`${catalogPath}/${r.slug}`}>
        <ProductIcon shape={r.shape} brand={racketParts(r, data).brand}/><span className="nm">{r.name}<span className="mt">{notes(notesFor(r.id))}</span></span><span className="end">{shortDate(r.createdAt)}</span>
      </a></li>)}</ul>
    </section>}

    {lonely.length > 0 && <section>
      <h2>{`Lonely ${w.many}`}</h2>
      <p className="side-note">{`Hardly any reviews yet. ${niche.copy.ui.triedOne} Keep it company.`}</p>
      <ul className="mini">{lonely.map(({racket, count}) => <li key={racket.id}><a href={`/add-review?racket=${racket.id}`}>
        <ProductIcon shape={racket.shape} brand={racketParts(racket, data).brand}/><span className="nm">{racket.name}<span className="mt">{notes(count)}</span></span><span className="end">+ add</span>
      </a></li>)}</ul>
    </section>}
  </aside>;
}
