import padel from "../db/photos/padel.json";
import { niche } from "./niche";

/** Product photos we host ourselves, by site and product slug, with the shop page each came from. Each shop's written
 *  permission is kept outside the repo; the terms say which pages may show them, so read them before adding a site. */
const photos: Record<string, Record<string, { source: string }>> = { padel };

export function shopPhoto(product: { slug: string }, site = niche.id) {
  return photos[site]?.[product.slug] ? `/photos/${site}/${product.slug}.webp` : null;
}
