export const dynamic = "force-dynamic";
import { catalog } from "../db/data";
import { Review, External, Sidebar } from "./components";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ source?: string | string[] }>;
}) {
  const [data, params] = await Promise.all([catalog(), searchParams]);
  const source = params.source === "players" || params.source === "web" ? params.source : "all";
  const sources = [
    { value: "all", label: "All", count: data.reviews.length + data.external.length, href: "/" },
    { value: "players", label: "From players", count: data.reviews.length, href: "/?source=players" },
    { value: "web", label: "From around the web", count: data.external.length, href: "/?source=web" },
  ];
  const items = [
    ...(source !== "web" ? data.reviews.map(r => ({ date: r.createdAt, key: `player-${r.id}`, node: <Review review={r} data={data}/> })) : []),
    ...(source !== "players" ? data.external.map(e => ({ date: e.createdAt, key: `web-${e.id}`, node: <External entry={e} data={data}/> })) : []),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return <main className="home"><div className="columns"><div>
    <div className="feed-heading">
      <h1 className="feed-title">Latest player notes</h1>
      <nav className="source-nav" aria-label="Note sources">
        {sources.map(item => <a key={item.value} href={item.href} aria-current={source === item.value ? "page" : undefined}>
          {item.label} <span className="source-count">{item.count.toLocaleString("en-US")}</span>
        </a>)}
      </nav>
    </div>
    {items.map(i => <div key={i.key}>{i.node}</div>)}
    {items.length === 0 && <p className="small muted">No notes from this source yet.</p>}
    <p className="end-note"><a href="/add-review">Add a review →</a></p>
  </div><Sidebar data={data}/></div></main>;
}
