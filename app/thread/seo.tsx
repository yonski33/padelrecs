// Search parity for the Thread pages (owner 2026-11-19 go-live): every page reuses the live page's own metadata (title,
// description, canonical, Open Graph) and prints structured data that matches what it shows.
import type { Metadata } from "next";
import { niche } from "../../lib/niche";
export const base = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}/>;
}
export const crumbs = (items: { name: string; path: string }[]) => ({ "@type": "BreadcrumbList",
  itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${base()}${c.path}` })) });
/** The page's share card (owner 2026-11-19, app/thread/share): og:image with its size and alt, and the large Twitter / X
 *  card, on top of the live page's metadata. A page without its own Open Graph keeps the site's name and type. */
export function withShare<T extends Metadata>(meta: T | Record<string, never>, url: string, alt: string): Metadata {
  const m = meta as Metadata, images = [{ url, width: 1200, height: 630, alt }];
  return { ...m, openGraph: { siteName: niche.site.name, type: "website", ...(m.openGraph ?? {}), images }, twitter: { ...(m.twitter ?? {}), card: "summary_large_image", images } };
}
/** The share card of a plain titled page (lib/thread/share-text.ts pageTitle), by its key. */
export const pageShareUrl = (key: string) => `/share-image?page=${encodeURIComponent(key)}`;
/** "<what it shows> on <site>", the alt beside a page's card. */
export const shareAlt = (what: string) => what.includes(niche.site.name) ? what : `${what} on ${niche.site.name}`;
/** withShare for a plain titled page: its key's card and alt. */
export const withPageShare = <T extends Metadata>(meta: T | Record<string, never>, key: string, what: string) => withShare(meta, pageShareUrl(key), shareAlt(what));
/** The live page's metadata, or none in a build without a database (CI), as the Thread data reads do (app/thread/data.ts). */
export const liveOr = async <T extends object>(read: () => Promise<T> | T): Promise<T | Record<string, never>> => process.env.DATABASE_URL ? read() : {};
