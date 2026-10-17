import type { Catalog } from "../db/data";
import { Balls, RacketIcon, SourceIcon } from "./icons";

type Racket = Catalog["rackets"][number];
type PlayerReview = Catalog["reviews"][number];
type WebReview = Catalog["external"][number];

const DAY = 86_400_000;

export function Stars({rating}: {rating:number}) { return <Balls rating={rating}/>; }

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
  return <a className="racket-link" href={`/rackets/${racket.slug}`}>{brand && <span className="brand">{brand}</span>}<span className="model">{model}</span></a>;
}

function Thumb({racket}: {racket: Racket}) {
  return <a className="thumb" href={`/rackets/${racket.slug}`} aria-hidden="true" tabIndex={-1}><RacketIcon shape={racket.shape}/></a>;
}

function Avatar({alias}: {alias: string | null}) {
  if (!alias) return <span className="avatar anon" aria-hidden="true">?</span>;
  const tone = [...alias].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4;
  return <span className={`avatar${tone ? ` a${tone + 1}` : ""}`} aria-hidden="true">{alias.trim()[0]?.toUpperCase()}</span>;
}

function timeLabel(value: string) {
  return value === "Tried briefly" ? "tried briefly" : value;
}

const categories = [["Power","powerRating"],["Control","controlRating"],["Maneuverability","maneuverabilityRating"],["Comfort","comfortRating"],["Forgiveness","forgivenessRating"]] as const;

export function Review({review: r, data, showRacket = true}: {review: PlayerReview; data: Catalog; showRacket?: boolean}) {
  const racket = data.rackets.find(x => x.id === r.racketId)!;
  const details = [r.playerLevel, r.playingSide && `${r.playingSide} side`, r.playingStyle && !showRacket ? r.playingStyle : null, r.timeWithRacket && timeLabel(r.timeWithRacket)].filter(Boolean);
  const scores = categories.filter(([, key]) => r[key] != null);
  return <article className={showRacket ? "note" : "note compact"}>
    {showRacket && <Thumb racket={racket}/>}
    <header className="note-head">
      {showRacket && <RacketHeading racket={racket} data={data}/>}
      <Balls rating={r.rating}/>
    </header>
    <p className="note-body">{r.reviewText}</p>
    {!showRacket && scores.length > 0 && <div className="subscores-line">{scores.map(([label, key]) => <span key={key}>{label}<b>{r[key]}</b></span>)}</div>}
    <footer className="note-foot">
      <Avatar alias={r.alias}/>
      <span className="who"><b>{r.alias || "anonymous"}</b>{details.map(d => <span key={d}><span className="dot">·</span>{d}</span>)}</span>
      <time dateTime={r.createdAt}>{shortDate(r.createdAt)}</time>
    </footer>
  </article>;
}

export function External({entry: e, data, showRacket = true}: {entry: WebReview; data: Catalog; showRacket?: boolean}) {
  const racket = data.rackets.find(r => r.id === e.racketId)!;
  return <article className={showRacket ? "note ext" : "note compact ext"}>
    {showRacket && <Thumb racket={racket}/>}
    {showRacket && <header className="note-head"><RacketHeading racket={racket} data={data}/></header>}
    <div className="quote" style={showRacket ? undefined : {marginTop: 0}}>
      <p className="note-body">{e.excerpt}</p>
      <div className="cite">
        <SourceIcon platform={e.sourcePlatform}/>
        <b>{e.sourcePlatform}</b>{e.sourceName && e.sourceName !== e.sourcePlatform && <span>{e.sourceName}</span>}
        {e.sourceDate && <><span className="dot">·</span><time dateTime={e.sourceDate}>{shortDate(e.sourceDate, true)}</time></>}
        {e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">View original ↗</a> : <span className="pending-link">source link coming</span>}
      </div>
    </div>
  </article>;
}

export function RacketRow({racket: r, average, count, details}: {racket: Racket; average: string | null; count: number; details: string}) {
  return <article className="racket-row">
    <Thumb racket={r}/>
    <div><h2><a href={`/rackets/${r.slug}`}>{r.name}</a></h2>{details && <p className="small muted">{details}</p>}</div>
    <div className="racket-score">{average ? <><Balls rating={Number(average)} size="sm"/><span><b>{average}</b> · {count} {count === 1 ? "rating" : "ratings"}</span></> : <span>no ratings yet</span>}</div>
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
  const notes = (n: number) => n === 0 ? "no notes yet" : `${n} ${n === 1 ? "note" : "notes"}`;

  return <aside className="database-sidebar">
    <section className="week">
      {weekPlayers + weekWeb > 0 ? <>
        <h2>This week <small>last 7 days</small></h2>
        <dl>
          <dt>{weekPlayers + weekWeb}</dt><dd>new {weekPlayers + weekWeb === 1 ? "note" : "notes"}, {weekPlayers} from players</dd>
          <dt>{weekRackets}</dt><dd>{weekRackets === 1 ? "racket" : "rackets"} talked about</dd>
          <dt>{data.rackets.length}</dt><dd>rackets in the database</dd>
        </dl>
      </> : <>
        <h2>So far</h2>
        <dl>
          <dt>{data.reviews.length}</dt><dd>notes from players</dd>
          <dt>{data.external.length}</dt><dd>quoted from around the web</dd>
          <dt>{data.rackets.length}</dt><dd>rackets in the database</dd>
        </dl>
      </>}
    </section>

    {discussed.length > 0 && <section>
      <h2>Most discussed <small>{discussedLabel}</small></h2>
      <ol className="rank">{discussed.map(({racket, count}) => <li key={racket.id}><a href={`/rackets/${racket.slug}`}>
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
      <a className="more-link" href="/rackets">All rackets →</a>
    </section>

    {recentlyAdded.length > 0 && <section>
      <h2>Recently added</h2>
      <ul className="mini">{recentlyAdded.map(r => <li key={r.id}><a href={`/rackets/${r.slug}`}>
        <RacketIcon shape={r.shape}/><span className="nm">{r.name}<span className="mt">{notes(notesFor(r.id))}</span></span><span className="end">{shortDate(r.createdAt)}</span>
      </a></li>)}</ul>
    </section>}

    {lonely.length > 0 && <section>
      <h2>Lonely rackets</h2>
      <p className="side-note">Hardly any notes yet. Played one? Keep it company.</p>
      <ul className="mini">{lonely.map(({racket, count}) => <li key={racket.id}><a href={`/add-review?racket=${racket.id}`}>
        <RacketIcon shape={racket.shape}/><span className="nm">{racket.name}<span className="mt">{notes(count)}</span></span><span className="end">+ add</span>
      </a></li>)}</ul>
    </section>}
  </aside>;
}
