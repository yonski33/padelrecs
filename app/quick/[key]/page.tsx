// The quick-match home (PadelRecs), one cached page per combination of picks (batch D). proxy.ts rewrites "/" and
// "/?style=…&level=…" here, so the CDN serves each combination without a database read; a direct visit to /quick/<key>
// redirects to its home address. Refreshed every 6 hours, and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeV2 from "../../home-v2";
import { homeMetadata } from "../../home-metadata";
import { readChoiceKey, choiceKey, INDEXABLE_CHOICES } from "../../../lib/quick-match";
import { niche, isV2 } from "../../../lib/niche";
import { attrProfileFor } from "../../../lib/attr-profile";

// 6 hours (owner 2026-11-16, Vercel cost: 5-minute refreshes were most of the CPU and 2M ISR writes); new data shows at once
// through on-demand refresh (admin writes: app/funtimes/auth.ts; imports and publishes: /api/refresh, scripts/refresh-sites.mjs).
export const revalidate = 21600;

// The 31 indexable combinations are built with the site; the rest (fine-tune, older models) on first visit. A build without
// a database (CI) builds none and still passes.
export function generateStaticParams() {
  if (!process.env.DATABASE_URL || !isV2 || !niche.finder || attrProfileFor(niche)) return [];
  return INDEXABLE_CHOICES.map(c => ({ key: choiceKey(c, false) }));
}

const picksOf = async (params: Promise<{ key: string }>) => {
  const k = isV2 && niche.finder && !attrProfileFor(niche) ? readChoiceKey((await params).key) : null;
  if (!k) notFound();
  return k;
};

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { choice, older } = await picksOf(params);
  return homeMetadata(choice, older);
}

export default async function QuickHome({ params }: { params: Promise<{ key: string }> }) {
  const { choice, older } = await picksOf(params);
  return <HomeV2 choice={choice} older={older}/>;
}
