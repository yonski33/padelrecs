// The products a SkinRecs page sends to the browser, packed (owner 2026-11-16: filters work in the browser, so the rows travel
// with the page; packed, the home and /products stay light). One array per product holds its ranking inputs (app/skin/rank.ts
// SkinWire) and its row's display fields (SkinCard); score and fact names are listed once. Packed on the server
// (app/skin/payload.ts packOf), unpacked here in the browser. Pure.
import type { SkinWire } from "./rank";
import { productHref } from "../../lib/niche";

/** One product row's display fields: brand, name without the brand, photo, one line, shop link, address and review counts. */
export type SkinCard = { brand: string | null; name: string; pic: string | null; line: string | null; shop: { url: string; rel: string } | null;
  href: string; n: number; pos: number; mix: number; neg: number };
/** [id, shape, name (0: the brand and short name), signal, scores (key index, score, n, plus, minus; -1 for none)…, facts (key index, value)…, brand, short
 *  name, photo, line, shop url, shop rel index, reviews, positive, mixed, negative, slug (0: same as the id)]. */
export type PackedRow = [string, string | null, string | 0, number | null, number[], (number | string)[], string | null, string, string | null, string | null,
  string | null, number, number, number, number, number, string | 0];
export type SkinPack = { k: string[]; f: string[]; rel: string[]; rows: PackedRow[] };

export function unpack(p: SkinPack): { items: SkinWire[]; cards: Record<string, SkinCard> } {
  const items: SkinWire[] = [], cards: Record<string, SkinCard> = {};
  for (const [id, shape, name, signal, s, f, brand, short, pic, line, url, rel, n, pos, mix, neg, slug] of p.rows) {
    const scores: SkinWire["attrs"]["scores"] = {}, facts: SkinWire["attrs"]["facts"] = {};
    for (let i = 0; i < s.length; i += 5) scores[p.k[s[i]]] = { score: s[i + 1], n: s[i + 2], ...(s[i + 3] >= 0 ? { plus: s[i + 3] } : {}), ...(s[i + 4] >= 0 ? { minus: s[i + 4] } : {}) };
    for (let i = 0; i < f.length; i += 2) facts[p.f[f[i] as number]] = f[i + 1];
    items.push({ id, shape, name: name || `${brand} ${short}`, signal, attrs: { scores, facts } });
    cards[id] = { brand, name: short, pic, line, shop: url ? { url, rel: p.rel[rel] } : null, href: productHref({ slug: slug || id, shape }), n, pos, mix, neg };
  }
  return { items, cards };
}
