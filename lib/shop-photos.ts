import padel from "../db/photos/padel.json";
import pickleball from "../db/photos/pickleball.json";
import { niche } from "./niche";

/** Product photos we host ourselves, by site and product slug, with the shop page each came from. Padel: each shop's
 *  written permission is kept outside the repo; the terms say which pages may show them, so read them before adding a site.
 *  PickleballRecs: makers' own product photos, hosted on the owner's decision (2026-11-27, "Host them now") without written
 *  permission; drop a photo if a maker asks. */
const photos: Record<string, Record<string, { source: string }>> = { padel, pickleball };

/** rackets.image_url: empty for the default photo, an uploaded photo's path, or this word for "show the drawing". */
export const NO_PHOTO = "none";
export const UPLOAD_PATH = "/product-photo/";

export const photoHidden = (product: { imageUrl?: string | null }) => product.imageUrl === NO_PHOTO;

/** The photo we host for a product: one uploaded in the admin area, or else a shop's. */
export function shopPhoto(product: { slug: string; imageUrl?: string | null }, site = niche.id) {
  if (photoHidden(product)) return null;
  if (product.imageUrl?.startsWith(UPLOAD_PATH)) return product.imageUrl;
  return photos[site]?.[product.slug] ? `/photos/${site}/${product.slug}.webp` : null;
}
