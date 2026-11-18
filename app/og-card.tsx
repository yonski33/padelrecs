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

/** The home and guide share card (Grok SEO audit, owner 2026-11-18; redesigned after the owner's review the same day): the
 *  site's light page colour, with the brand colour as the accent only (a strip on the left, the logo, ".com", the headline's
 *  second line, a short bar). Two or three cut-out product photos (transparent PNGs, no boxes) overlap on the right. Cached a
 *  day at the edge: crawlers rarely come back. */
export type OgPhoto = { src: string; width: number; height: number };
const t = niche.theme as Record<string, string>;
const PAGE = t["--tint"] ?? "#f6f5f0", INK = t["--ink"] ?? "#151515", INK2 = t["--ink-2"] ?? "#45403b", BRAND = t["--green"] ?? og.background, ACCENT = t["--lime"] ?? og.accent;
/** Where each photo sits on the right (the middle one in front), as a box it is fitted into. */
const SPOTS = { 1: [{ x: 70, y: 60, w: 380, h: 510 }], 2: [{ x: 0, y: 80, w: 290, h: 460 }, { x: 180, y: 120, w: 290, h: 460 }],
  3: [{ x: -10, y: 120, w: 230, h: 410 }, { x: 115, y: 50, w: 250, h: 460 }, { x: 250, y: 140, w: 230, h: 410 }] } as const;
export async function ogHomeCard({ title, detail, photos }: { title: string; detail: string; photos: OgPhoto[] }) {
  const [display, sans, sansBold] = await Promise.all([font("BricolageGrotesque-Bold.ttf"), font("Figtree-Medium.ttf"), font("Figtree-Bold.ttf")]);
  const pics = photos.slice(0, Math.max(1, Math.min(3, og.photos ?? 3))), spots = pics.length ? SPOTS[pics.length as 1 | 2 | 3] : [];
  const lines = (title.match(/[^.,]+[.,]?/g) ?? [title]).map(l => l.trim()).filter(Boolean);
  const titleSize = lines.some(l => l.length > 16) ? 66 : 76;
  const order = pics.length === 3 ? [0, 2, 1] : pics.map((_, i) => i); // the middle photo is drawn last, so it sits in front
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: PAGE, color: INK, fontFamily: "Figtree", position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, background: BRAND }}/>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700, padding: "58px 0 56px 76px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={ball(true)} width={46} height={46} alt=""/>
          <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 38, letterSpacing: -1, color: INK }}>{niche.site.wordmark}<span style={{ color: BRAND }}>.com</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Bricolage", fontSize: titleSize, lineHeight: 1.02, letterSpacing: -2.5 }}>
            {lines.map((l, i) => <div key={i} style={{ display: "flex", color: i === lines.length - 1 && lines.length > 1 ? BRAND : INK }}>{l}</div>)}</div>
          <div style={{ width: 120, height: 10, borderRadius: 5, background: ACCENT }}/>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: INK2 }}>{detail}</div>
      </div>
      <div style={{ display: "flex", position: "relative", width: 500, height: 630 }}>
        {order.map(i => { const p = pics[i], b = spots[i], k = Math.min(b.w / p.width, b.h / p.height), w = Math.round(p.width * k), h = Math.round(p.height * k);
          return <img key={i} src={p.src} width={w} height={h} alt="" style={{ position: "absolute", left: b.x + (b.w - w) / 2, top: b.y + (b.h - h) / 2 }}/>; })}
      </div>
    </div>,
    { ...ogSize, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }, fonts: [
      { name: "Bricolage", data: display, weight: 700, style: "normal" },
      { name: "Figtree", data: sans, weight: 500, style: "normal" },
      { name: "Figtree", data: sansBold, weight: 700, style: "normal" },
    ] },
  );
}
