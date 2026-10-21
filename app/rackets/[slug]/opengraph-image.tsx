import { catalog, score } from "../../../db/data";
import { racketParts } from "../../components";
import { ogCard, ogSize } from "../../og-card";
import { niche } from "../../../lib/niche";

export const alt = niche.seo.ogProductAlt;
export const size = ogSize;
export const contentType = "image/png";
// Cached like the racket page (lib/revalidate.ts): rendered on the first request, then refreshed after changes.
export const revalidate = 300;
export async function generateStaticParams() { return []; }

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, data] = await Promise.all([params, catalog()]);
  const racket = data.rackets.find(r => r.slug === slug);
  if (!racket) return ogCard({ eyebrow: niche.site.name, title: niche.seo.ogFallbackTitle, detail: `Real ${niche.people.one} experiences` });
  const { brand, model } = racketParts(racket, data);
  const s = score(data, racket.id);
  const notes = data.reviews.filter(r => r.racketId === racket.id).length + data.external.filter(e => e.racketId === racket.id).length;
  const detail = s.average
    ? `${s.count} ${niche.people.one} ${s.count === 1 ? "rating" : "ratings"} · ${notes} ${notes === 1 ? "review" : "reviews"}`
    : notes ? `${notes} ${notes === 1 ? "review" : "reviews"} from around the web` : "Be the first to review it";
  return ogCard({ eyebrow: brand || niche.seo.productCategory, title: model, rating: s.average ? Number(s.average) : null, detail });
}
