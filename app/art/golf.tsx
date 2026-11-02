// GolfRecs visuals: a driver head seen from above (face at the bottom, shaft rising from the heel), varied by category
// (a bigger head with back weight for max forgiveness, a compact head with forward weight for low spin, heel weight for
// draw, a small head for mini drivers), and the ball-on-tee logo.

export type Shape = "lowspin" | "max" | "draw" | "light" | "mini" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain head.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (!s) return "unknown";
  if (s.includes("mini")) return "mini";
  if (s.includes("low")) return "lowspin";
  if (s.includes("max") || s.includes("forgiv")) return "max";
  if (s.includes("draw")) return "draw";
  if (s.includes("light")) return "light";
  return "unknown";
}

// Head outline seen from above in a 40×64 box: flat face along the bottom, rounded back, shaft rising from the heel.
const HEAD = "M6 46C4 36 6 23 14 17.5C20 13.5 29.5 14 33.5 21.5C36.8 28 36.5 39 33 46Z";
// Each category scales the same head about the middle of the face: deeper and wider for max forgiveness, compact for low spin, small for minis.
const SCALE: Record<Shape, [number, number]> = { max: [1.12, 1.18], lowspin: [0.94, 0.9], mini: [0.74, 0.72], draw: [1, 1], light: [1, 1], unknown: [1, 1] };

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  const [sx, sy] = SCALE[kind];
  const clip = `gd-${kind}`;
  const t = `translate(20 46) scale(${sx} ${sy}) translate(-20 -46)`;
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <defs><clipPath id={clip}><path d={HEAD} transform={t}/></clipPath></defs>
    <path d={`M${20 + 13 * sx} ${46 - 1}L37 3`} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <path d={HEAD} transform={t} fill="currentColor" fillOpacity=".12"/>
    {/* Face edge and a sightline on the crown. */}
    <path d="M4 43h32" clipPath={`url(#${clip})`} stroke="currentColor" strokeOpacity=".35" strokeWidth="1.4"/>
    <path d="M20 26v9" clipPath={`url(#${clip})`} stroke="currentColor" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round"/>
    {kind === "max" && <circle cx="20" cy="20" r="3.4" clipPath={`url(#${clip})`} fill="currentColor" fillOpacity=".45"/>}
    {kind === "draw" && <circle cx="29" cy="38" r="3.2" clipPath={`url(#${clip})`} fill="currentColor" fillOpacity=".45"/>}
    {kind === "lowspin" && <circle cx="20" cy="39.5" r="2.8" clipPath={`url(#${clip})`} fill="currentColor" fillOpacity=".45"/>}
    {kind === "light" && <path d="M11 30c6-2 12-2 18 0" clipPath={`url(#${clip})`} stroke="currentColor" strokeOpacity=".35" strokeWidth="1.4" fill="none"/>}
    <path d={HEAD} transform={t} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <g transform="translate(1.5 3)">
      <path d="M12.6 0.8L9.2 8.2" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9.6 7.4c-2.6-0.6-6.6 0.2-7.6 2.6c-0.4 1.4 0.8 2.6 3 2.6c3 0 5.6-1.6 5.6-3.6c0-0.8-0.4-1.4-1-1.6z" fill="#166534"/>
      <path d="M3.4 10.6c1.6 0.4 4 0 5.6-1" stroke="#d9a441" strokeWidth=".9" fill="none" strokeLinecap="round"/>
    </g>
  </svg>;
}
