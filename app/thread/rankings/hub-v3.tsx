import { hasYears } from "../../../lib/niche";
// PadelRecs v3 rankings hub (Rankings Hub v3) and "How rankings work" (How Rankings Work v3), owner handoff
// design_handoff_padelrecs_v3 (2026-11-21), padel only. The mock's design with today's content where the mock has less (every
// list, its blurb, its top 3); words and rules: lib/thread/rankings-hub.ts. The ranking list pages are separate work.
// Page-scoped CSS (rankings-hub.css, every rule under .rkh), so the shared Thread tokens stay with the v7b work.
import "./rankings-hub.css";
import type { ReactNode } from "react";
import { th } from "../../../lib/thread/look";
import { HOW, HOW_INTRO, ratingTen } from "../../../lib/thread/rankings-hub";
import type { ThreadRanking } from "../rankings-data";
import type { ThreadRow } from "../ui";

/** The hub: one card per list, in its group's order, its top 3 with their opinions bar; a category list shows its rating. */
/** `headed` (SkinRecs: "For dry skin", then its per-type lists): each group under its own heading, a link when it has `href`;
 *  `title` and `crumbs`: a skin need's hub page. Padel: one grid, "Rankings". */
export function HubV3({ groups, rows, ratings, lead, title = "Rankings", crumbs, headed = false }: { groups: { title: string; href?: string; cards: ThreadRanking[] }[]; rows: Map<string, ThreadRow>;
  ratings: Record<string, Record<string, number>>; lead: string; title?: string; crumbs?: ReactNode; headed?: boolean }) {
  const card = (l: ThreadRanking) => <a key={l.slug} className="rkh-card rkh-hub" href={th(l.href)}>
      <b className="t">{l.short ?? l.label}</b>
      {l.blurb && <span className="b">{l.blurb}</span>}
      <span className="rows">{l.ids.slice(0, 3).map((id, i) => { const r = rows.get(id); if (!r) return null; const n = ratings[l.slug]?.[id];
        return <span key={id} className="row"><span className="r">{i + 1}</span><span className="n">{hasYears ? r.name.replace(/\s+\(?20\d\d\)?$/, "") : r.name}</span>
          {n != null && <span className="rt" title="PadelRecs rating, 0 to 10">{ratingTen(n)}</span>}
          {r.pos + r.mix + r.neg > 0 && <span className="rkh-bar sm" aria-label={`${r.pos} loved, ${r.mix} mixed, ${r.neg} not for me`}><i style={{ flex: r.pos }}/><i style={{ flex: r.mix }}/><i style={{ flex: r.neg }}/></span>}</span>; })}</span>
      <span className="go">See the full list →</span>
    </a>;
  return <main className="rkh">
    {crumbs}
    <section className="rkh-card rkh-hero"><h1>{title}</h1><p className="rkh-desc">{lead}</p></section>
    {headed ? groups.map(g => <section key={g.title} className="rkh-group"><h2 className="rkh-group-h">{g.href ? <a href={th(g.href)}>{g.title}</a> : g.title}</h2>
      <div className="rkh-hub-grid">{g.cards.map(card)}</div></section>)
      /* One even grid in the groups' order (the mock), so short groups leave no gaps. */
      : <div className="rkh-hub-grid">{groups.flatMap(g => g.cards).map(card)}</div>}
  </main>;
}

/** How rankings work, in the honesty rules' words. */
export function HowV3({ how = HOW }: { how?: { title: string; body: string[] }[] }) {
  return <main className="rkh">
    <section className="rkh-card rkh-hero"><h1>How rankings work</h1><p className="rkh-desc">{HOW_INTRO}</p></section>
    <article className="rkh-card rkh-how-body">{how.map(s => <section key={s.title}><h2>{s.title}</h2>{s.body.map(p => <p key={p}>{p}</p>)}</section>)}
      <p className="rkh-how-links"><a href={th("/rankings")}>All rankings →</a></p></article>
  </main>;
}
