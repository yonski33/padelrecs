// EbikeRecs visuals: one simple side-view line drawing per category (commuter, cargo, folding, e-MTB, road/gravel,
// fat-tire, scooter), all in the same 40×64 box as the other niches' product drawings, and the battery logo.

export type Shape = "commuter" | "cargo" | "folding" | "emtb" | "road" | "fat" | "scooter" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("scooter")) return "scooter";
  if (s.includes("cargo")) return "cargo";
  if (s.includes("fold")) return "folding";
  if (s.includes("mountain") || s.includes("mtb")) return "emtb";
  if (s.includes("road") || s.includes("gravel")) return "road";
  if (s.includes("fat") || s.includes("moped")) return "fat";
  if (s.includes("commuter") || s.includes("city")) return "commuter";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
const faint = { ...line, strokeOpacity: 0.45 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "commuter" && <>
      {/* Step-through commuter: low swooping frame, battery on the down tube, rear rack */}
      <circle cx="9" cy="46" r="7.5" {...line}/>
      <circle cx="31" cy="46" r="7.5" {...line}/>
      <path d="M9 46h10l-3-15M19 46c2-6 5-11 8-15M9 46l7-14M31 46l-4-15l-2-5h4" {...line}/>
      <rect x="20" y="35" width="3.2" height="8" rx="1.2" transform="rotate(35 21.6 39)" {...soft}/>
      <path d="M13 30h6M4 37h11" {...faint}/>
    </>}
    {kind === "cargo" && <>
      {/* Longtail cargo bike: long rear deck with a kid seat, small rear wheel */}
      <circle cx="7" cy="48" r="5.5" {...line}/>
      <circle cx="32" cy="46" r="7" {...line}/>
      <path d="M2 38h17M7 48l3-10M19 46l-2-12M17 46h-10M19 46c3-5 6-10 9-14M32 46l-4-14l-2-4h4" {...line}/>
      <rect x="4" y="30" width="9" height="8" rx="2" {...soft}/>
      <path d="M4 30v8M13 30v8" {...faint}/>
    </>}
    {kind === "folding" && <>
      {/* Folding e-bike: small wheels, tall stem and seatpost, hinge in the main tube */}
      <circle cx="9" cy="50" r="5.5" {...line}/>
      <circle cx="31" cy="50" r="5.5" {...line}/>
      <path d="M9 50l9-10h10M18 40l-3 10h-6M28 40l3 10M28 40l-1-20h4M15 50l-1-24M11 26h6" {...line}/>
      <circle cx="22" cy="40" r="1.6" {...soft}/>
      <circle cx="22" cy="40" r="1.6" {...faint}/>
    </>}
    {kind === "emtb" && <>
      {/* Full-suspension e-MTB: knobby wheels, shock in the frame, wide bar */}
      <circle cx="9" cy="46" r="7.5" {...line}/>
      <circle cx="31" cy="46" r="7.5" {...line}/>
      <circle cx="9" cy="46" r="9" strokeDasharray="1.5 2" {...faint}/>
      <circle cx="31" cy="46" r="9" strokeDasharray="1.5 2" {...faint}/>
      <path d="M9 46l9-1l-2-14M18 45l9-15M9 46l6-9l3-1M31 46l-4-16l-1-4h5M13 31h6" {...line}/>
      <rect x="18" y="35" width="5" height="3" rx="1" {...soft}/>
    </>}
    {kind === "road" && <>
      {/* Drop-bar road/gravel e-bike: thin wheels, level top tube, curled drops */}
      <circle cx="9" cy="46" r="8" {...line}/>
      <circle cx="31" cy="46" r="8" {...line}/>
      <path d="M9 46h9l-2-15h11M18 46l9-15M9 46l7-15M31 46l-4-15M27 31h3c2 0 2 4 0 5" {...line}/>
      <path d="M13 30h5" {...faint}/>
    </>}
    {kind === "fat" && <>
      {/* Fat-tire e-bike: doubled thick tires, sturdy frame, long seat */}
      <circle cx="9" cy="46" r="7.5" strokeWidth={4.5} fill="none" stroke="currentColor" strokeOpacity={0.35}/>
      <circle cx="31" cy="46" r="7.5" strokeWidth={4.5} fill="none" stroke="currentColor" strokeOpacity={0.35}/>
      <circle cx="9" cy="46" r="7.5" {...line}/>
      <circle cx="31" cy="46" r="7.5" {...line}/>
      <path d="M9 46h10l-3-14M19 46l8-15M9 46l7-13M31 46l-4-15l-2-4h5" {...line}/>
      <rect x="11" y="29" width="10" height="3" rx="1.5" {...soft}/>
    </>}
    {kind === "scooter" && <>
      {/* Kick e-scooter: low deck, small wheels, tall stem and T-bar */}
      <circle cx="8" cy="52" r="4.5" {...line}/>
      <circle cx="32" cy="52" r="4.5" {...line}/>
      <path d="M8 52l3-4h17l4 4M28 48l-1-34M23 14h9" {...line}/>
      <rect x="11" y="45" width="17" height="3" rx="1.5" {...soft}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="1.5" y="5" width="14.5" height="10" rx="2" fill="#2fbf71" stroke="#0d2b3e" strokeWidth="1"/>
    <rect x="16" y="8" width="2.5" height="4" rx="0.8" fill="#0d2b3e"/>
    <path d="M9.6 6.4 6.2 10.4h2.4l-.8 3.2 3.6-4.2H9l.6-3z" fill="#0d2b3e"/>
  </svg>;
}
