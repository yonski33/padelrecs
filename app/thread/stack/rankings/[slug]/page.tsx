// One StackRecs ranking: its rows in order, with the side's other rankings alongside.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../../shell";
import { Row, SideBox, LinkList } from "../../../ui";
import { STACK_RANKINGS, rankingBySlug } from "../../../../../lib/stack/rankings";
import { stackData } from "../../data";
import { rankingRows } from "../rows";

export const revalidate = 21600;
export const generateStaticParams = () => STACK_RANKINGS.map(l => ({ slug: l.slug }));
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const l = rankingBySlug.get((await params).slug);
  return l ? { title: `${l.label} ${new Date().getUTCFullYear()}`, description: `${l.label}, ranked by community votes and reviews. ${l.blurb}`, alternates: { canonical: `/rankings/${l.slug}` } } : {};
}

export default async function StackRanking({ params }: P) {
  const l = rankingBySlug.get((await params).slug);
  if (!l) notFound();
  const rows = rankingRows(await stackData(), l);
  const others = STACK_RANKINGS.filter(x => x.side === l.side).map(x => ({ label: x.label, href: `/rankings/${x.slug}` }));
  return <Shell active="rankings">
    <main className="th-main">
      <div className="th-col">
        <section className="th-card th-hero"><h1 className="th-h1">{`${l.label} ${new Date().getUTCFullYear()}`}</h1><p className="th-lead">{l.blurb}</p></section>
        <section className="th-card th-list">
          {rows.map(({ r, n }, i) => <Row key={r.id} r={r} rank={i + 1} badgeLabel={n != null ? "votes" : "score"} {...(n != null ? { badge: n } : {})}/>)}
          {rows.length === 0 && <p className="th-empty">No tool has enough votes or reviews here yet.</p>}
        </section>
      </div>
      <aside className="th-side"><SideBox title={l.side === "build" ? "Build rankings" : "Grow rankings"}><LinkList links={others} current={`/rankings/${l.slug}`}/></SideBox></aside>
    </main>
  </Shell>;
}
