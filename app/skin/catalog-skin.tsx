import "./skin-product.css";
import "./catalog-beauty.css";
import Link from "next/link";
import { niche } from "../../lib/niche";
import { matchingRackets } from "../../lib/racket-search";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import { V2Footer } from "../v2-footer";
import { skinContext } from "./context";
import { packOf } from "./payload";
import { CatalogSkinBrowser, type SkinF } from "./catalog-skin-browser";

// The SkinRecs catalogue in the owner's beauty design (Claude Design "SkinRecs products", 2026-11-16; before: padel's layout): filters on the
// left from the match engine's scores — "good for <skin type>" means people with that skin type rate it well (suits score 65+
// from enough of them), not that the maker says so — plus finish, texture and fragrance-free. Picking a skin type or a
// concern ranks by match %. Everything in the URL. Used for /products, each type page and each brand page. The filters and
// list work in the browser on the rows sent here (app/skin/catalog-skin-browser.tsx); a text search (?q=) narrows them here.
export default async function CatalogSkin({ f, base, fixedType, brand: only, title, intro }: { f: SkinF; base: string; fixedType?: string; brand?: { id: string; name: string; slug: string }; title?: string; intro?: string }) {
  const ctx = await skinContext(), { data } = ctx;
  const pool = matchingRackets(data.listed, f.q || "").filter(r => (!fixedType || r.shape === fixedType) && (!only || r.brandId === only.id));
  const heading = title ?? (only ? only.name : "All");
  return <main className={`bp bc ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bc-wrap">
      <section className="bc-hero">
        <div>{only && <p className="bc-crumbs"><Link href="/">home</Link> / <Link href="/brands">brands</Link> / {only.name.toLowerCase()}</p>}
          <h1>{fixedType || only ? heading : <>{`${heading} `}<em>products</em></>}</h1>
          <p>{intro ?? "Every product we track. Filter by what you need and the list updates as you tap. “Good for” comes from what people with that skin type said, not from the label."}</p></div>
        <span className="bc-meta">updated daily · <a href="/how-we-make-these">how we rank</a></span>
      </section>
      <CatalogSkinBrowser pack={packOf(ctx, pool)} f={f} base={base} fixedType={fixedType}/>
    </div>
    <V2Footer/>
  </main>;
}
