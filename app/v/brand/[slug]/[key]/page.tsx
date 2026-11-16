// A brand page (SkinRecs /brands/<slug>), one cached page per filter view (owner 2026-11-16). proxy.ts rewrites
// /brands/<slug> and /brands/<slug>?<filters> here (lib/view-key.ts SKIN_CATALOG_VIEW); a direct visit to /v/… redirects to its
// address. Refreshed every 5 minutes, and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandPage, { generateMetadata as brandMetadata } from "../../../../brands/[slug]/page";
import { readViewKey, SKIN_CATALOG_VIEW } from "../../../../../lib/view-key";
import { niche } from "../../../../../lib/niche";
import { attrProfileFor } from "../../../../../lib/attr-profile";

export const revalidate = 300;
export function generateStaticParams() { return []; }

type P = { params: Promise<{ slug: string; key: string }> };
const read = async (params: P["params"]) => { const { slug, key } = await params; const q = attrProfileFor(niche) ? readViewKey(key, SKIN_CATALOG_VIEW) : null; if (!q) notFound(); return { slug, q }; };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await read(params);
  return brandMetadata({ params: Promise.resolve({ slug }) });
}

export default async function BrandView({ params }: P) {
  const { slug, q } = await read(params);
  return <BrandPage params={Promise.resolve({ slug })} searchParams={Promise.resolve(q)}/>;
}
