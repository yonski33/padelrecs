// FragranceRecs visuals: a perfume bottle per "For" type (a square-shouldered flacon for men, a rounded one for women,
// a tall cylinder for unisex), all in the same 40×64 box as the other niches' product drawings, and the bottle logo.

export type Shape = "men" | "women" | "unisex" | "unknown";

// The catalog's "For" field picks the drawing; a blank one is drawn as the unisex cylinder.
export function shapeOf(who?: string | null): Shape {
  const s = (who || "").trim().toLowerCase();
  if (s === "men") return "men";
  if (s === "women") return "women";
  if (s === "unisex") return "unisex";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

/** Brand marks are not drawn on bottles; brand is accepted for the shared icon interface. */
export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  const body = kind === "men" ? "M7 28h26v28a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3z"
    : kind === "women" ? "M20 26c9 0 14 8 14 17s-5 16-14 16S6 52 6 43s5-17 14-17z"
    : "M10 26h20v31a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2z";
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <rect x="15" y="9" width="10" height="11" rx="1.5" fill="currentColor"/>
    <path d="M17 20h6v6h-6z" {...line}/>
    <path d={body} {...soft}/>
    <path d={body} {...line}/>
    <path d={kind === "women" ? "M12 46c2 5 6 8 10 8" : "M13 50h14"} {...line} strokeOpacity=".45"/>
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M7.8 1.6h4.4V7H7.8z" fill="#4c1d95"/>
    <path d="M6.4 7h7.2l2.2 2.6v7.6a1.6 1.6 0 0 1-1.6 1.6H5.8a1.6 1.6 0 0 1-1.6-1.6V9.6z" fill="#e9c46a" stroke="#4c1d95" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>;
}
