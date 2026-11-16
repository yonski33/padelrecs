import "./skin-product.css";
import "./pages-beauty.css";
import "./more-beauty.css";
import "./catalog-beauty.css"; // the sort row (.bc-sort)
import Link from "next/link";
import { niche } from "../../lib/niche";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import type { Catalog } from "../../db/data";
import { V2Footer } from "../v2-footer";
import { productSignals } from "../signals";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { BrandsSort, type BrandCard } from "./brands-sort";

/** SkinRecs brands in the owner's beauty design (Claude Design "SkinRecs brands", 2026-11-16): a card per brand with its
 *  product and review counts, its best-scored products' real photos, and what it's known for (its biggest product types). */

export default async function BrandsBeauty({ data, sort }: { data: Catalog; sort?: string }) {
  const sig = await productSignals();
  const reviewsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reviewsOf.set(x.racketId, (reviewsOf.get(x.racketId) ?? 0) + 1);
  const photo = (r: Catalog["listed"][number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const typeWord = (shape: string | null) => (niche.typePages?.find(t => t.shape === shape)?.label ?? shape ?? "").toLowerCase();
  const brands: BrandCard[] = data.listedBrands.map(b => {
    const products = data.listed.filter(r => r.brandId === b.id);
    const best = [...products].sort((x, y) => (sig.get(y.id)?.signal ?? -1) - (sig.get(x.id)?.signal ?? -1));
    const shapes = new Map<string, number>();
    for (const r of products) if (r.shape) shapes.set(r.shape, (shapes.get(r.shape) ?? 0) + 1);
    return { id: b.id, name: b.name, slug: b.slug, count: products.length, reviews: products.reduce((n, r) => n + (reviewsOf.get(r.id) ?? 0), 0),
      known: [...shapes].sort((x, y) => y[1] - x[1]).slice(0, 2).map(([s]) => typeWord(s)).filter(Boolean),
      pics: best.map(r => ({ id: r.id, src: photo(r) })).filter((x): x is { id: string; src: string } => !!x.src).slice(0, 3) };
  }).filter(x => x.count > 0);
  return <main className={`bp bb ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bb-wrap">
      {/* The sort works in the browser (app/skin/brands-sort.tsx). */}
      <BrandsSort brands={brands} sort={sort === "az" ? "az" : "reviews"}>
        <div><div className="bg-crumbs"><Link href="/">home</Link> / brands</div>
          <h1>Browse by <em>brand</em></h1>
          <p>Every brand we track, at a glance. Tap one to see all its products.</p></div>
      </BrandsSort>
      <section className="bg-cta"><div><b>Brand loyal? Fine. But is it right for your skin?</b><span>Answer two questions and see your match % on every product.</span></div>
        <Link className="bp-btn" href="/#match">Find my match →</Link></section>
    </div>
    <V2Footer/>
  </main>;
}
