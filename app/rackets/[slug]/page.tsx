export const dynamic = "force-dynamic";
import { catalog, score } from "../../../db/data";
import { notFound } from "next/navigation";
import { Review, External, racketParts } from "../../components";
import { Balls, PlusIcon, RacketIcon, SourceIcon } from "../../icons";

const categories = [["Power","powerRating"],["Control","controlRating"],["Maneuverability","maneuverabilityRating"],["Comfort","comfortRating"],["Forgiveness","forgivenessRating"]] as const;
const pct = (n: number, total: number) => total ? `${Math.round(n / total * 100)}%` : "0%";

export default async function RacketPage({params, searchParams}: {params: Promise<{slug: string}>; searchParams: Promise<{source?: string | string[]}>}) {
  const [{slug}, query, data] = await Promise.all([params, searchParams, catalog()]);
  const r = data.rackets.find(r => r.slug === slug);
  if (!r) notFound();
  const brand = data.brands.find(b => b.id === r.brandId);
  const { model } = racketParts(r, data);
  const s = score(data, r.id);
  const reviews = data.reviews.filter(x => x.racketId === r.id);
  const external = data.external.filter(e => e.racketId === r.id);
  const source = query.source === "players" || query.source === "web" ? query.source : "all";

  const cats = categories.map(([label, key]) => {
    const vals = reviews.flatMap(x => x[key] == null ? [] : [x[key]!]);
    return { label, key, count: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  });
  const catPlayers = reviews.filter(x => categories.some(([, key]) => x[key] != null)).length;
  const tally = (values: (string | null)[], options: string[]) => options.map(o => ({ o, n: values.filter(v => v === o).length })).filter(x => x.n > 0);
  const sides = tally(reviews.map(x => x.playingSide), ["Left", "Right", "Both"]);
  const levels = tally(reviews.map(x => x.playerLevel), ["Competitive", "Advanced", "Intermediate", "Beginner"]);
  const sideTotal = sides.reduce((a, x) => a + x.n, 0), levelTotal = levels.reduce((a, x) => a + x.n, 0);
  const colors = ["var(--green)", "var(--lime)", "#e0d9c2", "#b9c9bd"];
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, count: reviews.filter(x => x.rating === n).length }));
  const distMax = Math.max(1, ...dist.map(d => d.count));

  const firstWord = model.split(" ")[0]?.toLowerCase();
  const siblings = data.rackets.filter(x => x.brandId === r.brandId && x.id !== r.id)
    .sort((a, b) => Number(racketParts(b, data).model.toLowerCase().startsWith(firstWord)) - Number(racketParts(a, data).model.toLowerCase().startsWith(firstWord)) || b.year - a.year)
    .slice(0, 5);
  const platforms = [...external.reduce((m, e) => m.set(e.sourcePlatform, (m.get(e.sourcePlatform) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);

  const items = [
    ...(source !== "web" ? reviews.map(x => ({ date: x.createdAt, key: `p-${x.id}`, node: <Review review={x} data={data} showRacket={false}/> })) : []),
    ...(source !== "players" ? external.map(e => ({ date: e.createdAt, key: `w-${e.id}`, node: <External entry={e} data={data} showRacket={false}/> })) : []),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const tabs = [
    { value: "all", label: "All", count: reviews.length + external.length, href: `/rackets/${r.slug}` },
    { value: "players", label: "From players", count: reviews.length, href: `/rackets/${r.slug}?source=players` },
    { value: "web", label: "From around the web", count: external.length, href: `/rackets/${r.slug}?source=web` },
  ];
  const specs: [string, string | number | null][] = [["Year", r.year], ["Shape", r.shape], ["Weight", r.weight], ["Balance", r.balance], ["Core", r.core], ["Surface", r.surface]];
  const addHref = `/add-review?racket=${r.id}`;

  return <main>
    <section className="profile">
      <div className="profile-art">
        <RacketIcon shape={r.shape}/>
        {r.shape && <small>{r.shape.toLowerCase()}</small>}
      </div>

      <div className="profile-info">
        <div className="titleblock">
          <div className="crumbs"><a href="/rackets">Rackets</a><span>/</span>{brand && <a href={`/brands/${brand.slug}`}>{brand.name}</a>}</div>
          {brand && <span className="brandline">{brand.name}</span>}
          <h1>{model}</h1>
          {r.description && <p className="description">{r.description}</p>}
        </div>
        <dl className="spec-strip">
          {specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className={v ? undefined : "unknown"}>{v || "—"}</dd></div>)}
        </dl>
      </div>

      <aside className="scorecard">
        {s.average ? <>
          <div className="big">{s.average}<small>/ 5</small></div>
          <Balls rating={Number(s.average)} size="lg"/>
          <p><b>{s.count}</b> player {s.count === 1 ? "rating" : "ratings"} · <b>{reviews.length + external.length}</b> notes</p>
        </> : <>
          <div className="no-score">No ratings yet</div>
          <p>{external.length ? `${external.length} quoted from around the web, but no player has rated it here yet.` : "Nobody has rated this one yet. Be the first."}</p>
        </>}
        <a className="button" href={addHref}><PlusIcon/>Add your note</a>
        <p className="hint">Played it? No account needed.</p>
      </aside>
    </section>

    <div className="columns">
      <div>
        {reviews.length > 0 && <div className="panels">
          <section className="panel">
            <h2>How it plays<small>{catPlayers} {catPlayers === 1 ? "player" : "players"}</small></h2>
            {catPlayers ? <ul className="cats">{cats.map(c => <li key={c.key}>
              <span>{c.label}</span><span className="track"><i style={{width: c.avg ? `${c.avg / 5 * 100}%` : 0}}/></span>
              <b className={c.avg ? undefined : "na"}>{c.avg ? c.avg.toFixed(1) : "—"}</b>
            </li>)}</ul> : <p className="empty">No category scores yet. They're optional when adding a review.</p>}
          </section>

          <section className="panel">
            <h2>Who's playing it</h2>
            {sideTotal > 0 && <div className="split">
              <div className="lbl">Side</div>
              <div className="stack">{sides.map((x, i) => <i key={x.o} style={{width: pct(x.n, sideTotal), background: colors[i]}}/>)}</div>
              <div className="legend">{sides.map((x, i) => <span key={x.o} style={{"--c": colors[i]} as React.CSSProperties}>{x.o} {pct(x.n, sideTotal)}</span>)}</div>
            </div>}
            {levelTotal > 0 && <div className="split">
              <div className="lbl">Level</div>
              <div className="stack">{levels.map((x, i) => <i key={x.o} style={{width: pct(x.n, levelTotal), background: colors[i]}}/>)}</div>
              <div className="legend">{levels.map((x, i) => <span key={x.o} style={{"--c": colors[i]} as React.CSSProperties}>{x.o} {x.n}</span>)}</div>
            </div>}
            <div className="split">
              <div className="lbl">Ratings</div>
              <ul className="dist">{dist.map(d => <li key={d.n}><span>{d.n}</span><span className="track"><i style={{width: `${d.count / distMax * 100}%`}}/></span><b>{d.count}</b></li>)}</ul>
            </div>
          </section>
        </div>}

        <div className="feed-heading">
          <h2 className="feed-title">Notes</h2>
          <nav className="source-nav" aria-label="Note sources">
            {tabs.map(t => <a key={t.value} href={t.href} aria-current={source === t.value ? "page" : undefined}>{t.label}<span className="source-count">{t.count}</span></a>)}
          </nav>
        </div>
        {items.map(i => <div key={i.key}>{i.node}</div>)}
        {items.length === 0 && <p className="empty-feed">{source === "web" ? "Nothing quoted from around the web yet." : "No player notes yet. This racket is waiting for its first review."} <a href={addHref}>Write one →</a></p>}
      </div>

      <aside className="database-sidebar">
        {siblings.length > 0 && <section>
          <h2>More from {brand?.name}</h2>
          <ul className="mini">{siblings.map(x => { const sc = score(data, x.id); return <li key={x.id}><a href={`/rackets/${x.slug}`}>
            <RacketIcon shape={x.shape}/><span className="nm">{x.name}<span className="mt">{sc.count ? `${sc.count} ${sc.count === 1 ? "rating" : "ratings"}` : "no ratings yet"}</span></span>
            {sc.average && <span className="end"><Balls rating={Number(sc.average)} size="sm"/></span>}
          </a></li>; })}</ul>
        </section>}

        {platforms.length > 0 && <section>
          <h2>Quotes come from</h2>
          <ul className="mini">{platforms.map(([p, n]) => <li key={p}><span className="row"><span className="src"><SourceIcon platform={p}/></span><span className="nm">{p}</span><span className="end">{n}</span></span></li>)}</ul>
          <p className="side-note" style={{marginTop: 8}}>Quoted opinions never count toward the player rating.</p>
        </section>}

        <section>
          <h2>About these ratings</h2>
          <p className="side-note">Only approved player reviews count toward the average. Every player note is checked for spam before it appears.</p>
        </section>
      </aside>
    </div>
  </main>;
}
