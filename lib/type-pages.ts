import type { Catalog } from "../db/data";
import { score } from "../db/data";
import { niche } from "./niche";
import { sortProducts } from "./product-sort";

// Type hubs (app/types/[slug], served at /<slug>): their search title, description and share image.
export const pageFor = (slug: string) => niche.typePages?.find(t => t.slug === slug);
type TypePage = NonNullable<ReturnType<typeof pageFor>>;
/** The hub's keyword phrase: "Mirrorless Cameras" where the menu says "Mirrorless". */
export const seoName = (t: TypePage) => t.seoLabel ?? t.label;

/** This type's listed products, most discussed first, with their scores. */
export function productsOfType(data: Catalog, t: TypePage) {
  const scored = data.listed.filter(r => r.shape?.toLowerCase() === t.shape.toLowerCase()).map(r => ({ r, s: score(data, r.id) }));
  return sortProducts(scored, "discussed");
}

/** "Best Mirrorless Cameras – Real Photographer Reviews and Ratings" (the site name follows from seo.titleTemplate). */
export const hubTitle = (t: TypePage) => `Best ${seoName(t)} – Real ${niche.people.One} Reviews and Ratings`;

/** About 150 characters: the keyword phrase, the three most discussed products, then the type's intro if it fits. */
export function hubDescription(t: TypePage, names: string[]) {
  // "Monarch and YNAB", "A, B and C", "A, B, C and 87 more".
  const shown = names.slice(0, 3), rest = names.length - shown.length;
  const list = rest > 0 ? `${shown.join(", ")} and ${rest} more` : shown.length > 1 ? `${shown.slice(0, -1).join(", ")} and ${shown.at(-1)}` : shown[0];
  const lead = names.length
    ? `${seoName(t)} compared by real ${niche.people.one} reviews: ${list}.`
    : `${seoName(t)}: real ${niche.people.one} reviews and ratings on ${niche.site.name}.`;
  const full = `${lead} ${t.intro}.`;
  return full.length <= 160 ? full : lead;
}
