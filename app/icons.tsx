import type { CSSProperties } from "react";

export type Shape = "round" | "teardrop" | "diamond";

// Catalog shapes are free text ("Round", "Teardrop / hybrid"…); unknown values fall back to teardrop.
export function shapeOf(shape?: string | null): Shape {
  const s = (shape || "").toLowerCase();
  if (s.includes("round")) return "round";
  if (s.includes("diamond")) return "diamond";
  return "teardrop";
}

const racket: Record<Shape, { head: string; throat: string; dots: [number, number][] }> = {
  round: {
    head: "M20 3C31 3 37 10 37 21C37 32 30 39 24 41L16 41C10 39 3 32 3 21C3 10 9 3 20 3Z",
    throat: "M16 41L18.5 48M24 41L21.5 48",
    dots: [[14,13],[20,11],[26,13],[10,20],[16,19],[24,19],[30,20],[13,27],[20,26],[27,27],[17,33],[23,33]],
  },
  teardrop: {
    head: "M20 2C32 2 37 9 37 18C37 30 29 38 23 42L17 42C11 38 3 30 3 18C3 9 8 2 20 2Z",
    throat: "M17 42L18.5 48M23 42L21.5 48",
    dots: [[14,10],[20,9],[26,10],[10,17],[16,16],[24,16],[30,17],[13,24],[20,23],[27,24],[17,31],[23,31]],
  },
  diamond: {
    head: "M20 2C31 2 37 7 37 14C37 24 30 36 23 42L17 42C10 36 3 24 3 14C3 7 9 2 20 2Z",
    throat: "M17 42L18.5 48M23 42L21.5 48",
    dots: [[14,8],[20,7],[26,8],[9,14],[15,14],[25,14],[31,14],[12,21],[20,20],[28,21],[17,28],[23,28],[20,35]],
  },
};

export function RacketIcon({ shape, className }: { shape?: string | null; className?: string }) {
  const r = racket[shapeOf(shape)];
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <path d={r.head} fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth="2"/>
    <g fill="currentColor" fillOpacity=".55">{r.dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2"/>)}</g>
    <path d={r.throat} stroke="currentColor" strokeWidth="2" fill="none"/>
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
