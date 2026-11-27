// SkinRecs' and SimRacingRecs' type pages in the Thread look (/moisturizers, /wheelbases…): the Thread catalogue for one product type, with the
// live type page's metadata. proxy.ts serves it for /<type slug> on SkinRecs (lib/thread/look.ts threadPath).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { threadRows } from "../../data";
import { Catalog } from "../../live/catalog";
import { PadelCatalog } from "../../live/catalog-padel";
import { padelListData } from "../../padel-list-data";
import { threadRankings } from "../../rankings-data";
import { listJsonLd } from "../../../../lib/catalogue-seo";
import { niche } from "../../../../lib/niche";
import { liveOr } from "../../seo";
import { generateMetadata as liveTypeMetadata } from "../../../types/[slug]/page";

export const revalidate = 21600;
type P = { params: Promise<{ type: string }> };
const typeOf = (slug: string) => (niche.typePages ?? []).find(t => t.slug === slug);
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = typeOf((await params).type);
  if (!t) return {};
  // The live type page's title, description and canonical (app/types/[slug]/page.tsx).
  return liveOr(() => liveTypeMetadata({ params: Promise.resolve({ slug: t.slug }) } as Parameters<typeof liveTypeMetadata>[0]));
}

export default async function ThreadTypePage({ params }: P) {
  const t = typeOf((await params).type);
  if (!t) notFound();
  // AudioRecs (V3-ROLLOUT-BRIEF): the v3 catalogue for one type, no score.
  if (niche.id === "audio") {
    const d = await padelListData(), kinds = t.shape === "Headphones" ? ["Over-ear", "On-ear", "Open-back"] : t.shape === "IEMs" ? ["IEM"] : [t.shape];
    const keep = new Set(d.rows.filter(r => kinds.includes(r.shape ?? "")).map(r => r.id));
    const lists = await threadRankings();
    return <Shell active="rackets"><PadelCatalog rows={d.rows.filter(r => keep.has(r.id))} brands={d.brands} pills={d.pills} added={d.added} curated={[]}
      rankings={lists.slice(0, 6).map(l => ({ label: l.label, href: l.href }))} latest={[]} title={t.label} crumb={t.label}
      {...(d.wire ? { wire: d.wire.filter(w => keep.has(w.id)) } : {})}/></Shell>;
  }
  // SimRacingRecs (v3 rollout 2026-11-21): the v3 catalogue for one gear type, no score.
  // DiscGolfRecs (wave 2) the same way: one disc type, with its flight pills and Stability fine-tune.
  if (niche.id === "simracing" || niche.id === "discgolf") {
    const d = await padelListData(), lists = await threadRankings();
    return <Shell active="rackets"><PadelCatalog rows={d.rows.filter(r => r.shape === t.shape)} brands={d.brands} pills={d.pills} added={d.added} curated={[]}
      rankings={lists.slice(0, 6).map(l => ({ label: l.label, href: l.href }))} latest={[]} title={t.label} crumb={t.label}/></Shell>;
  }
  // LaptopRecs (owner 2026-11-24): the v3 catalogue for one category, with its quick match, no score.
  if (niche.id === "laptop") {
    const d = await padelListData(), lists = await threadRankings(), keep = new Set(d.rows.filter(r => r.shape === t.shape).map(r => r.id));
    const ld = listJsonLd([{ name: t.label, path: `/${t.slug}` }], d.rows.filter(r => keep.has(r.id)).sort((a, b) => b.n - a.n).map(r => ({ name: r.name, href: r.href })));
    return <Shell active="rackets"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }}/><PadelCatalog rows={d.rows.filter(r => keep.has(r.id))} brands={d.brands} pills={d.pills} added={d.added} curated={[]}
      rankings={lists.slice(0, 6).map(l => ({ label: l.label, href: l.href }))} latest={[]} title={t.label} crumb={t.label} {...(d.laptop ? { laptop: d.laptop.filter(w => keep.has(w.id)) } : {})}/></Shell>;
  }
  // CoffeeRecs (2026-11-28, the v3 port): the same as LaptopRecs, with its own quick match; its category lists first.
  if (niche.id === "coffee") {
    const d = await padelListData(), lists = await threadRankings(), keep = new Set(d.rows.filter(r => r.shape === t.shape).map(r => r.id));
    const ld = listJsonLd([{ name: t.label, path: `/${t.slug}` }], d.rows.filter(r => keep.has(r.id)).sort((a, b) => b.n - a.n).map(r => ({ name: r.name, href: r.href })));
    const own = lists.filter(l => (niche.topLists ?? []).find(x => x.slug === l.slug)?.filters?.some(f => f.column === "shape" && !!f.include?.includes(t.shape)));
    return <Shell active="rackets"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }}/><PadelCatalog rows={d.rows.filter(r => keep.has(r.id))} brands={d.brands} pills={d.pills} added={d.added} curated={[]}
      rankings={[...own, ...lists.filter(l => !own.includes(l))].slice(0, 6).map(l => ({ label: l.label, href: l.href }))} latest={[]} title={t.label} crumb={t.label}
      {...(d.coffee ? { coffee: d.coffee.filter(w => keep.has(w.id)) } : {})}/></Shell>;
  }
  // SkinRecs (v3 rollout 2026-11-21): the v3 catalogue for one product type, with its quick match, no score.
  if (niche.id === "skin") {
    const d = await padelListData(), lists = await threadRankings(), keep = new Set(d.rows.filter(r => r.shape === t.shape).map(r => r.id));
    // The live type page's structured list, as before (top by reviews; no score shown).
    const ld = listJsonLd([{ name: t.label, path: `/${t.slug}` }], d.rows.filter(r => keep.has(r.id)).sort((a, b) => b.n - a.n).map(r => ({ name: r.name, href: r.href })));
    return <Shell active="rackets"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }}/><PadelCatalog rows={d.rows.filter(r => keep.has(r.id))} brands={d.brands} pills={d.pills} added={d.added} curated={[]}
      rankings={[...lists.filter(l => l.kids), ...lists.filter(l => l.group === "By product type")].slice(0, 6).map(l => ({ label: l.label, href: l.href }))}
      latest={[]} title={t.label} crumb={t.label} {...(d.skin ? { skin: d.skin.filter(w => keep.has(w.id)) } : {})}/></Shell>;
  }
  const { all } = await threadRows();
  const rows = all.filter(r => r.n > 0 && r.shape === t.shape);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const brands = [...count].filter(([b, n]) => b && n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
  const top = [...rows].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.n - a.n);
  return <Shell active="rackets"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listJsonLd([{ name: t.label, path: `/${t.slug}` }], top.map(r => ({ name: r.name, href: r.href }))) }}/>
    <Catalog rows={rows} brands={brands} title={t.label} lead={niche.id === "simracing" ? `${t.intro}. Filter by level, drive and brand, then see what racers say.`
      : `${t.intro}. Filter by how it works for your skin, then see what people say.`}/></Shell>;
}
