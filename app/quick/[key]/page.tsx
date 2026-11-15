// The quick-match home (PadelRecs), one cached page per combination of picks (batch D). proxy.ts rewrites "/" and
// "/?style=…&level=…" here, so the CDN serves each combination without a database read; a direct visit to /quick/<key>
// redirects to its home address. Refreshed every 5 minutes, and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeV2 from "../../home-v2";
import { homeMetadata } from "../../home-metadata";
import { readChoiceKey, choiceKey, INDEXABLE_CHOICES } from "../../../lib/quick-match";
import { niche, isV2 } from "../../../lib/niche";

export const revalidate = 300;

// The 31 indexable combinations are built with the site; the rest (fine-tune, older models) on first visit. A build without
// a database (CI) builds none and still passes.
export function generateStaticParams() {
  if (!process.env.DATABASE_URL || !isV2 || !niche.finder) return [];
  return INDEXABLE_CHOICES.map(c => ({ key: choiceKey(c, false) }));
}

const picksOf = async (params: Promise<{ key: string }>) => {
  const k = isV2 && niche.finder ? readChoiceKey((await params).key) : null;
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
