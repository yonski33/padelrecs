import { ogCard, ogSize } from "./og-card";
import { niche } from "../lib/niche";

export const alt = niche.seo.ogAlt;
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ eyebrow: niche.seo.ogEyebrow, title: niche.seo.ogTitle, detail: niche.seo.ogDetail });
}
