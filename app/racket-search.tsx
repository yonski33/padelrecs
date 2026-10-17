"use client";

import { useEffect, useRef, useState } from "react";
import { matchingRackets, type SearchRacket } from "../lib/racket-search";

export function RacketSearch() {
  const [query, setQuery] = useState("");
  const [rackets, setRackets] = useState<SearchRacket[] | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const list = useRef<HTMLUListElement>(null);
  const matches = rackets && query.trim() ? matchingRackets(rackets, query) : [];
  const expanded = open && !!query.trim();

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

  return <form action="/rackets" className="search" role="search" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); }
  }}>
    <div className="search-input-wrap">
      <label className="sr-only" htmlFor="search">Search rackets</label>
      <input id="search" name="q" placeholder="Search rackets…" autoComplete="off"
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
      {expanded && <div className="search-dropdown">
        <ul id="racket-search-results" role="listbox" aria-label="Matching rackets" ref={list}>
          {matches.map((racket, index) => <li key={racket.slug} role="presentation">
            <a id={`racket-search-option-${index}`} role="option" aria-selected={index === active}
              tabIndex={-1} href={`/rackets/${racket.slug}`} onMouseEnter={() => setActive(index)}>{racket.name}</a>
          </li>)}
        </ul>
        <span className="search-status sr-only" role="status">{rackets ? `${matches.length} matching ${matches.length === 1 ? "racket" : "rackets"}` : ""}</span>
        {!matches.length && <p className="search-status" role="status">{failed ? "Press Enter to search." : !rackets ? "Loading rackets…" : "No matching rackets."}</p>}
      </div>}
    </div>
    <button aria-label="Search">Go</button>
  </form>;
}
