"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { RacketSearch } from "./racket-search";
import { LogoIcon, PlusIcon } from "./icons";
import { niche, catalogPath } from "../lib/niche";

const links = [
  ["/", `${niche.people.One} reviews`],
  [catalogPath, niche.words.Many],
  ["/brands", "Brands"],
  ["/add-review", "Add a review"],
  ["/about", "About"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const onAddPage = pathname.startsWith("/add-review");
  // On phones the type row scrolls sideways: bring the current type into view.
  const typeRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = typeRow.current, current = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (row && current) row.scrollLeft = current.offsetLeft - (row.clientWidth - current.offsetWidth) / 2;
  }, [pathname]);
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
          return <a key={href} href={href} className={className} aria-current={active ? "page" : undefined}>{label}</a>;
        })}
      </nav>
      {niche.typePages && <nav className="type-nav" aria-label={`${niche.words.One} types`}>
        <div className="wrap" ref={typeRow}>
          <a href={catalogPath} aria-current={pathname === catalogPath ? "page" : undefined}>All</a>
          {niche.typePages.map(t => <a key={t.slug} href={`/${t.slug}`} aria-current={pathname === `/${t.slug}` ? "page" : undefined}>{t.label}</a>)}
        </div>
      </nav>}
    </header>
  );
}
