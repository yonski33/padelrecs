// TravelGearRecs visuals: one simple line drawing per category (travel backpack, rolling suitcase, packing cube, sling,
// accessory), all in the same 40×64 box as the other niches' product drawings, and the luggage-tag logo.

export type Shape = "backpack" | "suitcase" | "cube" | "sling" | "accessory" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("daypack") || s.includes("sling")) return "sling";
  if (s.includes("backpack")) return "backpack";
  if (s.includes("luggage") || s.includes("suitcase")) return "suitcase";
  if (s.includes("cube") || s.includes("organizer")) return "cube";
  if (s.includes("accessor")) return "accessory";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "backpack" && <>
      <rect x="7" y="16" width="26" height="36" rx="6" {...soft}/>
      <rect x="7" y="16" width="26" height="36" rx="6" {...line}/>
      <path d="M15 16v-3a5 5 0 0 1 10 0v3" {...line}/>
      <rect x="12" y="34" width="16" height="11" rx="2.5" {...line} strokeOpacity=".6"/>
      <path d="M12 25h16" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "suitcase" && <>
      <rect x="8" y="18" width="24" height="34" rx="4" {...soft}/>
      <rect x="8" y="18" width="24" height="34" rx="4" {...line}/>
      <path d="M16 18v-7h8v7" {...line}/>
      <path d="M15 24v22M20 24v22M25 24v22" {...line} strokeOpacity=".6"/>
      <path d="M12 56h.01M28 56h.01" {...line} strokeWidth={3.4}/>
    </>}
    {kind === "cube" && <>
      <rect x="5" y="22" width="30" height="22" rx="4" {...soft}/>
      <rect x="5" y="22" width="30" height="22" rx="4" {...line}/>
      <path d="M9 28h22" {...line} strokeDasharray="2.5 3" strokeOpacity=".7"/>
      <path d="M28 28v4" {...line}/>
      <rect x="10" y="33" width="20" height="7" rx="1.5" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "sling" && <>
      <path d="M6 12l22 22" {...line} strokeOpacity=".6"/>
      <path d="M10 34h22a3 3 0 0 1 3 3v6a7 7 0 0 1-7 7H14a7 7 0 0 1-7-7v-6a3 3 0 0 1 3-3z" {...soft}/>
      <path d="M10 34h22a3 3 0 0 1 3 3v6a7 7 0 0 1-7 7H14a7 7 0 0 1-7-7v-6a3 3 0 0 1 3-3z" {...line}/>
      <path d="M11 40h20" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "accessory" && <>
      <path d="M8 26a3 3 0 0 1 1-2.2l5-4.3a3 3 0 0 1 2-.7h14a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H16a3 3 0 0 1-2-.7l-5-4.3a3 3 0 0 1-1-2.2z" {...soft}/>
      <path d="M8 26a3 3 0 0 1 1-2.2l5-4.3a3 3 0 0 1 2-.7h14a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H16a3 3 0 0 1-2-.7l-5-4.3a3 3 0 0 1-1-2.2z" {...line}/>
      <circle cx="15" cy="31" r="2.4" {...line}/>
      <path d="M21 28h7M21 34h5" {...line} strokeOpacity=".6"/>
      <path d="M12.8 29.3C10 25 9 16 14 11" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M2 6.6a2 2 0 0 1 .7-1.5l3.4-2.7a2 2 0 0 1 1.2-.4H16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7.3a2 2 0 0 1-1.2-.4l-3.4-2.7A2 2 0 0 1 2 13.4z" fill="#1d3557"/>
    <circle cx="6.2" cy="10" r="1.7" fill="#f28c28"/>
    <rect x="10" y="7.6" width="5.4" height="1.6" rx=".8" fill="#f28c28" fillOpacity=".55"/>
    <rect x="10" y="10.8" width="3.6" height="1.6" rx=".8" fill="#f28c28" fillOpacity=".55"/>
  </svg>;
}
