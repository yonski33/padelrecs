// MonitorRecs visuals: one simple line drawing per category (a gaming monitor on a wide V stand, a curved ultrawide,
// a work monitor on a height-adjustable stand, a thin-bezel creator display on a slim foot, a portable screen with its
// kickstand), all in the same 40×64 box as the other niches' product drawings, and the monitor logo.

export type Shape = "gaming" | "ultrawide" | "productivity" | "creator" | "portable" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("ultrawide")) return "ultrawide";
  if (s.includes("portable")) return "portable";
  if (s.includes("mac") || s.includes("creator")) return "creator";
  if (s.includes("productivity") || s.includes("office")) return "productivity";
  if (s.includes("gaming")) return "gaming";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "gaming" && <>
      <rect x="3" y="17" width="34" height="22" rx="2" {...soft}/>
      <rect x="3" y="17" width="34" height="22" rx="2" {...line}/>
      <path d="M20 39v6M11 50l9-5 9 5" {...line}/>
      <path d="M8 35h6" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "ultrawide" && <>
      <path d="M2 19q18 5 36 0v19q-18 4-36 0z" {...soft}/>
      <path d="M2 19q18 5 36 0v19q-18 4-36 0z" {...line}/>
      <path d="M20 41v6M13 48h14" {...line}/>
    </>}
    {kind === "productivity" && <>
      <rect x="5" y="14" width="30" height="20" rx="2" {...soft}/>
      <rect x="5" y="14" width="30" height="20" rx="2" {...line}/>
      <path d="M20 34v14M12 50h16" {...line}/>
      <path d="M17 40h6" {...line} strokeOpacity=".55"/>
      <path d="M10 20h12M10 24h16M10 28h9" {...line} strokeOpacity=".45" strokeWidth={1.6}/>
    </>}
    {kind === "creator" && <>
      <rect x="4" y="15" width="32" height="23" rx="1.5" {...soft}/>
      <rect x="4" y="15" width="32" height="23" rx="1.5" {...line}/>
      <path d="M17 38l-2 10h10l-2-10" {...line}/>
      <path d="M12 50h16" {...line}/>
    </>}
    {kind === "portable" && <>
      <rect x="5" y="22" width="30" height="20" rx="2" {...soft}/>
      <rect x="5" y="22" width="30" height="20" rx="2" {...line}/>
      <path d="M28 42l5 6M4 49h32" {...line} strokeOpacity=".6"/>
      <path d="M33 30v4" {...line} strokeWidth={2.6}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="1.5" y="2.5" width="17" height="11" rx="1.6" fill="#0f172a"/>
    <rect x="3.2" y="4.2" width="13.6" height="7.6" rx=".5" fill="#06b6d4"/>
    <path d="M10 13.5v2.8M6.5 17h7" stroke="#0f172a" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>;
}
