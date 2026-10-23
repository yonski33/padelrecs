// CameraRecs visuals: one simple line drawing per category (a mirrorless body with a lens and viewfinder hump, a flat
// compact with a small lens, a vlogging camera with its screen flipped out, a boxy action camera), all in the same
// 40×64 box as the other niches' product drawings, and the camera logo.

export type Shape = "mirrorless" | "compact" | "vlogging" | "action" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("action") || s.includes("360")) return "action";
  if (s.includes("vlog")) return "vlogging";
  if (s.includes("compact")) return "compact";
  if (s.includes("mirrorless")) return "mirrorless";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "mirrorless" && <>
      <path d="M3 24h9l3-5h10l3 5h9v19H3z" {...soft}/>
      <path d="M3 24h9l3-5h10l3 5h9v19H3z" {...line}/>
      <circle cx="20" cy="33.5" r="7" {...line}/>
      <circle cx="20" cy="33.5" r="3" {...line} strokeOpacity=".55"/>
      <path d="M7 28h3" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "compact" && <>
      <rect x="3" y="24" width="34" height="18" rx="3" {...soft}/>
      <rect x="3" y="24" width="34" height="18" rx="3" {...line}/>
      <circle cx="22" cy="33" r="5.5" {...line}/>
      <path d="M8 21h6M30 28h3" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "vlogging" && <>
      <rect x="9" y="22" width="28" height="18" rx="3" {...soft}/>
      <rect x="9" y="22" width="28" height="18" rx="3" {...line}/>
      <circle cx="25" cy="31" r="5" {...line}/>
      <path d="M9 25H4v12h5" {...line}/>
      <path d="M17 19h6" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "action" && <>
      <rect x="7" y="20" width="26" height="22" rx="4" {...soft}/>
      <rect x="7" y="20" width="26" height="22" rx="4" {...line}/>
      <rect x="11" y="25" width="10" height="10" rx="2" {...line}/>
      <circle cx="16" cy="30" r="2.4" {...line} strokeOpacity=".55"/>
      <path d="M26 25h3M14 46v4M26 46v4" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="5.2" y="2.8" width="5" height="3" rx=".8" fill="#18181b"/>
    <rect x="1.5" y="5.2" width="17" height="11.8" rx="2" fill="#18181b"/>
    <circle cx="10" cy="11.1" r="3.7" fill="#f43f5e" stroke="#f4f4f5" strokeWidth="1.1"/>
  </svg>;
}
