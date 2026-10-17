"use client";

import { usePathname } from "next/navigation";

const links = [
  ["/", "Player notes"],
  ["/rackets", "Rackets"],
  ["/brands", "Brands"],
  ["/add-review", "Add a review"],
  ["/about", "About"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="header-top">
        <div className="site-identity">
          <a className="logo" href="/">padelrecs.com</a>
          <span className="site-descriptor">player notes on padel rackets</span>
        </div>
        <form action="/rackets" className="search" role="search">
          <label className="sr-only" htmlFor="search">Search rackets</label>
          <input id="search" name="q" placeholder="Search rackets…"/>
          <button aria-label="Search">Go</button>
        </form>
      </div>
      <nav className="main-nav" aria-label="Main navigation">
        {links.map(([href, label]) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return <a key={href} href={href} aria-current={active ? "page" : undefined}>{label}</a>;
        })}
      </nav>
    </header>
  );
}
