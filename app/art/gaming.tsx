// GamingRecs visuals: one simple line drawing per category (mouse from above, keyboard, headset, controller, monitor),
// all in the same 40×64 box as the other niches' product drawings, and the keycap logo.

export type Shape = "mouse" | "keyboard" | "headset" | "controller" | "monitor" | "unknown";

// The catalog's "Category" field picks the drawing; anything unrecognised is drawn as a plain tile.
export function shapeOf(category?: string | null): Shape {
  const s = (category || "").toLowerCase();
  if (s.includes("mouse") || s.includes("mice")) return "mouse";
  if (s.includes("keyboard")) return "keyboard";
  if (s.includes("headset") || s.includes("earbud")) return "headset";
  if (s.includes("controller") || s.includes("gamepad")) return "controller";
  if (s.includes("monitor")) return "monitor";
  return "unknown";
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const soft = { fill: "currentColor", fillOpacity: 0.12 } as const;

export function ProductIcon({ shape, className }: { shape?: string | null; brand?: string | null; className?: string }) {
  const kind = shapeOf(shape);
  return <svg className={className} viewBox="0 0 40 64" aria-hidden="true">
    {kind === "mouse" && <>
      <path d="M20 12c-7.5 0-11 6-11 14v16c0 7.5 4.8 11 11 11s11-3.5 11-11V26c0-8-3.5-14-11-14z" {...soft}/>
      <path d="M20 12c-7.5 0-11 6-11 14v16c0 7.5 4.8 11 11 11s11-3.5 11-11V26c0-8-3.5-14-11-14z" {...line}/>
      <path d="M20 12v14M9.4 27h21.2" {...line} strokeOpacity=".45"/>
      <path d="M20 16.5v5" {...line} strokeWidth={3}/>
    </>}
    {kind === "keyboard" && <>
      <rect x="4" y="22" width="32" height="20" rx="3" {...soft}/>
      <rect x="4" y="22" width="32" height="20" rx="3" {...line}/>
      <path d="M9 28h.01M14 28h.01M19 28h.01M24 28h.01M29 28h.01M31 28h.01M9 33h.01M14 33h.01M19 33h.01M24 33h.01M29 33h.01" {...line} strokeWidth={2.6} strokeOpacity=".6"/>
      <path d="M13 37.5h14" {...line} strokeOpacity=".6"/>
    </>}
    {kind === "headset" && <>
      <path d="M8 36v-6a12 12 0 0 1 24 0v6" {...line}/>
      <rect x="5" y="34" width="8" height="13" rx="3" {...soft}/>
      <rect x="27" y="34" width="8" height="13" rx="3" {...soft}/>
      <rect x="5" y="34" width="8" height="13" rx="3" {...line}/>
      <rect x="27" y="34" width="8" height="13" rx="3" {...line}/>
      <path d="M9 47c0 4 3 6 8 6" {...line} strokeOpacity=".55"/>
    </>}
    {kind === "controller" && <>
      <path d="M12 23h16c5 0 7.5 3.5 8.3 9l1 7.5c.6 4.3-3.4 6.5-6.2 3.7L27 39H13l-4.1 4.2c-2.8 2.8-6.8.6-6.2-3.7l1-7.5C4.5 26.5 7 23 12 23z" {...soft}/>
      <path d="M12 23h16c5 0 7.5 3.5 8.3 9l1 7.5c.6 4.3-3.4 6.5-6.2 3.7L27 39H13l-4.1 4.2c-2.8 2.8-6.8.6-6.2-3.7l1-7.5C4.5 26.5 7 23 12 23z" {...line}/>
      <path d="M12 28.5v6M9 31.5h6" {...line} strokeOpacity=".6"/>
      <path d="M27 29h.01M30 32h.01" {...line} strokeWidth={3} strokeOpacity=".6"/>
    </>}
    {kind === "monitor" && <>
      <rect x="3" y="18" width="34" height="23" rx="2.5" {...soft}/>
      <rect x="3" y="18" width="34" height="23" rx="2.5" {...line}/>
      <path d="M20 41v7M13 49h14" {...line}/>
    </>}
    {kind === "unknown" && <rect x="8" y="20" width="24" height="24" rx="4" {...line}/>}
  </svg>;
}

export function LogoIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M3.5 3h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2z" fill="#6d28d9"/>
    <path d="M5.4 4.8h9.2a1.4 1.4 0 0 1 1.4 1.4v5a1.4 1.4 0 0 1-1.4 1.4h-9.2a1.4 1.4 0 0 1-1.4-1.4v-5a1.4 1.4 0 0 1 1.4-1.4z" fill="#a3e635"/>
  </svg>;
}
