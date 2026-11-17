import "./catalog-v2.css";
import { bestFor } from "../../lib/fit-verdict";
import { rowLine } from "../../lib/row-line";
import { niche, productHref, mockLook, catalogPath } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
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
import { fitConfigFor } from "../../lib/fit-config";
import { v2copy } from "../../lib/niche";

/** A type-picker site (DiscGolfRecs): its disc type and stability filters lead the catalogue (app/rackets/catalog-browser.tsx). */
const QUICK = fitConfigFor(niche)?.quick;
// Fits both layouts (UX audit 2026-11-17: "on the left" was wrong on phones, where the filters sit above the list).
const CAT_FILTER_LINE = fitConfigFor(niche) && !QUICK ? "Filter by style, level and shape." : "Filter the list and it updates as you tap.";

// The catalogue in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/Jv7VD7a2asnf83YuKDfxaw), PadelRecs
// only: filters on the left (play style, level, shape, year, arm-friendly, and "more filters" for weight, feel and a bigger
// sweet spot, like the home's fine-tune), the list as card rows ranked by Player score. Everything is in the URL, so every view
// is a server-rendered, shareable page; a group's counts are what you'd get by picking that option. A tap filters in the browser
// (app/rackets/catalog-browser.tsx, lib/catalog-filter.ts), with no round trip.
type F = CatalogFilters;


/** With `brand`, the same page for one brand (/brands/<slug>, owner 2026-11-15: the brand page in the new design). */
export default async function CatalogV2({ data: all, f, brand: only }: { data: Catalog; f: F; brand?: { id: string; name: string; slug: string } }) {
  const data = only ? { ...all, listed: all.listed.filter(r => r.brandId === only.id) } : all;
  const base = only ? `/brands/${only.slug}` : catalogPath;
  const ctx = await matchContext();
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  // Each listed racket's filter facts (app/rackets/catalog-rows.ts, shared with the guide), and its card. Both go to the
  // browser once; filters and sort run there (app/rackets/catalog-browser.tsx).
  const photo = (r: Catalog["listed"][number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const listed = matchingRackets(data.listed, f.q || "");
  const rows: CatalogRow[] = catalogRows(data, ctx, listed);
  const cards: Record<string, CatalogCard> = Object.fromEntries(listed.map(r => { const sc = score(data, r.id), shop = listShopLink(r);
    return [r.id, { name: displayName(r.name, brand(r.brandId)), slug: r.slug, href: productHref(r), pic: photo(r), tile: brand(r.brandId) ?? "", line: rowLine(r), ...(() => { const b = bestFor(ctx.facts(r.id)).join(", "); return b ? { best: b } : {}; })(),
      shop: shop ? { url: shop.url, rel: shop.rel } : null, pos: sc.positive, mix: sc.mixed, neg: sc.negative }]; }));

  return <main className={`ct2${mockLook ? " ct2-m" : ""} ${qtFontVars}`}>
    <div className="ct2-wrap">
      <section className="ct2-hero">
        <div>{only && <p className="ct2-crumbs"><a href="/">home</a> / <a href="/brands">brands</a> / {only.name.toLowerCase()}</p>}
          {only ? <h1>{`${only.name} `}<span className="hl">{niche.words.many}</span></h1> : <h1>All <span className="hl">{niche.words.many}</span></h1>}
          <p>{only ? `Every ${only.name} ${niche.words.one} we track, ranked by ${QUICK && v2copy.score ? v2copy.score : "Player score"}. Filter by what you want and the list updates as you tap.` : `Every ${niche.words.one} we track. ${CAT_FILTER_LINE}`}</p></div>
        <span className="ct2-meta">updated daily · <a href="/how-we-make-these">how we rank</a></span>
      </section>
      <CatalogBrowser rows={rows} cards={cards} f={f} base={base} suitsOk={SUITS_OK} many={niche.words.many} one={niche.words.one} spec={specGroups(niche.guide)}
        {...(QUICK ? { look: { lead: ["disc", "stab"], arm: QUICK.armChip, score: v2copy.score ?? "player score" } } : {})}/>
    </div>
    <V2Footer/>
  </main>;
}
