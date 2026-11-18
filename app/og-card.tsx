import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { niche } from "../lib/niche";

// Shared 1200×630 share-card layout for Open Graph / social previews.
export const ogSize = { width: 1200, height: 630 };

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
const svg = (markup: string) => `data:image/svg+xml;base64,${Buffer.from(markup).toString("base64")}`;
const { og } = niche;
const ball = (filled: boolean) => svg(filled ? og.scoreOn : og.scoreOff);

export async function ogCard({ eyebrow, title, rating, detail }: { eyebrow: string; title: string; rating?: number | null; detail: string }) {
  const [display, sans, sansBold] = await Promise.all([font("BricolageGrotesque-Bold.ttf"), font("Figtree-Medium.ttf"), font("Figtree-Bold.ttf")]);
  const titleSize = title.length > 34 ? 66 : title.length > 22 ? 80 : 96;
  const filled = rating ? Math.round(rating) : 0;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: og.background, color: "#fff", fontFamily: "Figtree" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <img src={ball(true)} width={48} height={48} alt=""/>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 38, letterSpacing: -1 }}>{niche.site.wordmark}<span style={{ color: og.muted }}>.com</span></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 34, color: og.accent, fontWeight: 700 }}>{eyebrow}</div>
        <div style={{ fontFamily: "Bricolage", fontSize: titleSize, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 1050 }}>{title}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 32, color: og.text }}>
        {rating ? <div style={{ display: "flex", gap: 8 }}>{[1, 2, 3, 4, 5].map(n => <img key={n} src={ball(n <= filled)} width={44} height={44} alt=""/>)}</div> : null}
        {rating ? <div style={{ fontFamily: "Bricolage", fontSize: 44, color: "#fff" }}>{rating.toFixed(1)}</div> : null}
        <div>{detail}</div>
      </div>
    </div>,
    { ...ogSize, fonts: [
      { name: "Bricolage", data: display, weight: 700, style: "normal" },
      { name: "Figtree", data: sans, weight: 500, style: "normal" },
      { name: "Figtree", data: sansBold, weight: 700, style: "normal" },
    ] },
  );
}

/** The home and guide share card (Grok SEO audit, owner 2026-11-18): the wordmark, the page's line, a detail line and up to three
 *  product photos on white tiles, in the site's own og colours. Cached at the edge for a day: crawlers rarely come back. */
export type OgPhoto = { src: string; width: number; height: number };
export async function ogHomeCard({ title, detail, photos }: { title: string; detail: string; photos: OgPhoto[] }) {
  const [display, sans, sansBold] = await Promise.all([font("BricolageGrotesque-Bold.ttf"), font("Figtree-Medium.ttf"), font("Figtree-Bold.ttf")]);
  const pics = photos.slice(0, 3);
  const titleSize = pics.length ? (title.length > 30 ? 64 : 76) : (title.length > 34 ? 72 : 92);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: "60px 64px", gap: 40, background: og.background, color: "#fff", fontFamily: "Figtree" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={ball(true)} width={48} height={48} alt=""/>
          <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 38, letterSpacing: -1 }}>{niche.site.wordmark}<span style={{ color: og.muted }}>.com</span></div>
        </div>
        {/* One line per sentence ("Less guessing." / "Better rackets."), so a long one never breaks mid-phrase. */}
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Bricolage", fontSize: titleSize, lineHeight: 1.04, letterSpacing: -2, color: "#fff" }}>
          {(title.match(/[^.]+\.?/g) ?? [title]).map((l, i) => <div key={i} style={{ display: "flex" }}>{l.trim()}</div>)}</div>
        <div style={{ display: "flex", fontSize: 30, color: og.text }}>{detail}</div>
      </div>
      {pics.length ? <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, width: 330 }}>
        {pics.map((p, i) => { const k = Math.min(136 / p.height, 290 / p.width);
          return <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 156, borderRadius: 22, background: "#fff", border: `4px solid ${og.accent}` }}>
          <img src={p.src} width={Math.round(p.width * k)} height={Math.round(p.height * k)} alt=""/>
        </div>; })}
      </div> : null}
    </div>,
    { ...ogSize, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }, fonts: [
      { name: "Bricolage", data: display, weight: 700, style: "normal" },
      { name: "Figtree", data: sans, weight: 500, style: "normal" },
      { name: "Figtree", data: sansBold, weight: 700, style: "normal" },
    ] },
  );
}
