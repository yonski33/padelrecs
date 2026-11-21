// PadelRecs rankings hub (owner mock "Rankings hub", 2026-11-21) and "How rankings work" (How Rankings Work v3), padel only.
// Words and rules: lib/thread/rankings-hub.ts. The ranking list pages are separate work.
// Page-scoped CSS (rankings-hub.css, every rule under .rkh), so the shared Thread tokens stay with the v7b work.
import "./rankings-hub.css";
import { th } from "../../../lib/thread/look";
import { HOW, HOW_INTRO, HUB_GROUPS, HUB_TILES, hubBlurb, hubPlace, hubTitle } from "../../../lib/thread/rankings-hub";
import type { ThreadRanking } from "../rankings-data";
import type { ThreadRow } from "../ui";

/** The hub (owner mock "Rankings hub", 2026-11-21): the title, the lead and "How rankings work →", then the lists in three
 *  groups (by how it plays, by who you are, by shape). Each card: the #1 racket's photo on a pastel tile, the title, one line,
 *  "#1 <racket>" and "then <#2>, <#3>". No score, no rating, no counts; the order is each list's own (lib/thread/vote-order.ts). */
export function HubV3({ lists, rows, lead }: { lists: ThreadRanking[]; rows: Map<string, ThreadRow>; lead: string }) {
  const name = (id: string) => { const r = rows.get(id); return r ? r.name.replace(/\s+\(?20\d\d\)?$/, "") : null; };
  const last = HUB_GROUPS.length - 1, place = (g: (typeof HUB_GROUPS)[number], gi: number, slug: string) => {
    const i = hubPlace(g, slug); return i >= 0 ? i : gi === last && HUB_GROUPS.every(x => hubPlace(x, slug) < 0) ? 99 : -1; };
  const groups = HUB_GROUPS.map((g, gi) => ({ ...g, cards: lists.filter(l => place(g, gi, l.slug) >= 0).sort((a, b) => place(g, gi, a.slug) - place(g, gi, b.slug)) }))
    .filter(g => g.cards.length > 0);
  let n = 0;
  return <main className="rkh rkh-v4">
    <header className="rkh-top"><div><h1>Rankings</h1><p className="rkh-desc">{lead}</p></div>
      <a className="rkh-how" href={th("/how-rankings-work")}>How rankings work →</a></header>
    {groups.map(g => <section key={g.title} className="rkh-group">
      <h2>{g.title}<span>{g.sub}</span></h2>
      <div className="rkh-grid">{g.cards.map(l => { const [first, ...rest] = l.ids.map(name).filter((x): x is string => !!x), pic = rows.get(l.ids[0])?.pic;
        const tile = HUB_TILES[n++ % HUB_TILES.length], blurb = hubBlurb(l.slug) ?? l.blurb;
        return <a key={l.slug} className="rkh-card rkh-list" href={th(l.href)}>
          <span className="tile" style={{ background: tile }}>{pic ? <img src={pic} alt="" loading="lazy"/> : <span className="th-ph" aria-hidden="true"/>}</span>
          <span className="txt"><b className="t">{hubTitle(l.short ?? l.label)}</b>
            {blurb && <span className="b">{blurb}</span>}
            {first && <span className="one"><i>#1</i>{first}</span>}
            {rest.length > 0 && <span className="then">{`then ${rest.slice(0, 2).join(", ")}`}</span>}</span>
        </a>; })}</div>
    </section>)}
  </main>;
}

/** How rankings work, in the honesty rules' words. */
export function HowV3() {
  return <main className="rkh">
    <section className="rkh-card rkh-hero"><h1>How rankings work</h1><p className="rkh-desc">{HOW_INTRO}</p></section>
    <article className="rkh-card rkh-how-body">{HOW.map(s => <section key={s.title}><h2>{s.title}</h2>{s.body.map(p => <p key={p}>{p}</p>)}</section>)}
      <p className="rkh-how-links"><a href={th("/rankings")}>All rankings →</a></p></article>
  </main>;
}
