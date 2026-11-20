// The rankings hub's cards (Rankings Hub Thread): each ranking with its top 3 and "See ranking ›". A category list's rows show
// its curated rating (lib/category-rating.ts), as its own page does; the other lists show the Player score. SkinRecs' need
// hubs use the same cards for their per-type lists.
import { th } from "../../lib/thread/look";
import { niche } from "../../lib/niche";
import { ratingCategory } from "../../lib/category-rating";
import { ratingsFor, type ThreadRanking } from "./rankings-data";
import { tone, type ThreadRow } from "./ui";

/** The top-3 ratings of each rated list, by slug. */
export async function hubRatings(lists: ThreadRanking[]): Promise<Record<string, Record<string, number>>> {
  const rated = lists.flatMap(l => { const c = ratingCategory(l.slug, niche.id); return c ? [[l, c] as const] : []; });
  return Object.fromEntries(await Promise.all(rated.map(async ([l, c]) => [l.slug, await ratingsFor(c, l.ids)] as const)));
}

export function HubCards({ cards, rows, ratings }: { cards: ThreadRanking[]; rows: Map<string, ThreadRow>; ratings: Record<string, Record<string, number>> }) {
  return <div className="th-hub-grid">{cards.map(l => <a key={l.slug} className="th-hub" href={th(l.href)}>
    <span className="th-hub-t"><b>{l.short ?? l.label}</b><small>{l.blurb}</small></span>
    <span className="th-hub-rows">{l.ids.slice(0, 3).map((id, i) => { const r = rows.get(id); if (!r) return null;
      const n = ratings[l.slug]?.[id] ?? r.score;
      return <span key={id} className="th-hub-row">
        <span className="r">{i + 1}</span><span className="p">{r.pic && <img src={r.pic} alt="" loading="lazy"/>}</span><span className="n">{r.name}</span>
        {n != null && <span className={`th-badge xs ${tone(n)}`}>{n}</span>}</span>; })}</span>
    <span className="th-hub-go">See ranking ›</span>
  </a>)}</div>;
}
