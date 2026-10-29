// Web hosting left SoftwareRecs for its own site, HostingRecs, on 2026-10-30. Its pages answer with a 301 to the same
// service there (lib/niche/software.ts movedAway), so links, bookmarks and rankings carry over. Slugs are unchanged;
// HostingRecs files each service under its own category.
export const HOSTINGRECS = "https://www.hostingrecs.com";

/** Every web host SoftwareRecs had, with its category page on HostingRecs. */
export const movedHostSlugs: Record<string, string> = {
  bluehost: "shared-hosting", hostinger: "shared-hosting", siteground: "shared-hosting",
  kinsta: "wordpress-hosting",
  "hetzner-cloud": "vps-hosting", linode: "vps-hosting", "ovhcloud-vps": "vps-hosting",
  digitalocean: "cloud-hosting", "fly-io": "cloud-hosting", render: "cloud-hosting",
  netlify: "static-hosting", vercel: "static-hosting",
};

/** Cloudflare was one "Web hosting" entry here; HostingRecs splits it into Cloudflare Pages and Cloudflare Registrar, so the
 *  old page goes to the Cloudflare brand page there. */
export const movedToBrand = { cloudflare: "cloudflare" };

/** Brands SoftwareRecs only had for their web hosts; their brand pages move too. Vercel keeps v0 here. */
export const movedHostBrandSlugs = ["akamai", "bluehost", "cloudflare", "digitalocean", "fly-io", "hetzner", "hostinger", "kinsta", "netlify", "ovhcloud", "render", "siteground"];

const productPages = (slug: string, destination: string) =>
  ["/web-hosting", "/tools", "/rackets"].map(base => ({ source: `${base}/${slug}`, destination }));

export const movedHostPages = [
  { source: "/web-hosting", destination: `${HOSTINGRECS}/` },
  { source: "/types/web-hosting", destination: `${HOSTINGRECS}/` },
  // The catalogue filtered to hosting; the HostingRecs home lists every category.
  { source: "/tools", destination: `${HOSTINGRECS}/`, query: { key: "shape", value: "Web hosting" } },
  { source: "/rankings/best-web-hosting-software", destination: `${HOSTINGRECS}/rankings` },
  ...Object.entries(movedHostSlugs).flatMap(([slug, type]) => productPages(slug, `${HOSTINGRECS}/${type}/${slug}`)),
  ...Object.entries(movedToBrand).flatMap(([slug, brand]) => productPages(slug, `${HOSTINGRECS}/brands/${brand}`)),
  ...movedHostBrandSlugs.map(slug => ({ source: `/brands/${slug}`, destination: `${HOSTINGRECS}/brands/${slug}` })),
];
