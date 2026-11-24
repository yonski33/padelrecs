// StackRecs rankings hub: every ranking as a card with its top 3, Build first, then Grow.
import type { Metadata } from "next";
import { Shell } from "../../shell";
import { tone } from "../../ui";
import { th } from "../../../../lib/thread/look";
import { STACK_RANKINGS } from "../../../../lib/stack/rankings";
import { stackData } from "../data";
import { rankingRows } from "./rows";

export const revalidate = 21600;
export const metadata: Metadata = { title: "Rankings", description: "AI coding agents, app builders and SEO tools ranked by community votes and reviews.", alternates: { canonical: "/rankings" } };

export default async function StackRankings() {
  const d = await stackData();
  return <Shell active="rankings">
    <main className="th-main"><div className="th-col" style={{ maxWidth: "none" }}>
      <section className="th-card th-hero"><h1 className="th-h1">Rankings</h1>
        <p className="th-lead">By score from votes and reviews, newer opinions weighted more. Vote rankings follow the votes.</p></section>
      {(["build", "grow"] as const).map(side => <section key={side} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 className="th-h2 th-group-h">{side === "build" ? "Build" : "Grow"}</h2>
        <div className="th-hub-grid">{STACK_RANKINGS.filter(l => l.side === side).map(l => { const top = rankingRows(d, l).slice(0, 3);
          return <a key={l.slug} className="th-hub" href={th(`/rankings/${l.slug}`)}>
            <span className="th-hub-t"><b>{l.label}</b><small>{l.blurb}</small></span>
            <span className="th-hub-rows">{top.map(({ r }, i) => <span key={r.id} className="th-hub-row">
              <span className="r">{i + 1}</span><span className="p">{r.pic && <img src={r.pic} alt="" loading="lazy"/>}</span><span className="n">{r.name}</span>
              {r.score != null && <span className={`th-badge xs ${tone(r.score)}`}>{r.score}</span>}</span>)}
              {top.length === 0 && <span className="th-note">Waiting for votes and reviews.</span>}</span>
            <span className="th-hub-go">See ranking ›</span>
          </a>; })}</div>
      </section>)}
    </div></main>
  </Shell>;
}
