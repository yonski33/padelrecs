export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog, score } from "../../../db/data";
import { RacketRow } from "../../components";
import { niche, catalogPath } from "../../../lib/niche";

// Served at /<slug> (next.config.ts rewrites only the configured slugs here). One page per product type, e.g. SkinRecs /cleansers.
const pageFor = (slug: string) => niche.typePages?.find(t => t.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = pageFor((await params).slug);
  if (!t) return {};
  const title = `${t.label} – ${niche.people.One} Reviews and Ratings`;
  const description = `${t.intro}: real ${niche.people.one} reviews and ratings of every ${t.shape.toLowerCase()} on ${niche.site.name}, plus opinions from around the web.`;
  return { title, description, alternates: { canonical: `/${t.slug}` }, openGraph: { title, description, url: `/${t.slug}`, type: "website" } };
}

export default async function TypePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ brand?: string }> }) {
  const [{ slug }, f, data] = await Promise.all([params, searchParams, catalog()]);
  const t = pageFor(slug);
  if (!t) notFound();
  const ofType = data.rackets.filter(r => r.shape?.toLowerCase() === t.shape.toLowerCase());
  const scored = ofType.map(r => ({ r, s: score(data, r.id) }));
  const brandIds = new Set(ofType.map(r => r.brandId));
  const brands = data.brands.filter(b => brandIds.has(b.id));
  // Most-discussed first (user ratings, then web reviews), so the products with the most to read lead.
  const results = scored.filter(x => !f.brand || x.r.brandId === f.brand)
    .sort((a, b) => b.s.count - a.s.count || b.s.web - a.s.web || a.r.name.localeCompare(b.r.name));
  const reviewTotal = scored.reduce((n, x) => n + x.s.count + x.s.web, 0);
  return <main>
    <p className="breadcrumb"><a href={catalogPath}>{niche.words.Many}</a> / {t.label}</p>
    <div className="page-title"><h1>{t.label}</h1><p>{`${t.intro}. ${ofType.length} ${ofType.length === 1 ? niche.words.one : niche.words.many} · ${reviewTotal} reviews.`}</p></div>
    {brands.length > 1 && <form className="filters" action={`/${t.slug}`}>
      <label>Brand<select name="brand" defaultValue={f.brand || ""}><option value="">All brands</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      <button>Filter</button>{f.brand && <a href={`/${t.slug}`}>Reset</a>}
    </form>}
    <div className="directory">{results.map(({ r, s }) => <RacketRow key={r.id} racket={r} brand={data.brands.find(b => b.id === r.brandId)?.name} average={s.average} count={s.count} web={s.web} details={niche.rowDetail && r[niche.rowDetail.column] ? `${r[niche.rowDetail.column]}${niche.rowDetail.suffix}` : ""}/>)}</div>
    {!results.length && <p className="empty-feed">{`No ${t.label.toLowerCase()} from this brand yet. `}<a href={`/${t.slug}`}>Show all {t.label.toLowerCase()}</a></p>}
  </main>;
}
