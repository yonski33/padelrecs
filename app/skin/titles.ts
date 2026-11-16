// SkinRecs page titles and notes shared by the server (metadata, first render) and the browser (a tap retitles the tab). Pure.
import { niche } from "../../lib/niche";
import { skinPicked, skinWords, type SkinChoice } from "../../lib/skin-choice";

export const MATCH_NOTE = "How well it fits the skin and goal you picked, from what people with your skin type said. Not a quality score: the user score is separate.";

/** "Best moisturizers for dry skin, fragrance-free | SkinRecs"; the site's home title without picks. */
export function skinHomeTitle(c: SkinChoice) {
  if (!skinPicked(c) && !c.type) return niche.seo.homeTitle;
  const what = c.typeSlug ? niche.typePages!.find(t => t.slug === c.typeSlug)!.label.toLowerCase() : "skincare";
  return `Best ${what}${c.skin || c.concerns.length ? ` for ${skinWords(c)[0]}` : ""}${c.finish ? `, ${c.finish} finish` : ""}${c.ff ? ", fragrance-free" : ""} | ${niche.site.name}`;
}
