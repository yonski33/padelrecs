// KeyboardRecs visuals: one simple line drawing per category (rapid trigger, mechanical, low-profile, kit, ergonomic,
// switch, keycap), all in the same 40×64 box as the other niches' product drawings, and the keycap logo.

export type Shape = "rapid" | "mechanical" | "lowprofile" | "kit" | "ergonomic" | "switch" | "keycap" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("rapid") || s.includes("hall effect") || s.includes("magnetic")) return "rapid";
  if (s.includes("low-profile") || s.includes("low profile")) return "lowprofile";
  if (s.includes("kit")) return "kit";
  if (s.includes("ergonomic") || s.includes("split")) return "ergonomic";
  if (s.includes("switch")) return "switch";
  if (s.includes("keycap")) return "keycap";
  if (s.includes("keyboard")) return "mechanical";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
const keys = "M9 28h.01M14 28h.01M19 28h.01M24 28h.01M29 28h.01M31 28h.01M9 33h.01M14 33h.01M19 33h.01M24 33h.01M29 33h.01";

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "mechanical" && <>
      <rect x="4" y="22" width="32" height="20" rx="3" {...soft}/>
      <rect x="4" y="22" width="32" height="20" rx="3" {...line}/>
      <path d={keys} {...line} strokeWidth={2.6} strokeOpacity=".6"/>
      <path d="M13 37.5h14" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "rapid" && <>
      <rect x="4" y="26" width="32" height="18" rx="3" {...soft}/>
      <rect x="4" y="26" width="32" height="18" rx="3" {...line}/>
      <path d="M9 31.5h.01M14 31.5h.01M19 31.5h.01M24 31.5h.01M29 31.5h.01M13 38.5h14" {...line} strokeWidth={2.6} strokeOpacity=".6"/>
      <path d="M22 11l-6 8h7l-5 7" {...line}/>
    </>}
    {kind === "lowprofile" && <>
      <path d="M3 38l3-8h28l3 8z" {...soft}/>
      <path d="M3 38l3-8h28l3 8zM3 38v2.5h34V38" {...line}/>
      <path d="M10 34h.01M15 34h.01M20 34h.01M25 34h.01M30 34h.01" {...line} strokeWidth={2.6} strokeOpacity=".6"/>
    </>}
    {kind === "kit" && <>
      <rect x="4" y="24" width="32" height="18" rx="3" {...line}/>
      <rect x="8" y="28" width="24" height="10" rx="1.5" {...line} strokeDasharray="2.5 3" strokeOpacity=".6"/>
      <path d="M27 12l4 4-9 9-4 1 1-4z" {...soft}/>
      <path d="M27 12l4 4-9 9-4 1 1-4z" {...line}/>
    </>}
    {kind === "ergonomic" && <>
      <path d="M3 27l14-3v18l-14 3z" {...soft}/>
      <path d="M37 27l-14-3v18l14 3z" {...soft}/>
      <path d="M3 27l14-3v18l-14 3zM37 27l-14-3v18l14 3z" {...line}/>
      <path d="M7 31.5h.01M12 30.5h.01M7 37h.01M12 36h.01M28 30.5h.01M33 31.5h.01M28 36h.01M33 37h.01" {...line} strokeWidth={2.6} strokeOpacity=".6"/>
    </>}
    {kind === "switch" && <>
      <path d="M8 34h24v10a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" {...soft}/>
      <path d="M8 34h24v10a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3zM10 34l3-8h14l3 8" {...line}/>
      <path d="M20 26v-8M16.5 22h7" {...line}/>
      <path d="M17 52v4M23 52v4" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "keycap" && <>
      <path d="M7 44l4-20h18l4 20z" {...soft}/>
      <path d="M7 44l4-20h18l4 20zM13 27h14l-1.5 10h-11z" {...line}/>
      <path d="M17.5 31.5h5" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3.5 3h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2z" fill="#2b2d33"/>
    <path d="M5.4 4.8h9.2a1.4 1.4 0 0 1 1.4 1.4v5a1.4 1.4 0 0 1-1.4 1.4h-9.2a1.4 1.4 0 0 1-1.4-1.4v-5a1.4 1.4 0 0 1 1.4-1.4z" fill="#e5533d"/>
  </svg>;
}
