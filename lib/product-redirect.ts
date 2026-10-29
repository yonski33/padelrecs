import type { Niche } from "./niche/types";
import { productPathIn } from "./niche";

export type ProductRef = { slug: string; shape: string | null };

/** The slug in a path that may be a product page on a categoryPaths niche: /rackets/<slug>, /<productPath>/<slug> or
 *  /<type slug>/<slug>. Anything else (brands, rankings, share images) is null, so proxy.ts only looks products up for these. */
export function productSlugIn(n: Niche, pathname: string) {
  if (!n.categoryPaths) return null;
  const m = /^\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
  if (!m || (m[1] !== "rackets" && m[1] !== n.productPath && !n.typePages?.some(t => t.slug === m[1]))) return null;
  try { return decodeURIComponent(m[2]); } catch { return null; }
}

/** Where a product address belongs when it isn't there already: an old /<productPath>/<slug> or /rackets/<slug>, a former
 *  slug, or a product filed under another type since. `find` resolves current and former slugs to the product. */
export function productRedirect(n: Niche, pathname: string, find: (slug: string) => ProductRef | undefined) {
  const slug = productSlugIn(n, pathname);
  const product = slug === null ? undefined : find(slug);
  if (!product) return null;
  const target = productPathIn(n, product);
  return target === pathname.replace(/\/$/, "") ? null : target;
}
