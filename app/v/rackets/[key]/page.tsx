// The catalogue (/rackets), one cached page per filter view (speed batch, owner 2026-11-15). proxy.ts rewrites /rackets and
// /rackets?<filters> here (lib/view-key.ts), so the CDN serves each view without a database read; a direct visit to /v/…
// redirects to its address. Refreshed every 5 minutes, and at once on an admin write (app/funtimes/auth.ts).
import { notFound } from "next/navigation";
import { catalog } from "../../../../db/data";
import CatalogV2 from "../../../rackets/catalog-v2";
import { generateMetadata as catalogMetadata } from "../../../rackets/page";
import { readViewKey, CATALOG_VIEW } from "../../../../lib/view-key";
import { readCatalogFilters } from "../../../../lib/catalog-filter";

export const revalidate = 300;
export function generateStaticParams() { return []; }
export const generateMetadata = catalogMetadata;

export default async function CatalogView({ params }: { params: Promise<{ key: string }> }) {
  const q = readViewKey((await params).key, CATALOG_VIEW);
  if (!q) notFound();
  return <CatalogV2 data={await catalog()} f={readCatalogFilters(q)}/>;
}
