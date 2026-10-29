export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog, score } from "../../../db/data";
import { RacketRow } from "../../components";
import { AutoSubmitForm } from "../../auto-submit";
import { SORTS, parseSort, sortProducts, positiveShare } from "../../../lib/product-sort";
import { niche, catalogPath, catalogLabel } from "../../../lib/niche";

// Served at /<slug> (next.config.ts rewrites only the configured slugs here). One page per product type, e.g. SkinRecs /cleansers.
const pageFor = (slug: string) => niche.typePages?.find(t => t.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = pageFor((await params).slug);
  if (!t) return {};
  const title = `${t.label} – ${niche.people.One} Reviews and Ratings`;
  const description = `${t.intro}: real ${niche.people.one} reviews and ratings of every ${lowerWords(t.shape)} on ${niche.site.name}, plus opinions from around the web.`;
  return { title, description, alternates: { canonical: `/${t.slug}` }, openGraph: { title, description, url: `/${t.slug}`, type: "website" } };
}

// "Cleanser" → "cleanser", but acronyms stay as they are: "AI assistant", "CRM", "VPN".
const lowerWords = (text: string) => text.replace(/\b[A-Z](?=[a-z])/g, c => c.toLowerCase());

export default async function TypePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ brand?: string; sort?: string }> }) {
  const [{ slug }, f, data] = await Promise.all([params, searchParams, catalog()]);
  const t = pageFor(slug);
  if (!t) notFound();
  const ofType = data.listed.filter(r => r.shape?.toLowerCase() === t.shape.toLowerCase());
  const scored = ofType.map(r => ({ r, s: score(data, r.id) }));
  const brandIds = new Set(ofType.map(r => r.brandId));
  const brands = data.brands.filter(b => brandIds.has(b.id));
  const sort = parseSort(f.sort);
  const results = sortProducts(scored.filter(x => !f.brand || x.r.brandId === f.brand), sort);
  const reviewTotal = scored.reduce((n, x) => n + x.s.count + x.s.web, 0);
  return <main>
    <p className="breadcrumb"><a href={catalogPath}>{catalogLabel}</a> / {t.label}</p>
    <div className="page-title"><h1>{t.label}</h1><p>{`${t.intro}. ${ofType.length} ${ofType.length === 1 ? niche.words.one : niche.words.many} · ${reviewTotal} reviews.`}</p></div>
    <AutoSubmitForm className="filters" action={`/${t.slug}`}>
      <label>Sort by<select name="sort" defaultValue={sort === "discussed" ? "" : sort}>{SORTS.map(s => <option key={s.value} value={s.value === "discussed" ? "" : s.value}>{s.label}</option>)}</select></label>
      {brands.length > 1 && <label>Brand<select name="brand" defaultValue={f.brand || ""}><option value="">All brands</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}
      <noscript><button>Filter</button></noscript>
      {(f.brand || f.sort) && <a href={`/${t.slug}`}>Reset</a>}
    </AutoSubmitForm>
    <div className="directory">{results.map(({ r, s }) => <RacketRow key={r.id} racket={r} brand={data.brands.find(b => b.id === r.brandId)?.name} average={s.average} count={s.count} web={s.web} positive={positiveShare(s)} details={niche.rowDetail && r[niche.rowDetail.column] ? `${r[niche.rowDetail.column]}${niche.rowDetail.suffix}` : ""}/>)}</div>
    {!results.length && <p className="empty-feed">{`No ${lowerWords(t.label)} from this brand yet. `}<a href={`/${t.slug}`}>Show all {lowerWords(t.label)}</a></p>}
  </main>;
}
