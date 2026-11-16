// The SkinRecs home, one cached page per set of quick-match picks (owner 2026-11-16: "SkinRecs has the same slowness padel
// had"). proxy.ts rewrites "/" and "/?skin=…&goal=…" here (lib/view-key.ts SKIN_HOME_VIEW), so the CDN serves each combination
// without a database read; a direct visit to /v/… redirects to its address. Padel's home has its own (app/quick/[key]).
// Refreshed every 5 minutes, and at once on an admin write (app/funtimes/auth.ts).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateMetadata as homeMetadata } from "../../../page";
import { readViewKey, SKIN_HOME_VIEW } from "../../../../lib/view-key";
import { readSkinChoice } from "../../../../lib/skin-choice";
import { niche, isV2 } from "../../../../lib/niche";
import { attrProfileFor } from "../../../../lib/attr-profile";

export const revalidate = 300;
// The plain home is built with the site (SkinRecs; padel-style homes are app/quick). None without a database (CI).
export function generateStaticParams() { return process.env.DATABASE_URL && isV2 && attrProfileFor(niche) ? [{ key: "-" }] : []; }

type P = { params: Promise<{ key: string }> };
const read = async (params: P["params"]) => { const q = isV2 && attrProfileFor(niche) ? readViewKey((await params).key, SKIN_HOME_VIEW) : null; if (!q) notFound(); return q; };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  return homeMetadata({ searchParams: Promise.resolve(await read(params)) });
}

export default async function SkinHomeView({ params }: P) {
  const q = await read(params);
  const { default: HomeBeauty } = await import("../../../skin/home-beauty");
  return <HomeBeauty choice={readSkinChoice(q, niche.typePages ?? [])}/>;
}
