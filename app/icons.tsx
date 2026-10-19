import type { CSSProperties } from "react";
import { art } from "./art";

// The active niche's drawings (app/art/<niche>.tsx).
export const ProductIcon = art.ProductIcon;
export const LogoIcon = art.LogoIcon;

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

// Rating shown as five of the niche's rating icons (padel balls on PadelRecs); fractional values fill partially.
// The images come from the theme (--score-on / --score-off, see .balls in globals.css).
export function Score({ rating, size }: { rating: number; size?: "sm" | "lg" }) {
  const label = `${Number.isInteger(rating) ? rating : rating.toFixed(1)} out of 5`;
  return <span className={size ? `balls ${size}` : "balls"} style={{ "--r": rating } as CSSProperties} role="img" aria-label={label}/>;
}
