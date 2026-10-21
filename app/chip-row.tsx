"use client";
import { useEffect, useRef } from "react";

/** A sideways-scrolling row of pill links (product types). On phones it scrolls the current one into view. */
export function ChipRow({ label, className, inner = "", children }: { label: string; className?: string; inner?: string; children: React.ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current, current = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && current) el.scrollLeft = current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2;
  });
  return <nav className={className} aria-label={label}><div className={`chips ${inner}`} ref={row}>{children}</div></nav>;
}
