"use client";
// The Thread header (README "Header"): logo, Rackets · Rankings · Guides with the current page in bold, and search. Brands is
// off the menu (owner 2026-11-19); the brand pages stay live and are linked from racket pages and the catalog.
// On phones a Menu button opens the same links full width. Search goes to the catalogue, which filters in the browser.
import { useState } from "react";
import { th, GUIDE_PATHS, THREAD_DEFAULT } from "../../../lib/thread/look";

export type Section = "rackets" | "rankings" | "brands" | "guides" | null;
const NAV: [Exclude<Section, null>, string, string][] = [["rackets", "Rackets", "/rackets"], ["rankings", "Rankings", "/rankings"], ["guides", "Guides", GUIDE_PATHS.racket]];

function Search() {
  return <form className="th-search" action="/rackets" role="search">
    {!THREAD_DEFAULT && <input type="hidden" name="look" value="thread"/>}
    <label className="vh" htmlFor="th-q">Search rackets</label>
    <input id="th-q" name="q" placeholder="Search rackets" autoComplete="off"/>
  </form>;
}

export function ThreadHeader({ active }: { active: Section }) {
  const [open, setOpen] = useState(false);
  return <header className="th-head">
    <div className="th-head-in">
      <a className="th-logo" href={th("/")}><span className="th-dot" aria-hidden="true"/>PadelRecs</a>
      <nav className="th-nav" aria-label="Main">{NAV.map(([k, label, href]) => <a key={k} href={th(href)} aria-current={active === k ? "page" : undefined}>{label}</a>)}</nav>
      <span className="th-grow"/>
      <Search/>
      <button type="button" className="th-menu-btn" aria-expanded={open} aria-controls="th-menu" onClick={() => setOpen(o => !o)}>
        <span className="th-burger" aria-hidden="true"><i/><i/><i/></span>{open ? "Close" : "Menu"}
      </button>
    </div>
    {open && <div className="th-menu" id="th-menu">
      {NAV.map(([k, label, href]) => <a key={k} href={th(href)} aria-current={active === k ? "page" : undefined}>{label}</a>)}
      <Search/>
    </div>}
  </header>;
}
