"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type CatChoice = { key: string; href: string; label: string; n: string; current: boolean };

/** The catalogue's Category radios (owner, 2026-11-13: a click shouldn't feel like opening a new page). The pick shows at
 *  once, the list fades while the new one loads, and the page swaps in place without a reload or a jump to the top.
 *  Plain links underneath, so they work without JavaScript and open in a new tab as usual. */
export function CatRadios({ label, head, more }: { label: string; head: CatChoice[]; more: CatChoice[] }) {
  const router = useRouter(), [pending, start] = useTransition();
  const [picked, setPicked] = useState<string | null>(null);
  const on = (c: CatChoice) => (picked ?? [...head, ...more].find(x => x.current)?.key) === c.key;
  const go = (e: React.MouseEvent<HTMLAnchorElement>, c: CatChoice) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setPicked(c.key);
    start(() => router.push(c.href, { scroll: false }));
  };
  const radio = (c: CatChoice) => <a key={c.key} href={c.href} onClick={e => go(e, c)} aria-current={on(c) ? "true" : undefined}>
    <span className="lc-radio" aria-hidden="true"/>{c.label}<small>{c.n}</small></a>;
  return <nav className={`lc-radios${pending ? " is-pending" : ""}`} aria-label={label} aria-busy={pending || undefined}>
    {head.map(radio)}
    {more.length > 0 && <details className="lc-showmore" open={more.some(c => c.current) || undefined}><summary>Show more <span aria-hidden="true">›</span></summary>{more.map(radio)}</details>}
    {/* The list fades while the next category loads (CSS: .lc-grid:has(.lc-radios.is-pending) .lc-rows). */}
  </nav>;
}
