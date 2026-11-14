"use client";

import { useEffect, useState } from "react";

const KEY = "recs-highlights";
const OFF = "hl-off";

/** "Highlights" on/off switch next to the review sort (owner, 2026-11-14). On by default; the choice is kept in this browser
 *  and flips a class on <html>, so the marks change at once with no reload. The inline script in HighlightBoot sets the class
 *  before the reviews paint, so a reader who turned them off never sees them flash. */
export function HighlightToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => { setOn(!document.documentElement.classList.contains(OFF)); }, []);
  const flip = () => {
    const next = !on;
    setOn(next);
    document.documentElement.classList.toggle(OFF, !next);
    try { if (next) localStorage.removeItem(KEY); else localStorage.setItem(KEY, "off"); } catch { /* private mode: this page only */ }
  };
  return <button type="button" className="hl-toggle" role="switch" aria-checked={on} onClick={flip}>
    <span className="hl-toggle-track" aria-hidden="true"><span className="hl-toggle-dot"/></span>Highlights
  </button>;
}

/** Applies a saved "off" before first paint. */
export function HighlightBoot() {
  return <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem(${JSON.stringify(KEY)})==="off")document.documentElement.classList.add(${JSON.stringify(OFF)})}catch(e){}` }}/>;
}
