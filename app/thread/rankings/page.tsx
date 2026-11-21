// Thread rankings hub (Rankings Hub Thread): every ranking as a card with its top 3 and "See ranking ›".
import { niche } from "../../../lib/niche";
import { Shell } from "../shell";
import { threadRows } from "../data";
import { threadRankings, GROUPS } from "../rankings-data";
import { th } from "../../../lib/thread/look";
import { HubCards, hubRatings } from "../hub-cards";
import { SKIN_NEEDS } from "../../../lib/skin-lists";

export const revalidate = 21600;
import type { Metadata } from "next";
import { generateMetadata as liveMetadata } from "../../rankings/page";
import { liveOr } from "../seo";
import { W } from "../../../lib/thread/words";
import { HubV3 } from "./hub-v3";
import { HUB_LEAD } from "../../../lib/thread/rankings-hub";
import { v3Site } from "../../../lib/thread/sites";
const AUDIO_HUB_LEAD = "Lists ordered by listener reviews, what listeners love most and the AudioRecs match. Pick a list.";
/** SimRacingRecs (v3 rollout 2026-11-21): no curated picks; Best overall by most loved, the rest by racer reviews and its match. */
/** PickleballRecs (wave 2): its own picks and lists, in padel's words. */
const PB_HUB_LEAD = "PickleballRecs picks and lists ordered by player reviews, checked against player votes. Pick a list.";
const DG_HUB_LEAD = "Lists ordered by player reviews, what players love most and the DiscGolfRecs match. Pick a list.";
const SR_HUB_LEAD = "Lists ordered by racer reviews, most loved first, and by the SimRacingRecs match. Pick a list.";
/** TennisRecs (v3 wave 2): no curated picks either. */
const TN_HUB_LEAD = "Lists ordered by player reviews and votes, most loved first. Pick a list.";
export const generateMetadata = (): Promise<Metadata> => liveOr(liveMetadata);

export default async function ThreadHub() {
  const [lists, { rows }] = await Promise.all([threadRankings(), threadRows()]);
  // PadelRecs (owner 2026-11-21): no ratings on its rankings.
  const ratings = v3Site(niche.id) ? {} : await hubRatings(lists);
  const rated = Object.keys(ratings).length > 0;
  // PadelRecs v3 (Rankings Hub v3 mock): the same lists and groups, top 3 with their opinions (no ratings since 2026-11-21).
  // AudioRecs (V3-ROLLOUT-BRIEF): the same hub, no score; its own lead (its lists: live ones by listener reviews, the
  // Thread-only ones by most loved or the AudioRecs match).
  if (v3Site(niche.id)) return <Shell active="rankings">
    <HubV3 lead={niche.id === "audio" ? AUDIO_HUB_LEAD : niche.id === "simracing" ? SR_HUB_LEAD : niche.id === "tennis" ? TN_HUB_LEAD : niche.id === "pickleball" ? PB_HUB_LEAD : niche.id === "discgolf" ? DG_HUB_LEAD : HUB_LEAD} rows={rows} ratings={ratings}
      groups={GROUPS.map(g => ({ title: g, cards: lists.filter(l => l.group === g) })).filter(g => g.cards.length > 0)}/>
  </Shell>;
  return <Shell active="rankings">
    <main className="th-main"><div className="th-col" style={{ maxWidth: "none" }}>
      <section className="th-card th-hero">
        <h1 className="th-h1">{niche.id === "skin" ? "Skincare rankings" : niche.id === "discgolf" ? "Disc rankings" : niche.id === "simracing" ? "Sim racing gear rankings" : `${niche.id[0].toUpperCase()}${niche.id.slice(1)} ${niche.words.one} rankings`}</h1>
        <p className="th-lead">{rated ? `Category lists follow the ${niche.site.name} pick order; the rest are sorted by ${W.score}.`
          : `Every ranking is sorted by ${W.score}, from reviews by people who ${W.played} the ${niche.words.many}. Scores update as new reviews come in.`}</p>
      </section>
      {GROUPS.map(g => { const cards = lists.filter(l => l.group === g); if (!cards.length) return null;
        // SkinRecs: a skin need's heading links to its hub page (the old mixed list's address).
        const hub = lists.find(l => l.kids && SKIN_NEEDS.find(n => n.group === g)?.hub === l.slug);
        return <section key={g} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 className="th-h2 th-group-h">{hub ? <a href={th(hub.href)} style={{ color: "inherit" }}>{g}</a> : g}</h2>
          <HubCards cards={cards} rows={rows} ratings={ratings}/>
        </section>; })}
    </div></main>
  </Shell>;
}
