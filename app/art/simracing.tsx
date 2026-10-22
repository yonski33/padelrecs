// SimRacingRecs visuals: one simple line drawing per category (wheelbase from the side, steering wheel, pedal set,
// cockpit, shifter), all in the same 40×64 box as the other niches' product drawings, and the steering-wheel logo.

export type Shape = "wheelbase" | "wheel" | "pedals" | "cockpit" | "shifter" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("wheelbase") || s.includes("wheel base")) return "wheelbase";
  if (s.includes("wheel") || s.includes("rim")) return "wheel";
  if (s.includes("pedal")) return "pedals";
  if (s.includes("cockpit") || s.includes("rig") || s.includes("stand")) return "cockpit";
  if (s.includes("shifter") || s.includes("handbrake")) return "shifter";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "wheelbase" && <>
      <rect x="10" y="22" width="24" height="20" rx="3" {...soft}/>
      <rect x="10" y="22" width="24" height="20" rx="3" {...line}/>
      <path d="M10 32H4M4 26v12" {...line}/>
      <path d="M16 46h12M14 42v4M30 42v4" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "wheel" && <>
      <circle cx="20" cy="32" r="14" {...soft}/>
      <circle cx="20" cy="32" r="14" {...line}/>
      <path d="M6.4 31h27.2M20 32v13.8" {...line}/>
      <circle cx="20" cy="31.5" r="4" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "pedals" && <>
      <path d="M4 50h32" {...line} strokeOpacity=".55"/>
      <rect x="6" y="22" width="7" height="14" rx="2" {...soft}/>
      <rect x="16.5" y="18" width="7" height="18" rx="2" {...soft}/>
      <rect x="27" y="22" width="7" height="14" rx="2" {...soft}/>
      <rect x="6" y="22" width="7" height="14" rx="2" {...line}/>
      <rect x="16.5" y="18" width="7" height="18" rx="2" {...line}/>
      <rect x="27" y="22" width="7" height="14" rx="2" {...line}/>
      <path d="M9.5 36v14M20 36v14M30.5 36v14" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "cockpit" && <>
      <path d="M8 26c0-4 2-6 5-6s4 3 4 7v15h-9z" {...soft}/>
      <path d="M8 42V26c0-4 2-6 5-6s4 3 4 7v15" {...line}/>
      <path d="M4 48h33M8 42h22l3-10M29 32h6" {...line}/>
      <path d="M6 48v-6M33 48v-16" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "shifter" && <>
      <circle cx="20" cy="16" r="5" {...soft}/>
      <circle cx="20" cy="16" r="5" {...line}/>
      <path d="M20 21v19" {...line}/>
      <rect x="10" y="40" width="20" height="9" rx="2" {...soft}/>
      <rect x="10" y="40" width="20" height="9" rx="2" {...line}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="7.4" fill="none" stroke="#e10600" strokeWidth="2.4"/>
    <path d="M2.6 10H17.4M10 10V17.4" stroke="#1e293b" strokeWidth="1.8"/>
    <circle cx="10" cy="10" r="2.4" fill="#1e293b"/>
  </svg>;
}
