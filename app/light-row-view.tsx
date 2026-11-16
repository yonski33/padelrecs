// The markup of one product row (app/light-row.tsx LightRow), from plain values: the server renders it, and the home board
// (app/home-board.tsx) renders it in the browser from the same values, so the home sends a few hundred bytes per row instead
// of every row's markup (owner 2026-11-16: the TennisRecs and SimRacingRecs homes were ~600 KB). No server imports here.
import type { ReactNode } from "react";
import { scoreLabel } from "../lib/niche";
import { SentimentBar } from "./sentiment-bar";

export type ShopLink = { url: string; label: string; short: string; rel: string };
/** The Amazon link's words (app/light-row.tsx quickAmazon): a row with these sends only the address. */
export const AMAZON_SHOP = { label: "Check price on Amazon", short: "Check Amazon price", rel: "sponsored nofollow noopener" } as const;
const fmt = (n: number) => n.toLocaleString("en-US");

/** rank: a number shows "#n"; undefined leaves it to the list's CSS counter (home); null hides the rank column (catalogue). */
/** photo: the product photo's address and kind (app/visual.tsx ProductArt's markup); art: the drawing, when it has none. */
export type LightRowProps = { name: string; href: string; photo?: { src: string; kind: string }; art?: ReactNode; line: string | null; shape: string | null;
  /** The shop link, or only its address when it is the Amazon link (AMAZON_SHOP). */ shop: ShopLink | { url: string } | null;
  rank?: number | null; noSignal?: boolean; signal?: number; extra?: ReactNode; judged: number; positive: number; mixed: number; negative: number;
  total: number; recent?: number };

export function LightRowView({ name, href, photo, art, line, shape, shop: given, rank, noSignal, signal, extra, judged, positive, mixed, negative, total, recent }: LightRowProps) {
  const shop: ShopLink | null = given ? { ...AMAZON_SHOP, ...given } : null;
  return <div className={`lt-row v2${rank === null ? " no-rank" : ""}${noSignal ? " no-sig" : ""}`}>
    {rank !== null && <span className="lt-rank" aria-hidden={rank === undefined ? "true" : undefined}>{rank !== undefined ? `#${rank}` : null}</span>}
    <span className="lt-art">{photo ? <span className={`art art-${photo.kind} `} aria-hidden="true"><img src={photo.src} alt={name} loading="lazy" decoding="async"/></span> : art}</span>
    <span className="lt-body">
      <a className="lt-name" href={href}>{name}</a>
      {line && <span className="lt-line">{line}</span>}
      {shape && <span className="lt-shape">{shape}</span>}
      {shop && <a className="lt-shop" href={shop.url} target="_blank" rel={shop.rel}>{shop.label} <span aria-hidden="true">›</span></a>}
      {extra && <span className="lt-extra">{extra}</span>}
    </span>
    {!noSignal && <span className="lt-sig">{signal ? <><b>{signal}</b><small>{scoreLabel}</small></> : <small className="lt-nosig" title={`A ${scoreLabel} needs more reviews`}>Not enough<br/>reviews</small>}</span>}
    <span className="lt-posbar">{judged > 0 && <><span className="lt-posn">{`${fmt(positive)} positive ${positive === 1 ? "review" : "reviews"}`}</span>
      <SentimentBar positive={positive} mixed={mixed} negative={negative}/></>}</span>
    {/* Phones: the shop link takes the positive count's place under the name (owner, 2026-11-13). */}
    {shop && <a className="lt-shop-m" href={shop.url} target="_blank" rel={shop.rel}>{shop.short} <span aria-hidden="true">›</span></a>}
    <a className="lt-total" href={`${href}#reviews`}><b>{fmt(total)}</b><span>{total === 1 ? "review" : "reviews"}{noSignal && <span aria-hidden="true"> ›</span>}</span>
      {/* The home list's order: reviews posted in the last six months (owner, 2026-11-13). */}
      {recent !== undefined && recent > 0 && <small className="lt-recent-n">{`+${fmt(recent)} in 6 months`}</small>}</a>
  </div>;
}
