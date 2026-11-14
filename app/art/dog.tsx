// DogRecs visuals: one simple line drawing per category (bed, crate, harness, toy, tracker, grooming, bowl, food bag),
// all in the same 40×64 box as the other niches' product drawings, and the paw-print logo.

export type Shape = "bed" | "crate" | "harness" | "toy" | "tracker" | "grooming" | "bowl" | "food" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("food")) return "food";
  if (s.includes("bed")) return "bed";
  if (s.includes("crate") || s.includes("carrier")) return "crate";
  if (s.includes("harness") || s.includes("collar") || s.includes("leash")) return "harness";
  if (s.includes("toy") || s.includes("chew")) return "toy";
  if (s.includes("gps") || s.includes("tracker") || s.includes("camera")) return "tracker";
  if (s.includes("groom")) return "grooming";
  if (s.includes("bowl") || s.includes("feeder") || s.includes("fountain")) return "bowl";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
const faint = { ...line, strokeOpacity: 0.45 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "bed" && <>
      {/* Round bolster bed seen from the side: raised rim around a cushion */}
      <path d="M4 38c0-6 4-9 8-9h16c4 0 8 3 8 9v6H4z" {...soft}/>
      <path d="M4 38c0-6 4-9 8-9h16c4 0 8 3 8 9v6H4z" {...line}/>
      <path d="M10 38c2-2 18-2 20 0" {...line}/>
      <path d="M6 44v3h28v-3" {...faint}/>
    </>}
    {kind === "crate" && <>
      {/* Wire crate: frame, bars and a latched door */}
      <rect x="4" y="20" width="32" height="26" rx="2" {...soft}/>
      <rect x="4" y="20" width="32" height="26" rx="2" {...line}/>
      <path d="M11 20v26M18 20v26M25 20v26" {...faint}/>
      <path d="M25 24h8v18h-8z" {...line}/>
      <path d="M31 33h2" {...line}/>
    </>}
    {kind === "harness" && <>
      {/* Harness: chest strap loop, back panel and a leash clip */}
      <path d="M8 30c0-6 6-10 12-10s12 4 12 10v6c0 3-4 5-12 5s-12-2-12-5z" {...soft}/>
      <path d="M8 30c0-6 6-10 12-10s12 4 12 10v6c0 3-4 5-12 5s-12-2-12-5z" {...line}/>
      <path d="M14 22v18M26 22v18" {...faint}/>
      <circle cx="20" cy="17" r="3" {...line}/>
      <path d="M20 14V6" {...line}/>
    </>}
    {kind === "toy" && <>
      {/* Stacked rubber treat toy (snowman shape) */}
      <path d="M15 14h10l-1 5c4 2 6 5 6 9 0 3-1 5-3 7 4 2 6 6 6 10H7c0-4 2-8 6-10-2-2-3-4-3-7 0-4 2-7 6-9z" {...soft}/>
      <path d="M15 14h10l-1 5c4 2 6 5 6 9 0 3-1 5-3 7 4 2 6 6 6 10H7c0-4 2-8 6-10-2-2-3-4-3-7 0-4 2-7 6-9z" {...line}/>
      <ellipse cx="20" cy="45" rx="4" ry="1.6" {...faint}/>
    </>}
    {kind === "tracker" && <>
      {/* GPS collar: strap with a tracker pod and signal arcs */}
      <path d="M4 38c4 4 28 4 32 0" {...line}/>
      <rect x="13" y="30" width="14" height="12" rx="3" {...soft}/>
      <rect x="13" y="30" width="14" height="12" rx="3" {...line}/>
      <circle cx="20" cy="36" r="2" {...line}/>
      <path d="M14 24a9 9 0 0 1 12 0M11 20a14 14 0 0 1 18 0" {...faint}/>
    </>}
    {kind === "grooming" && <>
      {/* Slicker brush: paddle head with pins and a handle */}
      <rect x="9" y="10" width="22" height="16" rx="4" {...soft}/>
      <rect x="9" y="10" width="22" height="16" rx="4" {...line}/>
      <path d="M13 15v6M17 15v6M21 15v6M25 15v6M29 15v6" {...faint}/>
      <path d="M17 26l-1 28h8l-1-28" {...line}/>
    </>}
    {kind === "bowl" && <>
      {/* Dog bowl: wide flared bowl with a rim */}
      <path d="M4 32h32l-4 14H8z" {...soft}/>
      <path d="M4 32h32l-4 14H8z" {...line}/>
      <path d="M3 32h34" {...line}/>
      <path d="M10 28c3-2 6 2 10 0s7 2 10 0" {...faint}/>
    </>}
    {kind === "food" && <>
      {/* Kibble bag: folded top, label panel, a bone on it */}
      <path d="M9 14h22l2 38H7z" {...soft}/>
      <path d="M9 14h22l2 38H7z" {...line}/>
      <path d="M9 14l2-4h18l2 4" {...line}/>
      <rect x="12" y="26" width="16" height="14" rx="2" {...faint}/>
      <path d="M16 33h8" {...line}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <g fill="#e8833a" stroke="#1f4e4a" strokeWidth="0.9">
      <path d="M10 9.6c-2.6 0-5.2 3.4-5.2 5.6 0 1.6 1.3 2.6 2.8 2.6 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.5 0 2.8-1 2.8-2.6 0-2.2-2.6-5.6-5.2-5.6z"/>
      <ellipse cx="4" cy="8.2" rx="1.8" ry="2.3"/>
      <ellipse cx="7.6" cy="4.4" rx="1.9" ry="2.5"/>
      <ellipse cx="12.4" cy="4.4" rx="1.9" ry="2.5"/>
      <ellipse cx="16" cy="8.2" rx="1.8" ry="2.3"/>
    </g>
  </svg>;
}
