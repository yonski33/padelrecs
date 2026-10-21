// RunningRecs visuals: a running-shoe sole seen from below, varied by category (lugs for trail, a plate for racing,
// a wider platform for max cushion, a medial post for stability), and the amber shoe logo.

export type Shape = "daily" | "max" | "stability" | "tempo" | "racing" | "trail" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a daily trainer.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (!s) return "unknown";
  if (s.includes("trail")) return "trail";
  if (s.includes("rac")) return "racing";
  if (s.includes("tempo")) return "tempo";
  if (s.includes("stab")) return "stability";
  if (s.includes("max")) return "max";
  if (s.includes("daily")) return "daily";
  return "unknown";
}

// Sole outline in a 40×64 box, toes at the top. `w` widens the platform.
const sole = (w: number) => `M20 3c${6 + w} 0 ${10 + w} 6 ${10 + w} 15c0 7-${2 + w / 2} 11-${3 + w / 2} 17c-1 5 0 9 0 13c0 7-3 12-${7 + w / 2} 12s-${7 + w / 2}-5-${7 + w / 2}-12c0-4 1-8 0-13c-1-6-${3 + w / 2}-10-${3 + w / 2}-17c0-9 ${4 + w}-15 ${10 + w}-15z`;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  const w = kind === "max" ? 1.6 : kind === "racing" || kind === "tempo" ? -1 : 0;
  const clip = `rs-${kind}`;
  const lugs: string[] = [];
  if (kind === "trail") for (let y = 9; y < 60; y += 6) for (let x = 12; x <= 28; x += 5.3) lugs.push(`M${(x + (y % 12 ? 2.6 : 0)).toFixed(1)} ${y}h2.6v2.6h-2.6z`);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <defs><clipPath id={clip}><path d={sole(w)}/></clipPath></defs>
    <path d={sole(w)} fill="currentColor" fillOpacity=".12"/>
    {kind === "trail" && <path d={lugs.join("")} clipPath={`url(#${clip})`} fill="currentColor" fillOpacity=".45"/>}
    {(kind === "racing" || kind === "tempo") && <path d="M20 8v48" clipPath={`url(#${clip})`} stroke="currentColor" strokeOpacity=".45" strokeWidth={kind === "racing" ? 6 : 3} strokeLinecap="round"/>}
    {kind === "stability" && <path d="M8 34h10v26H8z" clipPath={`url(#${clip})`} fill="currentColor" fillOpacity=".35"/>}
    {(kind === "daily" || kind === "max" || kind === "unknown") && <path d="M12 24c5 2 11 2 16 0M13 44c4 1.5 10 1.5 14 0" clipPath={`url(#${clip})`} stroke="currentColor" strokeOpacity=".35" strokeWidth="1.4" fill="none"/>}
    <path d={sole(w)} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <g transform="translate(1.5 3)">
      <path d="M1.6 10.4V6.3c0-1.4 1.1-2.3 2.4-1.9l2 1.3c1.3.8 2.7 1.3 4.2 1.6l3.1.7c1.5.4 2.4 1.3 2.5 2.4z" fill="#ffb703" stroke="#0b3d39" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M1.2 10.4h14.6v1.2c0 .6-.4 1-1 1H2.2c-.6 0-1-.4-1-1z" fill="#0b3d39"/>
    </g>
  </svg>;
}
