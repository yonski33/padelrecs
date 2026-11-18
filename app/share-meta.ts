import type { Metadata } from "next";
import { niche } from "../lib/niche";

/** The home's and the guide's share image (app/share-image/route.tsx): a page whose own openGraph would otherwise drop the
 *  root image names it here, with the large Twitter / X card. */
export function shareImage(page?: "guide"): Pick<Metadata, "twitter"> & { images: NonNullable<Metadata["openGraph"]>["images"] } {
  const url = page ? `/share-image?page=${page}` : "/share-image", alt = `${niche.site.name}: ${niche.site.descriptor}`;
  return { images: [{ url, width: 1200, height: 630, alt }], twitter: { card: "summary_large_image", images: [url] } };
}
