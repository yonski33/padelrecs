"use client";

import { useEffect, useRef, useState } from "react";
import { matchingRackets, type SearchRacket } from "../lib/racket-search";
import { RacketIcon, SearchIcon } from "./icons";

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

export function RacketSearch() {
  const [query, setQuery] = useState("");
  const [rackets, setRackets] = useState<SearchRacket[] | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const typed = query.trim();
  // Empty box: suggest the most-discussed rackets so the dropdown is useful straight away.
  const matches = !rackets ? [] : typed
    ? matchingRackets(rackets, query).slice(0, 8)
    : [...rackets].filter(r => (r.notes ?? 0) > 0).sort((a, b) => (b.notes ?? 0) - (a.notes ?? 0)).slice(0, 5);
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
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !target.closest("input, textarea, select, [contenteditable]")) { event.preventDefault(); input.current?.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return <form action="/rackets" className="search" role="search" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); }
  }}>
    <div className="search-box">
      <SearchIcon/>
      <label className="sr-only" htmlFor="search">Search rackets</label>
      <input id="search" name="q" ref={input} placeholder="Search rackets — try “nox”" autoComplete="off"
        role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls="racket-search-results"
        aria-activedescendant={expanded && active >= 0 ? `racket-search-option-${active}` : undefined}
        value={query} onFocus={() => setOpen(true)}
        onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={event => {
          if (event.key === "Escape") { setOpen(false); setActive(-1); }
          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && matches.length) {
            event.preventDefault(); setOpen(true);
            setActive(index => event.key === "ArrowDown" ? (index + 1) % matches.length : (index <= 0 ? matches.length : index) - 1);
          }
          if (event.key === "Enter" && expanded && active >= 0 && matches[active]) {
            event.preventDefault(); window.location.assign(`/rackets/${matches[active].slug}`);
          }
        }}/>
      <button className="sr-only" type="submit">Search</button>
    </div>
    {open && (typed || matches.length > 0 || !rackets) && <div className="search-dropdown">
      {matches.length > 0 && <h4>{typed ? "Rackets" : "Most discussed"}</h4>}
      <ul id="racket-search-results" role="listbox" aria-label="Matching rackets" ref={list}>
        {matches.map((racket, index) => <li key={racket.slug} role="presentation">
          <a className="sug-item" id={`racket-search-option-${index}`} role="option" aria-selected={index === active}
            tabIndex={-1} href={`/rackets/${racket.slug}`} onMouseEnter={() => setActive(index)}>
            <RacketIcon shape={racket.shape}/>
            <span className="nm">{highlight(racket.name, typed)}{racket.shape && <span className="mt">{racket.shape}</span>}</span>
            <span className="ct">{noteCount(racket.notes)}</span>
          </a>
        </li>)}
      </ul>
      <span className="sr-only" role="status">{rackets && typed ? `${matches.length} matching ${matches.length === 1 ? "racket" : "rackets"}` : ""}</span>
      {typed && matches.length > 0 && <p className="search-foot">↵ Enter to see every result for “{typed}”</p>}
      {!matches.length && <p className="search-status" role="status">{
        failed ? "Press Enter to search." :
        !rackets ? "Loading rackets…" :
        <><b>No racket found.</b>Either it’s very new, very obscure, or we need to add it. <a href="/add-review">Add it with a review →</a></>
      }</p>}
    </div>}
  </form>;
}
