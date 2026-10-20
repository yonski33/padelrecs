import type { JSX } from "react";

// SkinRecs visuals: a container per product type (pump bottle, dropper, jar, tube) and the drop logo.

export type Shape = "bottle" | "dropper" | "jar" | "tube" | "unknown";

// The catalog's "Type" field picks the container. Anything unrecognised is drawn as a pump bottle.
export function shapeOf(type?: string | null): Shape {
  const s = (type || "").toLowerCase();
  if (s.includes("serum") || s.includes("oil") || s.includes("ampoule")) return "dropper";
  if (s.includes("moistur") || s.includes("cream") && !s.includes("eye") || s.includes("mask") || s.includes("balm")) return "jar";
  if (s.includes("sunscreen") || s.includes("spf") || s.includes("eye") || s.includes("exfol") || s.includes("gel") || s.includes("treatment")) return "tube";
  if (s.includes("cleans") || s.includes("toner") || s.includes("lotion") || s.includes("wash")) return "bottle";
  return "unknown";
}

const body = { fill: "currentColor", fillOpacity: 0.12, stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" as const };
const solid = { fill: "currentColor" };
const label = { fill: "currentColor", fillOpacity: 0.32 };

const drawings: Record<Exclude<Shape, "unknown">, JSX.Element> = {
  bottle: <>
    <rect x="15" y="9" width="11" height="5" rx="1.5" {...solid}/>
    <path d="M26 11.5H32.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <rect x="17.5" y="14" width="6" height="7" {...solid}/>
    <rect x="10" y="21" width="21" height="40" rx="6" {...body}/>
    <rect x="13" y="33" width="15" height="15" rx="2" {...label}/>
  </>,
  dropper: <>
    <path d="M16 20C14.5 15 15.5 6 20.5 6C25.5 6 26.5 15 25 20Z" {...solid}/>
    <rect x="14" y="20" width="13" height="9" rx="1.5" {...solid} fillOpacity=".75"/>
    <rect x="11" y="29" width="19" height="32" rx="6" {...body}/>
    <rect x="14" y="38" width="13" height="13" rx="2" {...label}/>
  </>,
  jar: <>
    <rect x="5" y="25" width="31" height="10" rx="2.5" {...solid}/>
    <rect x="7" y="35" width="27" height="24" rx="6" {...body}/>
    <rect x="11" y="41" width="19" height="10" rx="2" {...label}/>
  </>,
  tube: <>
    <path d="M9 5H32L28.5 50H12.5Z" {...body}/>
    <path d="M9 9H32" stroke="currentColor" strokeWidth="1.4" strokeOpacity=".5"/>
    <rect x="15" y="21" width="11" height="17" rx="2" {...label}/>
    <rect x="14" y="50" width="13" height="10" rx="2.5" {...solid}/>
  </>,
};

/** Brand marks are not drawn on skincare containers; the brand argument is accepted for the shared icon interface. */
export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">{drawings[kind === "unknown" ? "bottle" : kind]}</svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 1.6C13.6 6 16.2 9.4 16.2 12.6C16.2 16.1 13.4 18.6 10 18.6C6.6 18.6 3.8 16.1 3.8 12.6C3.8 9.4 6.4 6 10 1.6Z" fill="#f3a683" stroke="#4e1f43" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M7.2 13.4C7.2 11.9 7.9 10.5 9 9.3" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>;
}
