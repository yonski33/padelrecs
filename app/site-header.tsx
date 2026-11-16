"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RacketSearch } from "./racket-search";
import { ChipRow } from "./chip-row";
import { LogoIcon, PlusIcon } from "./icons";
import { niche, catalogPath, catalogLabel, isV2, v2copy } from "../lib/niche";
import { RANKINGS_PATH, rankingHref, withModelYears } from "../lib/top-lists";
import { qtFontVars } from "./qt-fonts";
import "./site-header-v2.css";

// Kept short: "Add a review" is the button above, and About and Brands live in the footer.
// No "Player reviews" item any more (owner, 2026-11-12): the home page isn't a reviews feed now, and the logo goes home.
const links = [
  [catalogPath, catalogLabel],
] as const;
const finderLink = niche.finder ? ["/finder", niche.finder.navLabel] as const : null;

const topLists = withModelYears(niche.topLists ?? []);

/** "Rankings" with its lists in a dropdown. The label links to the rankings index, so it works without the menu (and on phones,
 *  where the nav scrolls sideways and has no room for a dropdown). */
function TopMenu({ pathname, ranked, v2 = false }: { pathname: string; ranked: string[]; v2?: boolean }) {
  // Last season's list ("Best of 2025") goes last, after this year's lists (owner, 2026-11-14).
  const shown = topLists.filter(l => ranked.includes(l.slug)).sort((a, b) => Number(a.modelYearsBack !== undefined) - Number(b.modelYearsBack !== undefined));
  const [open, setOpen] = useState(false);
  const active = pathname === RANKINGS_PATH || pathname.startsWith(`${RANKINGS_PATH}/`);
  return <div className={`nav-menu${open ? " open" : ""}`} // Only a mouse leaving closes it: phones fire a mouse-leave right after the tap, which shut the menu at once (owner 2026-11-16:
    // "rankings doesn't load" on mobile).
    onPointerLeave={e => { if (e.pointerType === "mouse") setOpen(false); }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
    onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
    <a href={RANKINGS_PATH} aria-current={active ? "page" : undefined}>{v2 ? "rankings" : "Rankings"}</a>
    {shown.length > 0 && <button type="button" className="nav-caret" aria-expanded={open} aria-controls="rankings-menu" aria-label="Show the rankings" onClick={() => setOpen(o => !o)}>
      <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>}
    <div className="nav-sub" id="rankings-menu">
      {shown.map(l => <a key={l.slug} href={rankingHref(l.slug)} aria-current={pathname === rankingHref(l.slug) ? "page" : undefined}>{v2 ? l.label.toLowerCase() : l.label}</a>)}
      <a href={RANKINGS_PATH} className="nav-sub-all">{v2 ? "all rankings →" : "All lists"}</a>
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
  // PadelRecs: the Claude Design header (owner 2026-11-15, "match the mockup"): the black side-project strip, then the logo dot,
  // three plain links, search and "+ add a review". Other niches keep the light header below.
  if (isV2) return <div className={`hv2-top ${qtFontVars}`}>
    <div className="hv2-strip">{`${v2copy.strip} · `}<a href="/how-we-make-these">{`${v2copy.howLink ?? "how we make these"} →`}</a></div>
    <header className="site-header hv2-sh"><div className="hv2-shin">
      <Link className="hv2-logo" href="/">{v2copy.logo === "icon" ? <img className="hv2-icon" src={`/niches/${niche.id}/icon.svg`} alt="" width={22} height={22}/> : <i aria-hidden="true"/>}{niche.site.name.toLowerCase()}</Link>
      <nav aria-label="Main navigation">
        <a href={catalogPath} aria-current={pathname === catalogPath || pathname.startsWith(`${catalogPath}/`) ? "page" : undefined}>{niche.words.many}</a>
        {/* Owner 2026-11-16: "the ranking menu item as a drop down that shows all the lists" (the classic menu, v2 styling). */}
        {ranked.length ? <TopMenu pathname={pathname} ranked={ranked} v2/> : <a href={RANKINGS_PATH} aria-current={inRankings ? "page" : undefined}>rankings</a>}
        {niche.guide && <a href="/guide" aria-current={pathname === "/guide" ? "page" : undefined}>{niche.guide.nav ?? "guide"}</a>}
        <a href="/reviews" aria-current={pathname === "/reviews" ? "page" : undefined}>latest reviews</a>
      </nav>
      <span className="hv2-grow"/>
      <div className="hv2-find"><RacketSearch placeholder={`search ${niche.words.many}…`}/></div>
      {!onAddPage && <a className="hv2-add" href={addHref}>+ add a review</a>}
    </div></header>
  </div>;
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
