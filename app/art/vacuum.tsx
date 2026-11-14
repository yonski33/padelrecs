// VacuumRecs visuals: one simple line drawing per category (robot, stick, upright, canister, handheld, wet/dry washer,
// carpet cleaner), all in the same 40×64 box as the other niches' product drawings, and the robot-vacuum logo.

export type Shape = "robot" | "stick" | "upright" | "canister" | "handheld" | "wetdry" | "carpet" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("robot")) return "robot";
  if (s.includes("wet")) return "wetdry";
  if (s.includes("carpet")) return "carpet";
  if (s.includes("stick")) return "stick";
  if (s.includes("upright")) return "upright";
  if (s.includes("canister")) return "canister";
  if (s.includes("handheld")) return "handheld";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
const faint = { ...line, strokeOpacity: 0.45 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "robot" && <>
      {/* Robot vacuum seen from above: round body, bumper arc, lidar turret */}
      <circle cx="20" cy="34" r="16" {...soft}/>
      <circle cx="20" cy="34" r="16" {...line}/>
      <path d="M8 27a14 14 0 0 1 24 0" {...faint}/>
      <circle cx="20" cy="34" r="4" {...line}/>
    </>}
    {kind === "stick" && <>
      {/* Cordless stick: handle and bin at the top, long wand, floor head */}
      <path d="M17 6h7l1 12h-9z" {...soft}/>
      <path d="M17 6h7l1 12h-9z" {...line}/>
      <path d="M24 9h4v6h-3" {...faint}/>
      <path d="M20 18v34" {...line}/>
      <path d="M10 52h20v5H10z" {...soft}/>
      <path d="M10 52h20v5H10z" {...line}/>
    </>}
    {kind === "upright" && <>
      {/* Upright: handle, tall body with bin, wide base on wheels */}
      <path d="M17 6h6M20 6v10" {...line}/>
      <rect x="13" y="16" width="14" height="26" rx="3" {...soft}/>
      <rect x="13" y="16" width="14" height="26" rx="3" {...line}/>
      <path d="M16 22h8M16 27h8" {...faint}/>
      <path d="M7 44h26v8H7z" {...line}/>
      <circle cx="11" cy="55" r="2" {...line}/>
      <circle cx="29" cy="55" r="2" {...line}/>
    </>}
    {kind === "canister" && <>
      {/* Canister: body on wheels, hose curling up to a wand */}
      <path d="M4 50c0-8 4-12 12-12h4c6 0 8 4 8 12z" {...soft}/>
      <path d="M4 50c0-8 4-12 12-12h4c6 0 8 4 8 12z" {...line}/>
      <circle cx="9" cy="52" r="2.5" {...line}/>
      <circle cx="23" cy="52" r="2.5" {...line}/>
      <path d="M26 42c6-4 8-10 6-16s-2-12 2-16" {...faint}/>
    </>}
    {kind === "handheld" && <>
      {/* Handheld: nozzle, bin and a handle loop with the battery */}
      <path d="M4 34l10-4h12v12H14z" {...soft}/>
      <path d="M4 34l10-4h12v12H14z" {...line}/>
      <path d="M26 30c6 0 10 2 10 6s-4 6-10 6" {...line}/>
      <path d="M17 33v6" {...faint}/>
    </>}
    {kind === "wetdry" && <>
      {/* Wet/dry floor washer: clean-water tank on the body, roller head */}
      <path d="M20 6v8" {...line}/>
      <rect x="13" y="14" width="14" height="28" rx="4" {...soft}/>
      <rect x="13" y="14" width="14" height="28" rx="4" {...line}/>
      <path d="M17 20c1.5 2 1.5 3 0 4.5" {...faint}/>
      <path d="M8 44h24v8H8z" {...line}/>
      <path d="M11 55h18" {...faint}/>
    </>}
    {kind === "carpet" && <>
      {/* Portable spot cleaner: tank body with carry handle, hose to a tool */}
      <path d="M10 18h16v4" {...line}/>
      <path d="M6 26h26l-2 24H8z" {...soft}/>
      <path d="M6 26h26l-2 24H8z" {...line}/>
      <path d="M10 34h18" {...faint}/>
      <path d="M32 40c4 2 4 8 0 12" {...line}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8.2" fill="#1fa2c4" stroke="#22355a" strokeWidth="1.1"/>
    <path d="M4.6 7.2a6.4 6.4 0 0 1 10.8 0" fill="none" stroke="#22355a" strokeWidth="1.1" strokeLinecap="round"/>
    <circle cx="10" cy="11" r="2.1" fill="#22355a"/>
  </svg>;
}
