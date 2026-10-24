"use client";
import { useEffect, useRef } from "react";

/** A sideways-scrolling row of pill links (product types). On phones it scrolls the current one into view. */
export function ChipRow({ label, className, inner = "", children }: { label: string; className?: string; inner?: string; children: React.ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current, current = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !current) return;
    // Measure from the row itself (offsetLeft counts from the page), and leave the row alone when the current chip is
    // already fully in view, so "All" and other early chips are never scrolled out of sight on wide screens.
    const box = el.getBoundingClientRect(), chip = current.getBoundingClientRect();
    if (chip.left >= box.left && chip.right <= box.right) return;
    el.scrollLeft += chip.left - box.left - (el.clientWidth - chip.width) / 2;
  });
  return <nav className={className} aria-label={label}><div className={`chips ${inner}`} ref={row}>{children}</div></nav>;
}
