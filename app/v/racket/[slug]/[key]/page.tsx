// A racket page (/rackets/<slug>), one cached page per set of picks (speed batch, owner 2026-11-15); on SkinRecs a product page
// (/<type>/<slug>) per set of skin picks (lib/view-key.ts SKIN_PRODUCT_VIEW, owner 2026-11-16). proxy.ts rewrites
// /rackets/<slug> and /rackets/<slug>?<picks> here (lib/view-key.ts); a direct visit to /v/… redirects to its address.
// Refreshed every 5 minutes, and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RacketPage, { generateMetadata as racketMetadata } from "../../../../rackets/[slug]/page";
import { readViewKey, RACKET_VIEW, SKIN_PRODUCT_VIEW } from "../../../../../lib/view-key";
import { niche, isV2 } from "../../../../../lib/niche";
import { catalog } from "../../../../../db/data";
import { attrProfileFor } from "../../../../../lib/attr-profile";

export const revalidate = 300;
// Every listed product's plain page is built with the site on v2 sites (owner 2026-11-16: racket pages took 5–14 s on a first
// visit, and every deploy starts with an empty cache); pages with picks on first visit. None without a database (CI).
export async function generateStaticParams() {
  if (!process.env.DATABASE_URL || !isV2) return [];
  return (await catalog()).listed.map(r => ({ slug: r.slug, key: "-" }));
}

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
