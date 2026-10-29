// SoftwareRecs visuals: one simple line drawing per category (a chat bubble, code brackets, a picture with a play button,
// a page with a sparkle, a notebook, a kanban board, a padlock, a browser window, a pen nib, an envelope, a contact card,
// a receipt, a shield, a server stack), all in the same 40×64 box as the other niches' product drawings, and the prompt logo.

export type Shape = "assistant" | "coding" | "media" | "writing" | "notes" | "projects" | "password" | "website" | "design" | "email" | "crm" | "accounting" | "vpn" | "hosting" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("assistant")) return "assistant";
  if (s.includes("coding")) return "coding";
  if (s.includes("image") || (s.includes("video") && s.startsWith("ai"))) return "media";
  if (s.includes("writing")) return "writing";
  if (s.includes("notes")) return "notes";
  if (s.includes("project")) return "projects";
  if (s.includes("password")) return "password";
  if (s.includes("website")) return "website";
  if (s.includes("design")) return "design";
  if (s.includes("email")) return "email";
  if (s.includes("crm")) return "crm";
  if (s.includes("accounting")) return "accounting";
  if (s.includes("vpn")) return "vpn";
  if (s.includes("hosting")) return "hosting";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
const faint = { strokeOpacity: 0.55 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "assistant" && <>
      <path d="M6 16h28a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H18l-8 7v-7H6a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3z" {...soft}/>
      <path d="M6 16h28a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H18l-8 7v-7H6a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3z" {...line}/>
      <path d="M12 28h.01M20 28h.01M28 28h.01" {...line} strokeWidth={3.4}/>
    </>}
    {kind === "coding" && <>
      <rect x="3" y="14" width="34" height="36" rx="3" {...soft}/>
      <rect x="3" y="14" width="34" height="36" rx="3" {...line}/>
      <path d="M3 21h34" {...line} {...faint}/>
      <path d="M15 29l-5 5 5 5M25 29l5 5-5 5M22 27l-4 14" {...line}/>
    </>}
    {kind === "media" && <>
      <rect x="3" y="14" width="34" height="34" rx="3" {...soft}/>
      <rect x="3" y="14" width="34" height="34" rx="3" {...line}/>
      <path d="M3 42l10-10 8 8 5-5 11 11" {...line} {...faint}/>
      <circle cx="28" cy="22" r="3" {...line}/>
      <path d="M17 52l8 5-8 5z" {...line}/>
    </>}
    {kind === "writing" && <>
      <path d="M7 8h18l8 8v40H7z" {...soft}/>
      <path d="M7 8h18l8 8v40H7z M25 8v8h8" {...line}/>
      <path d="M12 26h16M12 32h16M12 38h10" {...line} {...faint}/>
      <path d="M26 44l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" {...line} strokeWidth={1.6}/>
    </>}
    {kind === "notes" && <>
      <rect x="8" y="8" width="26" height="48" rx="3" {...soft}/>
      <rect x="8" y="8" width="26" height="48" rx="3" {...line}/>
      <path d="M5 16h6M5 26h6M5 36h6M5 46h6" {...line}/>
      <path d="M16 20h12M16 27h12M16 34h8" {...line} {...faint}/>
    </>}
    {kind === "projects" && <>
      <rect x="3" y="12" width="34" height="40" rx="3" {...line}/>
      <path d="M14.3 12v40M25.7 12v40" {...line} {...faint}/>
      <rect x="6" y="17" width="5.5" height="7" rx="1" {...soft}/><rect x="6" y="27" width="5.5" height="7" rx="1" {...soft}/>
      <rect x="17.2" y="17" width="5.5" height="7" rx="1" {...soft}/><rect x="28.5" y="17" width="5.5" height="7" rx="1" {...soft}/>
      <rect x="6" y="17" width="5.5" height="7" rx="1" {...line} strokeWidth={1.4}/><rect x="6" y="27" width="5.5" height="7" rx="1" {...line} strokeWidth={1.4}/>
      <rect x="17.2" y="17" width="5.5" height="7" rx="1" {...line} strokeWidth={1.4}/><rect x="28.5" y="17" width="5.5" height="7" rx="1" {...line} strokeWidth={1.4}/>
    </>}
    {kind === "password" && <>
      <path d="M11 28v-8a9 9 0 0 1 18 0v8" {...line}/>
      <rect x="6" y="28" width="28" height="24" rx="3" {...soft}/>
      <rect x="6" y="28" width="28" height="24" rx="3" {...line}/>
      <circle cx="20" cy="38" r="2.5" {...line}/>
      <path d="M20 40.5v5" {...line}/>
    </>}
    {kind === "website" && <>
      <rect x="3" y="12" width="34" height="40" rx="3" {...soft}/>
      <rect x="3" y="12" width="34" height="40" rx="3" {...line}/>
      <path d="M3 20h34" {...line}/>
      <path d="M7 16h.01M11 16h.01" {...line} strokeWidth={2.6}/>
      <rect x="8" y="25" width="24" height="9" rx="1.5" {...line} {...faint}/>
      <path d="M8 40h11M8 45h11M23 40h9v5h-9z" {...line} {...faint}/>
    </>}
    {kind === "design" && <>
      <path d="M20 8l10 22-10 16-10-16z" {...soft}/>
      <path d="M20 8l10 22-10 16-10-16z" {...line}/>
      <path d="M20 8v22" {...line} {...faint}/>
      <circle cx="20" cy="30" r="2.5" {...line}/>
      <path d="M13 50h14v6H13z" {...line}/>
    </>}
    {kind === "email" && <>
      <rect x="3" y="18" width="34" height="28" rx="3" {...soft}/>
      <rect x="3" y="18" width="34" height="28" rx="3" {...line}/>
      <path d="M4 20l16 13 16-13" {...line}/>
      <path d="M4 44l12-10M36 44l-12-10" {...line} {...faint}/>
    </>}
    {kind === "crm" && <>
      <rect x="3" y="14" width="34" height="36" rx="3" {...soft}/>
      <rect x="3" y="14" width="34" height="36" rx="3" {...line}/>
      <circle cx="14" cy="27" r="4.5" {...line}/>
      <path d="M7 41a7 7 0 0 1 14 0" {...line}/>
      <path d="M25 25h7M25 31h7M25 37h5" {...line} {...faint}/>
    </>}
    {kind === "accounting" && <>
      <path d="M8 6h24v52l-4-3-4 3-4-3-4 3-4-3-4 3z" {...soft}/>
      <path d="M8 6h24v52l-4-3-4 3-4-3-4 3-4-3-4 3z" {...line}/>
      <path d="M13 16h14M13 23h14M13 30h9" {...line} {...faint}/>
      <path d="M13 41h14" {...line}/>
      <path d="M22 46h5" {...line} strokeWidth={2.8}/>
    </>}
    {kind === "vpn" && <>
      <path d="M20 8l14 5v14c0 12-6 20-14 25-8-5-14-13-14-25V13z" {...soft}/>
      <path d="M20 8l14 5v14c0 12-6 20-14 25-8-5-14-13-14-25V13z" {...line}/>
      <path d="M14 30l4 4 8-9" {...line}/>
    </>}
    {kind === "hosting" && <>
      {[10, 26, 42].map(y => <g key={y}>
        <rect x="4" y={y} width="32" height="12" rx="2.5" {...soft}/>
        <rect x="4" y={y} width="32" height="12" rx="2.5" {...line}/>
        <path d={`M9 ${y + 6}h.01M14 ${y + 6}h.01`} {...line} strokeWidth={2.6}/>
        <path d={`M22 ${y + 6}h9`} {...line} {...faint}/>
      </g>)}
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="1" y="1" width="18" height="18" rx="4.6" fill="#3730a3"/>
    <path d="M5.4 6.6l3.4 3.4-3.4 3.4" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.6 13.6h4.2" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
  </svg>;
}
