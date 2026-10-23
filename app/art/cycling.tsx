// CyclingRecs visuals: one simple line drawing per category (drop-bar road bike, gravel bike with fat tyres and flared bar,
// mountain bike with a suspension fork and flat bar), all in the same 40×64 box as the other niches' product drawings, and the wheel logo.

export type Shape = "road" | "gravel" | "mountain" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("gravel") || s.includes("cyclocross")) return "gravel";
  if (s.includes("mountain") || s.includes("mtb")) return "mountain";
  if (s.includes("road")) return "road";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

// Shared frame: rear wheel centre (10,40), front (30,40), bottom bracket (18,41), seat cluster (15,29), head tube top (27,28).
function Frame({ tyre, fork }: { tyre: number; fork?: boolean }) {
  return <>
    <circle cx="10" cy="40" r="7.5" {...soft}/>
    <circle cx="30" cy="40" r="7.5" {...soft}/>
    <circle cx="10" cy="40" r="7.5" {...line} strokeWidth={tyre}/>
    <circle cx="30" cy="40" r="7.5" {...line} strokeWidth={tyre}/>
    <path d="M10 40L18 41L15 29L10 40M15 29H27M18 41L27 28.5" {...line}/>
    {fork ? <path d="M27 28.5L28.4 33.5M28.4 33.5L30 40" {...line} strokeWidth={2.6}/> : <path d="M27 28.5L30 40" {...line}/>}
    <path d="M15 29L14.4 26.5M12.4 26.2H17" {...line}/>
  </>;
}

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "road" && <>
      <Frame tyre={1.6}/>
      <path d="M27 28.5L27.6 26.5H31c1.6 0 2 2.2 0.6 3.2" {...line}/>
    </>}
    {kind === "gravel" && <>
      <Frame tyre={2.8}/>
      <path d="M27 28.5L27.6 26.5H31.4c1.8 0 2.4 2.6 1 3.8" {...line}/>
    </>}
    {kind === "mountain" && <>
      <Frame tyre={3.2} fork/>
      <path d="M27 28.5L27.4 26M24.6 25.6H30.4" {...line}/>
      <path d="M15.6 33.5L20 31.6" {...line} strokeWidth={2.6} strokeOpacity=".7"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="7.8" fill="none" stroke="#12355b" strokeWidth="2"/>
    <circle cx="10" cy="10" r="5.8" fill="none" stroke="#f5c400" strokeWidth="1.1"/>
    <path d="M5.2 10H14.8M10 5.2V14.8M6.6 6.6L13.4 13.4M6.6 13.4L13.4 6.6" stroke="#12355b" strokeWidth=".65"/>
    <circle cx="10" cy="10" r="1.25" fill="#12355b"/>
  </svg>;
}
