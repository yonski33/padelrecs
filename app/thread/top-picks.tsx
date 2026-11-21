// "Top picks by players" (home, owner mock 2026-11-19): six numbered lists of three, in 3 columns by 2 rows on desktop and
// one column on phones. Only #1 is tinted; the grey number is the raw count of players saying or voting it. Server
// rendered from cached data (app/thread/data.ts threadTopPicks), so it costs nothing in the browser.
import { catalogPath } from "../../lib/niche";
import type { PickList } from "../../lib/thread/top-picks";
import { th } from "../../lib/thread/look";
import { W } from "../../lib/thread/words";

/** `unit`: the PadelRecs v3 home writes the count with its unit ("42 votes"). */
export function TopPicks({ lists, total, hrefs, unit }: { lists: PickList[]; total: number; hrefs: Record<string, string>; unit?: [string, string] }) {
  const rows = [lists.slice(0, 3), lists.slice(3, 6)].filter(r => r.length);
  return <section className="th-card th-sec">
    <div className="th-head-row"><h2 className="th-h2">{`Top picks by ${W.people}`}</h2>{total > 0 && <span className="th-sub">{`From ${total.toLocaleString("en-US")} ${W.reviews} and votes`}</span>}</div>
    {rows.map((row, ri) => <div key={ri} className="th-picks-row">{row.map(l => <div key={l.cat.key} className="th-pick-list">
      <div className="th-pick-head"><b>{l.cat.title}</b><a className="th-pick-all" href={th(l.cat.href)}>See all ›</a></div>
      <ol>{l.rows.map((r, i) => <li key={r.id} className={i === 0 ? "first" : undefined}>
        <a href={th(hrefs[r.id] ?? catalogPath)}><span className="rk">{`${i + 1}.`}</span><span className="nm">{r.name}</span><span className="ct" title={`${r.n} ${W.people} say or voted it`}>{unit ? `${r.n.toLocaleString("en-US")} ${r.n === 1 ? unit[0] : unit[1]}` : r.n}</span></a>
      </li>)}</ol>
    </div>)}</div>)}
  </section>;
}
