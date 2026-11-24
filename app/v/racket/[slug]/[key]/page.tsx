// A racket page (/rackets/<slug>), one cached page per set of picks (speed batch, owner 2026-11-15); on SkinRecs a product page
// (/<type>/<slug>) per set of skin picks (lib/view-key.ts SKIN_PRODUCT_VIEW, owner 2026-11-16). proxy.ts rewrites
// /rackets/<slug> and /rackets/<slug>?<picks> here (lib/view-key.ts); a direct visit to /v/… redirects to its address.
// Refreshed every 24 hours, and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RacketPage, { generateMetadata as racketMetadata } from "../../../../rackets/[slug]/page";
import { readViewKey, RACKET_VIEW, SKIN_PRODUCT_VIEW } from "../../../../../lib/view-key";
import { niche } from "../../../../../lib/niche";
import { attrProfileFor } from "../../../../../lib/attr-profile";

// 24 hours (product pages are most of the pages) (owner 2026-11-16, Vercel cost: 5-minute refreshes were most of the CPU and 2M ISR writes); new data shows at once
// through on-demand refresh (admin writes: app/funtimes/auth.ts; imports and publishes: /api/refresh, scripts/refresh-sites.mjs).
export const revalidate = 86400;
export const dynamicParams = true;
// Built on first visit, not with the site (2026-11-24: prerendering ~800 product pages ran the build workers out of memory
// and sent one Amazon lookup per product during the build). The ISR revalidate above keeps each page cached once visited;
// scripts/warm.mjs visits the top pages after a deploy.
export function generateStaticParams() { return []; }

type P = { params: Promise<{ slug: string; key: string }> };
const read = async (params: P["params"]) => { const { slug, key } = await params; const q = readViewKey(key, attrProfileFor(niche) ? SKIN_PRODUCT_VIEW : RACKET_VIEW); if (!q) notFound(); return { slug, q }; };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug, q } = await read(params);
  return racketMetadata({ params: Promise.resolve({ slug }), searchParams: Promise.resolve(q) });
}

export default async function RacketView({ params }: P) {
  const { slug, q } = await read(params);
  return <RacketPage params={Promise.resolve({ slug })} searchParams={Promise.resolve(q)}/>;
}
