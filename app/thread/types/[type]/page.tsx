// SkinRecs' type pages in the Thread look (/moisturizers, /serums…): the Thread catalogue for one product type, with the
// live type page's metadata. proxy.ts serves it for /<type slug> on SkinRecs (lib/thread/look.ts threadPath).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { threadRows } from "../../data";
import { Catalog } from "../../live/catalog";
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
  const { all } = await threadRows();
  const rows = all.filter(r => r.n > 0 && r.shape === t.shape);
  const count = new Map<string, number>();
  for (const r of rows) count.set(r.brand, (count.get(r.brand) ?? 0) + 1);
  const brands = [...count].filter(([b, n]) => b && n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
  const top = [...rows].sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.n - a.n);
  return <Shell active="rackets"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listJsonLd([{ name: t.label, path: `/${t.slug}` }], top.map(r => ({ name: r.name, href: r.href }))) }}/>
    <Catalog rows={rows} brands={brands} title={t.label} lead={`${t.intro}. Filter by how it works for your skin, then see what people say.`}/></Shell>;
}
