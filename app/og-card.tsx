import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Shared 1200×630 share-card layout for Open Graph / social previews.
export const ogSize = { width: 1200, height: 630 };

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
const svg = (markup: string) => `data:image/svg+xml;base64,${Buffer.from(markup).toString("base64")}`;
const ball = (filled: boolean) => svg(filled
  ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6" fill="#d4ea4f" stroke="#0e3a24" stroke-width="1.4"/><path d="M3.4 5.2c3.4 1.6 3.4 8 0 9.6M16.6 5.2c-3.4 1.6-3.4 8 0 9.6" fill="none" stroke="#0e3a24" stroke-width="1.3" stroke-linecap="round"/></svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6" fill="#2f7a52"/></svg>`);

export async function ogCard({ eyebrow, title, rating, detail }: { eyebrow: string; title: string; rating?: number | null; detail: string }) {
  const [display, sans, sansBold] = await Promise.all([font("BricolageGrotesque-Bold.ttf"), font("Figtree-Medium.ttf"), font("Figtree-Bold.ttf")]);
  const titleSize = title.length > 34 ? 66 : title.length > 22 ? 80 : 96;
  const filled = rating ? Math.round(rating) : 0;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "#1b6b43", color: "#fff", fontFamily: "Figtree" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <img src={ball(true)} width={48} height={48} alt=""/>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 38, letterSpacing: -1 }}>padelrecs<span style={{ color: "#a9c6b2" }}>.com</span></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 34, color: "#d4ea4f", fontWeight: 700 }}>{eyebrow}</div>
        <div style={{ fontFamily: "Bricolage", fontSize: titleSize, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 1050 }}>{title}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 32, color: "#d9e8dd" }}>
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
