"use client";

import { useEffect, useState } from "react";
import { HIGHLIGHT_KEY as KEY } from "../lib/highlight-boot";

/** "Highlights" on/off switch next to the review sort (owner, 2026-11-14). On by default; the choice is kept in this browser
 *  and sets data-hl="off" on <html>, so the marks change at once with no reload. It's an attribute React doesn't manage: a class
 *  on <html> is React's (the layout sets it) and gets reset whenever React re-renders the root. HIGHLIGHT_BOOT runs in <head>
 *  before the reviews paint, so a reader who turned them off never sees them flash. */
export function HighlightToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => { setOn(document.documentElement.dataset.hl !== "off"); }, []);
  const flip = () => {
    const next = !on;
    setOn(next);
    if (next) delete document.documentElement.dataset.hl; else document.documentElement.dataset.hl = "off";
    try { if (next) localStorage.removeItem(KEY); else localStorage.setItem(KEY, "off"); } catch { /* private mode: this page only */ }
  };
  return <button type="button" className="hl-toggle" role="switch" aria-checked={on} onClick={flip}>
    <span className="hl-toggle-track" aria-hidden="true"><span className="hl-toggle-dot"/></span>Highlights
  </button>;
}
