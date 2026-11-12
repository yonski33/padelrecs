import { cache } from "react";
import { catalog, score } from "../db/data";
import { niche, typePageFor } from "../lib/niche";
import { signals, type Signal } from "../lib/signal";

/** A product's category for the signal score: its type on niches with type pages (cleansers apart from sunscreens),
 *  else the whole site (every padel racket against every other). */
export const signalCategory = (product: { shape: string | null }) => niche.typePages?.length ? typePageFor(product.shape)?.shape ?? "Other" : "all";

/** "moisturizers" or "padel rackets": what "#3 of 45 …" counts. */
export function categoryWords(category: string) {
  const page = niche.typePages?.find(t => t.shape === category);
  return page ? page.label.toLowerCase() : niche.words.many;
}

/** Every listed product's signal, once per request (pages and the rankings read the same numbers). */
export const productSignals = cache(async (): Promise<Map<string, Signal>> => {
  const data = await catalog();
  return signals(data.listed.map(r => { const s = score(data, r.id); return { id: r.id, category: signalCategory(r), positive: s.positive, mixed: s.mixed, judged: s.judged }; }));
});
