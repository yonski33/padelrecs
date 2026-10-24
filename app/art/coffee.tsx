// CoffeeRecs visuals: one simple line drawing per category (an espresso machine with its portafilter and cup, a grinder
// with its bean hopper, a pour-over dripper on a cup, a gooseneck kettle, a scale with its display), all in the same
// 40×64 box as the other niches' product drawings, and the coffee bean logo.

export type Shape = "espresso" | "grinder" | "brewer" | "kettle" | "scale" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("espresso")) return "espresso";
  if (s.includes("grinder")) return "grinder";
  if (s.includes("brewer") || s.includes("dripper")) return "brewer";
  if (s.includes("kettle")) return "kettle";
  if (s.includes("scale")) return "scale";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "espresso" && <>
      <path d="M6 14h28v34H6z" {...soft}/>
      <path d="M6 14h28v34H6z" {...line}/>
      <path d="M12 24h16M14 24v4M26 24v4" {...line} strokeOpacity=".55"/>
      <path d="M14 38h12v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z" {...line}/>
      <path d="M4 48h32" {...line}/>
    </>}
    {kind === "grinder" && <>
      <path d="M12 26h16v22a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" {...soft}/>
      <path d="M12 26h16v22a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2z" {...line}/>
      <path d="M10 12h20l-4 14H14z" {...line}/>
      <path d="M16 38h8v6h-8z" {...line} strokeOpacity=".55"/>
      <path d="M9 50h22" {...line}/>
    </>}
    {kind === "brewer" && <>
      <path d="M6 16h28l-10 18h-8z" {...soft}/>
      <path d="M6 16h28l-10 18h-8z" {...line}/>
      <path d="M13 22h14" {...line} strokeOpacity=".55"/>
      <path d="M11 38h18v8a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6z" {...line}/>
      <path d="M29 41h2a3 3 0 0 1 0 6h-2" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "kettle" && <>
      <path d="M10 26h18l2 22H8z" {...soft}/>
      <path d="M10 26h18l2 22H8z" {...line}/>
      <path d="M14 26v-3h10v3M17 23v-3h4v3" {...line} strokeOpacity=".55"/>
      <path d="M9 34C4 32 3 26 2 20" {...line}/>
      <path d="M29 30c4 0 6 3 6 8s-2 8-6 8" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "scale" && <>
      <rect x="5" y="30" width="30" height="16" rx="3" {...soft}/>
      <rect x="5" y="30" width="30" height="16" rx="3" {...line}/>
      <rect x="11" y="35" width="12" height="6" rx="1.5" {...line} strokeOpacity=".55"/>
      <path d="M28 38h2" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <ellipse cx="10" cy="10" rx="6.3" ry="8.6" transform="rotate(28 10 10)" fill="#4a2511"/>
    <path d="M12.3 2.6C8.6 6 11.6 12.6 7.7 17.4" fill="none" stroke="#f0a35e" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
