"use client";

import { usePathname } from "next/navigation";
import { RacketSearch } from "./racket-search";
import { LogoIcon, PlusIcon } from "./icons";
import { niche } from "../lib/niche";

const links = [
  ["/", "Player reviews"],
  ["/rackets", niche.words.Many],
  ["/brands", "Brands"],
  ["/add-review", "Add a review"],
  ["/about", "About"],
] as const;

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
          return <a key={href} href={href} className={className} aria-current={active ? "page" : undefined}>{label}</a>;
        })}
      </nav>
    </header>
  );
}
