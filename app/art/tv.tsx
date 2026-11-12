// TVRecs visuals: one simple line drawing per category (OLED, Mini-LED & QLED, budget), all in the same 40×64 box as the
// other niches' product drawings, and the flat-screen logo.

export type Shape = "oled" | "miniled" | "budget" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("oled")) return "oled";
  if (s.includes("mini") || s.includes("qled")) return "miniled";
  if (s.includes("budget") || s.includes("mid-range") || s.includes("led")) return "budget";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

/** A flat screen seen from the front, y=20 to 42. */
const Screen = ({ bezel = 1.5 }: { bezel?: number }) => <>
  <rect x="2" y="20" width="36" height="22" rx={bezel} {...soft}/>
  <rect x="2" y="20" width="36" height="22" rx={bezel} {...line}/>
</>;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "oled" && <>
      <Screen bezel={1}/>
      {/* Pedestal stand */}
      <path d="M17 42v4M11 47h18" {...line}/>
      <path d="M7 37c6-6 12-9 26-12" {...line} strokeOpacity=".45"/>
    </>}
    {kind === "miniled" && <>
      <Screen/>
      {/* Dimming zones */}
      {[26, 31, 36].map(y => [9, 16, 23, 30].map(x => <circle key={`${x}-${y}`} cx={x + 0.5} cy={y} r="1.1" fill="currentColor" fillOpacity=".55"/>))}
      <path d="M20 42v4M12 47h16" {...line}/>
    </>}
    {kind === "budget" && <>
      <Screen bezel={2}/>
      {/* Feet at the ends */}
      <path d="M7 42l-2 5M33 42l2 5" {...line}/>
      <path d="M8 26h8" {...line} strokeOpacity=".45"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="1.5" y="3" width="17" height="11" rx="1.2" fill="#111318"/>
    <rect x="3" y="4.5" width="14" height="8" rx=".4" fill="#f59e0b"/>
    <path d="M9 14h2v2.2h3.5v1.3h-9v-1.3H9z" fill="#111318"/>
  </svg>;
}
