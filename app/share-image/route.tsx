import { catalog } from "../../db/data";
import { niche, isV2, v2copy } from "../../lib/niche";
import { rankList, withNicheWindow, withModelYears } from "../../lib/top-lists";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import sharp from "sharp";
import { clearBackground } from "../../lib/photo-background";
import { ogHomeCard, type OgPhoto } from "../og-card";

// The home's and the guide's share image (Grok SEO audit, owner 2026-11-18): links pasted into Reddit, Facebook, iMessage or
// Slack show the site's name, its line and the top three products of its first ranking ("best overall") with photos.
// /share-image is the home; /share-image?page=guide the guide (lib/niche guide).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url), data = await catalog();
  const page = url.searchParams.get("page"), guide = page === "guide" ? niche.guide ?? (niche.id === "skin" ? { h1: ["Skincare,", "decoded"], crumb: "skincare guide" } : null) : null;
  const first = withModelYears(withNicheWindow(niche.topLists ?? [], niche.recentMonths))[0];
  const abs = (src: string) => src.startsWith("/") ? `${url.origin}${src}` : src;
  const srcs = first ? rankList(first, data, niche.tags).flatMap(e => {
    const r = data.rackets.find(x => x.id === e.product.id);
    const src = r && !photoHidden(r) ? shopPhoto(r) ?? amazonPhoto(r)?.image ?? null : null;
    return src ? [abs(src)] : [];
  }).slice(0, 8) : [];
  // next/og reads PNG / JPEG only and needs each image's size: every photo becomes a small cut-out PNG with known dimensions.
  // A photo that fails to load is skipped.
  const photos = (await Promise.all(srcs.map(toPng))).filter((p): p is OgPhoto => !!p).slice(0, 3);
  const total = data.reviews.length + data.external.length;
  const title = guide ? `${guide.h1[0]} ${guide.h1[1]}` : niche.id === "skin" ? "Less guessing. Better skincare."
    : isV2 ? (v2copy.hero ? v2copy.hero.h1.join(" ") : `Less guessing. Better ${v2copy.better ?? niche.words.many}.`) : niche.seo.ogTitle;
  const detail = guide ? `The ${guide.crumb}, in plain words` : `${total.toLocaleString("en-US")} reviews, read and ranked for you`;
  return ogHomeCard({ title, detail, photos });
}

async function toPng(src: string): Promise<OgPhoto | null> {
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    // Cut out (the plain background made transparent from the edges in, lib/photo-background.ts) and trimmed to the product, so
    // it sits straight on the card's page colour with no box.
    const sized = await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 640, height: 640, fit: "inside" }).png().toBuffer();
    const { data, info } = await sharp(await clearBackground(sized)).trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
    return { src: `data:image/png;base64,${data.toString("base64")}`, width: info.width, height: info.height };
  } catch { return null; }
}
