"use client";
// "N reviews at a glance" (paddle page v3, owner handoff 2026-11-26): the first rows, then "Show all N ↓" / "Show fewer ↑".
// The rows are server-rendered links to the review cards (live/creator-reviews.tsx opens and scrolls to the card); this only
// toggles how many show, in the browser, so the page's cache is untouched.
import { useState, type ReactNode } from "react";

export function GlanceTable({ title, sub, head, rows, first = 3 }: { title: string; sub: string; head: ReactNode; rows: ReactNode[]; first?: number }) {
  const [all, setAll] = useState(false);
  return <section id="creators" className="thc-box1 flush thc-glance">
    <div className="thc-h rule"><strong>{title}</strong><span>{sub}</span></div>
    {head}
    {all ? rows : rows.slice(0, first)}
    {rows.length > first && <button type="button" className="thc-g-tog" aria-expanded={all} onClick={() => setAll(a => !a)}>
      {all ? "Show fewer ↑" : `Show all ${rows.length} ↓`}</button>}
  </section>;
}
