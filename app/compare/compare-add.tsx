"use client";

import { useEffect, useState } from "react";
import { matchingRackets, type SearchRacket } from "../../lib/racket-search";
import { ProductIcon, SearchIcon } from "../icons";

/** "Add a product" on the compare page: the header search's name index, but picking a name adds it to the comparison.
 *  Without JavaScript the suggestion links beside it still work. */
export function CompareAdd({ slugs, label, autoFocus = false }: { slugs: string[]; label: string; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState<SearchRacket[] | null>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || all) return;
    fetch("/api/racket-search").then(r => r.ok ? r.json() : []).then(setAll).catch(() => setAll([]));
  }, [open, all]);
  const typed = query.trim();
  const matches = all && typed ? matchingRackets(all.filter(r => !slugs.includes(r.slug)), query).slice(0, 6) : [];
  const href = (slug: string) => `/compare?ids=${[...slugs, slug].map(encodeURIComponent).join(",")}`;
  return <div className="cmp-search" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <div className="search-box">
      <SearchIcon/>
      <input aria-label={label} placeholder={label} value={query} autoComplete="off" autoFocus={autoFocus} role="combobox" aria-expanded={open && matches.length > 0}
        onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === "ArrowDown" && matches.length) { e.preventDefault(); setActive(i => (i + 1) % matches.length); }
          if (e.key === "ArrowUp" && matches.length) { e.preventDefault(); setActive(i => (i - 1 + matches.length) % matches.length); }
          if (e.key === "Enter" && matches[active]) { e.preventDefault(); window.location.assign(href(matches[active].slug)); }
          if (e.key === "Escape") setOpen(false);
        }}/>
    </div>
    {open && typed && <div className="search-dropdown">
      {matches.length ? <ul role="listbox">{matches.map((r, i) => <li key={r.slug} role="presentation">
        <a className="sug-item" role="option" aria-selected={i === active} href={href(r.slug)} onMouseEnter={() => setActive(i)}>
          {r.photo ? <img className="sug-photo" src={r.photo} alt="" loading="lazy"/> : <ProductIcon shape={r.shape} brand={r.brand}/>}
          <span className="nm">{r.name}{r.shape && <span className="mt">{r.shape}</span>}</span>
          <span className="ct">{r.notes ? `${r.notes} reviews` : ""}</span>
        </a>
      </li>)}</ul> : <p className="search-status">{all ? "No match." : "Loading…"}</p>}
    </div>}
  </div>;
}
