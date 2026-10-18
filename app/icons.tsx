import type { CSSProperties } from "react";

export type Shape = "round" | "teardrop" | "diamond" | "unknown";

// Catalog shapes are free text ("Round", "Teardrop / hybrid"…). Anything unrecognised, or not set yet, is "unknown".
export function shapeOf(shape?: string | null): Shape {
  const s = (shape || "").toLowerCase();
  if (s.includes("round")) return "round";
  if (s.includes("diamond")) return "diamond";
  if (s.includes("tear") || s.includes("drop") || s.includes("hybrid")) return "teardrop";
  return "unknown";
}

const heads: Record<Exclude<Shape, "unknown">, { head: string; throat: string }> = {
  round: { head: "M20 3C30.5 3 37 10 37 21.5C37 32 30.5 39.5 24 41.5L16 41.5C9.5 39.5 3 32 3 21.5C3 10 9.5 3 20 3Z", throat: "M16 41.5L18.5 48M24 41.5L21.5 48" },
  teardrop: { head: "M20 2C32 2 37.5 9 37.5 18C37.5 29 30 37.5 23 42L17 42C10 37.5 2.5 29 2.5 18C2.5 9 8 2 20 2Z", throat: "M17 42L18.5 48M23 42L21.5 48" },
  diamond: { head: "M20 2.5C29 2.5 37.5 4.5 37.5 11C37.5 19 29 33 22.5 42L17.5 42C11 33 2.5 19 2.5 11C2.5 4.5 11 2.5 20 2.5Z", throat: "M17.5 42L18.5 48M22.5 42L21.5 48" },
};

// Hole pattern, clipped to the head.
const DOTS: [number, number][] = [];
for (let y = 6; y < 42; y += 5.2) for (let x = 5; x < 36; x += 5.2) DOTS.push([+x.toFixed(1), +y.toFixed(1)]);

type Mark = { d: string; stroke?: number; cap?: "round" | "butt"; hole?: [number, number, number]; extra?: "head-eye" | "kuikma-ring" };
const adidasBars = [[4, 23.5], [12.6, 16.5], [21.2, 9.5]].map(([x, top]) => { const s = (31 - top) * 0.36, w = 7.6; return `M${x} 31L${x + w} 31L${(x + w + s).toFixed(1)} ${top}L${(x + s).toFixed(1)} ${top}Z`; }).join("");
const starPath = (cx: number, cy: number, R: number, r: number) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R; return `${i ? "L" : "M"}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`; }).join("") + "Z";

/** Simplified, single-colour brand marks drawn on the racket face. Brands without an entry show the plain face. */
const MARKS: Record<string, Mark> = {
  nox: { d: "M1.5 5.5H11L38.5 36H29ZM29 5.5H38.5L11 36H1.5Z", hole: [24.2, 20.8, 3.6] },
  bullpadel: { d: "M1 10.4H23.5C31 10.4 32 20.6 24.5 20.6H12M24.5 20.6C34 20.6 34 31.8 24 31.8H1", stroke: 4.8, cap: "butt" },
  adidas: { d: adidasBars },
  head: { d: "M10.5 36C4.5 24 8 8.5 20.5 8C30.5 7.6 35.2 15 33.3 21.2C32.4 24 30.6 25.6 28.6 25.4", stroke: 4.2, extra: "head-eye" },
  babolat: { d: "M10.5 32L20.5 9L25 9L15 32ZM18 32L28 9L32.5 9L22.5 32Z" },
  wilson: { d: "M7.5 10.5L12.5 31L16.5 31L20 18.5L23.5 31L27.5 31L32.5 10.5L28.5 10.5L25.6 23L22 10.5L18 10.5L14.4 23L11.5 10.5Z" },
  starvie: { d: starPath(20, 21.5, 12, 5) },
  kuikma: { d: "M21.4 10.2L25.8 31.2L12.2 29.2Z", extra: "kuikma-ring" },
  oxdog: { d: "M13 4.8V10.6M4.2 12.6H17M5 16.6H17M19 7.5V35.5L14.6 31.6V20.5M21.6 12.6H28.4V22.5", stroke: 2.5, cap: "butt" },
  stiga: { d: "M27.6 9.6H14.2L11.6 21.4M12.4 31.6H25.8L28.4 19.8", stroke: 3.6, cap: "butt" },
};
const markKey = (brand?: string | null) => (brand || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function RacketIcon({ shape, brand, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  const { head, throat } = heads[kind === "unknown" ? "teardrop" : kind];
  const key = markKey(brand), mark = MARKS[key];
  // Ids only need to be unique per shape + brand: identical icons can share the same definitions.
  const clip = `ri-${kind}-${key || "x"}`;
  const ink = { fill: "currentColor", fillOpacity: 0.45 };
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <defs>
      <clipPath id={clip}><path d={head}/></clipPath>
      {mark?.hole && <mask id={`${clip}-m`}><rect width="40" height="64" fill="#fff"/><circle cx={mark.hole[0]} cy={mark.hole[1]} r={mark.hole[2]} fill="#000"/></mask>}
    </defs>
    <path d={head} fill="currentColor" fillOpacity=".12"/>
    <g clipPath={`url(#${clip})`}>
      {mark && (mark.stroke
        ? <path d={mark.d} fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth={mark.stroke} strokeLinecap={mark.cap ?? "round"} strokeLinejoin="miter"/>
        : <path d={mark.d} {...ink} mask={mark.hole ? `url(#${clip}-m)` : undefined}/>)}
      {mark?.extra === "head-eye" && <circle cx="21" cy="19.8" r="3.5" {...ink}/>}
      {mark?.extra === "kuikma-ring" && <ellipse cx="20" cy="20.6" rx="15.4" ry="9.6" transform="rotate(-38 20 20.6)" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="3.2"/>}
      <g fill="currentColor" fillOpacity={mark ? 0.28 : 0.5}>{DOTS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.05"/>)}</g>
    </g>
    <path d={head} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={kind === "unknown" ? "3.2 2.4" : undefined}/>
    <path d={throat} stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="17.5" y="48" width="5" height="14" rx="1.5" fill="currentColor"/>
  </svg>;
}

export function BallIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8.6" fill="#d4ea4f" stroke="#1b3d27" strokeWidth="1.6"/>
    <path d="M3.4 5.2c3.4 1.6 3.4 8 0 9.6M16.6 5.2c-3.4 1.6-3.4 8 0 9.6" fill="none" stroke="#1b3d27" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}

// Generic, monochrome source glyphs: citations, not logos.
export function SourceIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let body;
  if (p.includes("reddit")) body = <><g {...common}><ellipse cx="8" cy="10" rx="5.6" ry="4"/><path d="M8 6V2.6l3 .8"/><circle cx="12.2" cy="3.4" r="1"/></g><circle cx="6" cy="9.6" r="1" fill="currentColor"/><circle cx="10" cy="9.6" r="1" fill="currentColor"/></>;
  else if (p.includes("youtube")) body = <><rect x="1.2" y="3.2" width="13.6" height="9.6" rx="3" {...common}/><path d="M6.6 5.8v4.4L10.4 8z" fill="currentColor"/></>;
  else if (p.includes("shop") || p.includes("store") || p.includes("retail")) body = <g {...common}><path d="M2.5 5.5h11l-.8 8h-9.4z"/><path d="M5.6 5.5V4.4a2.4 2.4 0 0 1 4.8 0v1.1"/></g>;
  else if (p.includes("forum")) body = <g {...common}><path d="M1.8 2.8h8.4v5.6H5.4L2.8 10.4V8.4h-1z"/><path d="M12.2 5.6h2v5.6h-1v2l-2.6-2H7"/></g>;
  else body = <g {...common}><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c-2.2 2.4-2.2 9.6 0 12M8 2c2.2 2.4 2.2 9.6 0 12"/></g>;
  return <svg viewBox="0 0 16 16" aria-hidden="true">{body}</svg>;
}

export function SearchIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="7" cy="7" r="4.8"/><path d="M10.6 10.6l3.6 3.6"/></g></svg>;
}

export function PlusIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}

// Rating shown as padel balls; fractional values fill partially (see .balls in globals.css).
export function Balls({ rating, size }: { rating: number; size?: "sm" | "lg" }) {
  const label = `${Number.isInteger(rating) ? rating : rating.toFixed(1)} out of 5`;
  return <span className={size ? `balls ${size}` : "balls"} style={{ "--r": rating } as CSSProperties} role="img" aria-label={label}/>;
}
