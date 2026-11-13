// GrillRecs visuals: one simple line drawing per category (pellet, smoker, kamado, gas, charcoal kettle, griddle,
// portable, pizza oven), all in the same 40×64 box as the other niches' product drawings, and the flame logo.

export type Shape = "pellet" | "smoker" | "kamado" | "gas" | "charcoal" | "griddle" | "portable" | "pizza" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("pellet")) return "pellet";
  if (s.includes("smoker")) return "smoker";
  if (s.includes("kamado")) return "kamado";
  if (s.includes("gas")) return "gas";
  if (s.includes("charcoal") || s.includes("kettle")) return "charcoal";
  if (s.includes("griddle")) return "griddle";
  if (s.includes("portable")) return "portable";
  if (s.includes("pizza")) return "pizza";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
const faint = { ...line, strokeOpacity: 0.45 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "pellet" && <>
      {/* Barrel cook chamber with the pellet hopper on the left */}
      <path d="M12 24h24v12H12z" {...soft}/>
      <path d="M12 36V28a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v8z" {...line}/>
      <path d="M4 26h8v10H4z" {...line}/>
      <path d="M14 36l-2 12M34 36l2 12M12 44h24" {...line}/>
      <path d="M33 24v-4" {...faint}/>
    </>}
    {kind === "smoker" && <>
      {/* Offset: horizontal chamber, firebox low on the right, chimney on the left */}
      <path d="M3 26h26v11H3z" {...soft}/>
      <rect x="3" y="26" width="26" height="11" rx="5" {...line}/>
      <rect x="29" y="30" width="9" height="9" rx="1.5" {...line}/>
      <path d="M6 26V15h4v11" {...line}/>
      <path d="M8 37l-1 11M24 37l1 11" {...line}/>
      <path d="M8 12c-1-2 1-3 0-5" {...faint}/>
    </>}
    {kind === "kamado" && <>
      {/* Ceramic egg on a nest stand */}
      <path d="M20 14c-8 0-12 8-12 16 0 6 5 11 12 11s12-5 12-11c0-8-4-16-12-16z" {...soft}/>
      <path d="M20 14c-8 0-12 8-12 16 0 6 5 11 12 11s12-5 12-11c0-8-4-16-12-16z" {...line}/>
      <path d="M8.5 27h23" {...faint}/>
      <path d="M18 14v-2h4v2" {...line}/>
      <path d="M12 39l-3 9M28 39l3 9M10 45h20" {...line}/>
    </>}
    {kind === "gas" && <>
      {/* Hooded firebox on a cart with side shelves and knobs */}
      <path d="M8 22h24v12H8z" {...soft}/>
      <path d="M8 34V26a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v8z" {...line}/>
      <path d="M2 34h36" {...line}/>
      <path d="M8 34v14h24V34" {...line}/>
      <circle cx="14" cy="38" r="1.2" fill="currentColor"/><circle cx="20" cy="38" r="1.2" fill="currentColor"/><circle cx="26" cy="38" r="1.2" fill="currentColor"/>
      <path d="M15 26h10" {...faint}/>
    </>}
    {kind === "charcoal" && <>
      {/* Round kettle: dome lid, bowl, three legs */}
      <path d="M7 29a13 13 0 0 1 26 0z" {...soft}/>
      <path d="M7 29a13 13 0 0 1 26 0" {...line}/>
      <path d="M6 29h28c0 5-6 9-14 9s-14-4-14-9z" {...line}/>
      <path d="M18 16h4" {...line}/>
      <path d="M12 36l-4 13M28 36l4 13M20 38v11" {...line}/>
    </>}
    {kind === "griddle" && <>
      {/* Flat steel top with a folded hood, on a cart */}
      <path d="M4 30h32v3H4z" {...soft}/>
      <path d="M4 30h32v3H4z" {...line}/>
      <path d="M6 30V22h28v8" {...faint}/>
      <path d="M8 33v15M32 33v15M8 42h24" {...line}/>
      <path d="M12 27c2-1 4 1 6 0" {...faint}/>
    </>}
    {kind === "portable" && <>
      {/* Low tabletop grill with a carry handle */}
      <path d="M6 38h28v6H6z" {...soft}/>
      <path d="M6 44v-6a8 8 0 0 1 8-8h12a8 8 0 0 1 8 8v6z" {...line}/>
      <path d="M15 30v-3h10v3" {...line}/>
      <path d="M9 44l-1 4M31 44l1 4" {...line}/>
    </>}
    {kind === "pizza" && <>
      {/* Dome oven with an arched mouth and a flame inside */}
      <path d="M5 42a15 15 0 0 1 30 0z" {...soft}/>
      <path d="M5 42a15 15 0 0 1 30 0z" {...line}/>
      <path d="M13 42v-4a7 7 0 0 1 14 0v4" {...line}/>
      <path d="M20 41c-2-2 0-4 0-5 2 2 2 3 0 5" {...line} strokeWidth={1.6}/>
      <path d="M7 42l-1 6M33 42l1 6" {...line}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 1.5c.6 3.2 5.5 5.6 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.3 1.1-3.8 2.3-4.8.1 1.7.8 2.8 1.9 3.3C8.2 7.2 9 4 10 1.5z" fill="#e8590c"/>
    <path d="M10 10c.3 1.4 2.4 2.4 2.4 4.4a2.4 2.4 0 0 1-4.8 0c0-1.6 1.6-2.6 2.4-4.4z" fill="#fcc419"/>
  </svg>;
}
