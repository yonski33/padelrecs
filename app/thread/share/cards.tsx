// Thread share cards (owner 2026-11-19): the 1200×630 Open Graph / Twitter images in the Thread look, for any niche with the
// Thread look (lib/thread/look.ts threadSite). Cream page, a thin black frame with a radius, the logo top left, Barlow
// Condensed headings and the live badge colours. Four layouts: a racket, the home, a ranking, and a plain titled page.
// The words and picks come from the callers (app/thread/share/data.ts); this file only draws.
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { niche } from "../../../lib/niche";
import { fitLine, toneOf } from "../../../lib/thread/share-text";

export const SHARE_SIZE = { width: 1200, height: 630 };
/** Long at the browser, renewed with the pages (their 6-hour ISR) at the edge, stale kept while a new one renders. */
export const SHARE_CACHE = "public, max-age=3600, s-maxage=21600, stale-while-revalidate=604800";
// The Thread palette (app/thread/thread.css), as hex: the image renderer reads no oklch.
const C = { bg: "#efede6", soft: "#fbfaf6", ink: "#151515", ink2: "#4a4740", muted: "#6a675f", line: "#e3e0d7", lime: "#beea63", g: "#75d87a", y: "#feea74" };
const TONE = { g: C.g, y: C.y, w: "#ffffff" } as const;

// Fonts: the Thread's own (Barlow Condensed, Atkinson Hyperlegible) from Google Fonts, fetched once per instance with a short
// timeout; if that fails the card still renders with the bundled ones (assets/fonts), so a build or a crawl never fails on it.
type Font = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };
// Digits: Barlow first, as on the site (app/thread/layout.tsx), so numbers get a plain zero.
const GOOGLE: [string, string, 400 | 700][] = [["Barlow Condensed", "Barlow+Condensed:wght@700", 700], ["Atkinson", "Atkinson+Hyperlegible:wght@400", 400], ["Atkinson", "Atkinson+Hyperlegible:wght@700", 700],
  ["Digits", "Barlow:wght@400&text=0123456789", 400], ["Digits", "Barlow:wght@700&text=0123456789", 700]];
async function google(family: string): Promise<ArrayBuffer> {
  // No browser user agent: Google then serves TrueType, which the renderer reads (it can't read woff2).
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, { signal: AbortSignal.timeout(3000) })).text();
  const url = /src:\s*url\(([^)]+)\)/.exec(css)?.[1];
  if (!url) throw new Error("no font url");
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`font ${res.status}`);
  return res.arrayBuffer();
}
const local = async (file: string) => { const b = await readFile(join(process.cwd(), "assets/fonts", file)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer; };
let fonts: Promise<Font[]> | null = null;
export function shareFonts(): Promise<Font[]> {
  fonts ??= Promise.all(GOOGLE.map(async ([name, family, weight]) => ({ name, data: await google(family), weight, style: "normal" as const })))
    .catch(async () => { fonts = null; // try Google again next time
      const [d, r, b] = await Promise.all([local("BricolageGrotesque-Bold.ttf"), local("Figtree-Medium.ttf"), local("Figtree-Bold.ttf")]);
      return [{ name: "Barlow Condensed", data: d, weight: 700, style: "normal" }, { name: "Atkinson", data: r, weight: 400, style: "normal" }, { name: "Atkinson", data: b, weight: 700, style: "normal" },
        { name: "Digits", data: r, weight: 400, style: "normal" }, { name: "Digits", data: b, weight: 700, style: "normal" }]; });
  return fonts;
}

/** A product photo as a PNG data URL with its size (the renderer reads PNG and JPEG only, and needs the size), or null. */
export type SharePhoto = { src: string; width: number; height: number };
export async function sharePhoto(src: string | null, origin: string): Promise<SharePhoto | null> {
  if (!src) return null;
  try {
    const res = await fetch(src.startsWith("/") ? `${origin}${src}` : src, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const { data, info } = await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 520, height: 520, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" }).png().toBuffer({ resolveWithObject: true });
    return { src: `data:image/png;base64,${data.toString("base64")}`, width: info.width, height: info.height };
  } catch { return null; }
}

const Logo = () => <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
  <div style={{ width: 30, height: 30, borderRadius: 15, background: C.lime, border: `3px solid ${C.ink}` }}/>
  <div style={{ fontFamily: "Barlow Condensed", fontSize: 36, fontWeight: 700, color: C.ink }}>{niche.site.name}</div>
</div>;
/** The photo contained on white, never cropped: fitted inside the box, centred. */
function PhotoBox({ p, w, h, pad = 18 }: { p: SharePhoto; w: number; h: number; pad?: number }) {
  const s = Math.min((w - pad * 2) / p.width, (h - pad * 2) / p.height);
  return <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: `2px solid ${C.line}`, borderRadius: 18 }}>
    <img src={p.src} width={Math.round(p.width * s)} height={Math.round(p.height * s)} alt=""/>
  </div>;
}
function Badge({ n, size = 64 }: { n: number | null; size?: number }) {
  return <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: n == null ? size * 0.55 : size, lineHeight: 1, padding: `${size * 0.14}px ${size * 0.2}px`,
    border: `3px solid ${C.ink}`, borderRadius: size * 0.22, background: n == null ? "#fff" : TONE[toneOf(n)], color: C.ink }}>{n == null ? "New" : String(n)}</div>;
}
const Pill = ({ t, lime }: { t: string; lime?: boolean }) => <div style={{ display: "flex", fontSize: 24, fontWeight: 700, border: `2px solid ${C.ink}`, borderRadius: 999,
  padding: "2px 16px", background: lime ? C.lime : "#fff", color: C.ink }}>{t}</div>;

async function render(body: ReactNode) {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: C.bg, padding: 26, fontFamily: "Digits, Atkinson", color: C.ink }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.soft, border: `3px solid ${C.ink}`, borderRadius: 28, padding: "36px 44px" }}>{body}</div>
    </div>,
    { ...SHARE_SIZE, fonts: await shareFonts(), headers: { "Cache-Control": SHARE_CACHE } },
  );
}
/** The name's size so it fits in 2 lines of the column: shorter names larger. */
const nameSize = (name: string, wide: boolean) => { const n = name.length, room = wide ? 1.6 : 1; return n <= 18 * room ? 84 : n <= 26 * room ? 72 : n <= 36 * room ? 60 : 52; };

export type RacketCard = { people: string; name: string; pills: string[]; limeFirst: boolean; score: number | null; opinions: number; line: string | null; photo: SharePhoto | null };
export function racketCard(c: RacketCard) {
  const wide = !c.photo, fs = nameSize(c.name, wide);
  return render(<div style={{ flex: 1, display: "flex", gap: 40 }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
      <Logo/>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "block", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: fs, lineHeight: 1.02, lineClamp: 2, maxHeight: fs * 2.1, overflow: "hidden" }}>{c.name}</div>
        {c.pills.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{c.pills.slice(0, 4).map((t, i) => <Pill key={t} t={t} lime={i === 0 && c.limeFirst}/>)}</div>}
        {c.line && <div style={{ display: "flex", fontSize: 30, lineHeight: 1.3, color: C.ink2 }}>{fitLine(c.line, 90)}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Badge n={c.score}/>
        <div style={{ display: "flex", fontSize: 28, color: C.ink2 }}>{c.score == null ? `Not enough votes for a ${c.people} score yet` : `${c.people} score from ${c.opinions.toLocaleString("en-US")} ${c.opinions === 1 ? "opinion" : "opinions"}`}</div>
      </div>
    </div>
    {c.photo && <PhotoBox p={c.photo} w={400} h={496}/>}
  </div>);
}

export function homeCard({ title, line, photos }: { title: string; line: string; photos: SharePhoto[] }) {
  return render(<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <Logo/>
    <div style={{ display: "flex", gap: 36, alignItems: "flex-end", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: photos.length ? 520 : 1000 }}>
        <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 92, lineHeight: 0.98 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 30, color: C.ink2 }}>{line}</div>
      </div>
      {photos.length > 0 && <div style={{ display: "flex", gap: 12 }}>{photos.slice(0, 3).map((p, i) => <PhotoBox key={i} p={p} w={150} h={290} pad={10}/>)}</div>}
    </div>
  </div>);
}

export type RankEntry = { name: string; score: number | null; photo: SharePhoto | null };
export function rankingCard({ title, entries, byLine }: { title: string; entries: RankEntry[]; byLine: string }) {
  return render(<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Logo/><div style={{ display: "flex", fontSize: 26, color: C.muted }}>{byLine}</div></div>
    <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: title.length > 26 ? 64 : 80, lineHeight: 1 }}>{title}</div>
    <div style={{ display: "flex", gap: 22 }}>{entries.slice(0, 3).map((e, i) =>
      <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, background: "#fff", border: `2px solid ${C.line}`, borderRadius: 18, padding: 12, minWidth: 0 }}>
        {e.photo ? <PhotoBox p={e.photo} w={96} h={150} pad={6}/> : <div style={{ width: 96, height: 150, display: "flex", background: C.bg, borderRadius: 12 }}/>}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 26, color: C.muted }}>{`#${i + 1}`}</div>
          <div style={{ display: "block", fontSize: 25, fontWeight: 700, lineHeight: 1.15, lineClamp: 3, maxHeight: 88, overflow: "hidden" }}>{e.name}</div>
          <div style={{ display: "flex" }}><Badge n={e.score} size={40}/></div>
        </div>
      </div>)}</div>
  </div>);
}

export function pageCard({ title, line }: { title: string; line: string }) {
  return render(<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <Logo/>
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ width: 90, height: 10, borderRadius: 5, background: C.lime, border: `2px solid ${C.ink}` }}/>
      <div style={{ display: "flex", fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: title.length > 30 ? 80 : 100, lineHeight: 1, maxWidth: 1000 }}>{title}</div>
      <div style={{ display: "flex", fontSize: 32, color: C.ink2 }}>{line}</div>
    </div>
  </div>);
}
