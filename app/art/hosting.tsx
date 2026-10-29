// HostingRecs visuals: one simple line drawing per category (a server shared by three sites, a page with a plug, a server box
// split into slices, a cloud, a lightning page, a cloud with a gear, a tall tower server, a browser window of blocks, a globe,
// an envelope), all in the same 40×64 box as the other niches' product drawings, and the rack-unit logo.

export type Shape = "shared" | "wordpress" | "vps" | "cloud" | "static" | "managed" | "dedicated" | "builder" | "domain" | "email" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("shared")) return "shared";
  if (s.includes("wordpress")) return "wordpress";
  if (s.includes("vps")) return "vps";
  if (s.includes("managed cloud")) return "managed";
  if (s.includes("cloud")) return "cloud";
  if (s.includes("static")) return "static";
  if (s.includes("dedicated")) return "dedicated";
  if (s.includes("builder")) return "builder";
  if (s.includes("domain")) return "domain";
  if (s.includes("email")) return "email";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;
const faint = { strokeOpacity: 0.55 } as const;
const cloud = "M11 44a8 8 0 0 1-1-15.9A11 11 0 0 1 31 26a8.5 8.5 0 0 1-1 18z";

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "shared" && <>
      <rect x="4" y="30" width="32" height="22" rx="3" {...soft}/>
      <rect x="4" y="30" width="32" height="22" rx="3" {...line}/>
      <path d="M9 41h.01" {...line} strokeWidth={2.6}/>
      <path d="M15 41h16" {...line} {...faint}/>
      {[8, 17, 26].map(x => <rect key={x} x={x} y="12" width="6" height="8" rx="1.2" {...line} strokeWidth={1.6}/>)}
      <path d="M11 20v10M20 20v10M29 20v10" {...line} {...faint}/>
    </>}
    {kind === "wordpress" && <>
      <path d="M7 8h18l8 8v40H7z" {...soft}/>
      <path d="M7 8h18l8 8v40H7z M25 8v8h8" {...line}/>
      <path d="M12 24h16M12 30h12" {...line} {...faint}/>
      <path d="M16 38v4M24 38v4M13 42h14v3a7 7 0 0 1-14 0zM20 52v4" {...line}/>
    </>}
    {kind === "vps" && <>
      <rect x="4" y="12" width="32" height="40" rx="3" {...soft}/>
      <rect x="4" y="12" width="32" height="40" rx="3" {...line}/>
      <path d="M4 25.3h32M4 38.6h32" {...line} {...faint}/>
      <path d="M9 18.6h.01M9 32h.01M9 45.3h.01" {...line} strokeWidth={2.6}/>
      <path d="M15 18.6h10M15 32h14M15 45.3h8" {...line} {...faint}/>
    </>}
    {kind === "cloud" && <>
      <path d={cloud} {...soft}/>
      <path d={cloud} {...line}/>
      <path d="M20 44v8M14 52h12" {...line}/>
    </>}
    {kind === "static" && <>
      <path d="M7 8h18l8 8v40H7z" {...soft}/>
      <path d="M7 8h18l8 8v40H7z M25 8v8h8" {...line}/>
      <path d="M22 22l-7 12h6l-2 12 8-14h-6z" {...line}/>
    </>}
    {kind === "managed" && <>
      <path d={cloud} transform="translate(0 -8)" {...soft}/>
      <path d={cloud} transform="translate(0 -8)" {...line}/>
      <circle cx="20" cy="48" r="4" {...line}/>
      <path d="M20 41v2.5M20 52.5V55M13 48h2.5M24.5 48H27M15 43l1.8 1.8M23.2 51.2L25 53M25 43l-1.8 1.8M16.8 51.2L15 53" {...line} strokeWidth={1.8}/>
    </>}
    {kind === "dedicated" && <>
      <rect x="9" y="6" width="22" height="52" rx="3" {...soft}/>
      <rect x="9" y="6" width="22" height="52" rx="3" {...line}/>
      <path d="M14 14h12M14 20h12M14 26h12" {...line} {...faint}/>
      <path d="M20 46h.01" {...line} strokeWidth={3.2}/>
    </>}
    {kind === "builder" && <>
      <rect x="3" y="12" width="34" height="40" rx="3" {...soft}/>
      <rect x="3" y="12" width="34" height="40" rx="3" {...line}/>
      <path d="M3 20h34" {...line}/>
      <path d="M7 16h.01M11 16h.01" {...line} strokeWidth={2.6}/>
      <rect x="8" y="25" width="24" height="9" rx="1.5" {...line} {...faint}/>
      <rect x="8" y="38" width="11" height="9" rx="1.5" {...line} {...faint}/>
      <rect x="23" y="38" width="9" height="9" rx="1.5" {...line}/>
    </>}
    {kind === "domain" && <>
      <circle cx="20" cy="32" r="15" {...soft}/>
      <circle cx="20" cy="32" r="15" {...line}/>
      <ellipse cx="20" cy="32" rx="6.5" ry="15" {...line} {...faint}/>
      <path d="M5 32h30M7.5 24h25M7.5 40h25" {...line} {...faint}/>
    </>}
    {kind === "email" && <>
      <rect x="3" y="18" width="34" height="28" rx="3" {...soft}/>
      <rect x="3" y="18" width="34" height="28" rx="3" {...line}/>
      <path d="M4 20l16 13 16-13" {...line}/>
      <path d="M4 44l12-10M36 44l-12-10" {...line} {...faint}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <rect x="1" y="1" width="18" height="18" rx="4.6" fill="#0b5563"/>
    <rect x="4.5" y="5" width="11" height="4" rx="1.3" fill="none" stroke="#ffffff" strokeWidth="1.5"/>
    <rect x="4.5" y="11" width="11" height="4" rx="1.3" fill="none" stroke="#ffffff" strokeWidth="1.5"/>
    <circle cx="7" cy="7" r="1" fill="#f97316"/>
    <circle cx="7" cy="13" r="1" fill="#f97316"/>
  </svg>;
}
