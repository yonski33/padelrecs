import { catalog } from "../../../../db/data";
import { displayName } from "../../../../lib/brand-name";
import { racketParts } from "../../../components";
import { ogCard } from "../../../og-card";
import { niche } from "../../../../lib/niche";
import { threadSite } from "../../../../lib/thread/look";
import { racketShare } from "../../../thread/share/data";

// The product's share card, served under its real address (/moisturizers/<slug>/share-image on categoryPaths niches)
// rather than Next's file-based /rackets/<slug>/opengraph-image (owner, 2026-11-12, UX audit). The page links it in
// its metadata (app/rackets/[slug]/page.tsx).
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<unknown> }) {
  // Thread sites (owner 2026-11-19): the Thread racket card (app/thread/share).
  if (threadSite(niche.id)) return racketShare((await (context.params as Promise<{ slug: string }>)).slug, new URL(request.url).origin);
  const [{ slug }, data] = await Promise.all([context.params as Promise<{ slug: string }>, catalog()]);
  const racket = data.rackets.find(r => r.slug === slug);
  if (!racket) return ogCard({ eyebrow: niche.site.name, title: niche.seo.ogFallbackTitle, detail: `Real ${niche.people.one} experiences` });
  const { brand } = racketParts(racket, data);
  const notes = data.reviews.filter(r => r.racketId === racket.id).length + data.external.filter(e => e.racketId === racket.id).length;
  // The card shows how many reviews, never a "% positive" (owner 2026-11-15).
  const detail = notes ? `${notes} ${notes === 1 ? "review" : "reviews"}` : "Be the first to review it";
  return ogCard({ eyebrow: niche.seo.productCategory, title: displayName(racket.name, brand), rating: null, detail });
}
