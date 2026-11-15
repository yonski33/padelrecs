import { matchContext } from "./match-context";
import { listShopLink } from "../lib/amazon-offer";
import { score } from "../db/data";
import { displayName } from "../lib/brand-name";
import { listLine } from "../lib/list-lines";
import { shortLine } from "../lib/short-lines";
import { shopPhoto, photoHidden } from "../lib/shop-photos";
import { amazonPhoto } from "../lib/amazon-photos";
import { productHref } from "../lib/niche";
import { slimItems, type RankItem } from "../lib/home-rank";

/** What one home row shows. */
export type HomeCard = { name: string; href: string; pic: string | null; line: string | null; shop: { url: string; rel: string } | null;
  /** Reports, and how the judged ones split. */ n: number; pos: number; mix: number; neg: number; judged: number; shape: string | null };
/** Everything the quick-match list needs in the browser to re-rank on a chip tap (batch D): one compact ranking item per
 *  listed racket (lib/home-rank.ts) and a card for each racket that can take a row. */
export type HomePayload = { items: RankItem[]; cards: Record<string, HomeCard> };

export async function homePayload(): Promise<HomePayload> {
  const { data, takes, finder, items } = await matchContext();
  const slim = slimItems(items, finder);
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const reports = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
  // A row is a pool racket (every year, with "show older models") or the year that takes its family's row.
  const shown = new Set(items.flatMap(x => x.pool ? [x.id, x.row] : []));
  const cards = Object.fromEntries([...shown].map(id => {
    const r = byId.get(id)!, c = score(data, id), shop = listShopLink(r);
    const pic = photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
    return [id, { name: displayName(r.name, brand(r.brandId)), href: productHref(r), pic, line: takes.get(id)?.hook ?? shortLine(r) ?? listLine(r) ?? null,
      shop: shop ? { url: shop.url, rel: shop.rel } : null, n: reports.get(id) ?? 0, pos: c.positive, mix: c.mixed, neg: c.negative, judged: c.judged, shape: r.shape?.toLowerCase() ?? null }] as const;
  }));
  return { items: slim, cards };
}
