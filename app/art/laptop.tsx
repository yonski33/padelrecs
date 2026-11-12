// LaptopRecs visuals: one simple line drawing per category (ultrabook, gaming, business, creator, 2-in-1, Chromebook,
// MacBook), all in the same 40×64 box as the other niches' product drawings, and the open-laptop logo.

export type Shape = "ultrabook" | "gaming" | "business" | "creator" | "twoinone" | "chromebook" | "macbook" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("2-in-1") || s.includes("convertible") || s.includes("detachable")) return "twoinone";
  if (s.includes("chromebook")) return "chromebook";
  if (s.includes("macbook")) return "macbook";
  if (s.includes("gaming")) return "gaming";
  if (s.includes("business")) return "business";
  if (s.includes("creator") || s.includes("workstation")) return "creator";
  if (s.includes("ultrabook") || s.includes("everyday")) return "ultrabook";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

/** An open laptop seen from the front: lid from y=top to 40, base below. */
const Lid = ({ top = 20 }: { top?: number }) => <>
  <rect x="7" y={top} width="26" height={40 - top} rx="2" {...soft}/>
  <rect x="7" y={top} width="26" height={40 - top} rx="2" {...line}/>
</>;
const Base = ({ thick = false }: { thick?: boolean }) => <path d={thick ? "M3 41h34l-2 5H5z" : "M3 41h34l-1.5 3h-31z"} {...line}/>;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "ultrabook" && <>
      <Lid/><Base/>
    </>}
    {kind === "gaming" && <>
      <Lid/><Base thick/>
      <path d="M15 30l5-4 5 4-5 4z" {...line} strokeOpacity=".6"/>
      <path d="M9 48l-2 3M31 48l2 3" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "business" && <>
      <Lid/><Base/>
      <circle cx="20" cy="43" r=".9" fill="currentColor"/>
      <path d="M10 24h8" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "creator" && <>
      <Lid/><Base/>
      <path d="M12 35c3-6 6-8 9-4s5 2 7-3" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "twoinone" && <>
      <rect x="8" y="16" width="24" height="30" rx="3" {...soft}/>
      <rect x="8" y="16" width="24" height="30" rx="3" {...line}/>
      <path d="M29 50l-9-9" {...line} strokeOpacity=".7"/>
      <path d="M8 50h24" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "chromebook" && <>
      <Lid/><Base/>
      <circle cx="20" cy="30" r="5" {...line} strokeOpacity=".6"/>
      <circle cx="20" cy="30" r="1.8" fill="currentColor" fillOpacity=".6"/>
    </>}
    {kind === "macbook" && <>
      <Lid top={22}/>
      <path d="M2 41h36c0 2-1 3-3 3H5c-2 0-3-1-3-3z" {...line}/>
      <path d="M17 41.5h6" {...line} strokeOpacity=".5"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="3.5" y="3.5" width="13" height="9" rx="1.2" fill="#1e293b"/>
    <rect x="5" y="5" width="10" height="6" rx=".4" fill="#3b82f6"/>
    <path d="M1 14.2h18l-1.2 1.8H2.2z" fill="#1e293b"/>
  </svg>;
}
