"use client";
// Compare mode on the catalogue (owner 2026-11-16, Claude Design mock https://claude.ai/artifact/Jv7VD7a2asnf83YuKDfxaw):
// a "compare" switch in the sort bar turns the rank numbers into tick boxes; a tap on a row picks it (up to three) and a bar
// fixed to the bottom of the screen holds the picks and opens /compare?ids=… once two are in. The picks live in this tab's
// session storage, never in the address, so the catalogue's cached views and instant filters stay as they are (CI guard).
import { useEffect, useState } from "react";

export const MAX_PICKS = 3;
const KEY = "compare-picks";
export type Pick = { id: string; slug: string; name: string; pic: string | null };

/** The switch and the picks, kept across filter changes, pages and reloads in this tab. */
export function useComparePicks() {
  const [st, setSt] = useState<{ on: boolean; picks: Pick[] }>({ on: false, picks: [] });
  useEffect(() => {
    let next = { on: false, picks: [] as Pick[] };
    try { const s = JSON.parse(sessionStorage.getItem(KEY) ?? "null"); if (s) next = { on: !!s.on, picks: Array.isArray(s.picks) ? s.picks.slice(0, MAX_PICKS) : [] }; } catch { /* private mode */ }
    if (/[?&]compare=1\b/.test(location.search)) next.on = true;
    // A tap that came in before this ran wins over what was saved.
    setSt(s => s.on || s.picks.length ? s : next);
  }, []);
  // Functional updates, so two quick taps both count; every change is saved for this tab.
  const update = (f: (s: { on: boolean; picks: Pick[] }) => { on: boolean; picks: Pick[] }) => setSt(s => {
    const n = f(s); try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch { /* private mode */ } return n; });
  return {
    on: st.on, picks: st.picks,
    toggleMode: () => update(s => ({ ...s, on: !s.on })),
    has: (id: string) => st.picks.some(p => p.id === id),
    toggle: (p: Pick) => update(s => ({ ...s, picks: s.picks.some(x => x.id === p.id) ? s.picks.filter(x => x.id !== p.id) : s.picks.length < MAX_PICKS ? [...s.picks, p] : s.picks })),
    remove: (id: string) => update(s => ({ ...s, picks: s.picks.filter(p => p.id !== id) })),
    clear: () => update(s => ({ ...s, picks: [] })),
  };
}

/** The floating bar: three slots, clear, and "Compare N →" once two are picked. */
export function CompareTray({ picks, remove, clear, one }: { picks: Pick[]; remove: (id: string) => void; clear: () => void; one: string }) {
  const n = picks.length, href = n >= 2 ? `/compare?ids=${picks.map(p => encodeURIComponent(p.slug)).join(",")}` : undefined;
  return <><div className="ct2-trayspace" aria-hidden="true"/>
    <div className="ct2-tray" role="region" aria-label="Compare">
      <div className="slots">{Array.from({ length: MAX_PICKS }, (_, i) => picks[i]).map((p, i) => p
        ? <div key={p.id} className="slot on">{p.pic && <img src={p.pic} alt=""/>}<span>{p.name}</span>
            <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}>✕</button></div>
        : <div key={`e${i}`} className="slot"><span className="e">{`+ pick a ${one}`}</span></div>)}</div>
      <div className="go"><button type="button" className="clear" onClick={clear}>clear</button>
        {href ? <a className="btn on" href={href}>{`Compare ${n} →`}</a> : <span className="btn" aria-disabled="true">{n === 1 ? "pick 1 more" : "pick 2 or 3"}</span>}</div>
    </div></>;
}
