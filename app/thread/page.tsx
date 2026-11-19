// Thread home (Home Thread v4): the community card with Find my match, the top rackets, how players rate them by trait, the
// latest player reviews and web summaries, and the rankings. proxy.ts serves it for "/" (lib/thread/look.ts).
import type { Metadata } from "next";
import { Shell } from "./shell";
import { homeMetadata } from "../home-metadata";
import { liveOr } from "./seo";
import { DEFAULT_CHOICE } from "../../lib/quick-match";
import { threadRows, threadBoards, threadFeed } from "./data";
import { threadRankings } from "./rankings-data";
import { MatchBox, HomeList } from "./live/lists";
import { Feed, type FeedCard } from "./live/feed";
import { Boards } from "./boards";
import { SideBox, LinkList, NarrowLinks, SOURCE, ago } from "./ui";
import { th } from "../../lib/thread/look";

export const revalidate = 21600;
// The live home's title, description, canonical and share card (app/home-metadata.ts).
export const generateMetadata = (): Promise<Metadata> => liveOr(() => homeMetadata(DEFAULT_CHOICE, false));

export default async function ThreadHome() {
  const [{ all, rows }, boards, lists, feed] = await Promise.all([threadRows(), threadBoards(), threadRankings(), threadFeed()]);
  const scored = all.filter(r => r.score != null);
  const top = [...scored].sort((a, b) => b.score! - a.score! || b.n - a.n).slice(0, 10);
  const reviewed = [...scored].sort((a, b) => b.n - a.n).slice(0, 10);
  const now = Date.now();
  const card = (f: (typeof feed)[number]): FeedCard | null => { const r = rows.get(f.racketId); return r ? { id: f.id, kind: f.kind, who: f.who, text: f.text, when: ago(f.date, now), verdict: f.verdict, url: f.url, racket: { name: r.name, href: r.href, pic: r.pic } } : null; };
  const cards = feed.slice(0, 60).flatMap(f => card(f) ?? []);
  const web = feed.filter(f => f.kind !== "player" && rows.has(f.racketId)).slice(0, 3);
  const rankLinks = lists.slice(0, 8).map(l => ({ label: l.label, href: l.href }));
  const names = Object.fromEntries(all.map(r => [r.id, r.name]));
  return <Shell>
    <main className="th-main">
      <div className="th-col">
        <section className="th-card th-hero">
          <h1 className="th-h1">The padel racket community</h1>
          <p className="th-lead">Real players talking rackets. Share your take, and see what everyone actually thinks.</p>
          <MatchBox names={names}/>
        </section>
        <HomeList rows={top} reviewed={reviewed}/>
        {boards.length > 0 && <Boards boards={boards}/>}
        {cards.length > 0 && <Feed cards={cards}/>}
        <NarrowLinks title="Rankings" links={rankLinks}/>
      </div>
      <aside className="th-side">
        <SideBox title="Rankings"><LinkList links={rankLinks}/></SideBox>
        {web.length > 0 && <section className="th-card th-sec" style={{ padding: "12px 14px", gap: 8 }}>
          <span className="th-stitle">New from around the web</span>
          {web.map(w => { const r = rows.get(w.racketId)!, [label, cls] = SOURCE[w.kind as keyof typeof SOURCE];
            return <a key={w.id} className="th-web" href={th(`${r.href}#reviews`)}>
              <span className="th-web-src"><span className={`th-tag ${cls}`}>{label}</span>{w.who}</span>
              <b>{r.name}</b><span className="l">{w.text.length > 110 ? `${w.text.slice(0, w.text.lastIndexOf(" ", 106))}…` : w.text}</span>
            </a>; })}
        </section>}
      </aside>
    </main>
  </Shell>;
}
