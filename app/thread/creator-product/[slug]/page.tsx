// A product address on a site with creator pages that is not a Thread site (LaptopRecs, lib/thread/sites.ts
// CREATOR_PLAIN_SITES): proxy.ts rewrites /<type>/<slug> here for the products listed in db/creators/<site>-pages.json. It
// sits under app/thread for the Thread layout (the creator page's fonts and CSS). It shows the creator page
// (app/thread/creator-page.tsx) when the product has CREATOR_MIN_REVIEWS or more reviews in the database, and today's product
// page otherwise (no creator tables yet, too few reviews), rendered by that page itself with the same query. Per request like
// that page; the CDN caches both the same way (next.config.ts headers on the public address), so nothing varies per visitor.
import { notFound } from "next/navigation";
import { niche } from "../../../../lib/niche";
import { creatorPageOn, creatorPlainSite } from "../../../../lib/thread/sites";
import RacketPage, { generateMetadata as liveMetadata } from "../../../rackets/[slug]/page";
import { CreatorProductBody } from "../../creator-page";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
// The product page's own title, description, canonical (the product's own address) and share image.
export const generateMetadata = (p: P) => liveMetadata(p);

export default async function CreatorProductRoute({ params, searchParams }: P) {
  if (!creatorPlainSite(niche.id)) notFound();
  if (creatorPageOn(niche.id)) { const body = await CreatorProductBody({ slug: (await params).slug }); if (body) return body; }
  return RacketPage({ params, searchParams });
}
