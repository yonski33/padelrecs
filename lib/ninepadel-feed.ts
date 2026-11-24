// NINEPADEL's public feed (https://ninepadel.com/affiliate-feed.json) applied to db/shop/padel-offers.json. Pure, so
// tests/padel-offers.test.ts checks it without the network; scripts/ninepadel-feed.mts does the fetch and the write.
import type { OffersFile, StoredOffer } from "./padel-offers";

export type NineItem = { id?: string; title?: string; category?: string; product_type?: string; link?: string;
  price?: string; sale_price?: string; price_now?: string; currency?: string; availability?: string };
export type NineFeed = { built?: string; currency?: string; referral_param?: string; items?: NineItem[] };

const SHOP = "NINEPADEL";
/** "https://ninepadel.com/products/x?y=1" and ".../x/" both as "ninepadel.com/products/x". */
export const urlKey = (u: string) => { try { const x = new URL(u); return `${x.host.replace(/^www\./, "")}${x.pathname.replace(/\/+$/, "")}`.toLowerCase(); } catch { return u; } };
const isRacket = (i: NineItem) => /racket/i.test(`${i.category ?? ""} ${i.product_type ?? ""}`);
const isTrade = (u: string) => /\/products\/trade-/i.test(u);

export function refreshFromFeed(file: OffersFile, feed: NineFeed, today: string) {
  const items = (feed.items ?? []).filter(i => i.link && !isTrade(i.link));
  const byUrl = new Map(items.map(i => [urlKey(i.link!), i]));
  const linked = new Set<string>();
  const report = { updated: 0, priceChanged: 0, stockChanged: 0, dropped: [] as { slug: string; url: string; why: string }[], feedRackets: items.filter(isRacket).length, unlinked: 0 };
  const offers: Record<string, StoredOffer[]> = {};
  for (const [slug, rows] of Object.entries(file.offers)) {
    const kept: StoredOffer[] = [];
    for (const o of rows) {
      if (o.shop !== SHOP) { kept.push(o); continue; }
      if (isTrade(o.url)) { report.dropped.push({ slug, url: o.url, why: "trade-only URL" }); continue; }
      const it = byUrl.get(urlKey(o.url));
      if (!it) { report.dropped.push({ slug, url: o.url, why: "not in the feed" }); continue; }
      const price = Number(it.price_now || it.sale_price || it.price);
      const currency = (it.currency || feed.currency || "GBP").toUpperCase();
      if (!(price > 0) || currency !== o.currency) { report.dropped.push({ slug, url: o.url, why: `bad price or currency (${it.price_now ?? "?"} ${currency})` }); continue; }
      const inStock = /^in.?stock$/i.test(it.availability ?? "");
      if (price !== o.price) report.priceChanged++;
      if (inStock !== o.inStock) report.stockChanged++;
      report.updated++; linked.add(urlKey(o.url));
      kept.push({ ...o, url: it.link!, price, inStock, checked: today });
    }
    if (kept.length) offers[slug] = kept;
  }
  report.unlinked = items.filter(i => isRacket(i) && !linked.has(urlKey(i.link!))).length;
  return { next: { ...file, offers } as OffersFile, report };
}
