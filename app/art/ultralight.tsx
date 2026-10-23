// UltralightRecs visuals: one simple line drawing per category (a trekking-pole tent with its door and guylines, a
// roll-top backpack with side pockets, a rolled-up sleeping pad, a tapered quilt with baffles), all in the same 40×64
// box as the other niches' product drawings, and the tent logo.

export type Shape = "shelter" | "backpack" | "pad" | "quilt" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("shelter") || s.includes("tent") || s.includes("tarp")) return "shelter";
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
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 2L18.5 17H1.5z" fill="#4a3426" strokeLinejoin="round"/>
    <path d="M10 7.6L13.2 17H6.8z" fill="#38bdf8" stroke="#f5f1ec" strokeWidth="1" strokeLinejoin="round"/>
  </svg>;
}
