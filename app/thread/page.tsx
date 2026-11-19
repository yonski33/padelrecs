// Thread home (Home Thread v4): the community card with Find my match, the top rackets, how players rate them by trait, the
// latest player reviews and web summaries, and the rankings. proxy.ts serves it for "/" (lib/thread/look.ts).
import type { Metadata } from "next";
import { Shell } from "./shell";
import { homeMetadata } from "../home-metadata";
import { liveOr } from "./seo";
import { DEFAULT_CHOICE } from "../../lib/quick-match";
import { threadRows, threadFeed, hasDb, homeTop, threadTopPicks, threadHomeSide } from "./data";
import { TopPicks } from "./top-picks";
import { homePayload, defaultHomeIds } from "../home-payload";
import { threadRankings } from "./rankings-data";
import { MatchBox, HomeList } from "./live/lists";
import { Ago } from "./live/ago";
import { Feed, type FeedCard } from "./live/feed";
import { SideBox, LinkList, NarrowLinks, SOURCE, ago } from "./ui";
import { th } from "../../lib/thread/look";
import { newThisWeek, WEEK_SHORT } from "../../lib/new-this-week";
import { commenterName } from "../../lib/thread/display-name";
import { niche } from "../../lib/niche";

export const revalidate = 21600;
// The live home's title, description, canonical and share card (app/home-metadata.ts).
export const generateMetadata = (): Promise<Metadata> => liveOr(() => homeMetadata(DEFAULT_CHOICE, false));

export default async function ThreadHome() {
  const [{ all, rows, ctx }, picks, lists, feed, payload, side] = await Promise.all([threadRows(), threadTopPicks(), threadRankings(), threadFeed(), hasDb() ? homePayload() : null, threadHomeSide()]);
  // The classic home's own order (curated picks first, one current row per model; app/home-payload.ts defaultHomeIds).
  const top = payload ? homeTop(rows, defaultHomeIds(payload, DEFAULT_CHOICE)) : [];
  const reviewed = all.filter(r => r.score != null && r.current).sort((a, b) => b.n - a.n).slice(0, 10);
  const now = Date.now();
  const card = (f: (typeof feed)[number]): FeedCard | null => { const r = rows.get(f.racketId); return r ? { id: f.id, kind: f.kind, who: f.who, text: f.text, when: ago(f.date, now), at: f.date, verdict: f.verdict, url: f.url, racket: { name: r.name, href: r.href, pic: r.pic } } : null; };
  const cards = feed.slice(0, 60).flatMap(f => card(f) ?? []);
  const web = feed.filter(f => f.kind !== "player" && rows.has(f.racketId)).slice(0, 3);
  const rankLinks = lists.slice(0, 8).map(l => ({ label: l.label, href: l.href }));
  const names = Object.fromEntries(all.map(r => [r.id, r.name]));
  // The live count, as classic's home pill (app/home-v2.tsx): every review and web opinion, and how many came in this week.
  const total = ctx ? ctx.data.reviews.length + ctx.data.external.length : 0, week = ctx ? newThisWeek(ctx.data, now) : 0;
  const listed = all.filter(r => r.current !== false && r.n > 0).length;
  // Phones have no sidebar: the same box sits under the list there.
  // "Latest from the comments" (owner 2026-11-19, replacing "Fresh off the court", which repeated Latest player reviews):
  // the newest comments and replies on racket pages, then "Busy this week" to make up 3; no block when both are empty.
  // No "All comments" link: there's no list page for them.
  const said = side.filter(x => x.kind === "comment"), busy = side.filter(x => x.kind === "busy");
  const sideBox = (only = "") => side.length > 0 && <section className={`th-card th-sec${only}`} style={{ padding: "12px 14px", gap: 8, flexDirection: "column" }}>
          <span className="th-stitle">{said.length ? "Latest from the comments" : "Busy this week"}</span>
          {said.map(c => { const r = rows.get(c.racketId)!;
            return <a key={c.id} className="th-web th-fresh" href={th(`${r.href}#comments`)}>
              <span className="th-web-src"><b>{commenterName(c.alias)}</b><span>{"· "}<Ago at={c.at} initial={ago(c.at, now)}/></span></span>
              <b>{r.name}</b><span className="l two">{c.body}</span>
            </a>; })}
          {said.length > 0 && busy.length > 0 && <span className="th-side-sub">Busy this week</span>}
          {busy.map(x => { const r = rows.get(x.racketId)!;
            return <a key={x.racketId} className="th-web th-busy" href={th(r.href)}><b>{r.name}</b><span className="n">{`${x.n.toLocaleString("en-US")} new`}</span></a>; })}
        </section>;
  return <Shell>
    <main className="th-main">
      <div className="th-col">
        <section className="th-card th-hero">
          <div className="th-h1-row"><h1 className="th-h1">{`The ${niche.id} ${niche.words.one} community`}</h1>
            {total > 0 && <span className="th-live"><i aria-hidden="true"/>{`${total.toLocaleString("en-US")} reviews${week > 0 ? ` · ${week.toLocaleString("en-US")} ${WEEK_SHORT}` : ""}`}</span>}</div>
          <p className="th-lead">{`Real players talking ${niche.words.many}. Share your take, and see what everyone actually thinks.`}</p>
          <MatchBox names={names} listed={listed}/>
        </section>
        <HomeList rows={top} reviewed={reviewed}/>
        {sideBox(" th-only-m")}
        {picks.lists.length > 0 && <TopPicks lists={picks.lists} total={picks.total} hrefs={Object.fromEntries(all.map(r => [r.id, r.href]))}/>}
        {cards.length > 0 && <Feed cards={cards}/>}
        <NarrowLinks title="Rankings" links={rankLinks}/>
      </div>
      <aside className="th-side">
        {sideBox()}
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
