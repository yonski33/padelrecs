import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Public pages (home, catalogue, type, brand and product pages, share images, sitemap) are static and served from
 * Vercel's edge cache. Each route file sets `export const revalidate = 300`: a cached page is refreshed in the
 * background at most every 5 minutes. Changes made through the site or the publish/import scripts refresh at once:
 *  - admin approvals, edits, web quotes and catalogue edits call revalidateSite();
 *  - a helpful vote calls revalidateProduct() for the voted review's product;
 *  - scripts call POST /api/revalidate (scripts/revalidate-live.ts), which calls revalidateSite().
 * Revalidating only marks pages stale; each one re-renders from the database on its next visit.
 * Every site is its own Vercel project and build (NICHE is inlined at build time), so caches are never shared between sites.
 */
export function revalidateSite() {
  revalidatePath("/", "layout");
}

/** One product page (by its route path, /rackets/<slug>, which other niches' /paddles/<slug> rewrites onto) and the home feed. */
export function revalidateProduct(slug: string) {
  revalidatePath(`/rackets/${slug}`);
  revalidatePath("/");
}
