// SleepRecs visuals: one simple line drawing per category (mattress, topper, pillow, sheets, weighted blanket, sleep
// accessory, bed cooling), all in the same 40×64 box as the other niches' product drawings, and the bed logo.

export type Shape = "mattress" | "topper" | "pillow" | "sheets" | "blanket" | "accessory" | "cooling" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("topper")) return "topper";
  if (s.includes("mattress")) return "mattress";
  if (s.includes("pillow")) return "pillow";
  if (s.includes("weighted") || s.includes("blanket")) return "blanket";
  if (s.includes("sheet") || s.includes("bedding") || s.includes("duvet") || s.includes("comforter")) return "sheets";
  if (s.includes("cooling")) return "cooling";
  if (s.includes("accessor")) return "accessory";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "mattress" && <>
      <rect x="5" y="24" width="30" height="18" rx="3" {...soft}/>
      <rect x="5" y="24" width="30" height="18" rx="3" {...line}/>
      <path d="M5 32h30" {...line} strokeOpacity=".6"/>
      <path d="M12 36v2M20 36v2M28 36v2" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "topper" && <>
      <rect x="5" y="34" width="30" height="12" rx="2" {...line} strokeOpacity=".5"/>
      <rect x="5" y="26" width="30" height="7" rx="3.5" {...soft}/>
      <rect x="5" y="26" width="30" height="7" rx="3.5" {...line}/>
    </>}
    {kind === "pillow" && <>
      <path d="M7 24c4-3 22-3 26 0 2 5 2 11 0 16-4 3-22 3-26 0-2-5-2-11 0-16z" {...soft}/>
      <path d="M7 24c4-3 22-3 26 0 2 5 2 11 0 16-4 3-22 3-26 0-2-5-2-11 0-16z" {...line}/>
      <path d="M14 30c4 2 8 2 12 0" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "sheets" && <>
      <path d="M8 16h24v32H8z" {...soft}/>
      <path d="M8 16h24v32H8z" {...line}/>
      <path d="M8 24h24" {...line} strokeOpacity=".6"/>
      <path d="M32 24l-6 6v18" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "blanket" && <>
      <path d="M6 20h28v22a6 6 0 0 1-6 6H6z" {...soft}/>
      <path d="M6 20h28v22a6 6 0 0 1-6 6H6z" {...line}/>
      <path d="M6 29h28M6 38h28M15 20v28M24 20v28" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "accessory" && <>
      <path d="M5 30c0-4 4-6 8-6h14c4 0 8 2 8 6s-4 6-8 6h-4l-3-3-3 3h-4c-4 0-8-2-8-6z" {...soft}/>
      <path d="M5 30c0-4 4-6 8-6h14c4 0 8 2 8 6s-4 6-8 6h-4l-3-3-3 3h-4c-4 0-8-2-8-6z" {...line}/>
      <path d="M2 30h3M35 30h3" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "cooling" && <>
      <rect x="6" y="36" width="28" height="10" rx="2" {...soft}/>
      <rect x="6" y="36" width="28" height="10" rx="2" {...line}/>
      <path d="M20 12v18M12 16l16 10M28 16l-16 10" {...line} strokeOpacity=".7"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="1.5" y="5" width="2.4" height="11.5" rx="1" fill="#2e3a63"/>
    <rect x="5" y="8" width="5" height="2.6" rx="1.3" fill="#b7a8e3"/>
    <rect x="1.5" y="11" width="17" height="3.2" rx="1" fill="#2e3a63"/>
    <rect x="16.6" y="11" width="1.9" height="5.5" rx=".8" fill="#2e3a63"/>
  </svg>;
}
