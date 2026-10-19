// PickleballRecs visuals: paddle silhouettes by shape and the holed-ball logo.
// Brand marks are added per brand from reference logos, like MARKS in app/art/padel.tsx.

export type Shape = "standard" | "elongated" | "hybrid" | "widebody" | "unknown";

// Catalog shapes are free text ("Elongated", "Hybrid / thermoformed"…). Anything unrecognised is drawn as standard.
export function shapeOf(shape?: string | null): Shape {
  const s = (shape || "").toLowerCase();
  if (s.includes("elong")) return "elongated";
  if (s.includes("hybrid")) return "hybrid";
  if (s.includes("wide")) return "widebody";
  if (s.includes("standard") || s.includes("classic") || s.includes("square")) return "standard";
  return "unknown";
}

// Face outline (rounded rectangle) and where the handle starts, in a 40×64 box like the padel racket.
const faces: Record<Exclude<Shape, "unknown">, { x: number; w: number; h: number; r: number }> = {
  standard: { x: 4.5, w: 31, h: 39, r: 9 },
  widebody: { x: 3, w: 34, h: 37, r: 10 },
  hybrid: { x: 6, w: 28, h: 42, r: 8 },
  elongated: { x: 8, w: 24, h: 45, r: 7 },
};
const facePath = ({ x, w, h, r }: { x: number; w: number; h: number; r: number }) => {
  const top = 2, bottom = top + h, r2 = Math.min(r, 6);
  return `M${x + r} ${top}H${x + w - r}Q${x + w} ${top} ${x + w} ${top + r}V${bottom - r2}Q${x + w} ${bottom} ${x + w - r2} ${bottom}H${x + r2}Q${x} ${bottom} ${x} ${bottom - r2}V${top + r}Q${x} ${top} ${x + r} ${top}Z`;
};

type Mark = { d: string; stroke?: number };
/** Simplified, single-colour brand marks drawn on the paddle face. Brands without an entry show the plain face. */
const MARKS: Record<string, Mark> = {};
const markKey = (brand?: string | null) => (brand || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function ProductIcon({ shape, brand, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  const face = faces[kind === "unknown" ? "standard" : kind];
  const d = facePath(face), bottom = 2 + face.h;
  const key = markKey(brand), mark = MARKS[key];
  const clip = `pi-${kind}-${key || "x"}`;
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <defs><clipPath id={clip}><path d={d}/></clipPath></defs>
    <path d={d} fill="currentColor" fillOpacity=".12"/>
    <g clipPath={`url(#${clip})`}>
      {mark ? (mark.stroke
        ? <path d={mark.d} fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth={mark.stroke} strokeLinecap="round"/>
        : <path d={mark.d} fill="currentColor" fillOpacity=".45"/>)
        // Plain face: a faint surface texture.
        : <path d={`M${face.x} ${bottom - 8}L${face.x + face.w} ${bottom - 22}M${face.x} ${bottom - 16}L${face.x + face.w} ${bottom - 30}`} stroke="currentColor" strokeOpacity=".22" strokeWidth="1.4"/>}
    </g>
    {/* Edge guard */}
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2.4"/>
    {/* Throat and handle with grip wrap */}
    <path d={`M16.5 ${bottom}L17.5 ${bottom + 3}H22.5L23.5 ${bottom}`} fill="currentColor"/>
    <rect x="17" y={bottom + 3} width="6" height={60 - bottom} rx="1.6" fill="currentColor"/>
    <path d={`M17 ${bottom + 8}L23 ${bottom + 6}M17 ${bottom + 12}L23 ${bottom + 10}`} stroke="var(--bg, #fff)" strokeOpacity=".5" strokeWidth="0.9"/>
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8.6" fill="#e9e23f" stroke="#12305a" strokeWidth="1.6"/>
    {[[7.2, 5.4], [12.8, 5.4], [5, 10], [10, 9.6], [15, 10], [7.6, 14.4], [12.4, 14.4]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.15" fill="#12305a"/>)}
  </svg>;
}
