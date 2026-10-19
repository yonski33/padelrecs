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
  return <article className={showRacket ? "note ext" : "note compact ext"}>
    {showRacket && <Thumb racket={racket} brand={racketParts(racket, data).brand}/>}
    {showRacket && <header className="note-head"><RacketHeading racket={racket} data={data}/></header>}
    <div className="quote" style={showRacket ? undefined : {marginTop: 0}}>
      {e.summary ? <>
        {/* Our summary of the source's experience, then the source's exact words as evidence. */}
        <p className="summary-label">{`${niche.site.name} summary`}</p>
        <p className="note-body">{e.summary}</p>
        {e.excerpt && <blockquote className="source-quote">“{e.excerpt}”<span>In their words</span></blockquote>}
      </> : <p className="note-body">{e.excerpt}</p>}
      <TagList tags={e.tags}/>
      <div className="cite">
        <SourceIcon platform={e.sourcePlatform}/>
        <b>{e.sourcePlatform}</b>{e.sourceName && e.sourceName !== e.sourcePlatform && <span>{e.sourceName}</span>}
        {e.sourceDate && <><span className="dot">·</span><time dateTime={e.sourceDate}>{shortDate(e.sourceDate, true)}</time></>}
        {e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">View original ↗</a> : <span className="pending-link">source link coming</span>}
      </div>
    </div>
    <footer className="note-foot ext-foot"><HelpfulButton type="web" id={e.id} count={e.helpful}/></footer>
  </article>;
}

export function RacketRow({racket: r, brand, average, count, details}: {racket: Racket; brand?: string | null; average: string | null; count: number; details: string}) {
  return <article className="racket-row">
    <Thumb racket={r} brand={brand}/>
    <div><h2><a href={`${catalogPath}/${r.slug}`}>{r.name}</a></h2>{details && <p className="small muted">{details}</p>}</div>
    <div className="racket-score">{average ? <><Score rating={Number(average)} size="sm"/><span><b>{average}</b> · {count} {count === 1 ? "rating" : "ratings"}</span></> : <span>no ratings yet</span>}</div>
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
