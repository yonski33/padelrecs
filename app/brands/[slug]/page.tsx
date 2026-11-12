export const dynamic = "force-dynamic";
import { isLight } from "../../../lib/look";
import { CompareTray } from "../../compare/compare-pick";
import { LightCatalog, lightFilters } from "../../light-catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche, productHref } from "../../../lib/niche";
import { catalog, score, topTags } from "../../../db/data";
import { ProductCard, Directory, parseShow } from "../../components";
import { sortProducts } from "../../../lib/product-sort";
import { productSignals } from "../../signals";
import { displayName } from "../../../lib/brand-name";
import { catalogKeyword, listJsonLd } from "../../../lib/catalogue-seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params, data = await catalog(), brand = data.brands.find(b => b.slug === slug);
  if (!brand) return { title: "Brand not found", robots: { index: false } };
  return { ...niche.seo.brand(brand.name), alternates: { canonical: `/brands/${brand.slug}` } };
}

export default async function Brand({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ show?: string; look?: string }> }) {
  const [{ slug }, f, data, sig] = await Promise.all([params, searchParams, catalog(), productSignals()]);
  const brand = data.brands.find(b => b.slug === slug);
  if (!brand) notFound();
  // The light direction, the default since 2026-11-12 (?look=classic shows the old page) (owner, 2026-11-12): the light catalogue with this brand set.
  if (isLight(f.look)) return <LightCatalog data={data} signals={sig} f={lightFilters(f as Record<string, string | string[] | undefined>)} basePath={`/brands/${brand.slug}`} fixed={{ brand: brand.id }}
    title={<>{`${brand.name} `}<em>{catalogKeyword.toLowerCase()}</em></>} crumbs={<><a href="/">Home</a><span>/</span><a href="/brands">Brands</a><span>/</span>{brand.name}</>}/>;
  const results = sortProducts(data.listed.filter(r => r.brandId === brand.id).map(r => ({ r, s: score(data, r.id) })), "positive", x => { const g = sig.get(x.r.id); return g && g.signal * 10_000 - g.rank; });
  const tags = topTags(data), show = parseShow(f.show), w = niche.words;
  const reviews = results.reduce((n, { s }) => n + s.count + s.web, 0);
  const jsonLd = listJsonLd([{ name: "Brands", path: "/brands" }, { name: brand.name, path: `/brands/${brand.slug}` }], results.map(({ r }) => ({ name: displayName(r.name, brand.name), href: productHref(r) })));
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }}/>
    <p className="breadcrumb"><a href="/brands">Brands</a> / {brand.name}</p>
    <div className="page-title"><h1>{`${brand.name} ${catalogKeyword}`}</h1><p>{`${results.length} ${results.length === 1 ? w.one : w.many} · ${reviews.toLocaleString("en-US")} ${reviews === 1 ? "review" : "reviews"}.`}</p></div>
    <Directory show={show} moreHref={n => `/brands/${brand.slug}?show=${n}`} rows={results.map(({ r, s }) => <ProductCard key={r.id} racket={r} brand={brand.name} count={s.count} web={s.web} score={s} signal={sig.get(r.id)?.signal} tags={tags.get(r.id)} details={r.shape ?? ""}/>)}/>
    <CompareTray noun={niche.words.one}/>
  </main>;
}
