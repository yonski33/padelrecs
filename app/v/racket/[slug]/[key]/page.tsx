// A racket page (/rackets/<slug>), one cached page per set of picks (speed batch, owner 2026-11-15). proxy.ts rewrites
// /rackets/<slug> and /rackets/<slug>?<picks> here (lib/view-key.ts); a direct visit to /v/… redirects to its address.
// Refreshed every 5 minutes, and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RacketPage, { generateMetadata as racketMetadata } from "../../../../rackets/[slug]/page";
import { readViewKey, RACKET_VIEW } from "../../../../../lib/view-key";

export const revalidate = 300;
export function generateStaticParams() { return []; }

type P = { params: Promise<{ slug: string; key: string }> };
const read = async (params: P["params"]) => { const { slug, key } = await params; const q = readViewKey(key, RACKET_VIEW); if (!q) notFound(); return { slug, q }; };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug, q } = await read(params);
  return racketMetadata({ params: Promise.resolve({ slug }), searchParams: Promise.resolve(q) });
}

export default async function RacketView({ params }: P) {
  const { slug, q } = await read(params);
  return <RacketPage params={Promise.resolve({ slug })} searchParams={Promise.resolve(q)}/>;
}
