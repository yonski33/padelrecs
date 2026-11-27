"use client";
// The Thread header (README "Header"): logo, Rackets · Rankings · Guides with the current page in bold, and search. Brands is
// off the menu (owner 2026-11-19); the brand pages stay live and are linked from racket pages and the catalog.
// On phones a Menu button opens the same links full width, with the same search.
import { useEffect, useRef, useState } from "react";
import { th, GUIDE_PATHS, THREAD_DEFAULT } from "../../../lib/thread/look";
import { RacketSearch } from "../../racket-search";
import { niche, catalogPath } from "../../../lib/niche";
import { accountSite, reviewerPagesOn } from "../../../lib/thread/sites";
import { useAccountState, signInHref } from "./use-account";

/** The member zone's way in (PadelRecs accounts): "Sign in" for guests, the member's name when signed in, to /account. Read in
 *  the browser (use-account.ts), so every cached page stays the same for everyone. Hidden until the check ends. */
const ACCOUNTS = accountSite(niche.id);
function AccountLink({ className }: { className?: string }) {
  const me = useAccountState();
  const [href, setHref] = useState("/account");
  useEffect(() => { if (me === null) setHref(signInHref()); }, [me]);
  if (me === "checking") return <span className={className} style={{ visibility: "hidden" }} aria-hidden="true">Sign in</span>;
  return me ? <a className={className} href="/account" title="Your account">{me.name}</a> : <a className={className} href={href}>Sign in</a>;
}

/** The site's review flow (app/add-review): the header's "Add a review" (owner 2026-11-19, as on classic). */
const ADD = "/add-review";
export type Section = "rackets" | "rankings" | "creators" | "brands" | "guides" | "stories" | null;
/** Creators sits after Rankings on sites with creator pages (owner mock 2026-11-27, lib/thread/sites.ts REVIEWER_PAGES). */
const PADEL_NAV: [Exclude<Section, null>, string, string][] = [["rackets", niche.words.Many, catalogPath], ["rankings", "Rankings", "/rankings"],
  ...(reviewerPagesOn(niche.id) ? [["creators", "Creators", "/creators"] as [Exclude<Section, null>, string, string]] : []), ["guides", "Guides", GUIDE_PATHS.racket]];
/** StackRecs (no guides yet): Tools and Rankings. "rackets" stays the catalogue's section key. */
const STACK_NAV: [Exclude<Section, null>, string, string][] = [["rackets", "Tools", catalogPath], ["rankings", "Rankings", "/rankings"]];
/** AudioRecs: Headphones, Rankings, Brands, Guides. */
const AUDIO_NAV: [Exclude<Section, null>, string, string][] = [["rackets", niche.navLabel ?? niche.words.Many, catalogPath], ["rankings", "Rankings", "/rankings"], ["brands", "Brands", "/brands"], ["guides", "Guides", GUIDE_PATHS.racket]];
const SITE_NAV = niche.id === "stackrecs" ? STACK_NAV : niche.id === "audio" ? AUDIO_NAV : PADEL_NAV;

// The site's own racket search (app/racket-search.tsx: the shared name index and fuzzy matching) in the Thread look: live
// suggestions as you type, current models first, keyboard up/down/enter; Enter with no pick filters the catalogue.
function Search({ id, shortcut = true }: { id: string; shortcut?: boolean }) {
  return <RacketSearch thread id={id} shortcut={shortcut} placeholder={niche.id === "audio" ? "Search headphones" : `Search ${niche.words.many}`} hidden={THREAD_DEFAULT ? {} : { look: "thread" }}/>;
}

export function ThreadHeader({ active, stories = false }: { active: Section; /** Member stories are live (PadelRecs). */ stories?: boolean }) {
  const NAV = stories ? [...SITE_NAV, ["stories", "Stories", "/stories"] as [Exclude<Section, null>, string, string]] : SITE_NAV;
  const [open, setOpen] = useState(false);
  // The height left above the phone keyboard (visualViewport), so the menu's suggestion list ends above it and scrolls.
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const vv = window.visualViewport, el = menu.current;
    if (!open || !vv || !el) return;
    const fit = () => el.style.setProperty("--th-vvh", `${Math.round(vv.height)}px`);
    fit(); vv.addEventListener("resize", fit);
    return () => vv.removeEventListener("resize", fit);
  }, [open]);
  return <header className="th-head">
    <div className="th-head-in">
      <a className="th-logo" href={th("/")}>{niche.id === "stackrecs" || niche.id === "simracing" ? <img className="th-logo-icon" src={`/niches/${niche.id}/icon.svg`} alt="" width={24} height={24}/> : <span className="th-dot" aria-hidden="true"/>}{niche.site.name}</a>
      <nav className="th-nav" aria-label="Main">{NAV.map(([k, label, href]) => <a key={k} href={th(href)} aria-current={active === k ? "page" : undefined}>{label}</a>)}</nav>
      <span className="th-grow"/>
      <Search id="th-q"/>
      {ACCOUNTS && <AccountLink className="th-acct"/>}
      <a className="th-add" href={ADD}>Add a review</a>
      <a className="th-add-plus" href={ADD} aria-label="Add a review">+</a>
      <button type="button" className="th-menu-btn" aria-expanded={open} aria-controls="th-menu" onClick={() => setOpen(o => !o)}>
        <span className="th-burger" aria-hidden="true"><i/><i/><i/></span>{open ? "Close" : "Menu"}
      </button>
    </div>
    {open && <div className="th-menu" id="th-menu" ref={menu}>
      {/* Search first (owner 2026-11-25, iPhone): at the bottom it sat behind the keyboard with its suggestions under it. */}
      <Search id="th-q-menu" shortcut={false}/>
      {NAV.map(([k, label, href]) => <a key={k} href={th(href)} aria-current={active === k ? "page" : undefined}>{label}</a>)}
      <a href={ADD}>Add a review</a>
      {ACCOUNTS && <AccountLink/>}
    </div>}
  </header>;
}
