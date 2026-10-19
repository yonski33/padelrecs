// TennisRecs visuals: a strung tennis racket sized by head size (midsize / midplus / oversize) and the tennis-ball logo.

export type Shape = "midsize" | "midplus" | "oversize" | "unknown";

// The catalog's "Head size" field ("98 sq in (632 cm²)") picks the frame: under 95 sq in midsize, 105 and up oversize.
export function shapeOf(headSize?: string | null): Shape {
  const m = (headSize || "").match(/(\d+(?:\.\d+)?)\s*(sq|in|")/i) ?? (headSize || "").match(/^\s*(\d+(?:\.\d+)?)/);
  if (!m) return "unknown";
  const size = Number(m[1]);
  if (size > 200) return "unknown"; // a cm² value without sq in
  return size < 95 ? "midsize" : size >= 105 ? "oversize" : "midplus";
}

const heads: Record<Exclude<Shape, "unknown">, { rx: number; ry: number }> = {
  midsize: { rx: 12, ry: 15.5 },
  midplus: { rx: 13.5, ry: 17 },
  oversize: { rx: 15.2, ry: 18.6 },
};

/** Brand marks are not drawn on tennis rackets yet; the brand argument is accepted for the shared icon interface. */
export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  const { rx, ry } = heads[kind === "unknown" ? "midplus" : kind];
  const cx = 20, cy = 2 + ry, bottom = cy + ry;
  const clip = `tr-${kind}`;
  const strings: string[] = [];
  for (let x = cx - rx + 2.6; x < cx + rx; x += 2.6) strings.push(`M${x.toFixed(1)} ${cy - ry}V${cy + ry}`);
  for (let y = cy - ry + 2.6; y < cy + ry; y += 2.6) strings.push(`M${cx - rx} ${y.toFixed(1)}H${cx + rx}`);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <defs><clipPath id={clip}><ellipse cx={cx} cy={cy} rx={rx} ry={ry}/></clipPath></defs>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="currentColor" fillOpacity=".12"/>
    <path d={strings.join("")} clipPath={`url(#${clip})`} stroke="currentColor" strokeOpacity=".35" strokeWidth=".7"/>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="currentColor" strokeWidth="2.2"/>
    {/* Open throat: two beams from the frame to the handle */}
    <path d={`M${cx - 5.5} ${bottom - 1.2}L18 46M${cx + 5.5} ${bottom - 1.2}L22 46`} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="17.5" y="45" width="5" height="17" rx="1.5" fill="currentColor"/>
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8.6" fill="#dfe84a" stroke="#5a2412" strokeWidth="1.6"/>
    <path d="M3.4 5.2c3.4 1.6 3.4 8 0 9.6M16.6 5.2c-3.4 1.6-3.4 8 0 9.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>;
}
