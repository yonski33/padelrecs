export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche } from "../../lib/niche";
import { catalog } from "../../db/data";
import { ProductArt, productPhoto, Arrow } from "../visual";
const w = niche.words;
export const metadata: Metadata = { ...niche.seo.brands, alternates: { canonical: "/brands" } };

/** Brands A–Z as photo cards (owner, 2026-11-12): each shows its most-reviewed product with a photo, how many products
 *  and how many reviews. */
export default async function Brands() {
  const data = await catalog();
  const reviewsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reviewsOf.set(x.racketId, (reviewsOf.get(x.racketId) ?? 0) + 1);
  const brands = [...data.listedBrands].sort((a, b) => a.name.localeCompare(b.name)).map(b => {
    const products = data.listed.filter(r => r.brandId === b.id).sort((x, y) => (reviewsOf.get(y.id) ?? 0) - (reviewsOf.get(x.id) ?? 0));
    return { b, products, reviews: products.reduce((n, r) => n + (reviewsOf.get(r.id) ?? 0), 0), cover: products.find(r => productPhoto(r)) ?? products[0] };
  });
  return <main className="brands-page">
    <div className="page-title"><h1>Brands</h1><p>{`${brands.length} brands. Browse the ${w.one} database by maker.`}</p></div>
    <ul className="brand-cards">{brands.map(({ b, products, reviews, cover }) => <li key={b.id}><a href={`/brands/${b.slug}`}>
      {cover && <ProductArt product={cover} brand={b.name}/>}
      <span className="brand-card-body"><b>{b.name}</b><span>{`${products.length} ${products.length === 1 ? w.one : w.many} · ${reviews.toLocaleString("en-US")} ${reviews === 1 ? "review" : "reviews"}`}</span></span>
      <Arrow/>
    </a></li>)}</ul>
  </main>;
}
