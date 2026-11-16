// What a SkinRecs page sends to the browser so its filters and picks work there (app/instant-view.ts): each product's ranking
// inputs (app/skin/rank.ts SkinWire) and the few display fields its row needs. Built on the server from the skin context.
import type { SkinContext } from "./context";
import type { SkinWire } from "./rank";
import type { SkinPack, PackedRow } from "./pack";
import { displayName } from "../../lib/brand-name";
import { listLine } from "../../lib/list-lines";
import { shortLine } from "../../lib/short-lines";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { listShopLink } from "../../lib/amazon-offer";

type Row = SkinContext["data"]["listed"][number];

/** The ranking inputs, with empty scores left out. */
export function wireOf(ctx: SkinContext, rows: Row[] = ctx.data.listed): SkinWire[] {
  return rows.map(r => {
    const a = ctx.attrs.get(r.id) ?? { scores: {}, facts: {} };
    return { id: r.id, shape: r.shape, name: r.name, signal: ctx.signal(r.id),
      attrs: { scores: Object.fromEntries(Object.entries(a.scores).filter(([, v]) => v)), facts: Object.fromEntries(Object.entries(a.facts).filter(([, v]) => v !== null && v !== undefined)) } };
  });
}

/** The rows packed for the browser (app/skin/pack.ts): ranking inputs and display fields, score and fact names listed once. */
export function packOf(ctx: SkinContext, rows: Row[] = ctx.data.listed): SkinPack {
  const brands = new Map(ctx.data.brands.map(b => [b.id, b.name]));
  const k: string[] = [], f: string[] = [], rel: string[] = [];
  const at = (list: string[], x: string) => { const i = list.indexOf(x); return i >= 0 ? i : list.push(x) - 1; };
  return { k, f, rel, rows: wireOf(ctx, rows).map((w, i): PackedRow => {
    const r = rows[i], b = brands.get(r.brandId) ?? null, full = displayName(r.name, b ?? undefined), c = ctx.counts.get(r.id) ?? { n: 0, positive: 0, mixed: 0, negative: 0 };
    const short = b && full.toLowerCase().startsWith(`${b.toLowerCase()} `) ? full.slice(b.length + 1) : full;
    const shop = listShopLink(r);
    const scores = Object.entries(w.attrs.scores).flatMap(([key, v]) => v ? [at(k, key), v.score, v.n, v.plus ?? -1, v.minus ?? -1] : []);
    const facts = Object.entries(w.attrs.facts).flatMap(([key, v]) => v === null || v === undefined ? [] : [at(f, key), v]);
    return [w.id, w.shape, w.name === `${b} ${short}` ? 0 : w.name, w.signal, scores, facts, b, short, photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null, shortLine(r) ?? listLine(r) ?? null,
      shop?.url ?? null, shop ? at(rel, shop.rel) : -1, c.n, c.positive, c.mixed, c.negative, r.slug === r.id ? 0 : r.slug];
  }) };
}
