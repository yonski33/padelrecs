"use client";
// A sticky side column that never hides its own bottom (owner 2026-11-22: "make the right column sticky"): when the column
// fits the window it sticks under the header; when it is taller, it sticks with its bottom 16px above the window's bottom, so
// every part can still be read while the long table beside it scrolls. CSS does the sticking (.thc-v19 .thc-row-r).
import { useEffect, useRef, type ReactNode } from "react";

export function StickyCol({ className, children, head = 76 }: { className: string; children: ReactNode; head?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const fit = () => { el.style.top = `${Math.min(head, window.innerHeight - el.offsetHeight - 16)}px`; };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el); window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, [head]);
  return <div ref={ref} className={className}>{children}</div>;
}
