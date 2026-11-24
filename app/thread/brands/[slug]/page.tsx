// Thread brand page (no mockup: the Thread catalogue for one brand, owner 2026-11-19). proxy.ts serves it for /brands/<slug>.
// A short plain intro from the data, then the brand's rackets as catalogue rows with the same filters and sort, current models
// first (older years behind "Show older models"). Title, canonical and structured data are the live page's.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { threadRows, hasDb, laptopOf } from "../../data";
import { Catalog } from "../../live/catalog";
import { brandIntro } from "../../../../lib/thread/brand-intro";
import { generateMetadata as liveMetadata } from "../../../brands/[slug]/page";
import { listJsonLd } from "../../../../lib/catalogue-seo";
import { liveOr } from "../../seo";
import { th } from "../../../../lib/thread/look";
import { niche, catalogPath } from "../../../../lib/niche";
import { catalog } from "../../../../db/data";

export const revalidate = 21600;
export async function generateStaticParams() {
  if (!hasDb()) return [];
  return (await catalog()).listedBrands.map(b => ({ slug: b.slug }));
}
export const generateMetadata = ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> => liveOr(() => liveMetadata({ params }));

export default async function ThreadBrand({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { ctx, all }] = await Promise.all([params, threadRows()]);
  const brand = ctx?.data.brands.find(b => b.slug === slug);
  if (!brand) notFound();
  // LaptopRecs (owner 2026-11-24): current models only (lib/thread/laptop-lines.ts); older generations whose pages are ready
  // sit in a collapsed "Older models" list at the bottom, as reference pages. Pages not ready yet are never linked.
  const LT = niche.id === "laptop", ready = LT ? laptopOf(ctx)?.ready : null;
  const rows = all.filter(r => r.brand === brand.name && (LT ? r.current : r.n > 0));
  const older = LT ? all.filter(r => r.brand === brand.name && !r.current && ready?.has(r.id)).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const current = rows.filter(r => r.current !== false);
  const top = current.filter(r => r.score != null).sort((a, b) => b.score! - a.score! || b.n - a.n)[0];
  const short = (n: string) => n.replace(new RegExp(`^${brand.name}\\s+`, "i"), "");
  const lead = brandIntro(brand.name, current.length, rows.reduce((n, r) => n + r.n, 0), top ? { name: short(top.name), score: top.score! } : null, niche.words.one);
  const ld = listJsonLd([{ name: "Brands", path: "/brands" }, { name: brand.name, path: `/brands/${brand.slug}` }], ctx.data.listed.filter(r => r.brandId === brand.id).map(r => ({ name: all.find(x => x.id === r.id)?.name ?? r.name, href: all.find(x => x.id === r.id)?.href ?? `${catalogPath}/${r.slug}` })));
  return <Shell>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }}/>
    <Catalog rows={rows} brands={[]} title={niche.id === "skin" ? `${brand.name} skincare` : niche.id === "discgolf" ? `${brand.name} discs` : niche.id === "simracing" ? `${brand.name} sim racing gear` : `${brand.name} ${niche.id} ${niche.words.many}`} lead={lead}
      crumbs={<div key="crumbs" className="th-crumbs"><a href={th("/brands")}>Brands</a><span>/</span><span>{brand.name}</span></div>}/>
    {older.length > 0 && <details className="th-older"><summary>{`Older models (${older.length})`}</summary>
      <ul>{older.map(r => <li key={r.id}><a href={th(r.href)}>{r.name}</a></li>)}</ul></details>}
  </Shell>;
}
