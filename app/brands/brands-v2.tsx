import "./brands-v2.css";
import Link from "next/link";
import { niche, siteColor } from "../../lib/niche";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import type { Catalog } from "../../db/data";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { productSignals } from "../signals";
import { rowOfFamily } from "../../lib/compare-pairs";
import { MIN_FIT_REPORTS } from "../../lib/fit-verdict";

// Brands in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/3XBVLw7sGXDYTJcReV1mLm), PadelRecs
// only: one card per brand with its best-scored rackets' photos (a name tile when it has none), most reviewed first or A–Z.
const TINTS = [siteColor("--site-wash", "oklch(0.97 0.04 125)"), "oklch(0.97 0.05 95)", "oklch(0.97 0.025 200)", "oklch(0.97 0.03 60)"];
const HEIGHTS = [76, 70, 70, 64];

export default async function BrandsV2({ data, sort }: { data: Catalog; sort?: string }) {
  const sig = await productSignals();
  const reviewsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reviewsOf.set(x.racketId, (reviewsOf.get(x.racketId) ?? 0) + 1);
  const photo = (r: Catalog["listed"][number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const az = sort === "az";
  const brands = data.listedBrands.map(b => {
    const products = data.listed.filter(r => r.brandId === b.id);
    const best = [...products].sort((x, y) => (sig.get(y.id)?.signal ?? -1) - (sig.get(x.id)?.signal ?? -1) || y.year - x.year);
    // One count per model, newest year, the same rule as the catalogue and the brand page (audit 2026-11-17, #28: "Adidas 28
    // rackets" here, "All 19" on its page). Older years stay live on their own pages.
    const count = products.filter(r => rowOfFamily(r, data.listed, x => (reviewsOf.get(x.id) ?? 0) >= MIN_FIT_REPORTS).shown.id === r.id).length;
    return { b, count, reviews: products.reduce((n, r) => n + (reviewsOf.get(r.id) ?? 0), 0),
      pics: best.map(r => ({ r, src: photo(r) })).filter((x): x is { r: typeof x.r; src: string } => !!x.src).slice(0, 4) };
  }).filter(x => x.count > 0).sort((a, b) => az ? a.b.name.localeCompare(b.b.name) : b.reviews - a.reviews || a.b.name.localeCompare(b.b.name));
  const w = niche.words;
  return <main className={`bv2 ${qtFontVars}`}>
    <div className="bv2-wrap">
      <section className="bv2-hero">
        <div><p className="bv2-crumbs"><a href="/">home</a> / brands</p>
          <h1>Browse by <span className="hl">brand</span></h1>
          <p className="bv2-sub">{`Every brand we track, at a glance. Tap one to see all its ${w.many}.`}</p></div>
        <div className="bv2-sort"><span>sort</span>
          <Link href="/brands" scroll={false} replace aria-current={!az ? "true" : undefined}>most reviewed</Link>
          <Link href="/brands?sort=az" scroll={false} replace aria-current={az ? "true" : undefined}>A–Z</Link></div>
      </section>
      <ul className="bv2-grid">{brands.map(({ b, count, pics }, i) => <li key={b.id}><a className="bv2-card" href={`/brands/${b.slug}`}>
        <span className="bv2-top"><span><b>{b.name}</b><small>{`${count} ${count === 1 ? w.one : w.many}`}</small></span><i aria-hidden="true">→</i></span>
        <span className="bv2-strip" style={{ background: TINTS[i % TINTS.length] }}>
          {pics.length ? pics.map((p, j) => <span key={p.r.id} className="bv2-slot" style={{ height: HEIGHTS[j] }}><img src={p.src} alt="" width={408} height={620} decoding="async" loading={i < 6 ? "eager" : "lazy"}/></span>)
            : <span className="bv2-mono" aria-hidden="true">{b.name}</span>}
        </span>
      </a></li>)}</ul>
      <section className="bv2-cta">
        <div><p className="t">{`Brand loyal? Fine. But is it the right ${w.one}?`}</p><p>{`Answer two questions and see how well every ${w.one} fits your game.`}</p></div>
        <a href="/#match">{`Find your ${w.one} →`}</a>
      </section>
    </div>
    <V2Footer/>
  </main>;
}
