"use client";
import { useEffect, useRef } from "react";

/** A number that counts up to its value when the page opens (owner, 2026-11-12: makes the site feel active). The real
 *  number is in the HTML, so search engines and visitors without JavaScript see it; reduced-motion users get it as is. */
export function CountUp({ value, from = 0.9, ms = 1200 }: { value: number; from?: number; ms?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = Math.floor(value * from), t0 = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms), eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(start + (value - start) * eased).toLocaleString("en-US");
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, from, ms]);
  return <span ref={el} className="count-up">{value.toLocaleString("en-US")}</span>;
}
