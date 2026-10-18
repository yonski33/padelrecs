export const dynamic = "force-dynamic";
import { Fragment } from "react";
import type { Metadata } from "next";
import { catalog } from "../db/data";
import { Review, External, Sidebar, activity, racketParts } from "./components";
import { RacketIcon } from "./icons";
import { LoadMore } from "./load-more";

const DAY = 86_400_000;
const PAGE = 24;

const homeTitle = "PadelRecs – Real Player Reviews of Padel Rackets";
const homeDescription = "Browse real padel racket reviews from players and opinions collected from Reddit, YouTube, shops, and forums. Compare experiences across Nox, Bullpadel, Adidas, Head, and more.";
export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: { title: homeTitle, description: homeDescription, url: "/", type: "website" },
};

// "Today", "Yesterday", a weekday within the last week, otherwise the full date (UTC, like the stored timestamps).
function dayLabel(iso: string, now: Date) {
  const day = iso.slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const diff = Math.round((Date.parse(today) - Date.parse(day)) / DAY);
  const date = new Date(day + "T00:00:00Z");
  const short = date.toLocaleDateString("en-GB", {weekday: "short", day: "numeric", month: "short", timeZone: "UTC"});
  if (diff === 0) return { title: "Today", sub: short };
  if (diff === 1) return { title: "Yesterday", sub: short };
  if (diff > 1 && diff < 7) return { title: date.toLocaleDateString("en-GB", {weekday: "long", timeZone: "UTC"}), sub: date.toLocaleDateString("en-GB", {day: "numeric", month: "short", timeZone: "UTC"}) };
  return { title: date.toLocaleDateString("en-GB", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}), sub: "" };
}

export default async function Home({ searchParams }: {
  searchParams: Promise<{ source?: string | string[]; show?: string | string[] }>;
}) {
  const [data, params] = await Promise.all([catalog(), searchParams]);
  const now = new Date();
  const source = params.source === "players" || params.source === "web" ? params.source : "all";
  // How many notes to show: 24 at first, 24 more per "Load more" click (kept in the URL so it's linkable and crawlable).
  const requested = Number(Array.isArray(params.show) ? params.show[0] : params.show);
  const show = Number.isFinite(requested) ? Math.min(2400, Math.max(PAGE, Math.ceil(requested / PAGE) * PAGE)) : PAGE;
  const sources = [
    { value: "all", label: "All", count: data.reviews.length + data.external.length, href: "/" },
    { value: "players", label: "From players", count: data.reviews.length, href: "/?source=players" },
    { value: "web", label: "From around the web", count: data.external.length, href: "/?source=web" },
  ];
  const items = [
    ...(source !== "web" ? data.reviews.map(r => ({ date: r.createdAt, key: `player-${r.id}`, node: <Review review={r} data={data}/> })) : []),
    ...(source !== "players" ? data.external.map(e => ({ date: e.createdAt, key: `web-${e.id}`, node: <External entry={e} data={data}/> })) : []),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const weekNotes = [...data.reviews, ...data.external].filter(x => Date.parse(x.createdAt) >= now.getTime() - 7 * DAY).length;

  // Popular strip: most notes this week, or this month when the week is quiet. Hidden if there's nothing to rank.
  const week = activity(data, now.getTime() - 7 * DAY);
  const month = activity(data, now.getTime() - 30 * DAY);
  const popular = (week.length >= 2 ? week : month).slice(0, 4);
  const popularLabel = week.length >= 2 ? "this week" : "this month";
  const strip = popular.length >= 2 && <section className="strip" aria-label={`Popular ${popularLabel}`}>
    <div className="strip-head"><h2>Popular <em>{popularLabel}</em></h2><span>most new reviews</span></div>
    <ol>{popular.map(({racket, count}) => { const {brand, model} = racketParts(racket, data); return <li key={racket.id}><a href={`/rackets/${racket.slug}`}>
      <RacketIcon shape={racket.shape} brand={brand}/><span className="nm">{model}</span><span className="br">{brand}</span><span className="ct">+{count} {count === 1 ? "review" : "reviews"}</span>
    </a></li>; })}</ol>
  </section>;

  let lastDay = "";
  return <main className="home"><div className="columns"><div>
    <div className="feed-heading">
      <div>
        <h1 className="feed-title">Latest player reviews</h1>
        <p className="feed-sub">{weekNotes > 0 ? `${weekNotes} new this week, from players and from around the web.` : "From players, and from around the web with the source linked."}</p>
      </div>
      <nav className="source-nav" aria-label="Review sources">
        {sources.map(item => <a key={item.value} href={item.href} aria-current={source === item.value ? "page" : undefined}>
          {item.label}{item.value !== "all" && <span className="source-count">{item.count.toLocaleString("en-US")}</span>}
        </a>)}
      </nav>
    </div>
    {items.slice(0, show).map((item, index) => {
      const day = item.date.slice(0, 10);
      const label = day !== lastDay ? dayLabel(item.date, now) : null;
      lastDay = day;
      return <Fragment key={item.key}>
        {label && <h2 className="day">{label.title}{label.sub && <span>{label.sub}</span>}</h2>}
        {item.node}
        {index === 3 && strip}
      </Fragment>;
    })}
    {items.length > 0 && items.length < 4 && strip}
    {items.length === 0 && <p className="empty-feed">{source === "web" ? "Nothing quoted from around the web yet." : "No reviews here yet. Somebody has to go first."} <a href="/add-review">Add a review →</a></p>}
    {items.length > show && <LoadMore href={`/?${source !== "all" ? `source=${source}&` : ""}show=${show + PAGE}`}/>}
    {items.length > 0 && items.length <= show && <p className="end-note">You've reached the end. Played one of these? <a href="/add-review">Add your own review →</a></p>}
  </div><Sidebar data={data}/></div></main>;
}
