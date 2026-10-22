// DiscGolfRecs visuals: a disc seen from above with its rim width marked, over a side profile that gets deeper and bluntier
// from distance drivers to putters, and the flying-disc logo.

export type Shape = "distance" | "fairway" | "midrange" | "putter" | "unknown";

// The catalog's "Type" field picks the drawing; anything unrecognised is drawn as a mid-sized disc.
export function shapeOf(type?: string | null): Shape {
  const s = (type || "").toLowerCase();
  if (s.includes("distance")) return "distance";
  if (s.includes("fairway") || s.includes("control")) return "fairway";
  if (s.includes("mid")) return "midrange";
  if (s.includes("putt") || s.includes("approach")) return "putter";
  return "unknown";
}

// Rim width seen from above and profile height, in the 40×64 box shared by every niche's product drawing.
const RIM: Record<Shape, number> = { distance: 6, fairway: 4.6, midrange: 3.4, putter: 2.4, unknown: 4 };
const DEPTH: Record<Shape, number> = { distance: 3, fairway: 4.8, midrange: 6.8, putter: 9, unknown: 5.5 };

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  const rim = RIM[kind], h = DEPTH[kind], base = 52;
  // Side profile: domed flight plate on top, the rim tapering to a sharp edge on drivers and a blunt one on putters.
  const nose = kind === "putter" ? 1.2 : kind === "midrange" ? 0.8 : 0.3;
  const profile = `M4 ${base - nose}C8 ${base - h} 32 ${base - h} 36 ${base - nose}L36 ${base}L${36 - rim} ${base + 1.8}H${4 + rim}L4 ${base}Z`;
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <circle cx="20" cy="24" r="16" fill="currentColor" fillOpacity=".12"/>
    <circle cx="20" cy="24" r={16 - rim} fill="none" stroke="currentColor" strokeOpacity=".4" strokeWidth="1.4"/>
    <circle cx="20" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="2.2"/>
    <path d={profile} fill="currentColor" fillOpacity=".12"/>
    <path d={profile} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M1.6 7.4h3.2M1 10.4h3.4M1.8 13.4h2.6" stroke="#f26b1d" strokeOpacity=".75" strokeWidth="1.3" strokeLinecap="round"/>
    <g transform="rotate(-16 12 10)">
      <ellipse cx="12" cy="10" rx="7.2" ry="4.4" fill="#f26b1d" stroke="#0f2a1f" strokeWidth="1.2"/>
      <ellipse cx="12" cy="9.6" rx="4.4" ry="2.5" fill="#f89a5e"/>
    </g>
  </svg>;
}
