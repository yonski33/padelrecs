"use client";

import { useEffect, useState } from "react";
import "./compare-lists.css";

// Picking products to compare from list rows: a small checkbox on each row and a bar at the bottom of the screen once
// something is picked. The pick lives in this tab's sessionStorage, so it survives "Show more" pages and type tabs.

type Pick = { slug: string; name: string };
const KEY = "recs-compare", EVENT = "recs-compare-change", MAX = 3;

function read(): Pick[] {
  try { const v = JSON.parse(sessionStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.slice(0, MAX) : []; } catch { return []; }
}
function write(picks: Pick[]) {
  try { sessionStorage.setItem(KEY, JSON.stringify(picks)); } catch { /* private mode: the pick just won't persist */ }
  window.dispatchEvent(new Event(EVENT));
}
function usePicks() {
  const [picks, setPicks] = useState<Pick[]>([]);
  useEffect(() => {
    const sync = () => setPicks(read());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return picks;
}

export function CompareCheck({ slug, name }: Pick) {
  const picks = usePicks();
  const on = picks.some(p => p.slug === slug), full = !on && picks.length >= MAX;
  return <label className={`cmp-check${on ? " on" : ""}${full ? " full" : ""}`} title={full ? `You can compare up to ${MAX}` : undefined}>
    <input type="checkbox" checked={on} disabled={full}
      onChange={() => write(on ? read().filter(p => p.slug !== slug) : [...read().filter(p => p.slug !== slug), { slug, name }].slice(0, MAX))}/>
    <span>Compare</span>
  </label>;
}

export function CompareTray({ noun }: { noun: string }) {
  const picks = usePicks();
  if (!picks.length) return null;
  const href = `/compare?ids=${picks.map(p => encodeURIComponent(p.slug)).join(",")}`;
  return <div className="cmp-tray" role="region" aria-label="Compare">
    <ul>{picks.map(p => <li key={p.slug}><span>{p.name}</span>
      <button type="button" aria-label={`Remove ${p.name}`} onClick={() => write(read().filter(x => x.slug !== p.slug))}>×</button></li>)}</ul>
    <span className="cmp-tray-count">{`${picks.length} of ${MAX} picked`}</span>
    <div className="cmp-tray-go">
      <button type="button" className="cmp-tray-clear" onClick={() => write([])}>Clear</button>
      {picks.length >= 2 ? <a className="button" href={href}>{`Compare ${picks.length} →`}</a>
        : <span className="cmp-tray-more">{`Pick one more ${noun}`}</span>}
    </div>
  </div>;
}
