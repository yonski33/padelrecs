import { notFound } from "next/navigation";
import { niche } from "../../../../lib/niche";
import { threadSite } from "../../../../lib/thread/look";
import { rankingShare } from "../../../thread/share/data";

// A ranking's share card on Thread sites (owner 2026-11-19): the list's title and its top 3 with photos, names and Player
// scores (app/thread/share). The Thread ranking page links it in its metadata. Other sites keep the site's card.
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!threadSite(niche.id)) notFound();
  return rankingShare((await context.params).slug, new URL(request.url).origin);
}
