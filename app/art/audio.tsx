// AudioRecs visuals: one simple line drawing per category (over-ear headphones, a wired IEM with its cable, a true wireless
// earbud next to its case), all in the same 40×64 box as the other niches' product drawings, and the headphones logo.

export type Shape = "headphones" | "iem" | "earbuds" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("earbud")) return "earbuds";
  if (s.includes("iem") || s.includes("in-ear")) return "iem";
  if (s.includes("headphone")) return "headphones";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "headphones" && <>
      <path d="M7 38v-7a13 13 0 0 1 26 0v7" {...line}/>
      <rect x="3.5" y="33" width="9" height="15" rx="4" {...soft}/>
      <rect x="27.5" y="33" width="9" height="15" rx="4" {...soft}/>
      <rect x="3.5" y="33" width="9" height="15" rx="4" {...line}/>
      <rect x="27.5" y="33" width="9" height="15" rx="4" {...line}/>
    </>}
    {kind === "iem" && <>
      <path d="M13 22c5-4 14-3 15 4 1 6-3 11-9 11-5 0-8-4-8-8 0-3 .7-5.3 2-7z" {...soft}/>
      <path d="M13 22c5-4 14-3 15 4 1 6-3 11-9 11-5 0-8-4-8-8 0-3 .7-5.3 2-7z" {...line}/>
      <path d="M11.5 27l-4-2.5" {...line} strokeWidth={3.4}/>
      <path d="M24 20c3-4 7-3 7 2 0 5-2 9-2 16s-3 14-9 16" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "earbuds" && <>
      <rect x="6" y="36" width="28" height="16" rx="8" {...soft}/>
      <rect x="6" y="36" width="28" height="16" rx="8" {...line}/>
      <path d="M6.5 42.5h27" {...line} strokeOpacity=".45"/>
      <circle cx="18" cy="17" r="6" {...soft}/>
      <circle cx="18" cy="17" r="6" {...line}/>
      <path d="M22.5 21L24 31" {...line} strokeWidth={4}/>
      <circle cx="16.5" cy="16" r="1.6" fill="currentColor"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4.5 11.5V9.5a5.5 5.5 0 0 1 11 0V11.5" fill="none" stroke="#1b1f3b" strokeWidth="1.9" strokeLinecap="round"/>
    <rect x="2.6" y="10.2" width="4" height="6.2" rx="1.5" fill="#7c3aed"/>
    <rect x="13.4" y="10.2" width="4" height="6.2" rx="1.5" fill="#7c3aed"/>
  </svg>;
}
