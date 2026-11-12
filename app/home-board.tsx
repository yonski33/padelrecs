"use client";
// The home leaderboard's category row (owner, 2026-11-13): picking a category filters the list on the page, with no
// reload. The server sends every row once, in order; this shows the chosen category's rows, numbers them #1, #2… in
// that category, and keeps the address in step (?shape=…) so a category can still be linked to and shared.
import { useEffect, useState, type ReactNode } from "react";

export type BoardItem = { key: string; shape: string | null; node: ReactNode };
type Cat = { key: string; label: string; n: number };
const PAGE = 30;

/** base: the rest of the address (search, order), the same on the server and in the browser so links match. */
export function HomeBoard({ cats, allCount, initial, ranked, items, empty, base }: { cats: Cat[]; allCount: number; initial?: string; ranked: boolean; items: BoardItem[]; empty: ReactNode; base: string }) {
  const [shape, setShape] = useState<string | undefined>(cats.some(c => c.key === initial) ? initial : undefined);
  const [shown, setShown] = useState(PAGE);
  // Back and forward move between categories too.
  useEffect(() => {
    const onPop = () => { const s = new URLSearchParams(window.location.search).get("shape") ?? undefined; setShape(cats.some(c => c.key === s) ? s : undefined); setShown(PAGE); };
    window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop);
  }, [cats]);
  const pick = (key: string | undefined) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // a new tab keeps the plain link
    e.preventDefault();
    setShape(key); setShown(PAGE);
    const url = new URL(window.location.href);
    if (key) url.searchParams.set("shape", key); else url.searchParams.delete("shape");
    url.searchParams.delete("show"); url.hash = "";
    window.history.pushState(null, "", url);
    e.currentTarget.closest("details")?.removeAttribute("open");
  };
  const href = (key?: string) => { const q = new URLSearchParams(base); if (key) q.set("shape", key); const s = q.toString(); return s ? `/?${s}` : "/"; };
  const visible = items.filter(i => !shape || i.shape === shape);
  const head = cats.slice(0, 5), more = cats.slice(5), current = cats.find(c => c.key === shape);

  return <>
    <div className="lt-bar">
      {cats.length > 1 && <nav className="lt-cats" aria-label="Categories">
        <a href={href()} onClick={pick(undefined)} aria-current={!shape ? "true" : undefined}>All<small>{allCount.toLocaleString("en-US")}</small></a>
        {head.map(c => <a key={c.key} href={href(c.key)} onClick={pick(c.key)} aria-current={shape === c.key ? "true" : undefined}>{c.label}<small>{c.n.toLocaleString("en-US")}</small></a>)}
        {more.length > 0 && <details className="lc-more"><summary>{more.some(c => c.key === shape) ? current!.label : "More"} <span aria-hidden="true">⌄</span></summary>
          <div>{more.map(c => <a key={c.key} href={href(c.key)} onClick={pick(c.key)} aria-current={shape === c.key ? "true" : undefined}>{c.label}<small>{c.n.toLocaleString("en-US")}</small></a>)}</div></details>}
      </nav>}
    </div>
    {visible.length ? <div className={`prow-list lt-list${ranked ? " ranked" : ""}`}>
      {visible.slice(0, shown).map((it, i) => <div key={it.key} className={`lt-slot${ranked && i < 3 ? ` lt-top lt-top${i + 1}` : ""}`}>{it.node}</div>)}
    </div> : empty}
    {visible.length > shown && <div className="load-more"><button type="button" className="button ghost" onClick={() => setShown(shown + PAGE)}>Show more</button></div>}
  </>;
}
