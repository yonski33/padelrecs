// BadmintonRecs visuals: a strung badminton racket (isometric head on a long thin shaft, T-joint, handle) and the shuttlecock logo.
import { BADMINTON_SERIES } from "../../lib/niche/badminton";

export type Shape = "racket" | "unknown";

// The catalog's "Series" field (Astrox, Thruster, Axforce…). Every known series draws the same racket; balance and flex
// are not given by every maker, so the drawing doesn't vary with them.
export function shapeOf(series?: string | null): Shape {
  const s = (series || "").trim().toLowerCase();
  return BADMINTON_SERIES.some(x => x.toLowerCase() === s) ? "racket" : "unknown";
}

/** Brand marks are not drawn on badminton rackets yet; shape and brand are accepted for the shared icon interface. */
export function ProductIcon({ className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const cx = 20, cy = 15, rx = 10.5, ry = 13;
  const strings: string[] = [];
  for (let x = cx - rx + 2.4; x < cx + rx; x += 2.4) strings.push(`M${x.toFixed(1)} ${cy - ry}V${cy + ry}`);
  for (let y = cy - ry + 2.4; y < cy + ry; y += 2.4) strings.push(`M${cx - rx} ${y.toFixed(1)}H${cx + rx}`);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    <defs><clipPath id="bd-head"><ellipse cx={cx} cy={cy} rx={rx} ry={ry}/></clipPath></defs>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="currentColor" fillOpacity=".12"/>
    <path d={strings.join("")} clipPath="url(#bd-head)" stroke="currentColor" strokeOpacity=".35" strokeWidth=".6"/>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="currentColor" strokeWidth="1.8"/>
    {/* T-joint, thin shaft, handle */}
    <path d={`M${cx} ${cy + ry}V45`} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <rect x="17.8" y="45" width="4.4" height="17" rx="1.6" fill="currentColor"/>
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3 1.6h14L13.2 12.4H6.8z" fill="#fff" stroke="#7f1d1d" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M8 2.2L8.9 12M12 2.2L11.1 12" stroke="#7f1d1d" strokeWidth=".9"/>
    <path d="M6.6 12.4h6.8v2.4a3.4 3.4 0 0 1-6.8 0z" fill="#fbbf24" stroke="#7f1d1d" strokeWidth="1.4"/>
  </svg>;
}
