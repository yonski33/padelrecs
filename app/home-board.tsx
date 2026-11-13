"use client";
// The home leaderboard (owner, 2026-11-13): the category row and the search box filter the list on the page, with no
// reload, and the search box keeps its focus while you type. The server sends every row once, in order; this shows the
// matching rows, numbers them #1, #2… (CSS counter) and keeps the address in step (?shape=… and ?q=…) so a category or
// a search can still be linked to and shared. The search box sits in the hero (HomeSearch) and talks to the list with a
// window event.
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type BoardItem = { key: string; shape: string | null; text: string; node: ReactNode };
type Cat = { key: string; label: string };
// 15 rows first, the last ones fading out over a Show more button (owner, 2026-11-13).
const PAGE = 15, EVENT = "home-search";

/** Lower case, accents and punctuation off, so "La Roche-Posay" matches "la roche posay". */
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const matches = (text: string, q: string) => { const t = norm(text), words = norm(q).split(" ").filter(Boolean); return words.every(w => t.includes(w)); };

function setParam(key: string, value: string | undefined, push: boolean) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
  url.searchParams.delete("show"); url.hash = "";
  if (push) window.history.pushState(null, "", url); else window.history.replaceState(null, "", url);
}

/** The hero's search box: filters the list below as you type (no reload). Enter does the same. */
export function HomeSearch({ initial, placeholder, label }: { initial?: string; placeholder: string; label: string }) {
  const [q, setQ] = useState(initial ?? "");
  const send = (v: string) => { setQ(v); window.dispatchEvent(new CustomEvent(EVENT, { detail: v })); setParam("q", v.trim() || undefined, false); };
  return <form className="lt-search" action="/" onSubmit={e => { e.preventDefault(); send(q); document.getElementById("board")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
    <input type="search" name="q" value={q} onChange={e => send(e.target.value)} placeholder={placeholder} aria-label={label} autoComplete="off"/>
    <button type="submit">Search</button>
  </form>;
}

/** base: the rest of the address (order), the same on the server and in the browser so links match. */
export function HomeBoard({ cats, initial, initialQ, ranked, items, empty, noMatch, base, aside, noun, sort }: { cats: Cat[]; initial?: string; initialQ?: string; ranked: boolean; items: BoardItem[]; empty: ReactNode; noMatch: string; base: string; aside?: ReactNode; noun: [string, string]; sort?: ReactNode }) {
  const [shape, setShape] = useState<string | undefined>(cats.some(c => c.key === initial) ? initial : undefined);
  const [q, setQ] = useState(initialQ ?? "");
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    const onSearch = (e: Event) => { setQ((e as CustomEvent<string>).detail); setShown(PAGE); };
    // Back and forward move between categories and searches too.
    const onPop = () => { const p = new URLSearchParams(window.location.search), s = p.get("shape") ?? undefined; setShape(cats.some(c => c.key === s) ? s : undefined); setQ(p.get("q") ?? ""); setShown(PAGE); };
    window.addEventListener(EVENT, onSearch); window.addEventListener("popstate", onPop);
    return () => { window.removeEventListener(EVENT, onSearch); window.removeEventListener("popstate", onPop); };
  }, [cats]);
  const pick = (key: string | undefined) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // a new tab keeps the plain link
    e.preventDefault();
    setShape(key); setShown(PAGE); setParam("shape", key, true);
    e.currentTarget.closest("details")?.removeAttribute("open");
  };
  const href = (key?: string) => { const p = new URLSearchParams(base); if (key) p.set("shape", key); const s = p.toString(); return s ? `/?${s}` : "/"; };
  const searched = q.trim() ? items.filter(i => matches(i.text, q)) : items;
  const visible = searched.filter(i => !shape || i.shape === shape);
  const count = (key: string) => searched.filter(i => i.shape === key).length;
  const shownCats = cats.filter(c => count(c.key) > 0 || c.key === shape);
  const head = shownCats.slice(0, 4), more = shownCats.slice(4), current = cats.find(c => c.key === shape);
  // A rank number means a place in the ranking, so it shows only without a search.
  const numbered = ranked && !q.trim();

  return <>
    <div className="lt-bar">
      {cats.length > 1 && <nav className="lt-cats" aria-label="Categories">
        <a href={href()} onClick={pick(undefined)} aria-current={!shape ? "true" : undefined}>All<small>{searched.length.toLocaleString("en-US")}</small></a>
        {head.map(c => <a key={c.key} href={href(c.key)} onClick={pick(c.key)} aria-current={shape === c.key ? "true" : undefined}>{c.label}<small>{count(c.key).toLocaleString("en-US")}</small></a>)}
        {more.length > 0 && <details className="lc-more"><summary>{more.some(c => c.key === shape) ? current!.label : "More"} <span aria-hidden="true">⌄</span></summary>
          <div>{more.map(c => <a key={c.key} href={href(c.key)} onClick={pick(c.key)} aria-current={shape === c.key ? "true" : undefined}>{c.label}<small>{count(c.key).toLocaleString("en-US")}</small></a>)}</div></details>}
      </nav>}
      {/* Sort at the right end of the tab row (owner, 2026-11-13): no extra line between the tabs and the list. */}
      {(sort || aside) && <div className="lt-bar-aside">{sort}{aside}</div>}
    </div>
    {/* The count and the order, right over the list, as over the reviews on a product page (owner, 2026-11-13). */}
    {q.trim() && items.length > 0 && <p className="lt-filtered">{`${visible.length.toLocaleString("en-US")} for “${q.trim()}”`}</p>}
    {/* The first row's signal explains itself on hover or tap (owner, 2026-11-13); the words sit once, in a CSS variable. */}
    {visible.length ? <div style={{ "--sig-tip": JSON.stringify("Signal score: how well reviewed this is next to others of its kind, out of 100. Positive reviews raise it, weighed by how many there are; negative and mixed reviews take points off.") } as React.CSSProperties} className={`prow-list lt-list${numbered ? " ranked" : ""}${visible.length > shown ? " lt-faded" : ""}`}>
      {visible.slice(0, shown).map((it, i) => <div key={it.key} className={`lt-slot${numbered && i < 3 ? ` lt-top lt-top${i + 1}` : ""}${i === 0 ? " lt-first" : ""}`}>{it.node}</div>)}
    </div> : items.length ? <p className="lt-filtered">{noMatch}</p> : empty}
    {visible.length > shown && <div className="load-more"><button type="button" className="button ghost" onClick={() => setShown(shown + PAGE)}>Show more</button></div>}
  </>;
}

/** "Sort: Top rated ⌄" over the list. Changing it updates the page in place (no full reload). */
export function HomeSort({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  return <label className="lt-sort"><span>Sort:</span>
    <select value={value} onChange={e => { const url = new URL(window.location.href); if (e.target.value) url.searchParams.set("sort", e.target.value); else url.searchParams.delete("sort"); url.hash = ""; router.replace(`${url.pathname}${url.search}`, { scroll: false }); }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select></label>;
}
