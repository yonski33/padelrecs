export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { catalog as loadCatalog, score, topTags } from "../../../db/data";
import { pageFor, seoName, hubTitle, hubDescription, productsOfType } from "../../../lib/type-pages";
import { ProductCard, Directory, parseShow } from "../../components";
import { AutoSubmitForm } from "../../auto-submit";
import { CategoryTabs } from "../../visual";
import { SORTS, parseSort, sortProducts } from "../../../lib/product-sort";
import { niche, catalogPath, catalogLabel, productHref } from "../../../lib/niche";
import { displayName } from "../../../lib/brand-name";
import { listJsonLd, catalogCrumb } from "../../../lib/catalogue-seo";

// Served at /<slug> (next.config.ts rewrites only the configured slugs here). One page per product type, e.g. SkinRecs /cleansers.
// One catalog read per request, shared by the page and its metadata.
const catalog = cache(() => loadCatalog());

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = pageFor((await params).slug);
  if (!t) return {};
  const title = hubTitle(t);
  const description = hubDescription(t, productsOfType(await catalog(), t).map(x => x.r.name));
  return { title, description, alternates: { canonical: `/${t.slug}` }, openGraph: { title, description, url: `/${t.slug}`, type: "website" } };
}

// "Cleanser" → "cleanser", but acronyms stay as they are: "AI assistant", "CRM", "VPN".
const lowerWords = (text: string) => text.replace(/\b[A-Z](?=[a-z])/g, c => c.toLowerCase());

export default async function TypePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ brand?: string; sort?: string; show?: string }> }) {
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
  const tags = topTags(data), show = parseShow(f.show);
  const moreHref = (n: number) => { const q = new URLSearchParams(Object.entries({ ...f, show: String(n) }).filter(([, v]) => v) as [string, string][]); return `/${t.slug}?${q}`; };
  const jsonLd = listJsonLd([catalogCrumb, { name: t.label, path: `/${t.slug}` }], results.map(({ r }) => ({ name: displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name), href: productHref(r) })));
  return <main className="catalog v2">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }}/>
    <p className="breadcrumb"><a href={catalogPath}>{catalogLabel}</a> / {t.label}</p>
    <div className="page-hero"><h1>{seoName(t)}</h1><p>{`${t.intro}. ${ofType.length} ${ofType.length === 1 ? niche.words.one : niche.words.many} · ${reviewTotal} reviews.`}</p></div>
    <CategoryTabs current={t.slug}/>
    <AutoSubmitForm className="pills" action={`/${t.slug}`}>
      {brands.length > 1 && <label className={f.brand ? "pill on" : "pill"}><span className="sr-only">Brand</span><select name="brand" defaultValue={f.brand || ""}><option value="">All brands</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>}
      {(f.brand || f.sort) && <a className="pills-clear" href={`/${t.slug}`}>Clear</a>}
      <p className="pills-count">{`${results.length} ${results.length === 1 ? niche.words.one : niche.words.many}`}</p>
      <label className="pills-sort">Sort:<select name="sort" defaultValue={sort === "discussed" ? "" : sort}>{SORTS.map(s => <option key={s.value} value={s.value === "discussed" ? "" : s.value}>{s.label}</option>)}</select></label>
      <noscript><button>Filter</button></noscript>
    </AutoSubmitForm>
    <Directory show={show} moreHref={moreHref} rows={results.map(({ r, s }) => <ProductCard key={r.id} racket={r} brand={data.brands.find(b => b.id === r.brandId)?.name} count={s.count} web={s.web} score={s} tags={tags.get(r.id)} details=""/>)}/>
    {!results.length && (f.brand
      ? <p className="empty-feed">{`No ${lowerWords(seoName(t))} from this brand yet. `}<a href={`/${t.slug}`}>Show all {lowerWords(seoName(t))}</a></p>
      : <p className="empty-feed">{`No ${lowerWords(seoName(t))} reviewed here yet. `}<a href="/add-review">Add a review →</a></p>)}
  </main>;
}
