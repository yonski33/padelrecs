// The catalogue (/rackets), one cached page per filter view (speed batch, owner 2026-11-15). proxy.ts rewrites /rackets and
// /rackets?<filters> here (lib/view-key.ts), so the CDN serves each view without a database read; a direct visit to /v/…
// redirects to its address. Refreshed every 6 hours, and at once on an admin write (app/funtimes/auth.ts).
import { notFound } from "next/navigation";
import { catalog } from "../../../../db/data";
import CatalogV2 from "../../../rackets/catalog-v2";
import { generateMetadata as catalogMetadata } from "../../../rackets/page";
import { readViewKey, CATALOG_VIEW, SKIN_CATALOG_VIEW } from "../../../../lib/view-key";
import { readCatalogFilters } from "../../../../lib/catalog-filter";
import { specGroups } from "../../../../lib/guide";
import { niche, catalogPath, isV2 } from "../../../../lib/niche";
import { attrProfileFor } from "../../../../lib/attr-profile";

const SPEC = specGroups(niche.guide).map(g => g.key);

// 6 hours (owner 2026-11-16, Vercel cost: 5-minute refreshes were most of the CPU and 2M ISR writes); new data shows at once
// through on-demand refresh (admin writes: app/funtimes/auth.ts; imports and publishes: /api/refresh, scripts/refresh-sites.mjs).
export const revalidate = 21600;
// The plain catalogue is built with the site on v2 sites (the cache guard, tests/isr-routes.test.ts); filter views on first
// visit, then the post-deploy warm-up (scripts/warm.mjs). A build without a database (CI) builds none and still passes.
export function generateStaticParams() { return process.env.DATABASE_URL && isV2 ? [{ key: "-" }] : []; }
export const generateMetadata = catalogMetadata;

export default async function CatalogView({ params }: { params: Promise<{ key: string }> }) {
  // SkinRecs (an attribute profile) has its own filters and catalogue (owner 2026-11-16; padel's 500'd there, #374).
  if (attrProfileFor(niche)) {
    const q = readViewKey((await params).key, SKIN_CATALOG_VIEW);
    if (!q) notFound();
    const { default: CatalogSkin } = await import("../../../skin/catalog-skin");
    return <CatalogSkin f={q} base={catalogPath}/>;
  }
  const q = readViewKey((await params).key, [...CATALOG_VIEW, ...SPEC]);
  if (!q) notFound();
  return <CatalogV2 data={await catalog()} f={readCatalogFilters(q, SPEC)}/>;
}
