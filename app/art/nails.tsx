// NailsRecs visuals: one simple line drawing per category (a polish bottle with its round cap, a gel pot,
// a clear coat bottle with a tall cap, a pair of press-on tips, a treatment bottle with a long brush cap, a cuticle-oil dropper),
// all in the same 40×64 box as the other niches' product drawings, and the polished-nail logo.

export type Shape = "polish" | "gel" | "coat" | "press" | "treatment" | "oil" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
// "Gel polish" is checked before "Nail polish" because both contain "polish".
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("gel")) return "gel";
  if (s.includes("polish")) return "polish";
  if (s.includes("coat")) return "coat";
  if (s.includes("press")) return "press";
  if (s.includes("treatment")) return "treatment";
  if (s.includes("oil")) return "oil";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "polish" && <>
      <rect x="14" y="10" width="12" height="16" rx="5" fill="currentColor"/>
      <path d="M9 32a6 6 0 0 1 6-6h10a6 6 0 0 1 6 6v18a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5z" {...soft}/>
      <path d="M9 32a6 6 0 0 1 6-6h10a6 6 0 0 1 6 6v18a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5z" {...line}/>
      <path d="M14 33v12" {...line} strokeOpacity=".45"/>
    </>}
    {kind === "gel" && <>
      <rect x="12" y="10" width="16" height="15" rx="3" fill="currentColor"/>
      <path d="M8 29h24v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" {...soft}/>
      <path d="M8 29h24v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" {...line}/>
      <path d="M10 25h20v4H10z" {...line}/>
      <path d="M13 35v10" {...line} strokeOpacity=".45"/>
    </>}
    {kind === "coat" && <>
      <rect x="16" y="6" width="8" height="21" rx="2.5" fill="currentColor"/>
      <path d="M10 33a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v17a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5z" {...line}/>
      <path d="M15 34v11" {...line} strokeOpacity=".45"/>
    </>}
    {kind === "press" && <>
      <path d="M6 54V34c0-8 3-14 7-14s7 6 7 14v20z" {...soft}/>
      <path d="M6 54V34c0-8 3-14 7-14s7 6 7 14v20z" {...line}/>
      <path d="M21 50V28c0-8 3-14 7-14s7 6 7 14v22z" {...line}/>
      <path d="M10 30c0-3 1-5 2-6M25 24c0-3 1-5 2-6" {...line} strokeOpacity=".45"/>
    </>}
    {kind === "treatment" && <>
      <rect x="15" y="4" width="10" height="24" rx="3" fill="currentColor"/>
      <path d="M11 32a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4z" {...soft}/>
      <path d="M11 32a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4z" {...line}/>
      <path d="M15 40h10" {...line} strokeOpacity=".45"/>
    </>}
    {kind === "oil" && <>
      <path d="M17 6h6v4h-6zM15 10h10v4H15z" fill="currentColor"/>
      <path d="M18 14v6M22 14v6" {...line}/>
      <path d="M12 26a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v24a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5z" {...soft}/>
      <path d="M12 26a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v24a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5z" {...line}/>
      <path d="M20 31c-2.4 3-3.6 5-3.6 6.6a3.6 3.6 0 0 0 7.2 0c0-1.6-1.2-3.6-3.6-6.6z" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 1.8C13.4 1.8 15.4 5 15.4 9.6V16.2C15.4 17.6 14.3 18.6 12.9 18.6H7.1C5.7 18.6 4.6 17.6 4.6 16.2V9.6C4.6 5 6.6 1.8 10 1.8Z" fill="#6b1538"/>
    <path d="M7.6 11.2C7.6 7.8 8.4 5.6 9.8 4.6" fill="none" stroke="#f7a1c4" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>;
}
