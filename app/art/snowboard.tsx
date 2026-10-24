// SnowboardRecs visuals: one simple line drawing per category (a twin-tip all-mountain board, a park twin with a big kick at both ends,
// a tapered freeride board with a long nose, a splitboard with its seam and clips), all in the same 40×64 box as the other niches'
// product drawings, and the snowflake logo.

export type Shape = "allmountain" | "freestyle" | "freeride" | "split" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("split")) return "split";
  if (s.includes("freestyle") || s.includes("park")) return "freestyle";
  if (s.includes("freeride") || s.includes("powder")) return "freeride";
  if (s.includes("all-mountain") || s.includes("snowboard")) return "allmountain";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
// A board standing upright: rounded nose and tail joined by a gentle sidecut.
const BOARD = "M13 4h14a6 6 0 0 1 6 6v2c-2 6-2 34 0 40v2a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6v-2c2-6 2-34 0-40v-2a6 6 0 0 1 6-6z";
const TWIN = "M12 5h16a6 6 0 0 1 5 6c-2.5 7-2.5 35 0 42a6 6 0 0 1-5 6H12a6 6 0 0 1-5-6c2.5-7 2.5-35 0-42a6 6 0 0 1 5-6z";
const TAPER = "M14 2h12a7 7 0 0 1 7 7v4c-2 8-2.5 30-1 38l-1 5a5 5 0 0 1-5 4H14a5 5 0 0 1-5-4l-1-5c1.5-8 1-30-1-38V9a7 7 0 0 1 7-7z";

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "allmountain" && <>
      <path d={BOARD} {...soft}/>
      <path d={BOARD} {...line}/>
      <rect x="13" y="19" width="14" height="5" rx="2" {...line} strokeOpacity=".55"/>
      <rect x="13" y="40" width="14" height="5" rx="2" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "freestyle" && <>
      <path d={TWIN} {...soft}/>
      <path d={TWIN} {...line}/>
      <rect x="13" y="21" width="14" height="5" rx="2" {...line} strokeOpacity=".55"/>
      <rect x="13" y="38" width="14" height="5" rx="2" {...line} strokeOpacity=".55"/>
      <path d="M14 11h12M14 53h12" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "freeride" && <>
      <path d={TAPER} {...soft}/>
      <path d={TAPER} {...line}/>
      <rect x="13" y="24" width="14" height="5" rx="2" {...line} strokeOpacity=".55"/>
      <rect x="13" y="43" width="14" height="5" rx="2" {...line} strokeOpacity=".55"/>
      <path d="M15 10l5-3 5 3" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "split" && <>
      <path d={BOARD} {...soft}/>
      <path d={BOARD} {...line}/>
      <path d="M20 5v54" {...line}/>
      <path d="M16 9h8M16 55h8" {...line} strokeOpacity=".55"/>
      <rect x="12" y="24" width="16" height="4" rx="2" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 1.6V18.4M2.7 5.8L17.3 14.2M2.7 14.2L17.3 5.8M7.6 2.8L10 5.2L12.4 2.8M7.6 17.2L10 14.8L12.4 17.2M2.6 8.4L5.9 7.5L5 4.3M17.4 11.6L14.1 12.5L15 15.7M2.6 11.6L5.9 12.5L5 15.7M17.4 8.4L14.1 7.5L15 4.3" fill="none" stroke="#0c4a6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="10" cy="10" r="2.3" fill="#ff7a59"/>
  </svg>;
}
