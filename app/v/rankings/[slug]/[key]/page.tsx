// A ranking (/rankings/<slug>), one cached page per set of picks (speed batch, owner 2026-11-15). proxy.ts rewrites
// /rankings/<slug>?<picks> here (lib/view-key.ts); a direct visit to /v/… redirects to its address. Refreshed every 6 hours,
// and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TopListPage, { generateMetadata as rankingMetadata } from "../../../../rankings/[slug]/page";
import { readViewKey, RANKING_VIEW } from "../../../../../lib/view-key";
import { niche, isV2 } from "../../../../../lib/niche";
import { withModelYears } from "../../../../../lib/top-lists";

// 6 hours (owner 2026-11-16, Vercel cost: 5-minute refreshes were most of the CPU and 2M ISR writes); new data shows at once
// through on-demand refresh (admin writes: app/funtimes/auth.ts; imports and publishes: /api/refresh, scripts/refresh-sites.mjs).
export const revalidate = 21600;
// Each list's plain view is built with the site on v2 sites; views with picks on first visit. None without a database (CI).
export function generateStaticParams() {
  return process.env.DATABASE_URL && isV2 ? withModelYears(niche.topLists ?? []).map(l => ({ slug: l.slug, key: "-" })) : [];
}

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
