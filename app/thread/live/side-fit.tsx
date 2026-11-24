"use client";
// The sticky sidebar on short screens (owner bug 2026-11-22, 13" laptop): .th-side sticks 76px from the top, so when it is
// taller than the window its bottom (The basics, Check price) never came into view. When it doesn't fit, it sticks by its
// bottom edge instead: it scrolls with the page until its end is in view, then stays there. Short sidebars keep the CSS top.
import { useEffect } from "react";

const TOP = 76; // .th-side's CSS top (below the sticky site header)
const GAP = 16; // room under the sidebar's bottom edge

export function SideFit() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".th-side"));
    if (els.length === 0) return;
    const fit = () => {
      for (const el of els) {
        const room = window.innerHeight - GAP;
        el.style.top = el.offsetHeight + TOP > room ? `${Math.min(TOP, room - el.offsetHeight)}px` : "";
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    els.forEach(el => ro.observe(el));
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, []);
  return null;
}
