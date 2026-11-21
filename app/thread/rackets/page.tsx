// Thread catalogue (Rackets Thread). proxy.ts serves it for /rackets; search, filters and sort stay in the browser.
// PadelRecs (owner mock 2026-11-21, "i think it works now"): its own catalogue (app/thread/live/catalog-padel.tsx) with a
// full-width top card, the match bar, a fine-tune panel, the list and a community sidebar. Other sites keep Catalog.
import { Shell } from "../shell";
import { threadRows, traitCounts, traitGroup } from "../data";
import { Catalog } from "../live/catalog";
import { PadelCatalog, type SideReview } from "../live/catalog-padel";
import { listJsonLd, catalogCrumb } from "../../../lib/catalogue-seo";
import { niche } from "../../../lib/niche";
import { votePill } from "../../../lib/thread/vote-pill";
import { TRAIT_GROUPS } from "../../../lib/thread/traits";
import { threadRankings } from "../rankings-data";
import { typedName } from "../../../lib/thread/display-name";
import padelCurated from "../../../db/curated/padel.json";

export const revalidate = 21600;
import type { Metadata } from "next";
import { generateMetadata as liveMetadata } from "../../rackets/page";
import { liveOr } from "../seo";
export const generateMetadata = (): Promise<Metadata> => liveOr(liveMetadata);

/** The sidebar's ranking links, in the mock's order, where the list exists. */
const RANK_LINKS = ["best-padel-rackets", "best-power-padel-rackets", "best-control-padel-rackets", "best-padel-rackets-for-beginners", "best-teardrop-padel-rackets", "best-diamond-padel-rackets"];
/** "PadelRecs picks": the owner's curated lists (db/curated/padel.json) interleaved by place (#1 of each, then #2 …). */
const curatedOrder = () => { const lists = Object.values((padelCurated as { lists: Record<string, { slug: string }[]> }).lists), out: string[] = [];
  for (let i = 0; i < Math.max(0, ...lists.map(l => l.length)); i++) for (const l of lists) { const s = l[i]?.slug; if (s && !out.includes(s)) out.push(s); }
  return out; };

export default async function ThreadCatalog() {
  const { all, ctx } = await threadRows();
  const rows = all.filter(r => r.n > 0);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const top = [...rows].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.n - a.n);
  const ld = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listJsonLd([catalogCrumb], top.map(r => ({ name: r.name, href: r.href }))) }}/>;
  if (niche.id !== "padel") {
    const brands = [...count].filter(([b, n]) => b && n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
    return <Shell active="rackets">{ld}<Catalog rows={rows} brands={brands}/></Shell>;
  }
  const brands = [...count].filter(([b]) => b).sort((a, b) => b[1] - a[1]).map(([b]) => b);
  // One vote pill per row (lib/thread/vote-pill.ts), from the groups as each racket page shows them.
  const tc = ctx ? await traitCounts() : null;
  const pills = Object.fromEntries(rows.flatMap(r => { const p = tc ? votePill(Object.fromEntries(TRAIT_GROUPS.map(g => [g.key, traitGroup(tc, r.id, g.key)]))) : null; return p ? [[r.id, p]] : []; }));
  const listed = new Map((ctx?.data.listed ?? []).map(x => [x.id, x]));
  const added = Object.fromEntries(rows.map(r => [r.id, listed.get(r.id)?.createdAt ?? ""]));
  const bySlug = new Map(rows.map(r => [r.slug, r.id])), curated = curatedOrder().flatMap(s => bySlug.get(s) ?? []);
  const lists = await threadRankings(), rankings = RANK_LINKS.flatMap(s => { const l = lists.find(x => x.slug === s); return l ? [{ label: l.label, href: l.href }] : []; });
  // Latest reviews: the 3 newest approved player reviews with a typed name and a line to show.
  const byId = new Map(rows.map(r => [r.id, r]));
  const latest: SideReview[] = (ctx?.data.reviews ?? []).filter(x => typedName(x.alias) && x.reviewText?.trim().length >= 30 && byId.has(x.racketId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
    .map(x => ({ id: x.id, who: typedName(x.alias)!, at: x.createdAt, racket: byId.get(x.racketId)!.name, href: `${byId.get(x.racketId)!.href}#reviews`, text: x.reviewText.trim() }));
  return <Shell active="rackets">{ld}<PadelCatalog rows={rows} brands={brands} pills={pills} added={added} curated={curated} rankings={rankings} latest={latest}/></Shell>;
}
