// StackRecs home (plan PR #517 section 5): Find my match and the top tools for it, top picks by vote per side, fresh
// reviews and the rankings. proxy.ts serves it for "/" (lib/thread/look.ts stackPath). Heading per the community voice
// rule: "Find your …", no subheader.
import type { Metadata } from "next";
import { Shell } from "../shell";
import { SideBox, LinkList, NarrowLinks, ago, type ThreadRow } from "../ui";
import { Feed, type FeedCard } from "../live/feed";
import { niche } from "../../../lib/niche";
import { th } from "../../../lib/thread/look";
import { STACK_BOARDS } from "../../../lib/stack/traits";
import { STACK_RANKINGS } from "../../../lib/stack/rankings";
import { stackData, matchInputs, boardTop, toolCards } from "./data";
import { StackHome } from "./live/match";

export const revalidate = 21600;
export const metadata: Metadata = { title: { absolute: niche.seo.homeTitle }, description: niche.seo.homeDescription, alternates: { canonical: "/" } };

export default async function StackHomePage() {
  const d = await stackData(), now = Date.now();
  const rows = Object.fromEntries(d.rows.map(r => [r.id, r as ThreadRow]));
  const cards: FeedCard[] = d.data ? d.rows.flatMap(r => toolCards(d.data!, r.id, now).map(c => ({ id: c.id, kind: c.kind, who: c.who, text: c.text, when: c.when, at: c.at,
    verdict: c.verdict, url: c.url, racket: { name: r.name, href: r.href, pic: r.pic } }))).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 40) : [];
  const boards = STACK_BOARDS.map(b => ({ b, top: boardTop(d, b.side, b.trait, b.choice) })).filter(x => x.top.length > 0);
  const links = STACK_RANKINGS.slice(0, 8).map(l => ({ label: l.label, href: `/rankings/${l.slug}` }));
  return <Shell>
    <main className="th-main">
      <div className="th-col">
        <StackHome inputs={matchInputs(d.rows)} rows={rows}><h1 className="th-h1">Find your stack</h1></StackHome>
        {boards.length > 0 && <section className="th-card th-sec">
          <div className="th-head-row"><h2 className="th-h2">Top picks by votes</h2></div>
          <div className="th-picks-row">{boards.map(({ b, top }) => <div key={b.slug} className="th-pick-list">
            <div className="th-pick-head"><b>{b.title}</b><a className="th-pick-all" href={th(`/rankings/${b.slug}`)}>See all ›</a></div>
            <ol>{top.map(({ r, n }, i) => <li key={r.id} className={i === 0 ? "first" : undefined}>
              <a href={th(r.href)}><span className="rk">{`${i + 1}.`}</span><span className="nm">{r.name}</span><span className="ct" title={`${n} votes`}>{n}</span></a></li>)}</ol>
          </div>)}</div>
        </section>}
        {cards.length > 0 && <Feed cards={cards} title="Fresh reviews"/>}
        <NarrowLinks title="Rankings" links={links}/>
      </div>
      <aside className="th-side">
        <SideBox title="Rankings"><LinkList links={links}/></SideBox>
        <SideBox title="How the score works"><p className="th-note" style={{ padding: "10px 14px", margin: 0 }}>
          Scores come only from votes and reviews. Newer opinions weigh more. A commission never changes a score.{" "}
          <a href={th("/how-we-make-these")}>More</a></p></SideBox>
      </aside>
    </main>
  </Shell>;
}
