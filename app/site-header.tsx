"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { RacketSearch } from "./racket-search";
import { ChipRow } from "./chip-row";
import { LogoIcon, PlusIcon } from "./icons";
import { niche, catalogPath, catalogLabel } from "../lib/niche";
import { RANKINGS_PATH, rankingHref } from "../lib/top-lists";

// Kept short: "Add a review" is the button above, and About and Brands live in the footer.
const links = [
  ["/", `${niche.people.One} reviews`],
  [catalogPath, catalogLabel],
] as const;

const topLists = niche.topLists ?? [];

/** "Rankings" with its lists in a dropdown. The label links to the rankings index, so it works without the menu (and on phones,
 *  where the nav scrolls sideways and has no room for a dropdown). */
function TopMenu({ pathname, ranked }: { pathname: string; ranked: string[] }) {
  const shown = topLists.filter(l => ranked.includes(l.slug));
  const [open, setOpen] = useState(false);
  const active = pathname === RANKINGS_PATH || pathname.startsWith(`${RANKINGS_PATH}/`);
  return <div className={`nav-menu${open ? " open" : ""}`} onMouseLeave={() => setOpen(false)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
    onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
    <a href={RANKINGS_PATH} aria-current={active ? "page" : undefined}>Rankings</a>
    {shown.length > 0 && <button type="button" className="nav-caret" aria-expanded={open} aria-controls="rankings-menu" aria-label="Show the rankings" onClick={() => setOpen(o => !o)}>
      <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>}
    <div className="nav-sub" id="rankings-menu">
      {shown.map(l => <a key={l.slug} href={rankingHref(l.slug)} aria-current={pathname === rankingHref(l.slug) ? "page" : undefined}>{l.label}</a>)}
      <a href={RANKINGS_PATH} className="nav-sub-all">All lists</a>
    </div>
  </div>;
}

/** `ranked`: slugs of the rankings lists that rank at least one product; empty lists are left out of the menu. */
export function SiteHeader({ ranked }: { ranked: string[] }) {
  const pathname = usePathname();
  const onAddPage = pathname.startsWith("/add-review");
  const inTypePath = niche.categoryPaths ? niche.typePages?.find(t => pathname.startsWith(`/${t.slug}/`)) : undefined;
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
          // On categoryPaths niches a product page (/vpns/mullvad-vpn) still belongs under the catalogue link.
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`) || (href === catalogPath && !!inTypePath);
          const link = <a key={href} href={href} aria-current={active ? "page" : undefined}>{label}</a>;
          return href === catalogPath && topLists.length ? [link, <TopMenu key="rankings" pathname={pathname} ranked={ranked}/>] : link;
        })}
      </nav>
      {/* Product-type pages menu. The home page shows its own row that filters the review feed instead. */}
      {niche.typePages && pathname !== "/" && <ChipRow className="type-nav" inner="wrap" label={`${niche.words.One} types`}>
        <a href={catalogPath} aria-current={pathname === catalogPath ? "page" : undefined}>All</a>
        {niche.typePages.map(t => <a key={t.slug} href={`/${t.slug}`} aria-current={pathname === `/${t.slug}` ? "page" : inTypePath === t ? "true" : undefined}>{t.label}</a>)}
      </ChipRow>}
    </header>
  );
}
