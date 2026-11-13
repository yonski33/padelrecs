// ToolRecs visuals: one simple line drawing per category (drill, saw, multi-tool, sander, grinder, nailer, outdoor power,
// battery platform), all in the same 40×64 box as the other niches' product drawings, and the lightning-bolt logo.

export type Shape = "drill" | "saw" | "multitool" | "sander" | "grinder" | "nailer" | "outdoor" | "battery" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("drill") || s.includes("driver")) return "drill";
  if (s.includes("saw")) return "saw";
  if (s.includes("oscillat") || s.includes("multi")) return "multitool";
  if (s.includes("sander")) return "sander";
  if (s.includes("grinder")) return "grinder";
  if (s.includes("nail")) return "nailer";
  if (s.includes("outdoor")) return "outdoor";
  if (s.includes("battery") || s.includes("platform")) return "battery";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
const faint = { ...line, strokeOpacity: 0.45 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "drill" && <>
      {/* Pistol-grip drill: body with chuck and bit, grip, battery pack */}
      <path d="M8 18h20v10H8z" {...soft}/>
      <path d="M8 18h20v10H8z" {...line}/>
      <path d="M28 20h4v6h-4M32 23h6" {...line}/>
      <path d="M14 28l-2 14h8l1-14" {...line}/>
      <path d="M8 42h16v6H8z" {...line}/>
      <path d="M19 31h-3" {...faint}/>
    </>}
    {kind === "saw" && <>
      {/* Circular saw blade with teeth and arbor */}
      <circle cx="20" cy="32" r="14" {...soft}/>
      <circle cx="20" cy="32" r="14" {...line}/>
      <circle cx="20" cy="32" r="3" {...line}/>
      <path d="M20 18l2-3M34 32l3 2M20 46l-2 3M6 32l-3-2M30 22l3-1M30 42l1 3M10 42l-3 1M10 22l-1-3" {...line}/>
    </>}
    {kind === "multitool" && <>
      {/* Long body with a flat oscillating blade at the nose */}
      <rect x="15" y="10" width="10" height="30" rx="5" {...soft}/>
      <rect x="15" y="10" width="10" height="30" rx="5" {...line}/>
      <path d="M17 40h6v4h-6z" {...line}/>
      <path d="M14 44h12v8H14z" {...line}/>
      <path d="M15 52v2M18 52v2M21 52v2M24 52v2" {...faint}/>
    </>}
    {kind === "sander" && <>
      {/* Palm random-orbit sander: dome body, round pad */}
      <path d="M10 40a10 14 0 0 1 20 0z" {...soft}/>
      <path d="M10 40a10 14 0 0 1 20 0z" {...line}/>
      <path d="M5 40h30v5H5z" {...line}/>
      <path d="M30 32h6v4" {...line}/>
      <path d="M8 48h24" {...faint}/>
    </>}
    {kind === "grinder" && <>
      {/* Angle grinder: long body, gear head, disc and guard */}
      <rect x="4" y="26" width="24" height="9" rx="4.5" {...soft}/>
      <rect x="4" y="26" width="24" height="9" rx="4.5" {...line}/>
      <path d="M28 25h6v11h-6" {...line}/>
      <path d="M31 36v4" {...line}/>
      <path d="M24 42h14" {...line}/>
      <path d="M24 44a7 3 0 0 0 14 0" {...faint}/>
    </>}
    {kind === "nailer" && <>
      {/* Nailer: body over a nose, grip and slanted magazine */}
      <path d="M6 16h22v10H6z" {...soft}/>
      <path d="M6 16h22v10H6z" {...line}/>
      <path d="M8 26v20h4V26" {...line}/>
      <path d="M22 26l-2 12h6l2-12" {...line}/>
      <path d="M12 44l10-6" {...line}/>
      <path d="M10 46v4" {...faint}/>
    </>}
    {kind === "outdoor" && <>
      {/* String trimmer: long shaft, motor head, guard and line */}
      <path d="M8 8l18 38" {...line}/>
      <path d="M12 16h7" {...line}/>
      <rect x="22" y="44" width="10" height="7" rx="2" {...soft}/>
      <rect x="22" y="44" width="10" height="7" rx="2" {...line}/>
      <path d="M16 54a12 4 0 0 1 20 0" {...line}/>
      <path d="M27 51l-8 4M27 51l8 4" {...faint}/>
    </>}
    {kind === "battery" && <>
      {/* Slide battery pack with charge bars */}
      <path d="M8 24h24v24H8z" {...soft}/>
      <rect x="8" y="24" width="24" height="24" rx="3" {...line}/>
      <path d="M13 24v-5h14v5" {...line}/>
      <path d="M14 42h3M19 42h3M24 42h3" {...line}/>
      <path d="M19 30l-3 5h4l-2 4" {...faint}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M11.8 1.5 4 11.2h5.3l-1.1 7.3L16 8.6h-5.3l1.1-7.1z" fill="#f5b400" stroke="#16181b" strokeWidth="1" strokeLinejoin="round"/>
  </svg>;
}
