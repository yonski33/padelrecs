/** A racket head outline per shape, for the guide's shape cards and the home's Shape row. */
export function ShapeIcon({ shape }: { shape: string }) {
  const p = { fill: "oklch(0.95 0.06 130)", stroke: "currentColor", strokeWidth: 2.5 };
  return <svg className="gd-icon" viewBox="0 0 48 56" width="48" height="56" aria-hidden="true">
    {shape === "round" && <circle cx="24" cy="28" r="20" {...p}/>}
    {shape === "teardrop" && <path d="M24 6c11 0 18 9 17 21-1 13-8 23-17 23S8 40 7 27C6 15 13 6 24 6z" {...p}/>}
    {shape === "hybrid" && <ellipse cx="24" cy="28" rx="19" ry="22" {...p}/>}
    {shape === "diamond" && <path d="M24 4l20 24-20 24L4 28z" {...p} strokeLinejoin="round"/>}
  </svg>;
}
