import "./skin-product.css";
import "./pages-beauty.css";
import "./more-beauty.css";
import Link from "next/link";
import { niche } from "../../lib/niche";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import type { Catalog } from "../../db/data";
import { V2Footer } from "../v2-footer";
import { productSignals } from "../signals";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";

/** SkinRecs brands in the owner's beauty design (Claude Design "SkinRecs brands", 2026-11-16): a card per brand with its
 *  product and review counts, its best-scored products' real photos, and what it's known for (its biggest product types). */
const TINTS = ["oklch(0.97 0.02 20)", "oklch(0.97 0.025 155)", "#f4ede6", "oklch(0.97 0.03 70)"];
const HEIGHTS = [72, 64, 68];

export default async function BrandsBeauty({ data, sort }: { data: Catalog; sort?: string }) {
  const sig = await productSignals();
  const reviewsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reviewsOf.set(x.racketId, (reviewsOf.get(x.racketId) ?? 0) + 1);
  const photo = (r: Catalog["listed"][number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const typeWord = (shape: string | null) => (niche.typePages?.find(t => t.shape === shape)?.label ?? shape ?? "").toLowerCase();
  const az = sort === "az";
  const brands = data.listedBrands.map(b => {
    const products = data.listed.filter(r => r.brandId === b.id);
    const best = [...products].sort((x, y) => (sig.get(y.id)?.signal ?? -1) - (sig.get(x.id)?.signal ?? -1));
    const shapes = new Map<string, number>();
    for (const r of products) if (r.shape) shapes.set(r.shape, (shapes.get(r.shape) ?? 0) + 1);
    return { b, count: products.length, reviews: products.reduce((n, r) => n + (reviewsOf.get(r.id) ?? 0), 0),
      known: [...shapes].sort((x, y) => y[1] - x[1]).slice(0, 2).map(([s]) => typeWord(s)).filter(Boolean),
      pics: best.map(r => ({ r, src: photo(r) })).filter((x): x is { r: typeof x.r; src: string } => !!x.src).slice(0, 3) };
  }).filter(x => x.count > 0).sort((a, b) => az ? a.b.name.localeCompare(b.b.name) : b.reviews - a.reviews || a.b.name.localeCompare(b.b.name));
  return <main className={`bp bb ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bb-wrap">
      <section className="bb-hero">
        <div><div className="bg-crumbs"><Link href="/">home</Link> / brands</div>
          <h1>Browse by <em>brand</em></h1>
          <p>Every brand we track, at a glance. Tap one to see all its products.</p></div>
        <div className="bc-sort"><span>sort</span>
          <Link href="/brands" scroll={false} replace className={`bp-pick sm${!az ? " on" : ""}`} aria-current={!az ? "true" : undefined}>most reviewed</Link>
          <Link href="/brands?sort=az" scroll={false} replace className={`bp-pick sm${az ? " on" : ""}`} aria-current={az ? "true" : undefined}>A to Z</Link></div>
      </section>
      <ul className="bb-grid">{brands.map(({ b, count, reviews, known, pics }, i) => <li key={b.id}><a className="bb-card" href={`/brands/${b.slug}`}>
        <span className="bb-top"><span><b>{b.name}</b><small>{`${count} ${count === 1 ? "product" : "products"} · ${reviews.toLocaleString("en-US")} reviews`}</small></span><i aria-hidden="true">→</i></span>
        <span className="bb-strip" style={{ background: TINTS[i % TINTS.length] }}>
          {pics.length ? pics.map((p, j) => <span key={p.r.id} className="bb-slot" style={{ height: HEIGHTS[j] }}><img src={p.src} alt="" width={120} height={160} decoding="async" loading={i < 8 ? "eager" : "lazy"}/></span>)
            : <span className="bb-mono" aria-hidden="true">{b.name}</span>}
        </span>
        {known.length > 0 && <span className="bb-known">{known.map(k => <span key={k}>{k}</span>)}</span>}
      </a></li>)}</ul>
      <section className="bg-cta"><div><b>Brand loyal? Fine. But is it right for your skin?</b><span>Answer two questions and see your match % on every product.</span></div>
        <Link className="bp-btn" href="/#match">Find my match →</Link></section>
    </div>
    <V2Footer/>
  </main>;
}
