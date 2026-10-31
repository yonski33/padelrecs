// BabyGearRecs visuals: one simple line drawing per category (stroller, car seat, carrier, high chair, crib, monitor,
// bottle, bouncer), all in the same 40×64 box as the other niches' product drawings, and the rattle logo.

export type Shape = "stroller" | "carseat" | "carrier" | "highchair" | "crib" | "monitor" | "bottle" | "bouncer" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("stroller")) return "stroller";
  if (s.includes("car seat")) return "carseat";
  if (s.includes("carrier") || s.includes("wrap")) return "carrier";
  if (s.includes("high chair")) return "highchair";
  if (s.includes("crib") || s.includes("bassinet") || s.includes("play yard")) return "crib";
  if (s.includes("monitor")) return "monitor";
  if (s.includes("pump") || s.includes("bottle")) return "bottle";
  if (s.includes("bouncer") || s.includes("swing")) return "bouncer";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "stroller" && <>
      <path d="M8 22a14 14 0 0 1 14 0v12H8z" {...soft}/>
      <path d="M8 22a14 14 0 0 1 14 0v12H8z" {...line}/>
      <path d="M8 34h22l4-16" {...line}/>
      <path d="M12 34l-2 12M28 34l2 12" {...line} strokeOpacity=".6"/>
      <circle cx="10" cy="50" r="3.5" {...line}/>
      <circle cx="30" cy="50" r="3.5" {...line}/>
    </>}
    {kind === "carseat" && <>
      <path d="M11 14h12a4 4 0 0 1 4 4v18l5 6v6H11a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" {...soft}/>
      <path d="M11 14h12a4 4 0 0 1 4 4v18l5 6v6H11a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" {...line}/>
      <path d="M13 22l4 8 4-8M17 30v6" {...line} strokeOpacity=".6"/>
      <path d="M6 54h28" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "carrier" && <>
      <path d="M11 26h18v14a9 9 0 0 1-18 0z" {...soft}/>
      <path d="M11 26h18v14a9 9 0 0 1-18 0z" {...line}/>
      <path d="M11 26l-3-12M29 26l3-12" {...line}/>
      <path d="M6 44h28" {...line} strokeOpacity=".6"/>
      <circle cx="20" cy="20" r="4" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "highchair" && <>
      <path d="M12 12h16v20H12z" {...soft}/>
      <path d="M12 12h16v20H12z" {...line}/>
      <path d="M8 28h24" {...line}/>
      <path d="M13 32l-4 22M27 32l4 22M11 44h18" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "crib" && <>
      <rect x="5" y="22" width="30" height="22" rx="2" {...soft}/>
      <path d="M5 18v32M35 18v32M5 22h30M5 44h30" {...line}/>
      <path d="M11 22v22M17 22v22M23 22v22M29 22v22" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "monitor" && <>
      <rect x="8" y="16" width="24" height="18" rx="9" {...soft}/>
      <rect x="8" y="16" width="24" height="18" rx="9" {...line}/>
      <circle cx="20" cy="25" r="4.5" {...line}/>
      <path d="M20 34v12M13 50h14" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "bottle" && <>
      <path d="M13 24h14v24a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" {...soft}/>
      <path d="M13 24h14v24a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" {...line}/>
      <path d="M12 20h16v4H12zM16 20c0-5 2-8 4-8s4 3 4 8" {...line}/>
      <path d="M17 32h4M17 38h4M17 44h4" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "bouncer" && <>
      <path d="M8 26c8 10 16 10 24 0l2 6c-8 10-20 10-28 0z" {...soft}/>
      <path d="M8 26c8 10 16 10 24 0l2 6c-8 10-20 10-28 0z" {...line}/>
      <path d="M10 40l-4 12h28l-4-12" {...line} strokeOpacity=".6"/>
      <path d="M12 22a8 8 0 0 1 16 0" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="7" r="5.6" fill="#3d6b5a"/>
    <circle cx="8" cy="6" r="1.1" fill="#f0a37c"/>
    <circle cx="12" cy="8.2" r="1.1" fill="#f0a37c"/>
    <rect x="9" y="12" width="2" height="4.2" rx="1" fill="#3d6b5a"/>
    <circle cx="10" cy="17.6" r="1.6" fill="none" stroke="#3d6b5a" strokeWidth="1.4"/>
  </svg>;
}
