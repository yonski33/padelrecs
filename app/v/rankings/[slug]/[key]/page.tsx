// A ranking (/rankings/<slug>), one cached page per set of picks (speed batch, owner 2026-11-15). proxy.ts rewrites
// /rankings/<slug>?<picks> here (lib/view-key.ts); a direct visit to /v/… redirects to its address. Refreshed every 5 minutes,
// and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TopListPage, { generateMetadata as rankingMetadata } from "../../../../rankings/[slug]/page";
import { readViewKey, RANKING_VIEW } from "../../../../../lib/view-key";

export const revalidate = 300;
export function generateStaticParams() { return []; }

type P = { params: Promise<{ slug: string; key: string }> };
const read = async (params: P["params"]) => { const { slug, key } = await params; const q = readViewKey(key, RANKING_VIEW); if (!q) notFound(); return { slug, q }; };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug, q } = await read(params);
  return rankingMetadata({ params: Promise.resolve({ slug }), searchParams: Promise.resolve(q) } as Parameters<typeof rankingMetadata>[0]);
}

export default async function RankingView({ params }: P) {
  const { slug, q } = await read(params);
  return <TopListPage params={Promise.resolve({ slug })} searchParams={Promise.resolve(q)}/>;
}
