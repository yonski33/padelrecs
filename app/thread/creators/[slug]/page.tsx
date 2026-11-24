// The creator page at its preview address (proxy.ts: ?view=creators on a product with creator data). The page itself is
// app/thread/creator-page.tsx, the same one the normal product address shows once CREATOR_PAGE is on (lib/thread/sites.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateMetadata as liveMetadata } from "../../../rackets/[slug]/page";
import { CreatorProductBody } from "../../creator-page";

export const revalidate = 86400;
// A slug without creator data gets a 404 from the page body (CreatorProductBody returns null).
export const dynamicParams = true;
// Built on first visit, not with the site (2026-11-24: prerendering ~800 product pages ran the build workers out of memory
// and sent one Amazon lookup per product during the build). The ISR revalidate above keeps each page cached once visited;
// scripts/warm.mjs visits the top pages after a deploy.
export function generateStaticParams() { return []; }

type P = { params: Promise<{ slug: string }> };
// The live product page's title, description, canonical (the product's own address) and share image.
export const generateMetadata = ({ params }: P): Promise<Metadata> => liveMetadata({ params, searchParams: Promise.resolve({}) });

export default async function CreatorProductPage({ params }: P) {
  const body = await CreatorProductBody({ slug: (await params).slug });
  if (!body) notFound();
  return body;
}
