// TableTennisRecs visuals: one simple line drawing per type (a bare blade showing its plies, a rubber sheet with its pimple
// grid, a pre-assembled racket with red rubber and a ball), all in the same 40×64 box as the other niches' product drawings,
// and the paddle-and-ball logo.

export type Shape = "blade" | "rubber" | "racket" | "unknown";

// The catalog's "Type" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(type?: string | null): Shape {
  const s = (type || "").toLowerCase();
  if (s.includes("racket")) return "racket";
  if (s.includes("rubber")) return "rubber";
  if (s.includes("blade")) return "blade";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
// A shakehand head (slightly taller than wide) on a flared handle, standing upright.
const HEAD = "M20 4c8.3 0 14 6.4 14 15.5S28.3 37 20 37 6 28.6 6 19.5 11.7 4 20 4z";
const HANDLE = "M16.5 36.5h7l1 21a3.5 3.5 0 0 1-3.5 3.5h-2A3.5 3.5 0 0 1 15.5 57.5z";

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "blade" && <>
      <path d={HEAD} {...soft}/>
      <path d={HEAD} {...line}/>
      <path d={HANDLE} {...line}/>
      <path d="M10 14c6-3 14-3 20 0M8 20c7-3 17-3 24 0M10 26c6-3 14-3 20 0" {...line} strokeOpacity=".55"/>
      <path d="M17 44h6M17 50h6" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "rubber" && <>
      <rect x="7" y="10" width="26" height="44" rx="3" {...soft}/>
      <rect x="7" y="10" width="26" height="44" rx="3" {...line}/>
      <path d="M13 17h.01M20 17h.01M27 17h.01M16.5 23h.01M23.5 23h.01M13 29h.01M20 29h.01M27 29h.01M16.5 35h.01M23.5 35h.01M13 41h.01M20 41h.01M27 41h.01M16.5 47h.01M23.5 47h.01" {...line} strokeWidth={2.6} strokeOpacity=".55"/>
    </>}
    {kind === "racket" && <>
      <path d={HEAD} fill="#dc2626" fillOpacity=".85"/>
      <path d={HEAD} {...line}/>
      <path d={HANDLE} {...line}/>
      <path d="M17 44h6M17 50h6" {...line} strokeOpacity=".55"/>
      <circle cx="31" cy="46" r="5" fill="#f97316"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M8.6 1.8c3.9 0 6.6 2.9 6.6 6.8s-2.7 6.9-6.6 6.9S2 12.5 2 8.6s2.7-6.8 6.6-6.8z" fill="#1e3a8a"/>
    <path d="M7.1 15.2h3l.5 2.9a1.3 1.3 0 0 1-1.3 1.5H7.9a1.3 1.3 0 0 1-1.3-1.5z" fill="#1e3a8a"/>
    <circle cx="16" cy="15.4" r="2.7" fill="#f97316"/>
  </svg>;
}
