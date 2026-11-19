// "How players vote them": six boxes of three rackets each. Until trait votes are stored (migration 0024, waiting for the
// owner's OK) the counts are what players mention in their reviews, so the subtitle says that instead of "votes".
import type { Board } from "./data";
import { th } from "../../lib/thread/look";

export function Boards({ boards }: { boards: Board[] }) {
  const votes = boards.every(b => b.source === "votes");
  return <section className="th-card th-sec">
    <div className="th-head-row"><h2 className="th-h2">{votes ? "How players vote them" : "How players rate them"}</h2><span className="th-sub">{votes ? "Top 3 in each, from votes on racket pages" : "Top 3 in each, from what players say in their reviews"}</span></div>
    <div className="th-vgrid">{boards.map(b => { const max = Math.max(...b.rows.map(r => r.n));
      return <div key={b.title} className="th-vbox">
        <span className="th-vbox-head">{b.title}</span>
        {b.rows.map((o, i) => <a key={o.id} href={th(o.href)} className={`th-vopt${i === 0 ? " top" : ""}`}>
          <i style={{ width: `${Math.round(o.n / Math.max(max, 1) * 85)}%` }}/>
          <span>{o.pic && <img src={o.pic} alt="" loading="lazy"/>}<span className="nm">{o.name}</span></span>
          <b title={votes ? `${o.n} votes` : `${o.n} players mention it`}>{o.n}</b>
        </a>)}
      </div>; })}</div>
  </section>;
}
