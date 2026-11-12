export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { niche } from "../../lib/niche";
import { catalog } from "../../db/data";
import { ProductArt, productPhoto, Arrow } from "../visual";
import { lightFont } from "../light-font";
import { productSignals } from "../signals";
const w = niche.words;
export const metadata: Metadata = { ...niche.seo.brands, alternates: { canonical: "/brands" } };

/** Brands A–Z as photo cards (owner, 2026-11-12): each shows its most-reviewed product with a photo, how many products
 *  and how many reviews. */
export default async function Brands({ searchParams }: { searchParams: Promise<{ look?: string }> }) {
  const [data, f] = await Promise.all([catalog(), searchParams]);
  const reviewsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reviewsOf.set(x.racketId, (reviewsOf.get(x.racketId) ?? 0) + 1);
  const brands = [...data.listedBrands].sort((a, b) => a.name.localeCompare(b.name)).map(b => {
    const products = data.listed.filter(r => r.brandId === b.id).sort((x, y) => (reviewsOf.get(y.id) ?? 0) - (reviewsOf.get(x.id) ?? 0));
    return { b, products, reviews: products.reduce((n, r) => n + (reviewsOf.get(r.id) ?? 0), 0), cover: products.find(r => productPhoto(r)) ?? products[0] };
  });
  // The light direction, previewed with ?look=light (owner, 2026-11-12): calm brand cards, the most-reviewed first,
  // each with its best-scored product so the card says what the brand is known for.
  if (f.look === "light") {
    const sig = await productSignals();
    const byReviews = [...brands].sort((a, b) => b.reviews - a.reviews);
    const total = brands.reduce((n, x) => n + x.reviews, 0);
    return <main className={`brands-page lt-page lb ${lightFont.className}`}>
      <p className="crumbs"><a href="/">Home</a><span>/</span>Brands</p>
      <header className="lc-hero"><div><h1>{"Browse by "}<em>brand</em></h1><p className="lc-sub">{`Every brand in the ${w.one} database, most-reviewed first.`}</p></div>
        <p className="lc-live"><span className="lt-dot" aria-hidden="true"/>{`${brands.length} brands · ${total.toLocaleString("en-US")} reviews`}</p></header>
      <ul className="lb-grid">{byReviews.map(({ b, products, reviews, cover }) => { const best = [...products].sort((x, y) => (sig.get(y.id)?.signal ?? 0) - (sig.get(x.id)?.signal ?? 0))[0]; return <li key={b.id}><a href={`/brands/${b.slug}?look=light`}>
        <span className="lb-art">{cover && <ProductArt product={cover} brand={b.name}/>}</span>
        <span className="lb-body"><b>{b.name}</b><span>{`${products.length} ${products.length === 1 ? w.one : w.many} · ${reviews.toLocaleString("en-US")} ${reviews === 1 ? "review" : "reviews"}`}</span>
          {best && sig.get(best.id) && <small>{`Top: ${best.name.replace(new RegExp(`^${b.name}\\s+`, "i"), "")} · ${sig.get(best.id)!.signal}`}</small>}</span>
      </a></li>; })}</ul>
    </main>;
  }
  return <main className="brands-page">
    <div className="page-title"><h1>Brands</h1><p>{`${brands.length} brands. Browse the ${w.one} database by maker.`}</p></div>
    <ul className="brand-cards">{brands.map(({ b, products, reviews, cover }) => <li key={b.id}><a href={`/brands/${b.slug}`}>
      {cover && <ProductArt product={cover} brand={b.name}/>}
      <span className="brand-card-body"><b>{b.name}</b><span>{`${products.length} ${products.length === 1 ? w.one : w.many} · ${reviews.toLocaleString("en-US")} ${reviews === 1 ? "review" : "reviews"}`}</span></span>
      <Arrow/>
    </a></li>)}</ul>
  </main>;
}
