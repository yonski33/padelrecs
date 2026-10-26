// UltralightRecs visuals: one simple line drawing per category (a trekking-pole tent with its door and guylines, a
// roll-top backpack with side pockets, a rolled-up sleeping pad, a tapered quilt with baffles, a lidded pot over a stove
// flame, a squeeze filter on its pouch, a pair of trekking poles and a hooded rain jacket), all in the same 40×64 box as
// the other niches' product drawings, and the tent logo.

export type Shape = "shelter" | "backpack" | "pad" | "quilt" | "cook" | "filter" | "poles" | "jacket" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("shelter") || s.includes("tent") || s.includes("tarp")) return "shelter";
  if (s.includes("cook") || s.includes("stove") || s.includes("pot")) return "cook";
  if (s.includes("filter")) return "filter";
  if (s.includes("pole")) return "poles";
  if (s.includes("jacket")) return "jacket";
  if (s.includes("pack")) return "backpack";
  if (s.includes("pad")) return "pad";
  if (s.includes("quilt") || s.includes("bag")) return "quilt";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "shelter" && <>
      <path d="M20 18L36 44H4z" {...soft}/>
      <path d="M20 18L36 44H4z" {...line}/>
      <path d="M20 27L25 44H15z" {...line} strokeOpacity=".55"/>
      <path d="M20 18V14M36 44l2 2M4 44l-2 2" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "backpack" && <>
      <path d="M11 20h18v26a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" {...soft}/>
      <path d="M11 20h18v26a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" {...line}/>
      <path d="M12 15h16v5H12z" {...line}/>
      <path d="M11 34H7v10a2 2 0 0 0 2 2h2M29 34h4v10a2 2 0 0 1-2 2h-2" {...line} strokeOpacity=".55"/>
      <path d="M15 27h10" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "pad" && <>
      <rect x="6" y="22" width="28" height="20" rx="10" {...soft}/>
      <rect x="6" y="22" width="28" height="20" rx="10" {...line}/>
      <circle cx="16" cy="32" r="6" {...line} strokeOpacity=".55"/>
      <circle cx="16" cy="32" r="2.4" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "quilt" && <>
      <path d="M8 12h24l-4 40H12z" {...soft}/>
      <path d="M8 12h24l-4 40H12z" {...line}/>
      <path d="M8.9 21h22.2M9.8 30h20.4M10.7 39h18.6" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "cook" && <>
      <path d="M9 24h22v16a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4z" {...soft}/>
      <path d="M9 24h22v16a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4z" {...line}/>
      <path d="M8 24h24M17 20h6M31 29h4" {...line} strokeOpacity=".55"/>
      <path d="M20 56c-3 0-4.5-2-4.5-4 0-2.5 2.5-3.5 2.5-6 1.5 1.2 2.5 2.4 2.5 2.4s.7-1.4.5-2.9c2 1.5 3.5 3.6 3.5 6.5 0 2-1.5 4-4.5 4z" {...line}/>
    </>}
    {kind === "filter" && <>
      <path d="M10 30h20v18a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" {...soft}/>
      <path d="M10 30h20v18a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" {...line}/>
      <rect x="15" y="12" width="10" height="18" rx="2.5" {...line}/>
      <path d="M17 8h6v4h-6zM15 19h10M15 24h10" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "poles" && <>
      <path d="M14 10l-2 46M26 10l2 46" {...line}/>
      <rect x="11.5" y="8" width="5" height="10" rx="2" {...soft}/>
      <rect x="23.5" y="8" width="5" height="10" rx="2" {...soft}/>
      <path d="M10 50h5M25 50h5M13 30h2M25 30h2" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "jacket" && <>
      <path d="M15 14l5 4 5-4 8 5 3 15h-5v18H9V34H4l3-15z" {...soft}/>
      <path d="M15 14l5 4 5-4 8 5 3 15h-5v18H9V34H4l3-15z" {...line}/>
      <path d="M20 18v34M15 14c0-3 2.2-5 5-5s5 2 5 5" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 2L18.5 17H1.5z" fill="#4a3426" strokeLinejoin="round"/>
    <path d="M10 7.6L13.2 17H6.8z" fill="#38bdf8" stroke="#f5f1ec" strokeWidth="1" strokeLinejoin="round"/>
  </svg>;
}
