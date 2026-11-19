// Thread guides (Racket, Beginner tips, Shape, Side, Elbow): title, TL;DR, numbered steps, the racket picks from the live
// rankings, and the sidebar with On this page and More guides. proxy.ts serves /guide and /guides/<x> with ?look=thread.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { threadRows } from "../../data";
import { threadRankings } from "../../rankings-data";
import { GUIDES, GUIDE_LINK_LABELS, GUIDE_UI } from "../../../../lib/thread/copy";
import { GUIDE_KEYS, GUIDE_PATHS, type GuideKey } from "../../../../lib/thread/look";
import { Row, SideBox, LinkList, NarrowLinks, type ThreadRow } from "../../ui";
import { th } from "../../../../lib/thread/look";

export const revalidate = 21600;
export const dynamicParams = false;
export function generateStaticParams() { return GUIDE_KEYS.map(key => ({ key })); }
type P = { params: Promise<{ key: string }> };
const guideOf = (key: string) => GUIDES.find(g => g.key === key);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const g = guideOf((await params).key);
  return g ? { title: { absolute: `${g.seoTitle} | PadelRecs` }, description: g.description } : {};
}

/** Which rackets each guide lists: one per shape, or a ranking's top, or each side's (control for the right, power for the left). */
async function picksFor(key: GuideKey): Promise<{ title?: string; rows: ThreadRow[] }[]> {
  const [{ all, rows }, lists] = await Promise.all([threadRows(), threadRankings()]);
  const top = (slugPart: string, n: number) => (lists.find(l => l.slug.includes(slugPart))?.ids ?? []).slice(0, n).map(id => rows.get(id)!).filter(Boolean);
  const bestOfShape = (shape: string, n: number) => all.filter(r => r.score != null && r.n >= 10 && r.shape?.toLowerCase() === shape).sort((a, b) => b.score! - a.score!).slice(0, n);
  if (key === "racket") return [{ rows: ["round", "teardrop", "diamond"].flatMap(s => bestOfShape(s, 1)) }];
  if (key === "shape") return [{ rows: ["round", "teardrop", "diamond"].flatMap(s => bestOfShape(s, 2)) }];
  if (key === "beginner") return [{ rows: top("for-beginners", 4) }];
  if (key === "elbow") return [{ rows: top("for-sore-arms", 4) }];
  return [{ title: "Right side", rows: top("best-control", 3) }, { title: "Left side", rows: top("best-power", 3) }];
}

export default async function ThreadGuide({ params }: P) {
  const { key } = await params;
  const g = guideOf(key);
  if (!g) notFound();
  const picks = await picksFor(g.key);
  const others = GUIDE_KEYS.filter(k => k !== g.key).map(k => ({ label: GUIDE_LINK_LABELS[k], href: GUIDE_PATHS[k] }));
  const fullRanking = g.key === "beginner" ? "/rankings/best-padel-rackets-for-beginners" : g.key === "elbow" ? "/rankings/best-padel-rackets-for-sore-arms" : "/rankings/best-padel-rackets";
  const lime = Number((g.extra as { highlightFirstSteps?: number } | undefined)?.highlightFirstSteps ?? g.steps.length);
  const picksTitle = g.picksTitle.replace(/\bvote for\b/, "rate highest");
  return <Shell active="guides">
    <main className="th-main">
      <div className="th-col">
        <div className="th-crumbs"><a href={th(GUIDE_PATHS.racket)}>{GUIDE_UI.crumbRoot}</a><span>/</span><span>{g.crumb}</span></div>
        <article className="th-card th-hero">
          <h1 className="th-h1">{g.title}</h1>
          <div className="th-tldr"><div className="th-tldr-h">{GUIDE_UI.tldrLabel}</div>
            {g.tldrLead && <p>{g.tldrLead}</p>}
            {g.tldr.length > 0 && <ul>{g.tldr.map(t => <li key={t}><span className="th-sdot pos"/><span>{t}</span></li>)}</ul>}
          </div>
        </article>
        <section className="th-card th-steps">
          <h2 className="th-h2" style={{ padding: "0 0 6px" }}>{g.stepsTitle}</h2>
          {g.steps.map((s, i) => <div key={s.title} id={`tip-${i + 1}`} className="th-step">
            <span className="th-num" style={i < lime ? undefined : { background: "#fff" }}>{i + 1}</span>
            <div><h3>{s.title}</h3><p>{s.body}</p></div>
          </div>)}
        </section>
        {picks.some(p => p.rows.length) && <section className="th-card th-list">
          <div className="th-head-row" style={{ marginBottom: 6 }}><h2 className="th-h2">{picksTitle}</h2><a className="th-link-b" href={th(fullRanking)}>{GUIDE_UI.fullRanking}</a></div>
          {picks.map((p, i) => p.rows.length > 0 && <div key={i}>{p.title && <h3 className="th-sub-h">{p.title}</h3>}{p.rows.map(r => <Row key={r.id} r={r}/>)}</div>)}
        </section>}
        <NarrowLinks title={GUIDE_UI.moreGuides} links={others}/>
      </div>
      <aside className="th-side">
        {g.onThisPage.length > 0 && <section className="th-card th-sbox"><div className="th-sbox-head">{GUIDE_UI.onThisPage}</div><div className="th-sbox-body">
          {g.onThisPage.map((t, i) => <a key={t} className="th-slink" href={`#tip-${i + 1}`}><span>{`${i + 1}. ${t}`}</span><span aria-hidden="true">↓</span></a>)}
        </div></section>}
        <SideBox title={GUIDE_UI.moreGuides}><LinkList links={others}/></SideBox>
      </aside>
    </main>
  </Shell>;
}
