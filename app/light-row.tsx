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
import { ProductArt, SentimentBar } from "./visual";

type Product = Catalog["listed"][number];
export type ShopLink = { url: string; label: string; short: string; rel: string };
const fmt = (n: number) => n.toLocaleString("en-US");

/** Amazon without a lookup: the matched product page when one is saved, otherwise a tagged Amazon search. */
export function quickAmazon(r: Product, brand: string | undefined): ShopLink | null {
  const tag = amazonLinksOn() ? affiliateTag() : "", market = niche.amazon?.marketplace;
  if (!tag) return null;
  const asin = (r as { amazonAsin?: string | null }).amazonAsin;
  const url = asin ? amazonLink(asin, tag, market) : amazonSearchLink(displayName(r.name, brand), tag, market);
  return { url, label: "Check price on Amazon", short: "Check Amazon price", rel: "sponsored nofollow noopener" };
}

/** rank: a number shows "#n"; undefined leaves it to the list's CSS counter (home); null hides the rank column (catalogue). */
/** noSignal: the home page's "most reviewed" browse shows no signal score (owner, 2026-11-13). */
export function LightRow({ data, r, signal, line, shop, rank, shape = true, extra, noSignal }: { data: Catalog; r: Product; signal?: number; line: string | null; shop: ShopLink | null; rank?: number | null; shape?: boolean; extra?: ReactNode; noSignal?: boolean }) {
  const brand = data.brands.find(b => b.id === r.brandId)?.name, name = displayName(r.name, brand), href = productHref(r);
  const s = score(data, r.id), total = s.count + s.web;
  return <div className={`lt-row v2${rank === null ? " no-rank" : ""}${noSignal ? " no-sig" : ""}`}>
    {rank !== null && <span className="lt-rank" aria-hidden={rank === undefined ? "true" : undefined}>{rank !== undefined ? `#${rank}` : null}</span>}
    <span className="lt-art"><ProductArt product={r} brand={brand}/></span>
    <span className="lt-body">
      <a className="lt-name" href={href}>{name}</a>
      {line && <span className="lt-line">{line}</span>}
      {shape && r.shape && <span className="lt-shape">{r.shape}</span>}
      {shop && <a className="lt-shop" href={shop.url} target="_blank" rel={shop.rel}>{shop.label} <span aria-hidden="true">›</span></a>}
      {extra && <span className="lt-extra">{extra}</span>}
    </span>
    {!noSignal && <span className="lt-sig">{signal ? <><b>{signal}</b><small>Signal score</small></> : <small>new</small>}</span>}
    <span className="lt-posbar">{s.judged > 0 && <><span className="lt-posn">{`${fmt(s.positive)} positive ${s.positive === 1 ? "review" : "reviews"}`}</span>
      <SentimentBar positive={s.positive} mixed={s.mixed} negative={s.negative}/></>}</span>
    {/* Phones: the shop link takes the positive count's place under the name (owner, 2026-11-13). */}
    {shop && <a className="lt-shop-m" href={shop.url} target="_blank" rel={shop.rel}>{shop.short} <span aria-hidden="true">›</span></a>}
    <a className="lt-total" href={`${href}#reviews`}><b>{fmt(total)}</b><span>{total === 1 ? "review" : "reviews"}{noSignal && <span aria-hidden="true"> ›</span>}</span></a>
  </div>;
}

/** The first row's signal tooltip words, set once on the list (CSS shows them from a variable, so they aren't repeated per row). */
export const sigTipStyle = { "--sig-tip": JSON.stringify("Signal score: how well reviewed this is next to others of its kind, out of 100. Positive reviews raise it, weighed by how many there are; negative and mixed reviews take points off.") } as CSSProperties;
