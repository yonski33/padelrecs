import { niche, catalogPath, catalogLabel } from "./niche";

const base = () => (process.env.SITE_URL || `https://www.${niche.site.domain}`).replace(/\/$/, "");

/** The catalogue's keyword phrase, from its search title: "All Padel Rackets – Player Reviews…" gives "Padel Rackets". */
export const catalogKeyword = niche.seo.catalog.title.replace(/^All /, "").split(" – ")[0];

/** "157 Padel Rackets Compared: Real Player Reviews" (the site name follows from seo.titleTemplate). */
export const catalogTitle = (products: number) => `${products.toLocaleString("en-US")} ${catalogKeyword} Compared: Real ${niche.people.One} Reviews`;

/** "Padel Rackets compared by 4,210 real reviews: Nox AT10, Siux Electra and more. See what players love and complain about." */
export function catalogDescription(reviews: number, names: string[]) {
  const lead = `${catalogKeyword} compared by ${reviews.toLocaleString("en-US")} real reviews`;
  const full = `${lead}: ${names.slice(0, 3).join(", ")} and more. See what ${niche.people.many} love and complain about.`;
  return full.length <= 160 ? full : `${lead}. See what ${niche.people.many} love and complain about.`;
}

type Crumb = { name: string; path: string };
type Listed = { name: string; href: string };
/** ItemList of the first products on a page, plus its breadcrumbs, for Google. */
export function listJsonLd(crumbs: Crumb[], products: Listed[]) {
  const url = base();
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", itemListElement: [{ name: niche.site.name, path: "/" }, ...crumbs].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${url}${c.path}` })) },
    { "@type": "ItemList", numberOfItems: products.length, itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: `${url}${p.href}` })) },
  ] }).replace(/</g, "\\u003c");
}

export const catalogCrumb: Crumb = { name: catalogLabel, path: catalogPath };
