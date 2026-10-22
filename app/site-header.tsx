"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { RacketSearch } from "./racket-search";
import { ChipRow } from "./chip-row";
import { LogoIcon, PlusIcon } from "./icons";
import { niche, catalogPath } from "../lib/niche";

const links = [
  ["/", `${niche.people.One} reviews`],
  [catalogPath, niche.words.Many],
  ["/brands", "Brands"],
  ["/add-review", "Add a review"],
  ["/about", "About"],
] as const;

const topLists = niche.topLists ?? [];

/** "Top 10" with its lists in a dropdown. The label links to the /best index, so it works without the menu (and on phones,
 *  where the nav scrolls sideways and has no room for a dropdown). */
function TopMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = pathname === "/best" || pathname.startsWith("/best/");
  return <div className={`nav-menu${open ? " open" : ""}`} onMouseLeave={() => setOpen(false)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
    onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
    <a href="/best" aria-current={active ? "page" : undefined}>Top 10</a>
    <button type="button" className="nav-caret" aria-expanded={open} aria-controls="top10-menu" aria-label="Show the Top 10 lists" onClick={() => setOpen(o => !o)}>
      <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    <div className="nav-sub" id="top10-menu">
      {topLists.map(l => <a key={l.slug} href={`/best/${l.slug}`} aria-current={pathname === `/best/${l.slug}` ? "page" : undefined}>{l.label}</a>)}
      <a href="/best" className="nav-sub-all">All lists</a>
    </div>
  </div>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const onAddPage = pathname.startsWith("/add-review");
  return (
    <header className="site-header">
      <div className="wrap header-top">
        <a className="logo" href="/">
          <LogoIcon/>
          <span className="logo-text"><span className="wordmark">{niche.site.wordmark}<span>.com</span></span><span className="descriptor">{niche.site.descriptor}</span></span>
        </a>
        <RacketSearch/>
        {!onAddPage && <a className="button header-add" href="/add-review"><PlusIcon/><span>Add<span className="long"> a review</span></span></a>}
      </div>
      <nav className="wrap main-nav" aria-label="Main navigation">
        {links.map(([href, label]) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          // On phones the header button already covers "Add a review", unless we're on that page.
          const className = href === "/add-review" && !onAddPage ? "nav-add" : undefined;
          const link = <a key={href} href={href} className={className} aria-current={active ? "page" : undefined}>{label}</a>;
          return href === catalogPath && topLists.length ? [link, <TopMenu key="top10" pathname={pathname}/>] : link;
        })}
      </nav>
      {/* Product-type pages menu. The home page shows its own row that filters the review feed instead. */}
      {niche.typePages && pathname !== "/" && <ChipRow className="type-nav" inner="wrap" label={`${niche.words.One} types`}>
        <a href={catalogPath} aria-current={pathname === catalogPath ? "page" : undefined}>All</a>
        {niche.typePages.map(t => <a key={t.slug} href={`/${t.slug}`} aria-current={pathname === `/${t.slug}` ? "page" : undefined}>{t.label}</a>)}
      </ChipRow>}
    </header>
  );
}
