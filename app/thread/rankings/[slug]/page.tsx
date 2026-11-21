// Thread ranking page (Rankings Thread v2): no sort control; the ranking pills, the list (curated picks first on the site's own
// lists), how players rate them, questions answered from this list's own data, and "See how you match" beside it.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { threadRows, threadBoards, skinOf } from "../../data";
import { threadRankings, ratingsFor } from "../../rankings-data";
import { ratingCategory, ratingHow } from "../../../../lib/category-rating";
import { SKIN_NEEDS } from "../../../../lib/skin-lists";
import { HubCards, hubRatings } from "../../hub-cards";
import { RankingList, SideMatch } from "../../live/lists";
import { SkinMatchBox } from "../../live/skin-match";
import { quickMatchFor } from "../../../../lib/thread/sites";
import { Faq } from "../../live/faq";
import { Comments } from "../../live/comments";
import { Discussion } from "../../live/discussion";
import { niche } from "../../../../lib/niche";
import { Boards } from "../../boards";
import { SideBox, LinkList, NarrowLinks, plural } from "../../ui";
import { th } from "../../../../lib/thread/look";
import { generateMetadata as liveMetadata } from "../../../rankings/[slug]/page";
import { JsonLd, crumbs, base } from "../../seo";
import { W } from "../../../../lib/thread/words";
import { threadFeed } from "../../data";
import { ELBOW_SLUG, GUIDE_PATHS } from "../../../../lib/thread/look";
import { RankRows, QuickMatch, type V5Row } from "../../live/ranking-v5";
import { traitCounts, traitGroup } from "../../data";
import { listOrder } from "../../../../lib/thread/vote-order";
/** PadelRecs (owner 2026-11-21): no "Ranked by player score…" line, the lists as one dropdown, and phone rows with the rank
 *  inline (th-hp, as on the home page). */
const PADEL = niche.id === "padel";
const short = (label: string) => label.replace(/^Best (for )?/, "").replace(/^./, c => c.toUpperCase());

const { one: ONE, many: MANY } = niche.words;
const PICKLEBALL = niche.id === "pickleball", DG = niche.id === "discgolf", SKIN = niche.id === "skin";
/** The sidebar's "See how you match": the site's own quick match, the one its home shows, or no card (lib/thread/sites.ts). */
const QM = quickMatchFor(niche.id);
/** Sites whose product pages use the v7b Discussion (PadelRecs, #565) use it here too, so the two never disagree; the rest
 *  keep Comments. Same thread (`ranking:<slug>`), posting, votes and owner tools either way. */
const V7B_DISCUSSION = niche.id === "padel";
/** The arm and shape FAQ lines, the site's own (PickleballRecs: its Rankings and Elbow Guide mocks). */
const ARM_TIP = PICKLEBALL ? "A soft core, a lighter paddle and a relaxed grip help most." : "A soft core, a lower balance and a lighter racket help most.";
// SkinRecs has no shape question (it showed padel's until 2026-11-21).
const SHAPE_FAQ = SKIN ? null : DG
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
  const title = `${l.title}, ranked by real ${W.reviews}`;
  const description = l.kids ? `${l.blurb} The top picks by product type, from reviews by people who ${W.played} them.`
    : ratingCategory(l.slug, niche.id) ? `${l.blurb} The top ${l.ids.length}, from reviews by people who ${W.played} them.`
    : `${l.blurb} The top ${l.ids.length} by ${W.score}, from reviews by people who ${W.played} them.`;
  return { title: { absolute: `${title} | ${niche.site.name}` }, description, alternates: { canonical: l.href }, openGraph: { title, description, url: l.href, type: "website" } };
}

const names = (xs: { name: string }[]) => xs.length > 1 ? `${xs.slice(0, -1).map(x => x.name).join(", ")} and ${xs[xs.length - 1].name}` : xs[0]?.name ?? "";

export default async function ThreadRanking({ params }: P) {
  const { slug } = await params;
  const [lists, { rows, all, ctx }] = await Promise.all([threadRankings(), threadRows()]);
  const l = lists.find(x => x.slug === slug);
  if (!l) notFound();
  if (l.kids) return <NeedHub l={l} lists={lists}/>;
  const list = l.ids.map(id => rows.get(id)!).filter(Boolean);
  // Padel category lists (owner 2026-11-21): a curated rating as the big number, the Player score small on each row. Never in
  // the structured data below, which carries no rating at all.
  // PadelRecs (owner 2026-11-21): no rating on its lists any more; the "Most picked for" pill and the opinions carry each row.
  const cat = PADEL ? null : ratingCategory(l.slug, niche.id);
  const [boards, rated] = await Promise.all([threadBoards(new Set(l.ids)), cat ? ratingsFor(cat, list.map(r => r.id)) : null]);
  const reviews = list.reduce((s, r) => s + r.n, 0);
  const beginner = list.filter(r => r.levels.includes("beginner")).slice(0, 3), arm = list.filter(r => r.arm).slice(0, 3);
  const faqs = [
    ...(beginner.length ? [{ q: `Which ${ONE} here is best for a beginner?`, a: `${names(beginner)} ${beginner.length > 1 ? "are" : "is"} the ones ${W.people} rate as fine for beginners on this list. Pick your level above to see your match.` }] : []),
    ...(arm.length ? [DG ? { q: "What if I have a slow arm?", a: `Throwers with slower arms speak best of ${names(arm)}. Lighter, understable discs with a speed of 7 or less help most.` }
      : { q: "What if I have tennis elbow?", a: `Players with sore arms speak best of ${names(arm)}. ${ARM_TIP}` }] : []),
    ...(SHAPE_FAQ ? [SHAPE_FAQ] : []),
    { q: "How often does this ranking change?", a: `Scores update as new reviews come in, so ${MANY} can move up or down any day. A ${ONE} joins once it has enough reviews to score fairly.` },
  ];
  const more = moreFor(l, lists);
  // SkinRecs: a per-type list sits under its need's hub in the breadcrumbs.
  const hub = lists.find(x => x.kids?.includes(l.slug));
  const nameMap = Object.fromEntries(list.map(r => [r.id, r.name]));
  // SkinRecs: its home's quick match (skin type · goal · sensitive), on the same ranking inputs as the home (app/thread/page.tsx).
  const sk = QM === "skin" ? skinOf(ctx) : null;
  const skinRows = sk ? all.filter(r => r.current !== false && r.n > 0) : [];
  const skinWire = sk ? (await import("../../../skin/payload")).wireOf(sk, sk.data.listed.filter(r => skinRows.some(x => x.id === r.id))) : [];
  const side = QM === "engine" ? <SideMatch names={nameMap}/>
    : sk ? <section className="th-card" style={{ padding: "12px 14px" }}><SkinMatchBox title="See how you match" wire={skinWire} names={Object.fromEntries(all.map(r => [r.id, r.name]))}/></section> : null;
  // The live ranking page's structured data, built from what this page shows: its FAQ, the list and the breadcrumbs.
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "FAQPage", mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    { "@type": "ItemList", name: l.title, url: `${base()}${l.href}`, numberOfItems: list.length, itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: list.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${base()}${r.href}` })) },
    crumbs([{ name: "Rankings", path: "/rankings" }, ...(hub ? [{ name: hub.label, path: hub.href }] : []), { name: l.label, path: l.href }]),
  ] };
  if (PADEL) return <RankingV5 l={l} lists={lists} list={list} rated={rated} label={cat?.label ?? null} faqs={faqs} ld={ld} picOf={id => rows.get(id)?.pic ?? null}/>;
  return <Shell active="rankings">
    <JsonLd data={ld}/>
    <main className={PADEL ? "th-main th-hp" : "th-main"}>
      <div className="th-col">
        <div className="th-crumbs"><a href={th("/rankings")}>Rankings</a><span>/</span>{hub && <><a href={th(hub.href)}>{hub.label}</a><span>/</span></>}<span>{l.label}</span></div>
        <section className="th-card th-hero">
          <h1 className="th-h1">{l.title}</h1>
          {(cat || !PADEL) && <p className="th-lead">{cat ? ratingHow(niche.site.name, W.people) : `Ranked by ${W.score}, from reviews by people who ${W.played} them. Updates as new reviews come in.`}</p>}
          {PADEL ? <details className="th-rk-dd">
            {/* A plain links menu (no script), so the cached page works as is. */}
            <summary><span className="lbl">Ranking</span>{short(l.label)}<small aria-hidden="true">▼</small></summary>
            <nav className="th-rk-menu" aria-label="Rankings">{lists.map(x => <a key={x.slug} href={th(x.href)} aria-current={x.slug === l.slug ? "page" : undefined}>{short(x.label)}<span aria-hidden="true">{x.slug === l.slug ? "✓" : ""}</span></a>)}</nav>
          </details>
          : <Tabs lists={lists} current={hub?.slug ?? l.slug}/>}
        </section>
        <RankingList rows={list} title={l.label} meta={`${plural(list.length, ONE)} · ${plural(reviews, "review")}`}
          {...(cat && rated ? { ratings: { by: rated, label: cat.label } } : {})}{...(QM !== "engine" ? { match: false } : {})}/>
        {boards.length > 0 && <Boards boards={boards}/>}
        <section className="th-card th-sec"><h2 className="th-h2">{`Questions ${W.people} ask`}</h2><Faq items={faqs}/></section>
        {V7B_DISCUSSION ? <Discussion page={`ranking:${l.slug}`} model={l.label} words={{ sub: `Questions about this list? Ask ${W.people} who've used these ${MANY}.`,
          placeholder: "What do you want to know about this list?" }}/>
          : <Comments page={`ranking:${l.slug}`} prompt="Agree with this list? Join the conversation" nicknames={niche.form.quickVote?.nicknames ?? []}/>}
        {side && <div className="th-narrow" style={{ flexDirection: "column", gap: 12 }}>{side}</div>}
        <NarrowLinks title="More rankings" links={more}/>
      </div>
      <aside className="th-side">
        {side}
        <SideBox title="More rankings"><LinkList links={more}/></SideBox>
      </aside>
    </main>
  </Shell>;
}

/** The ranking pills: the first seven lists; SkinRecs: its four skin needs, then product types. */
function Tabs({ lists, current }: { lists: Awaited<ReturnType<typeof threadRankings>>; current: string }) {
  const tabs = SKIN ? [...lists.filter(x => x.kids), ...lists.filter(x => x.group === "By product type")].slice(0, 7) : lists.slice(0, 7);
  return <nav className="th-rtabs" aria-label="Rankings">{tabs.map(x => <a key={x.slug} href={th(x.href)} aria-current={x.slug === current ? "page" : undefined}>
    {x.label.replace(/^Best (for )?/, "").replace(/^For /, "").replace(/^./, c => c.toUpperCase())}</a>)}</nav>;
}
/** "More rankings": every other list; SkinRecs: the same need's lists, the other needs and the product types (not all 30). */
function moreFor(l: { slug: string; group: string }, lists: Awaited<ReturnType<typeof threadRankings>>) {
  const xs = SKIN ? lists.filter(x => x.group === l.group || x.kids || x.group === "By product type") : lists;
  return xs.filter(x => x.slug !== l.slug).map(x => ({ label: x.label, href: x.href }));
}

/** A SkinRecs skin need's hub (owner 2026-11-21): the old mixed list's address, now its per-type lists as cards. */
async function NeedHub({ l, lists }: { l: Awaited<ReturnType<typeof threadRankings>>[number]; lists: Awaited<ReturnType<typeof threadRankings>> }) {
  const { rows } = await threadRows();
  const kids = l.kids!.flatMap(k => lists.filter(x => x.slug === k));
  const ratings = await hubRatings(kids);
  const need = SKIN_NEEDS.find(n => n.hub === l.slug);
  const more = moreFor(l, lists).filter(x => !kids.some(k => k.href === x.href));
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "ItemList", name: l.title, url: `${base()}${l.href}`, numberOfItems: kids.length,
      itemListElement: kids.map((k, i) => ({ "@type": "ListItem", position: i + 1, name: k.title, url: `${base()}${k.href}` })) },
    crumbs([{ name: "Rankings", path: "/rankings" }, { name: l.label, path: l.href }]),
  ] };
  return <Shell active="rankings">
    <JsonLd data={ld}/>
    <main className="th-main">
      <div className="th-col">
        <div className="th-crumbs"><a href={th("/rankings")}>Rankings</a><span>/</span><span>{l.label}</span></div>
        <section className="th-card th-hero">
          <h1 className="th-h1">{l.title}</h1>
          <p className="th-lead">{`One ranking per product type${need ? ` for ${need.words}` : ""}. Pick one to see its top 10.`}</p>
          <Tabs lists={lists} current={l.slug}/>
        </section>
        <HubCards cards={kids} rows={rows} ratings={ratings} two/>
        <NarrowLinks title="More rankings" links={more}/>
      </div>
      <aside className="th-side">
        <SideBox title="More rankings"><LinkList links={more}/></SideBox>
      </aside>
    </main>
  </Shell>;
}

/** PadelRecs ranking page v5 (owner mock "Rankings Thread v4", 2026-11-21): one grid with the hero, every list as a pill and
 *  the list card on the left; Quick match, About these rankings and More rankings on the right. Then the discussion, today's
 *  questions (kept: the mock has none) and More to explore. No score; the curated rating stays on the category lists. */
type Lists = Awaited<ReturnType<typeof threadRankings>>;
/** "Most picked for control · 26 players": the top "Plays like" option on the racket page ("How does it play?": the review
 *  prefill or the owner's override, plus votes), under the home's Top picks copy rule (5+ backers, 10+ in the group). */
const PLAYS = { control: "control", all_round: "all-round play", power: "power" } as Record<string, string>;
function pickedLine(group: Record<string, number>) {
  const total = Object.values(group).reduce((a, b) => a + b, 0);
  const top = Object.entries(group).filter(([k]) => PLAYS[k]).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 5 && total >= 10 ? `Most picked for ${PLAYS[top[0]]} · ${plural(top[1], "player", "players")}` : null;
}
async function RankingV5({ l, lists, list, rated, label, faqs, ld, picOf }: { l: Lists[number]; lists: Lists; list: import("../../ui").ThreadRow[];
  rated: Record<string, number> | null; label: string | null; faqs: { q: string; a: string }[]; ld: object; picOf: (id: string) => string | null }) {
  const t = await traitCounts();
  // A list ordered by votes (lib/thread/vote-order.ts) says so in About these rankings, with the answer it counts.
  const vo = listOrder(niche.id, l.slug), votes = vo?.order === "votes" ? PLAYS[vo.option ?? ""] ?? null : null; const loved = vo?.order === "loved";
  const rows: V5Row[] = list.map((r, i) => ({ id: r.id, rank: i + 1, name: r.name, href: r.href, pic: r.pic, shape: r.shape ? r.shape[0].toUpperCase() + r.shape.slice(1) : null,
    line: r.line, pos: r.pos, mix: r.mix, neg: r.neg, rating: rated?.[r.id] != null ? (rated[r.id] / 10).toFixed(1) : null,
    picked: pickedLine(traitGroup(t, r.id, "plays_like")), arm: !!r.arm }));
  const opinions: [string, string] = [W.opinions.replace(/s$/, ""), W.opinions];
  const said = rows.reduce((a, r) => a + r.pos + r.mix + r.neg, 0);
  const others = lists.filter(x => x.slug !== l.slug);
  // The mock's picture strip: real photos, the list's own top rackets for a ranking and this list's for the guides.
  const pics = (ids: string[], n: number) => ids.map(picOf).filter((x): x is string => !!x).slice(0, n);
  const mine = rows.map(r => r.id);
  const explore = [{ tag: "Guide", title: "How to choose a padel racket", desc: "Shape, weight, balance and feel, in plain words.", cta: "Read guide", href: GUIDE_PATHS.racket, imgs: pics(mine, 1), tone: "dark" },
    { tag: "Guide", title: "Padel racket shapes explained", desc: "Round, teardrop or diamond, and who each suits.", cta: "Read guide", href: GUIDE_PATHS.shape, imgs: pics(mine.slice(1), 3), tone: "sand" },
    ...others.filter(x => x.slug !== "best-padel-rackets").slice(0, 2).map((x, i) => ({ tag: "Ranking", title: x.label, desc: x.blurb, cta: "View ranking", href: x.href,
      imgs: pics(x.ids, 2), tone: i ? "lime" : "sand" }))];
  return <Shell active="rankings">
    <JsonLd data={ld}/>
    <main className="th-main rk5">
      <div className="th-crumbs"><a href={th("/rankings")}>Rankings</a><span>/</span><span>{l.label}</span></div>
      <div className="rk5-grid">
        <div className="rk5-main">
          <section className="th-card rk5-hero">
            <h1 className="th-h1">{l.title}</h1>
            {l.blurb && <p>{l.blurb}</p>}
            <nav className="rk5-pills" aria-label="Rankings">{lists.map(x =>
              <a key={x.slug} href={th(x.href)} aria-current={x.slug === l.slug ? "page" : undefined}>{x.label}</a>)}</nav>
          </section>
          <section className="th-card rk5-list">
            <div className="rk5-list-head"><h2 className="th-h2">{l.label}</h2>
              <span>{`${plural(rows.length, ONE, MANY)}  ·  ${plural(said, opinions[0], opinions[1])}`}</span></div>
            <RankRows rows={rows} ratingLabel={label} opinions={opinions} markLoved={loved}/>
          </section>
        </div>
        <aside className="rk5-side">
          <QuickMatch rows={rows}/>
          <section className="th-card rk5-box"><h3>About these rankings</h3>
            <div className="about">
              <span className="item"><svg className="ic" width="30" height="28" viewBox="0 0 30 28" aria-hidden="true" fill="currentColor"><circle cx="15" cy="9" r="4.5"/><circle cx="6" cy="11" r="3.5"/><circle cx="24" cy="11" r="3.5"/><path d="M7 24c0-4.5 3.6-8 8-8s8 3.5 8 8zM0 23c0-3.3 2.4-6 5.5-6 1.2 0 2.2.3 3 .9C7 19.4 6 21.3 6 23.5zM30 23c0-3.3-2.4-6-5.5-6-1.2 0-2.2.3-3 .9 1.5 1.5 2.5 3.4 2.5 5.6z"/></svg><span><strong>Based on player feedback</strong><span>Reviews and votes on {niche.site.name}, plus summaries of Reddit threads, YouTube reviews and blogs.</span></span></span>
              <span className="item"><svg className="ic" width="30" height="28" viewBox="0 0 30 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"><path d="M15 3L26 9 15 15 4 9z"/><path d="M4 14l11 6 11-6M4 19l11 6 11-6"/></svg><span>{loved ? <><strong>Ordered by most loved</strong><span>{`Rackets go by how many players loved them, the count on each row. ${new Date().getUTCFullYear()} models with 10+ reviews.`}</span></>
                : votes ? <><strong>Ordered by player votes</strong><span>{`Rackets go by how many players pick them for ${votes}, the number on each row. Needs 12+ reviews and 10+ players.${label ? ` The number on each pick is a ${niche.site.name} rating from 0 to 10.` : ""}`}</span></> : <><strong>Picked, then checked</strong><span>{label ? `${niche.site.name} sets the order and checks it against what players report. The number on each pick is a ${niche.site.name} rating from 0 to 10.`
                : `${niche.site.name} sets the order and checks it against what players report, not brand claims.`}</span></>}</span></span>
              <span className="item"><svg className="ic" width="30" height="28" viewBox="0 0 30 28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="15" cy="14" r="11"/><path d="M15 8v6l4 3"/></svg><span><strong>Updated as new feedback arrives</strong><span>The counts change as new reviews come in.</span></span></span>
              <a className="more" href={th("/how-we-make-these")}>How rankings work →</a>
            </div></section>
          {others.length > 0 && <section className="th-card rk5-box"><h3>More rankings</h3>
            <div>{others.map(x => <a key={x.slug} className="arrow" href={th(x.href)}><span>{x.label}</span><span aria-hidden="true">→</span></a>)}</div></section>}
        </aside>
      </div>
      <Discussion page={`ranking:${l.slug}`} model={l.label} words={{ heading: "Community discussion", sub: "General discussions, comparisons and picks for this ranking.",
        askIcon: "?", ask: "Ask a question or share a thought about this ranking…", placeholder: "What do you want to know about this list?" }}/>
      <section className="rk5-explore"><h2 className="th-h2">More to explore</h2>
        <div>{explore.map(e => <a key={e.href} className="th-card" href={th(e.href)}><span className={`strip ${e.tone}`}>{e.imgs.map(src => <img key={src} src={src} alt="" loading="lazy"/>)}<span className="tag">{e.tag}</span></span><strong>{e.title}</strong><span className="desc">{e.desc}</span><span className="cta">{`${e.cta} →`}</span></a>)}</div>
      </section>
      <section className="th-card th-sec rk5-faq"><h2 className="th-h2">{`Questions ${W.people} ask`}</h2><Faq items={faqs}/></section>
    </main>
  </Shell>;
}
