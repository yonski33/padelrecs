// The creator page at its preview address (proxy.ts: ?view=creators on a product with creator data). The page itself is
// app/thread/creator-page.tsx, the same one the normal product address shows once CREATOR_PAGE is on (lib/thread/sites.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { niche } from "../../../../lib/niche";
import { creatorSlugs } from "../../../../lib/thread/creator-data";
import { generateMetadata as liveMetadata } from "../../../rackets/[slug]/page";
import { CreatorProductBody } from "../../creator-page";

export const revalidate = 86400;
export const dynamicParams = false;
// No DATABASE_URL (CI): nothing to prerender, because the page reads the racket from the database; the fixture only stands in
// at request time. A build with the database prerenders every product that has creator data.
export async function generateStaticParams() { return process.env.DATABASE_URL ? (await creatorSlugs(niche.id)).map(slug => ({ slug })) : []; }

type P = { params: Promise<{ slug: string }> };
// The live product page's title, description, canonical (the product's own address) and share image.
export const generateMetadata = ({ params }: P): Promise<Metadata> => liveMetadata({ params, searchParams: Promise.resolve({}) });

export default async function CreatorProductPage({ params }: P) {
  const body = await CreatorProductBody({ slug: (await params).slug });
  if (!body) notFound();
  return body;
}
