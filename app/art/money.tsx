// MoneyRecs visuals: one simple line drawing per kind of product (an upright card with its chip for the four card categories,
// a coin jar, a bank building, a rising chart, a chart with a gear, a pie chart, a tax form, two crossing arrows), all in the
// same 40×64 box as the other niches' product drawings, and the coin logo.

export type Shape = "card" | "savings" | "bank" | "brokerage" | "robo" | "budget" | "tax" | "transfer" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("card")) return "card";
  if (s.includes("saving")) return "savings";
  if (s.includes("checking")) return "bank";
  if (s.includes("brokerage")) return "brokerage";
  if (s.includes("robo")) return "robo";
  if (s.includes("budget")) return "budget";
  if (s.includes("tax")) return "tax";
  if (s.includes("transfer")) return "transfer";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "card" && <>
      <rect x="7" y="6" width="26" height="52" rx="4" {...soft}/>
      <rect x="7" y="6" width="26" height="52" rx="4" {...line}/>
      <rect x="12" y="14" width="9" height="7" rx="1.5" {...line}/>
      <path d="M26 6v52" {...line} strokeOpacity=".4" strokeWidth={3}/>
      <path d="M12 46h8M12 51h5" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "savings" && <>
      <path d="M10 22h20v30a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4Z" {...soft}/>
      <path d="M10 22h20v30a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4Z" {...line}/>
      <path d="M8 22h24M12 16h16" {...line}/>
      <circle cx="20" cy="44" r="5" {...line}/>
      <circle cx="20" cy="33" r="3" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "bank" && <>
      <path d="M5 26 20 14l15 12Z" {...soft}/>
      <path d="M5 26 20 14l15 12Z" {...line}/>
      <path d="M10 30v18M17 30v18M23 30v18M30 30v18" {...line}/>
      <path d="M5 52h30M7 48h26" {...line}/>
    </>}
    {kind === "brokerage" && <>
      <path d="M6 10v44h30" {...line}/>
      <path d="M10 46l8-10 6 5 10-15" {...line} strokeWidth={2.8}/>
      <path d="M28 26h6v6" {...line}/>
      <path d="M12 54v-4M20 54v-7M28 54v-10" {...line} strokeOpacity=".4"/>
    </>}
    {kind === "robo" && <>
      <path d="M6 12v30h28" {...line}/>
      <path d="M10 36l7-8 5 4 9-11" {...line} strokeWidth={2.6}/>
      <circle cx="20" cy="51" r="6" {...soft}/>
      <circle cx="20" cy="51" r="3" {...line}/>
      <path d="M20 42v3M20 57v3M11 51h3M26 51h3M14 45l2 2M24 55l2 2M14 57l2-2M24 47l2-2" {...line}/>
    </>}
    {kind === "budget" && <>
      <circle cx="20" cy="28" r="14" {...soft}/>
      <circle cx="20" cy="28" r="14" {...line}/>
      <path d="M20 28V14M20 28l12 7M20 28l-10 10" {...line}/>
      <path d="M8 52h24M8 57h16" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "tax" && <>
      <path d="M8 6h17l7 7v45H8Z" {...soft}/>
      <path d="M8 6h17l7 7v45H8Z" {...line}/>
      <path d="M25 6v7h7" {...line}/>
      <path d="M13 22h14M13 28h14M13 34h9" {...line} strokeOpacity=".55"/>
      <path d="M14 50l10-10" {...line}/>
      <circle cx="15" cy="41" r="1.6" {...line}/>
      <circle cx="23" cy="49" r="1.6" {...line}/>
    </>}
    {kind === "transfer" && <>
      <circle cx="20" cy="32" r="16" {...soft}/>
      <path d="M8 24h22M24 18l6 6-6 6" {...line}/>
      <path d="M32 40H10M16 34l-6 6 6 6" {...line}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="8.6" fill="#14335c"/>
    <circle cx="10" cy="10" r="5.8" fill="none" stroke="#e0b84c" strokeWidth="1.7"/>
    <path d="M10 7.3v5.4" stroke="#e0b84c" strokeWidth="1.9" strokeLinecap="round"/>
  </svg>;
}
