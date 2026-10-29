import { ogCard, ogSize } from "../../og-card";
import { catalog } from "../../../db/data";
import { niche } from "../../../lib/niche";
import { pageFor, productsOfType, seoName } from "../../../lib/type-pages";

// Share image for a type hub (/mirrorless-cameras): "Best Mirrorless Cameras", with how many products and reviews it covers.
export const alt = `${niche.site.name} type page`;
export const size = ogSize;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const t = pageFor((await params).slug);
  if (!t) return ogCard({ eyebrow: niche.seo.ogEyebrow, title: niche.seo.ogTitle, detail: niche.seo.ogDetail });
  const products = productsOfType(await catalog(), t);
  const reviews = products.reduce((n, x) => n + x.s.count + x.s.web, 0);
  const detail = products.length
    ? `${products.length} ${products.length === 1 ? niche.words.one : niche.words.many} · ${reviews} ${reviews === 1 ? "review" : "reviews"} from ${niche.people.many} and around the web`
    : `Real ${niche.people.one} reviews and ratings`;
  return ogCard({ eyebrow: niche.seo.ogEyebrow, title: `Best ${seoName(t)}`, detail });
}
