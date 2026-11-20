// Thread ranking page (Rankings Thread v2): no sort control; the ranking pills, the list (curated picks first on the site's own
// lists), how players rate them, questions answered from this list's own data, and "See how you match" beside it.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { threadRows, threadBoards } from "../../data";
import { threadRankings } from "../../rankings-data";
import { RankingList, SideMatch } from "../../live/lists";
import { Faq } from "../../live/faq";
import { Comments } from "../../live/comments";
import { niche } from "../../../../lib/niche";
import { Boards } from "../../boards";
import { SideBox, LinkList, NarrowLinks, plural } from "../../ui";
import { th } from "../../../../lib/thread/look";
import { generateMetadata as liveMetadata } from "../../../rankings/[slug]/page";
import { JsonLd, crumbs, base } from "../../seo";
import { W } from "../../../../lib/thread/words";

const { one: ONE, many: MANY } = niche.words;
const PICKLEBALL = niche.id === "pickleball", DG = niche.id === "discgolf";
/** The arm and shape FAQ lines, the site's own (PickleballRecs: its Rankings and Elbow Guide mocks). */
const ARM_TIP = PICKLEBALL ? "A soft core, a lighter paddle and a relaxed grip help most." : "A soft core, a lower balance and a lighter racket help most.";
const SHAPE_FAQ = DG
  ? { q: "Understable or overstable?", a: "Understable turns over and helps a slower arm fly straight and far. Overstable fights the wind and hooks left at the end. Not sure? Stable." }
  : PICKLEBALL
  ? { q: "Standard, hybrid or elongated?", a: "Standard is the most forgiving and quickest at the kitchen. Hybrid is the all-rounder. Elongated adds reach and drive power, with a smaller sweet spot." }
  : { q: "Round, teardrop or diamond?", a: "Round is the most forgiving and suits defenders. Teardrop is the all-rounder. Diamond adds smash power but needs better technique." };
export const revalidate = 21600;
export async function generateStaticParams() { return (await threadRankings()).map(l => ({ slug: l.slug })); }
type P = { params: Promise<{ slug: string }> };

// The site's own lists keep the live page's metadata (app/rankings/[slug]/page.tsx); a Thread-only list has its own.
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const l = (await threadRankings()).find(x => x.slug === slug);
  if (!l) return { title: "Ranking not found", robots: { index: false } };
  if (l.own) return liveMetadata({ params });
  const title = `${l.title}, ranked by real ${W.reviews}`, description = `${l.blurb} The top ${l.ids.length} by ${W.score}, from reviews by people who ${W.played} them.`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description, alternates: { canonical: l.href }, openGraph: { title, description, url: l.href, type: "website" } };
}

const names = (xs: { name: string }[]) => xs.length > 1 ? `${xs.slice(0, -1).map(x => x.name).join(", ")} and ${xs[xs.length - 1].name}` : xs[0]?.name ?? "";

export default async function ThreadRanking({ params }: P) {
  const { slug } = await params;
  const [lists, { rows }] = await Promise.all([threadRankings(), threadRows()]);
  const l = lists.find(x => x.slug === slug);
  if (!l) notFound();
  const list = l.ids.map(id => rows.get(id)!).filter(Boolean);
  const boards = await threadBoards(new Set(l.ids));
  const reviews = list.reduce((s, r) => s + r.n, 0);
  const beginner = list.filter(r => r.levels.includes("beginner")).slice(0, 3), arm = list.filter(r => r.arm).slice(0, 3);
  const faqs = [
    ...(beginner.length ? [{ q: `Which ${ONE} here is best for a beginner?`, a: `${names(beginner)} ${beginner.length > 1 ? "are" : "is"} the ones ${W.people} rate as fine for beginners on this list. Pick your level above to see your match.` }] : []),
    ...(arm.length ? [DG ? { q: "What if I have a slow arm?", a: `Throwers with slower arms speak best of ${names(arm)}. Lighter, understable discs with a speed of 7 or less help most.` }
      : { q: "What if I have tennis elbow?", a: `Players with sore arms speak best of ${names(arm)}. ${ARM_TIP}` }] : []),
    SHAPE_FAQ,
    { q: "How often does this ranking change?", a: `Scores update as new reviews come in, so ${MANY} can move up or down any day. A ${ONE} joins once it has enough reviews to score fairly.` },
  ];
  const more = lists.filter(x => x.slug !== l.slug).map(x => ({ label: x.label, href: x.href }));
  const nameMap = Object.fromEntries(list.map(r => [r.id, r.name]));
  // The live ranking page's structured data, built from what this page shows: its FAQ, the list and the breadcrumbs.
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "FAQPage", mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@type": "ItemList", name: l.title, url: `${base()}${l.href}`, numberOfItems: list.length, itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: list.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${base()}${r.href}` })) },
    crumbs([{ name: "Rankings", path: "/rankings" }, { name: l.label, path: l.href }]),
  ] };
  return <Shell active="rankings">
    <JsonLd data={ld}/>
    <main className="th-main">
      <div className="th-col">
        <div className="th-crumbs"><a href={th("/rankings")}>Rankings</a><span>/</span><span>{l.label}</span></div>
        <section className="th-card th-hero">
          <h1 className="th-h1">{l.title}</h1>
          <p className="th-lead">{`Ranked by ${W.score}, from reviews by people who ${W.played} them. Updates as new reviews come in.`}</p>
          <nav className="th-rtabs" aria-label="Rankings">{lists.slice(0, 7).map(x => <a key={x.slug} href={th(x.href)} aria-current={x.slug === l.slug ? "page" : undefined}>{x.label.replace(/^Best (for )?/, "").replace(/^./, c => c.toUpperCase())}</a>)}</nav>
        </section>
        <RankingList rows={list} title={l.label} meta={`${plural(list.length, ONE)} · ${plural(reviews, "review")}`}/>
        {boards.length > 0 && <Boards boards={boards}/>}
        <section className="th-card th-sec"><h2 className="th-h2">{`Questions ${W.people} ask`}</h2><Faq items={faqs}/></section>
        <Comments page={`ranking:${l.slug}`} prompt="Agree with this list? Join the conversation" nicknames={niche.form.quickVote?.nicknames ?? []}/>
        <div className="th-narrow" style={{ flexDirection: "column", gap: 12 }}><SideMatch names={nameMap}/></div>
        <NarrowLinks title="More rankings" links={more}/>
      </div>
      <aside className="th-side">
        <SideMatch names={nameMap}/>
        <SideBox title="More rankings"><LinkList links={more}/></SideBox>
      </aside>
    </main>
  </Shell>;
}
