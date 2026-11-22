// Thread catalogue (Rackets Thread). proxy.ts serves it for /rackets; search, filters and sort stay in the browser.
// PadelRecs (owner mock 2026-11-21, "i think it works now"): its own catalogue (app/thread/live/catalog-padel.tsx) with a
// full-width top card, the match bar, a fine-tune panel, the list and a community sidebar. Other sites keep Catalog.
import { Shell } from "../shell";
import { threadRows } from "../data";
import { padelListData } from "../padel-list-data";
import { Catalog } from "../live/catalog";
import { PadelCatalog, type SideReview } from "../live/catalog-padel";
import { listJsonLd, catalogCrumb } from "../../../lib/catalogue-seo";
import { niche } from "../../../lib/niche";
import { threadRankings } from "../rankings-data";
import { typedName } from "../../../lib/thread/display-name";
import { v3Site } from "../../../lib/thread/sites";

export const revalidate = 21600;
import type { Metadata } from "next";
import { generateMetadata as liveMetadata } from "../../rackets/page";
import { liveOr } from "../seo";
/** PadelRecs (owner 2026-11-21): no "Ranked by Player Score" in the title; the rest of the live metadata stays. */
const PADEL_TITLE = () => `All padel rackets ${new Date().getUTCFullYear()}: player opinions and quick match`;
/** SimRacingRecs (v3 rollout 2026-11-21): the same, in its words. */
const SR_TITLE = () => `All sim racing gear ${new Date().getUTCFullYear()}: racer opinions and quick match`;
const PB_TITLE = () => `All pickleball paddles ${new Date().getUTCFullYear()}: player opinions and quick match`;
export const generateMetadata = async (): Promise<Metadata> => { const m = await liveOr(liveMetadata);
  const t = niche.id === "simracing" ? SR_TITLE() : niche.id === "pickleball" ? PB_TITLE() : PADEL_TITLE();
  return niche.id !== "padel" && niche.id !== "simracing" && niche.id !== "pickleball" ? m : { ...m, title: { absolute: `${t} | ${niche.site.name}` }, openGraph: { ...m.openGraph, title: t }, twitter: { ...m.twitter, title: t } }; };

/** The sidebar's ranking links, in the mock's order, where the list exists. */
/** SimRacingRecs' sidebar links: overall, the gear types, beginners. */
const SR_RANK_LINKS = ["best-sim-racing-gear", "best-sim-racing-wheelbases", "best-sim-racing-pedals", "best-sim-racing-wheels", "best-sim-racing-gear-for-beginners", "best-sim-racing-cockpits"];
const TN_RANK_LINKS = ["best-tennis-rackets", "best-power-tennis-rackets", "best-control-tennis-rackets", "best-spin-tennis-rackets", "best-arm-friendly-tennis-rackets", "best-tennis-rackets-for-beginners"];
/** PickleballRecs' sidebar links: overall, power, control, spin, beginners, tennis elbow. */
const PB_RANK_LINKS = ["best-pickleball-paddles", "best-power-pickleball-paddles", "best-control-pickleball-paddles", "best-spin-pickleball-paddles", "best-pickleball-paddles-for-beginners", "best-pickleball-paddles-for-tennis-elbow"];
const RANK_LINKS = ["best-padel-rackets", "best-power-padel-rackets", "best-control-padel-rackets", "best-padel-rackets-for-beginners", "best-teardrop-padel-rackets", "best-diamond-padel-rackets"];
export default async function ThreadCatalog() {
  const { all, ctx } = await threadRows();
  const rows = all.filter(r => r.n > 0);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const top = [...rows].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.n - a.n);
  // The v3 catalogue counts and lists current models only (older ones sit behind "Show older models"), so its ItemList
  // says the same number (pickleball audit 2026-11-22: "162 paddles" on the page, 178 in the JSON-LD).
  const ldRows = v3Site(niche.id) ? top.filter(r => r.current !== false) : top;
  const ld = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listJsonLd([catalogCrumb], ldRows.map(r => ({ name: r.name, href: r.href }))) }}/>;
  if (!v3Site(niche.id)) {
    const brands = [...count].filter(([b, n]) => b && n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
    return <Shell active="rackets">{ld}<Catalog rows={rows} brands={brands}/></Shell>;
  }
  const { brands, pills, added, curated, wire, rows: listRows } = await padelListData();
  const lists = await threadRankings(), rankings = (niche.id === "audio" ? lists.map(l => l.slug).slice(0, 6) : niche.id === "simracing" ? SR_RANK_LINKS : niche.id === "tennis" ? TN_RANK_LINKS : niche.id === "pickleball" ? PB_RANK_LINKS : RANK_LINKS).flatMap(s => { const l = lists.find(x => x.slug === s); return l ? [{ label: l.label, href: l.href }] : []; });
  // Latest reviews: the 3 newest approved player reviews with a typed name and a line to show.
  const byId = new Map(rows.map(r => [r.id, r]));
  const latest: SideReview[] = (ctx?.data.reviews ?? []).filter(x => typedName(x.alias) && x.reviewText?.trim().length >= 30 && byId.has(x.racketId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
    .map(x => ({ id: x.id, who: typedName(x.alias)!, at: x.createdAt, racket: byId.get(x.racketId)!.name, href: `${byId.get(x.racketId)!.href}#reviews`, text: x.reviewText.trim() }));
  // AudioRecs: its list rows (kind and tuning as the filters), its match inputs and its own words.
  const audio = niche.id === "audio" ? { rows: listRows, ...(wire ? { wire } : {}), title: "All headphones", crumb: "Headphones" }
    : niche.id === "simracing" ? { rows: listRows, title: "All sim racing gear", crumb: "Products" }
    // TennisRecs: its list rows carry head size bands and stiffness as the filters (app/thread/padel-list-data.ts).
    : niche.id === "tennis" ? { rows: listRows, title: "All tennis rackets", crumb: "Rackets" }
    : niche.id === "pickleball" ? { rows: listRows, title: "All pickleball paddles", crumb: "Paddles" } : { rows };
  return <Shell active="rackets">{ld}<PadelCatalog brands={brands} pills={pills} added={added} curated={curated} rankings={rankings} latest={latest} {...audio}/></Shell>;
}
