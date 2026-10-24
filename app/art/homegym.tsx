// HomeGymRecs visuals: one simple line drawing per category (an upright dumbbell, a power rack with a bar on its hooks, an
// adjustable bench, a loaded barbell end-on to the viewer as a long bar, a stack of plates, a cable machine with its weight
// stack, a rower), all in the same 40×64 box as the other niches' product drawings, and the dumbbell logo.

export type Shape = "dumbbell" | "rack" | "bench" | "barbell" | "plates" | "machine" | "cardio" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("dumbbell")) return "dumbbell";
  if (s.includes("rack")) return "rack";
  if (s.includes("bench")) return "bench";
  if (s.includes("barbell")) return "barbell";
  if (s.includes("plate")) return "plates";
  if (s.includes("machine")) return "machine";
  if (s.includes("cardio")) return "cardio";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "dumbbell" && <>
      <rect x="9" y="8" width="22" height="12" rx="3" {...soft}/>
      <rect x="9" y="8" width="22" height="12" rx="3" {...line}/>
      <rect x="9" y="44" width="22" height="12" rx="3" {...soft}/>
      <rect x="9" y="44" width="22" height="12" rx="3" {...line}/>
      <path d="M20 20v24" {...line} strokeWidth={3.4}/>
      <path d="M17 28h6M17 33h6" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "rack" && <>
      <path d="M8 6v52M32 6v52M8 8h24M5 58h11M24 58h11" {...line}/>
      <path d="M8 14h24" {...line} strokeOpacity=".55"/>
      <path d="M3 28h34" {...line} strokeWidth={2.8}/>
      <rect x="1" y="23" width="4" height="10" rx="1" {...soft}/>
      <rect x="35" y="23" width="4" height="10" rx="1" {...soft}/>
      <path d="M8 42h5M27 42h5" {...line}/>
    </>}
    {kind === "bench" && <>
      <path d="M6 38h20l10-18" {...line} strokeWidth={4}/>
      <path d="M6 38h20l10-18" {...soft}/>
      <path d="M10 38v16M22 38v16M6 54h20" {...line}/>
      <path d="M26 38l4 8" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "barbell" && <>
      <path d="M20 4v56" {...line} strokeWidth={2.6}/>
      <rect x="11" y="9" width="18" height="6" rx="2" {...soft}/>
      <rect x="11" y="9" width="18" height="6" rx="2" {...line}/>
      <rect x="11" y="49" width="18" height="6" rx="2" {...soft}/>
      <rect x="11" y="49" width="18" height="6" rx="2" {...line}/>
      <path d="M18 24v16M22 24v16" {...line} strokeOpacity=".4" strokeWidth={1.4}/>
    </>}
    {kind === "plates" && <>
      <circle cx="20" cy="26" r="15" {...soft}/>
      <circle cx="20" cy="26" r="15" {...line}/>
      <circle cx="20" cy="26" r="9" {...line} strokeOpacity=".55"/>
      <circle cx="20" cy="26" r="3" {...line}/>
      <path d="M6 48h28M8 54h24" {...line}/>
    </>}
    {kind === "machine" && <>
      <path d="M6 6v52M34 6v52M6 6h28M3 58h34" {...line}/>
      <rect x="14" y="30" width="12" height="18" rx="1.5" {...soft}/>
      <rect x="14" y="30" width="12" height="18" rx="1.5" {...line}/>
      <path d="M14 36h12M14 42h12" {...line} strokeOpacity=".55"/>
      <path d="M20 6v24" {...line} strokeOpacity=".55"/>
      <circle cx="10" cy="10" r="2" {...line}/>
      <circle cx="30" cy="10" r="2" {...line}/>
    </>}
    {kind === "cardio" && <>
      <circle cx="10" cy="36" r="7" {...soft}/>
      <circle cx="10" cy="36" r="7" {...line}/>
      <path d="M10 43v12M10 55h26M36 55v-4" {...line}/>
      <path d="M17 33l15-4" {...line} strokeOpacity=".55"/>
      <rect x="20" y="48" width="9" height="4" rx="1" {...line}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="1.2" y="5" width="4.2" height="10" rx="1.2" fill="#1f2937"/>
    <rect x="14.6" y="5" width="4.2" height="10" rx="1.2" fill="#1f2937"/>
    <rect x="5" y="8.6" width="10" height="2.8" rx="1" fill="#f5b300"/>
  </svg>;
}
