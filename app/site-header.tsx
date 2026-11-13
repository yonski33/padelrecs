"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { RacketSearch } from "./racket-search";
import { ChipRow } from "./chip-row";
import { LogoIcon, PlusIcon } from "./icons";
import { niche, catalogPath, catalogLabel } from "../lib/niche";
import { RANKINGS_PATH, rankingHref, withModelYears } from "../lib/top-lists";

// Kept short: "Add a review" is the button above, and About and Brands live in the footer.
// No "Player reviews" item any more (owner, 2026-11-12): the home page isn't a reviews feed now, and the logo goes home.
const links = [
  [catalogPath, catalogLabel],
] as const;
const finderLink = niche.finder ? ["/finder", niche.finder.navLabel] as const : null;

const topLists = withModelYears(niche.topLists ?? []);

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
  const inRankings = pathname === RANKINGS_PATH || pathname.startsWith(`${RANKINGS_PATH}/`);
  const inTypePath = niche.categoryPaths ? niche.typePages?.find(t => pathname.startsWith(`/${t.slug}/`)) : undefined;
  // On a product page the review form opens with that product chosen (app/add-review matches the path to a product).
  const addHref = pathname === "/" ? "/add-review" : `/add-review?from=${encodeURIComponent(pathname)}`;
  return (
    <header className="site-header">
      <div className="wrap header-top">
        <a className="logo" href="/">
          <LogoIcon/>
          <span className="logo-text"><span className="wordmark">{niche.site.name}</span></span>
        </a>
      <nav className="main-nav" aria-label="Main navigation">
        {links.map(([href, label]) => {
          // On categoryPaths niches a product page (/vpns/mullvad-vpn) still belongs under the catalogue link.
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`) || (href === catalogPath && !!inTypePath);
          const link = <a key={href} href={href} aria-current={active ? "page" : undefined}>{label}</a>;
          // Latest reviews sits right after Rankings (owner, 2026-11-13).
          const reviews = <a key="reviews" href="/reviews" aria-current={pathname === "/reviews" ? "page" : undefined}><span className="nav-long">Latest reviews</span><span className="nav-short">Reviews</span></a>;
          return href === catalogPath ? [link, ranked.length ? <TopMenu key="rankings" pathname={pathname} ranked={ranked}/> : null, reviews] : link;
        })}
        {finderLink && <a href={finderLink[0]} aria-current={pathname === finderLink[0] ? "page" : undefined}><span className="nav-long">{finderLink[1]}</span><span className="nav-short">Finder</span></a>}
      </nav>
        <RacketSearch/>
        {!onAddPage && <a className="button header-add" href={addHref}><PlusIcon/><span>Add<span className="long"> a review</span></span></a>}
      </div>
      {/* On Rankings pages the row lists the rankings, so a chip there opens a ranking, not a product-type page. */}
      {/* Rankings pages show their lists as tabs in the page itself (2026-11 redesign), so no chip row here. */}
      {/* Product-type pages menu. The home page shows its own row that filters the review feed instead. */}
      {/* Product-type chips help browsing; the add-review form has its own product picker, so they are left off there. */}
      {niche.typePages && pathname !== "/" && pathname !== catalogPath && !niche.typePages.some(t => pathname === `/${t.slug}`) && !inRankings && !onAddPage && <ChipRow className="type-nav" inner="wrap" label={`${niche.words.One} types`}>
        <a href={catalogPath} aria-current={pathname === catalogPath ? "page" : undefined}>All</a>
        {niche.typePages.map(t => <a key={t.slug} href={`/${t.slug}`} aria-current={pathname === `/${t.slug}` ? "page" : inTypePath === t ? "true" : undefined}>{t.label}</a>)}
      </ChipRow>}
    </header>
  );
}
