"use client";
import { siteVoice } from "../lib/site-voice";

import { useEffect, useRef, useState } from "react";
import { matchingRackets, currentFirst, type SearchRacket } from "../lib/racket-search";
import { ProductIcon, SearchIcon } from "./icons";
import { niche, catalogPath, productHref } from "../lib/niche";

const w = niche.words;

// Wrap each typed word in <mark> where it appears in the name.
function highlight(name: string, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const marked = new Array<boolean>(name.length).fill(false);
  const lower = name.toLowerCase();
  for (const word of words) {
    const i = lower.indexOf(word);
    if (i >= 0) marked.fill(true, i, i + word.length);
  }
  const parts: React.ReactNode[] = [];
  let start = 0;
  for (let i = 1; i <= name.length; i++) {
    if (i === name.length || marked[i] !== marked[start]) {
      const text = name.slice(start, i);
      parts.push(marked[start] ? <mark key={start}>{text}</mark> : text);
      start = i;
    }
  }
  return parts;
}

const noteCount = (n?: number) => n === undefined ? "" : n === 0 ? "no reviews yet" : `${n} ${n === 1 ? "review" : "reviews"}`;

/** The Thread look's badge colours (app/thread/ui.tsx tone): green 85+, yellow 70–84, white under 70. */
const toneOf = (n: number) => n >= 85 ? "g" : n >= 70 ? "y" : "w";
/** "Siux Electra Pro 2026" → "Siux Electra Pro (2026)", as the Thread rows write it. */
const withYear = (r: SearchRacket) => r.year && new RegExp(`\\s${r.year}$`).test(r.name) ? `${r.name.replace(new RegExp(`\\s${r.year}$`), "")} (${r.year})` : r.name;

/** The racket search with live suggestions. `thread` draws it in the Thread look (app/thread/live/header.tsx): current models
 *  first, thumbnail, "Name (year)" and the Player score badge. `id` keeps two boxes on one page apart (header and menu);
 *  `shortcut` binds "/" to this box; `hidden` adds fields to the plain search (Enter with no pick goes to the catalogue). */
export function RacketSearch({ placeholder, thread = false, id = "search", shortcut = true, hidden = {} }: { placeholder?: string; thread?: boolean; id?: string; shortcut?: boolean; hidden?: Record<string, string> } = {}) {
  const [query, setQuery] = useState("");
  const [rackets, setRackets] = useState<SearchRacket[] | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const typed = query.trim();
  // Empty box: suggest the most-discussed rackets so the dropdown is useful straight away.
  const order = (l: SearchRacket[]) => thread ? currentFirst(l) : l;
  const matches = !rackets ? [] : typed
    ? order(matchingRackets(rackets, query)).slice(0, 8)
    : order([...rackets].filter(r => (r.notes ?? 0) > 0 && (!thread || r.current !== false)).sort((a, b) => (b.notes ?? 0) - (a.notes ?? 0))).slice(0, 5);
  const listId = `${id}-results`, optId = (i: number) => `${id}-option-${i}`;
  const expanded = open && (!!typed || matches.length > 0);

  // Load the small public name index once, then narrow it immediately on every keystroke.
  useEffect(() => {
    if (!open || rackets || failed) return;
    const controller = new AbortController();
    fetch("/api/racket-search", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Search unavailable");
        return response.json() as Promise<SearchRacket[]>;
      })
      .then(setRackets)
      .catch(error => { if (error.name !== "AbortError") setFailed(true); });
    return () => controller.abort();
  }, [open, rackets, failed]);

  useEffect(() => {
    if (active >= 0) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // "/" jumps to search from anywhere that isn't a text field.
  useEffect(() => {
    if (!shortcut) return;
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !target.closest("input, textarea, select, [contenteditable]")) { event.preventDefault(); input.current?.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const keys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setOpen(false); setActive(-1); }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && matches.length) {
      event.preventDefault(); setOpen(true);
      setActive(index => event.key === "ArrowDown" ? (index + 1) % matches.length : (index <= 0 ? matches.length : index) - 1);
    }
    if (event.key === "Enter" && expanded && active >= 0 && matches[active]) {
      event.preventDefault(); window.location.assign(productHref(matches[active]));
    }
  };
  const field = (className?: string) => <input id={id} name="q" ref={input} className={className} placeholder={placeholder ?? `Search ${w.many} — try “${niche.examples.search}”`} autoComplete="off"
    role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={listId}
    aria-activedescendant={expanded && active >= 0 ? optId(active) : undefined}
    value={query} onFocus={() => setOpen(true)}
    onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }} onKeyDown={keys}/>;
  const blur = (event: React.FocusEvent<HTMLFormElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); } };
  const status = <span className="sr-only vh" role="status">{rackets && typed ? `${matches.length} matching ${matches.length === 1 ? w.one : w.many}` : ""}</span>;

  if (thread) return <form action={catalogPath} className="th-search th-ac" role="search" onBlur={blur}>
    {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v}/>)}
    <label className="vh" htmlFor={id}>{`Search ${w.many}`}</label>
    {field()}
    {expanded && <div className="th-ac-drop">
      {!typed && matches.length > 0 && <span className="th-ac-h">Most discussed</span>}
      <ul id={listId} role="listbox" aria-label={`Matching ${w.many}`} ref={list}>
        {matches.map((r, index) => <li key={r.slug} role="presentation">
          <a className="th-ac-item" id={optId(index)} role="option" aria-selected={index === active} tabIndex={-1} href={productHref(r)} onMouseEnter={() => setActive(index)}>
            <span className="th-ac-pic">{r.photo ? <img src={r.photo} alt="" loading="lazy"/> : null}</span>
            <span className="th-ac-name"><span>{highlight(withYear(r), typed)}</span>{r.current === false && <small>older model</small>}</span>
            {r.score != null && <span className={`th-badge xs ${toneOf(r.score)}`}>{r.score}</span>}
          </a>
        </li>)}
      </ul>
      {status}
      {typed && matches.length > 0 && <p className="th-ac-foot">Enter to see every result for “{typed}”</p>}
      {!matches.length && <p className="th-ac-foot" role="status">{failed ? "Press Enter to search." : !rackets ? `Loading ${w.many}…` : `No ${w.one} matches “${typed}”. Press Enter to search the catalogue.`}</p>}
    </div>}
  </form>;

  return <form action={catalogPath} className="search" role="search" onBlur={blur}>
    <div className="search-box">
      <SearchIcon/>
      <label className="sr-only" htmlFor={id}>{`Search ${w.many}`}</label>
      {field()}
      <button className="sr-only" type="submit">Search</button>
    </div>
    {open && (typed || matches.length > 0 || !rackets) && <div className="search-dropdown">
      {matches.length > 0 && <h4>{typed ? w.Many : "Most discussed"}</h4>}
      <ul id={listId} role="listbox" aria-label={`Matching ${w.many}`} ref={list}>
        {matches.map((racket, index) => <li key={racket.slug} role="presentation">
          <a className="sug-item" id={optId(index)} role="option" aria-selected={index === active}
            tabIndex={-1} href={productHref(racket)} onMouseEnter={() => setActive(index)}>
            {racket.photo ? <img className="sug-photo" src={racket.photo} alt="" loading="lazy"/> : <ProductIcon shape={racket.shape} brand={racket.brand}/>}
            <span className="nm">{highlight(racket.name, typed)}{racket.shape && <span className="mt">{racket.shape}</span>}</span>
            <span className="ct">{noteCount(racket.notes)}</span>
          </a>
        </li>)}
      </ul>
      {status}
      {typed && matches.length > 0 && <p className="search-foot">↵ Enter to see every result for “{typed}”</p>}
      {!matches.length && <p className="search-status" role="status">{
        failed ? "Press Enter to search." :
        !rackets ? `Loading ${w.many}…` :
        siteVoice() ? <><b>{siteVoice()!.empty.search}</b> <a href="/add-review">Add it with a review →</a></>
        : <><b>{`No ${w.one} found.`}</b>Either it’s very new, very obscure, or we need to add it. <a href="/add-review">Add it with a review →</a></>
      }</p>}
    </div>}
  </form>;
}
