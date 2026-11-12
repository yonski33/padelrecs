// PrintRecs visuals: one simple line drawing per category (FDM printer, resin printer, multi-material unit, filament spool,
// resin bottle), all in the same 40×64 box as the other niches' product drawings, and the spool logo.

export type Shape = "fdm" | "resinprinter" | "multi" | "filament" | "resin" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("fdm")) return "fdm";
  if (s.includes("resin printer")) return "resinprinter";
  if (s.includes("multi") || s.includes("enclosure")) return "multi";
  if (s.includes("filament")) return "filament";
  if (s.includes("resin")) return "resin";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "fdm" && <>
      <rect x="5" y="14" width="30" height="36" rx="2.5" {...soft}/>
      <rect x="5" y="14" width="30" height="36" rx="2.5" {...line}/>
      <path d="M5 22h30" {...line} strokeOpacity=".6"/>
      <path d="M18 22v5h4v-5M20 27v2" {...line}/>
      <path d="M10 42h20" {...line} strokeOpacity=".6"/>
      <path d="M16 42v-5h8v5" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "resinprinter" && <>
      <path d="M9 14h22v20H9z" {...soft}/>
      <path d="M9 14h22v20H9z" {...line} strokeOpacity=".7"/>
      <rect x="6" y="34" width="28" height="14" rx="2" {...line}/>
      <path d="M14 22h12M20 14v8" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "multi" && <>
      <rect x="4" y="22" width="32" height="22" rx="3" {...soft}/>
      <rect x="4" y="22" width="32" height="22" rx="3" {...line}/>
      <circle cx="11" cy="33" r="3" {...line} strokeOpacity=".7"/>
      <circle cx="17.7" cy="33" r="3" {...line} strokeOpacity=".7"/>
      <circle cx="24.3" cy="33" r="3" {...line} strokeOpacity=".7"/>
      <circle cx="31" cy="33" r="3" {...line} strokeOpacity=".7"/>
    </>}
    {kind === "filament" && <>
      <circle cx="20" cy="32" r="14" {...soft}/>
      <circle cx="20" cy="32" r="14" {...line}/>
      <circle cx="20" cy="32" r="9" {...line} strokeOpacity=".5"/>
      <circle cx="20" cy="32" r="3.5" {...line}/>
    </>}
    {kind === "resin" && <>
      <path d="M15 12h10v5l4 4v25a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V21l4-4z" {...soft}/>
      <path d="M15 12h10v5l4 4v25a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V21l4-4z" {...line}/>
      <path d="M11 30h18" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8.6" fill="#1f3a5a"/>
    <circle cx="10" cy="10" r="6.4" fill="#f2792b"/>
    <circle cx="10" cy="10" r="2.6" fill="#1f3a5a"/>
  </svg>;
}
