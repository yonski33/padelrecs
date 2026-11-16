// One product row for the home leaderboard, the rankings and the catalogue (owner's mockup, 2026-11-13): rank · photo ·
// name, short take, category and a quiet shop link · signal score · positive reviews over a sentiment bar · total reviews.
// The name's link covers the row; the shop link, the reviews link and anything in `extra` (the compare box) sit above it.
import type { CSSProperties, ReactNode } from "react";
import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche, productHref } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { amazonLinksOn } from "../lib/amazon-offer";
import { affiliateTag, amazonLink, amazonSearchLink } from "../lib/amazon";
import { ProductArt } from "./visual";
import { LightRowView, type LightRowProps, type ShopLink } from "./light-row-view";
export type { ShopLink } from "./light-row-view";

type Product = Catalog["listed"][number];

/** Amazon without a lookup: the matched product page when one is saved, otherwise a tagged Amazon search. */
export function quickAmazon(r: Product, brand: string | undefined): ShopLink | null {
  const tag = amazonLinksOn() ? affiliateTag() : "", market = niche.amazon?.marketplace;
  if (!tag) return null;
  const asin = (r as { amazonAsin?: string | null }).amazonAsin;
  const url = asin ? amazonLink(asin, tag, market) : amazonSearchLink(displayName(r.name, brand), tag, market);
  return { url, label: "Check price on Amazon", short: "Check Amazon price", rel: "sponsored nofollow noopener" };
}

/** A row's plain values (app/light-row-view.tsx); the art (photo or drawing) is rendered here, on the server. */
export function lightRowProps({ data, r, signal, line, shop, rank, shape = true, extra, noSignal, recent }: { data: Catalog; r: Product; signal?: number; line: string | null; shop: ShopLink | null; rank?: number | null; shape?: boolean; extra?: ReactNode; noSignal?: boolean; recent?: number }): LightRowProps {
  const brand = data.brands.find(b => b.id === r.brandId)?.name;
  const s = score(data, r.id);
  return { name: displayName(r.name, brand), href: productHref(r), art: <ProductArt product={r} brand={brand}/>, line, shape: shape && r.shape ? r.shape : null, shop,
    rank, noSignal, signal, extra, judged: s.judged, positive: s.positive, mixed: s.mixed, negative: s.negative, total: s.count + s.web, recent };
}

/** rank: a number shows "#n"; undefined leaves it to the list's CSS counter (home); null hides the rank column (catalogue). */
/** noSignal: the home page's "most reviewed" browse shows no signal score (owner, 2026-11-13). */
export function LightRow(props: Parameters<typeof lightRowProps>[0]) {
  return <LightRowView {...lightRowProps(props)}/>;
}

/** The first row's signal tooltip words, set once on the list (CSS shows them from a variable, so they aren't repeated per row). */
export const sigTipStyle = { "--sig-tip": JSON.stringify("Signal score: how well reviewed this is next to others of its kind, out of 100. Positive reviews raise it, weighed by how many there are; negative and mixed reviews take points off.") } as CSSProperties;
