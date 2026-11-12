import { catalog, score } from "../../../db/data";
import { displayName } from "../../../lib/brand-name";
import { racketParts } from "../../components";
import { ogCard, ogSize } from "../../og-card";
import { niche } from "../../../lib/niche";

export const alt = niche.seo.ogProductAlt;
export const size = ogSize;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, data] = await Promise.all([params, catalog()]);
  const racket = data.rackets.find(r => r.slug === slug);
  if (!racket) return ogCard({ eyebrow: niche.site.name, title: niche.seo.ogFallbackTitle, detail: `Real ${niche.people.one} experiences` });
  const { brand } = racketParts(racket, data);
  const s = score(data, racket.id);
  const notes = data.reviews.filter(r => r.racketId === racket.id).length + data.external.filter(e => e.racketId === racket.id).length;
  // Reviews are positive / mixed / negative now (lib/verdict.ts): the card shows the positive share, not stars.
  const share = s.judged >= 3 ? Math.round(s.positive / s.judged * 100) : null;
  const detail = notes ? [share !== null && `${share}% positive`, `${notes} ${notes === 1 ? "review" : "reviews"}`].filter(Boolean).join(" · ") : "Be the first to review it";
  return ogCard({ eyebrow: niche.seo.productCategory, title: displayName(racket.name, brand), rating: null, detail });
}
