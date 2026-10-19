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
