// KitchenRecs visuals: one simple line drawing per category (an air fryer with its pull-out basket, a countertop oven with
// its window and knobs, a blender jar on its base, a tilt-head stand mixer over its bowl, a food processor with its feed tube,
// a multicooker pot with its lid), all in the same 40×64 box as the other niches' product drawings, and the cooking-pot logo.

export type Shape = "airfryer" | "oven" | "blender" | "mixer" | "processor" | "multicooker" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("air fryer")) return "airfryer";
  if (s.includes("oven")) return "oven";
  if (s.includes("blender")) return "blender";
  if (s.includes("mixer")) return "mixer";
  if (s.includes("processor")) return "processor";
  if (s.includes("cooker")) return "multicooker";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "airfryer" && <>
      <path d="M8 20a8 8 0 0 1 8-8h8a8 8 0 0 1 8 8v30H8z" {...soft}/>
      <path d="M8 20a8 8 0 0 1 8-8h8a8 8 0 0 1 8 8v30H8z" {...line}/>
      <path d="M8 34h24M15 41h10" {...line}/>
      <path d="M17 20h6" {...line} strokeOpacity=".55"/>
      <path d="M10 50v3M30 50v3" {...line}/>
    </>}
    {kind === "oven" && <>
      <rect x="3" y="20" width="34" height="26" rx="3" {...soft}/>
      <rect x="3" y="20" width="34" height="26" rx="3" {...line}/>
      <rect x="7" y="25" width="20" height="16" rx="1.5" {...line}/>
      <path d="M10 37h14" {...line} strokeOpacity=".55"/>
      <circle cx="32" cy="28" r="1.8" fill="currentColor"/>
      <circle cx="32" cy="36" r="1.8" fill="currentColor"/>
      <path d="M7 46v3M33 46v3" {...line}/>
    </>}
    {kind === "blender" && <>
      <path d="M11 8h18l-3 32H14z" {...soft}/>
      <path d="M11 8h18l-3 32H14z" {...line}/>
      <path d="M10 8h20" {...line}/>
      <path d="M29 14h3v12h-4" {...line}/>
      <path d="M16 32l4-3 4 3" {...line} strokeOpacity=".55"/>
      <path d="M10 40h20v14H10z" {...line}/>
      <circle cx="20" cy="47" r="2" fill="currentColor"/>
    </>}
    {kind === "mixer" && <>
      <path d="M6 54h28" {...line}/>
      <path d="M26 54V30" {...line}/>
      <path d="M6 22a6 6 0 0 1 6-6h18a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H12a6 6 0 0 1-6-6z" {...soft}/>
      <path d="M6 22a6 6 0 0 1 6-6h18a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H12a6 6 0 0 1-6-6z" {...line}/>
      <path d="M13 30v6" {...line}/>
      <path d="M5 40h16l-2 10H7z" {...line}/>
    </>}
    {kind === "processor" && <>
      <path d="M16 6h8v10h-8z" {...line}/>
      <path d="M9 16h22l-2 22H11z" {...soft}/>
      <path d="M9 16h22l-2 22H11z" {...line}/>
      <path d="M14 27h12" {...line} strokeOpacity=".55"/>
      <path d="M8 38h24v14H8z" {...line}/>
      <circle cx="20" cy="45" r="2" fill="currentColor"/>
    </>}
    {kind === "multicooker" && <>
      <path d="M8 26h24v22a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z" {...soft}/>
      <path d="M8 26h24v22a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z" {...line}/>
      <path d="M6 26c0-6 6-10 14-10s14 4 14 10z" {...line}/>
      <path d="M18 16v-3h4v3" {...line}/>
      <rect x="15" y="34" width="10" height="6" rx="1.5" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M5.2 8.5H14.8A2.2 2.2 0 0 1 17 10.7V14.8A2.2 2.2 0 0 1 14.8 17H5.2A2.2 2.2 0 0 1 3 14.8V10.7A2.2 2.2 0 0 1 5.2 8.5ZM1.8 9.6H3V11.6H1.8A1 1 0 0 1 1.8 9.6ZM17 9.6H18.2A1 1 0 0 1 18.2 11.6H17ZM10 3A1.6 1.6 0 1 1 10 6.2A1.6 1.6 0 1 1 10 3Z" fill="#9a3412"/>
    <path d="M3 7.2H17" fill="none" stroke="#f6c453" strokeWidth="2" strokeLinecap="round"/>
  </svg>;
}
