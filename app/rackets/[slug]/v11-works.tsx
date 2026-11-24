// "Works with" on SimRacingRecs product pages (owner 2026-11-18): only pairs from the makers' compatibility table
// (lib/simracing-pairs.ts, db/compat/simracing-pairs.json), grouped by product type, each with the note a buyer needs
// ("needs a hub", "needs the G Racing Adapter on console"). Nothing shows without a table pair: never a brand guess.
export type WorksItem = { name: string; href: string; pic: string | null; note?: string; score: number | null };
export type WorksGroup = { label: string; items: WorksItem[]; more: number };

export function V11Works({ groups, short }: { groups: WorksGroup[]; short: string }) {
  if (!groups.length) return null;
  return <section className="v11-sec v11-works" id="works-with">
    <div className="v11-sh v11-rule"><h2>Works with</h2><span>{`from the makers' compatibility lists for the ${short}`}</span></div>
    {groups.map(g => <div key={g.label} className="v11-wg">
      <h3>{g.label}</h3>
      <ul>{g.items.map(x => <li key={x.name}><a href={x.href}>
        {x.pic && <span className="v11-wpic" aria-hidden="true"><img src={x.pic} alt="" width={40} height={40} loading="lazy"/></span>}
        <span className="v11-wn"><b>{x.name}</b>{x.note && <small>{x.note}</small>}</span></a></li>)}</ul>
      {g.more > 0 && <p className="v11-wmore">{`and ${g.more} more on the makers' lists`}</p>}
    </div>)}
  </section>;
}
