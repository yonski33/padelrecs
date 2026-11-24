import { niche } from "../../lib/niche";
// Search parity for the Thread pages (owner 2026-11-19 go-live): every page reuses the live page's own metadata (title,
// description, canonical, Open Graph) and prints structured data that matches what it shows.
export const base = () => (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}/>;
}
export const crumbs = (items: { name: string; path: string }[]) => ({ "@type": "BreadcrumbList",
  itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${base()}${c.path}` })) });
/** The live page's metadata, or none in a build without a database (CI), as the Thread data reads do (app/thread/data.ts).
 *  Padel's Thread pages only: other sites' builds never serve them (StackRecs has app/thread/stack). */
export const liveOr = async <T extends object>(read: () => Promise<T> | T): Promise<T | Record<string, never>> => process.env.DATABASE_URL && niche.id === "padel" ? read() : {};
