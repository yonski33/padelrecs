"use client";
// The Thread header (README "Header"): logo, Rackets · Rankings · Guides with the current page in bold, and search. Brands is
// off the menu (owner 2026-11-19); the brand pages stay live and are linked from racket pages and the catalog.
// On phones a Menu button opens the same links full width, with the same search.
import { useState } from "react";
import { th, GUIDE_PATHS, THREAD_DEFAULT } from "../../../lib/thread/look";
import { RacketSearch } from "../../racket-search";
import { niche, catalogPath } from "../../../lib/niche";

/** The site's review flow (app/add-review): the header's "Add a review" (owner 2026-11-19, as on classic). */
const ADD = "/add-review";
export type Section = "rackets" | "rankings" | "brands" | "guides" | null;
const PADEL_NAV: [Exclude<Section, null>, string, string][] = [["rackets", niche.words.Many, catalogPath], ["rankings", "Rankings", "/rankings"], ["guides", "Guides", GUIDE_PATHS.racket]];
/** StackRecs (no guides yet): Tools and Rankings. "rackets" stays the catalogue's section key. */
const STACK_NAV: [Exclude<Section, null>, string, string][] = [["rackets", "Tools", catalogPath], ["rankings", "Rankings", "/rankings"]];
const NAV = niche.id === "stackrecs" ? STACK_NAV : PADEL_NAV;

// The site's own racket search (app/racket-search.tsx: the shared name index and fuzzy matching) in the Thread look: live
// suggestions as you type, current models first, keyboard up/down/enter; Enter with no pick filters the catalogue.
function Search({ id, shortcut = true }: { id: string; shortcut?: boolean }) {
  return <RacketSearch thread id={id} shortcut={shortcut} placeholder={`Search ${niche.words.many}`} hidden={THREAD_DEFAULT ? {} : { look: "thread" }}/>;
}

export function ThreadHeader({ active }: { active: Section }) {
  const [open, setOpen] = useState(false);
  return <header className="th-head">
    <div className="th-head-in">
      <a className="th-logo" href={th("/")}><span className="th-dot" aria-hidden="true"/>{niche.site.name}</a>
      <nav className="th-nav" aria-label="Main">{NAV.map(([k, label, href]) => <a key={k} href={th(href)} aria-current={active === k ? "page" : undefined}>{label}</a>)}</nav>
      <span className="th-grow"/>
      <Search id="th-q"/>
      <a className="th-add" href={ADD}>Add a review</a>
      <a className="th-add-plus" href={ADD} aria-label="Add a review">+</a>
      <button type="button" className="th-menu-btn" aria-expanded={open} aria-controls="th-menu" onClick={() => setOpen(o => !o)}>
        <span className="th-burger" aria-hidden="true"><i/><i/><i/></span>{open ? "Close" : "Menu"}
      </button>
    </div>
    {open && <div className="th-menu" id="th-menu">
      {NAV.map(([k, label, href]) => <a key={k} href={th(href)} aria-current={active === k ? "page" : undefined}>{label}</a>)}
      <a href={ADD}>Add a review</a>
      <Search id="th-q-menu" shortcut={false}/>
    </div>}
  </header>;
}
