import "./catalog-v2.css";
import { niche, productHref, mockLook } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { listLine } from "../../lib/list-lines";
import { shortLine } from "../../lib/short-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { matchingRackets } from "../../lib/racket-search";
import { score, type Catalog } from "../../db/data";
import { SUITS_OK } from "../../lib/fit-verdict";
import type { CatalogFilters, CatalogRow } from "../../lib/catalog-filter";
import { CatalogBrowser, type CatalogCard } from "./catalog-browser";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { matchContext } from "../match-context";
import { listShopLink } from "../../lib/amazon-offer";
import { catalogRows } from "./catalog-rows";
import { specGroups } from "../../lib/guide";

// The catalogue in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/Jv7VD7a2asnf83YuKDfxaw), PadelRecs
// only: filters on the left (play style, level, shape, year, arm-friendly, and "more filters" for weight, feel and a bigger
// sweet spot, like the home's fine-tune), the list as card rows ranked by Player score. Everything is in the URL, so every view
// is a server-rendered, shareable page; a group's counts are what you'd get by picking that option. A tap filters in the browser
// (app/rackets/catalog-browser.tsx, lib/catalog-filter.ts), with no round trip.
type F = CatalogFilters;


/** With `brand`, the same page for one brand (/brands/<slug>, owner 2026-11-15: the brand page in the new design). */
export default async function CatalogV2({ data: all, f, brand: only }: { data: Catalog; f: F; brand?: { id: string; name: string; slug: string } }) {
  const data = only ? { ...all, listed: all.listed.filter(r => r.brandId === only.id) } : all;
  const base = only ? `/brands/${only.slug}` : "/rackets";
  const ctx = await matchContext();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  // Each listed racket's filter facts (app/rackets/catalog-rows.ts, shared with the guide), and its card. Both go to the
  // browser once; filters and sort run there (app/rackets/catalog-browser.tsx).
  const photo = (r: Catalog["listed"][number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const listed = matchingRackets(data.listed, f.q || "");
  const rows: CatalogRow[] = catalogRows(data, ctx, listed);
  const cards: Record<string, CatalogCard> = Object.fromEntries(listed.map(r => { const sc = score(data, r.id), shop = listShopLink(r);
    return [r.id, { name: displayName(r.name, brand(r.brandId)), href: productHref(r), pic: photo(r), tile: brand(r.brandId) ?? "", line: shortLine(r) ?? listLine(r) ?? null,
      shop: shop ? { url: shop.url, rel: shop.rel } : null, pos: sc.positive, mix: sc.mixed, neg: sc.negative }]; }));

  return <main className={`ct2${mockLook ? " ct2-m" : ""} ${qtFontVars}`}>
    <div className="ct2-wrap">
      <section className="ct2-hero">
        <div>{only && <p className="ct2-crumbs"><a href="/">home</a> / <a href="/brands">brands</a> / {only.name.toLowerCase()}</p>}
          {only ? <h1>{`${only.name} `}<span className="hl">{niche.words.many}</span></h1> : <h1>All <span className="hl">{niche.words.many}</span></h1>}
          <p>{only ? `Every ${only.name} ${niche.words.one} we track, ranked by Player score. Narrow it down on the left.` : `Every ${niche.words.one} we track. Narrow it down on the left — the list updates as you tap.`}</p></div>
        <span className="ct2-meta">updated daily · <a href="/how-we-make-these">how we rank</a></span>
      </section>
      <CatalogBrowser rows={rows} cards={cards} f={f} base={base} suitsOk={SUITS_OK} many={niche.words.many} one={niche.words.one} spec={specGroups(niche.guide)}/>
    </div>
    <V2Footer/>
  </main>;
}
