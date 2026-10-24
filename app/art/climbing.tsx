// ClimbingRecs visuals: one simple line drawing per category (a downturned climbing shoe, a harness with its leg loops,
// a tube belay device on its carabiner, a coiled rope, a chalk bag with its cinch, a folded crash pad), all in the same
// 40×64 box as the other niches' product drawings, and the climbing hold logo.

export type Shape = "shoe" | "harness" | "belay" | "rope" | "chalk" | "pad" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("shoe")) return "shoe";
  if (s.includes("harness")) return "harness";
  if (s.includes("belay")) return "belay";
  if (s.includes("rope")) return "rope";
  if (s.includes("chalk")) return "chalk";
  if (s.includes("pad")) return "pad";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "shoe" && <>
      <path d="M4 40c0-6 3-11 8-12l4-8h8l2 8c4 1 9 4 10 9 1 4-1 7-5 7H10c-4 0-6-1-6-4z" {...soft}/>
      <path d="M4 40c0-6 3-11 8-12l4-8h8l2 8c4 1 9 4 10 9 1 4-1 7-5 7H10c-4 0-6-1-6-4z" {...line}/>
      <path d="M14 30l10 4M17 25l9 3" {...line} strokeOpacity=".55"/>
      <path d="M5 42c8 2 20 2 30 0" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "harness" && <>
      <path d="M6 18c4 3 24 3 28 0v6c-4 3-24 3-28 0z" {...soft}/>
      <path d="M6 18c4 3 24 3 28 0v6c-4 3-24 3-28 0z" {...line}/>
      <path d="M17 26v6h6v-6" {...line}/>
      <ellipse cx="11" cy="42" rx="6" ry="9" {...line}/>
      <ellipse cx="29" cy="42" rx="6" ry="9" {...line}/>
      <path d="M17 32l-2 4M23 32l2 4" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "belay" && <>
      <path d="M13 34h14l-2 16h-10z" {...soft}/>
      <path d="M13 34h14l-2 16h-10z" {...line}/>
      <path d="M17 38v8M23 38v8" {...line} strokeOpacity=".55"/>
      <path d="M20 34v-6M14 12h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" {...line}/>
    </>}
    {kind === "rope" && <>
      <ellipse cx="20" cy="34" rx="14" ry="14" {...soft}/>
      <ellipse cx="20" cy="34" rx="14" ry="14" {...line}/>
      <ellipse cx="20" cy="34" rx="9" ry="9" {...line} strokeOpacity=".55"/>
      <ellipse cx="20" cy="34" rx="4" ry="4" {...line} strokeOpacity=".55"/>
      <path d="M34 34c2 6 0 14-4 18" {...line}/>
    </>}
    {kind === "chalk" && <>
      <path d="M10 24h20l-1 24a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" {...soft}/>
      <path d="M10 24h20l-1 24a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" {...line}/>
      <path d="M9 24c3-4 19-4 22 0" {...line}/>
      <path d="M20 21v-5M18 16h4" {...line} strokeOpacity=".55"/>
      <path d="M30 32h4v8h-4" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "pad" && <>
      <rect x="4" y="26" width="32" height="12" rx="2" {...soft}/>
      <rect x="4" y="26" width="32" height="12" rx="2" {...line}/>
      <rect x="4" y="38" width="32" height="12" rx="2" {...line}/>
      <path d="M14 22h12M14 22v4M26 22v4" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3.4 13.8C1.4 10.6 2.8 5.6 6.6 4 9.8 2.6 12.4 4.2 15 3.6 17.8 3 19.4 6.4 18.4 9.6 17.6 12.4 18.4 15 16 16.6 13.4 18.4 10 16.8 7.6 17 5.4 17.2 4.3 15.4 3.4 13.8Z" fill="#0f4c5c"/>
    <circle cx="10.8" cy="10.4" r="2.1" fill="#fb8c3c"/>
  </svg>;
}
