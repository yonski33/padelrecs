// Thread rankings hub (Rankings Hub Thread): every ranking as a card with its top 3 and "See ranking ›".
import { niche } from "../../../lib/niche";
import { Shell } from "../shell";
import { threadRows } from "../data";
import { threadRankings, GROUPS } from "../rankings-data";
import { th } from "../../../lib/thread/look";
import { tone } from "../ui";

export const revalidate = 21600;
import type { Metadata } from "next";
import { generateMetadata as liveMetadata } from "../../rankings/page";
import { liveOr } from "../seo";
export const generateMetadata = (): Promise<Metadata> => liveOr(liveMetadata);

export default async function ThreadHub() {
  const [lists, { rows }] = await Promise.all([threadRankings(), threadRows()]);
  return <Shell active="rankings">
    <main className="th-main"><div className="th-col" style={{ maxWidth: "none" }}>
      <section className="th-card th-hero">
        <h1 className="th-h1">{`${niche.id[0].toUpperCase()}${niche.id.slice(1)} ${niche.words.one} rankings`}</h1>
        <p className="th-lead">{`Every ranking is sorted by player score, from reviews by people who played the ${niche.words.many}. Scores update as new reviews come in.`}</p>
      </section>
      {GROUPS.map(g => { const cards = lists.filter(l => l.group === g); return cards.length > 0 && <section key={g} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 className="th-h2 th-group-h">{g}</h2>
        <div className="th-hub-grid">{cards.map(l => <a key={l.slug} className="th-hub" href={th(l.href)}>
          <span className="th-hub-t"><b>{l.label}</b><small>{l.blurb}</small></span>
          <span className="th-hub-rows">{l.ids.slice(0, 3).map((id, i) => { const r = rows.get(id)!; return <span key={id} className="th-hub-row">
            <span className="r">{i + 1}</span><span className="p">{r.pic && <img src={r.pic} alt="" loading="lazy"/>}</span><span className="n">{r.name}</span>
            {r.score != null && <span className={`th-badge xs ${tone(r.score)}`}>{r.score}</span>}</span>; })}</span>
          <span className="th-hub-go">See ranking ›</span>
        </a>)}</div>
      </section>; })}
    </div></main>
  </Shell>;
}
