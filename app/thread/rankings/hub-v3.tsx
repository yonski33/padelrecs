import { hasYears } from "../../../lib/niche";
// PadelRecs v3 rankings hub (Rankings Hub v3) and "How rankings work" (How Rankings Work v3), owner handoff
// design_handoff_padelrecs_v3 (2026-11-21), padel only. The mock's design with today's content where the mock has less (every
// list, its blurb, its top 3); words and rules: lib/thread/rankings-hub.ts. The ranking list pages are separate work.
// Page-scoped CSS (rankings-hub.css, every rule under .rkh), so the shared Thread tokens stay with the v7b work.
import "./rankings-hub.css";
import { th } from "../../../lib/thread/look";
import { HOW, HOW_INTRO, ratingTen } from "../../../lib/thread/rankings-hub";
import type { ThreadRanking } from "../rankings-data";
import type { ThreadRow } from "../ui";

/** The hub: one card per list, in its group's order, its top 3 with their opinions bar; a category list shows its rating. */
export function HubV3({ groups, rows, ratings, lead }: { groups: { title: string; cards: ThreadRanking[] }[]; rows: Map<string, ThreadRow>;
  ratings: Record<string, Record<string, number>>; lead: string }) {
  return <main className="rkh">
    <section className="rkh-card rkh-hero"><h1>Rankings</h1><p className="rkh-desc">{lead}</p></section>
    {/* One even grid in the groups' order (the mock), so short groups leave no gaps. */}
    <div className="rkh-hub-grid">{groups.flatMap(g => g.cards).map(l => <a key={l.slug} className="rkh-card rkh-hub" href={th(l.href)}>
      <b className="t">{l.short ?? l.label}</b>
      {l.blurb && <span className="b">{l.blurb}</span>}
      <span className="rows">{l.ids.slice(0, 3).map((id, i) => { const r = rows.get(id); if (!r) return null; const n = ratings[l.slug]?.[id];
        return <span key={id} className="row"><span className="r">{i + 1}</span><span className="n">{hasYears ? r.name.replace(/\s+\(?20\d\d\)?$/, "") : r.name}</span>
          {n != null && <span className="rt" title="PadelRecs rating, 0 to 10">{ratingTen(n)}</span>}
          {r.pos + r.mix + r.neg > 0 && <span className="rkh-bar sm" aria-label={`${r.pos} loved, ${r.mix} mixed, ${r.neg} not for me`}><i style={{ flex: r.pos }}/><i style={{ flex: r.mix }}/><i style={{ flex: r.neg }}/></span>}</span>; })}</span>
      <span className="go">See the full list →</span>
    </a>)}</div>
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
