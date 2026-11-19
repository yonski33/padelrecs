// Every Thread page: the header, the page, the footer (README "Footer": "How the score works", never "How we score").
import type { ReactNode } from "react";
import { ThreadHeader, type Section } from "./live/header";
import { th } from "../../lib/thread/look";
import { GUIDE_UI } from "../../lib/thread/copy";
import { amazonLinksOn } from "../../lib/amazon-offer";
import { niche } from "../../lib/niche";

export const FOOTER_LINKS = [{ label: "About", href: "/about" }, { label: "How the score works", href: "/how-we-make-these" }, { label: "Affiliate disclosure", href: "/affiliate-disclosure" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "/privacy" }];

export function Shell({ active = null, children }: { active?: Section; children: ReactNode }) {
  return <div className="th">
    <ThreadHeader active={active}/>
    {children}
    <footer className="th-foot"><div className="th-foot-in">
      <span>{`${niche.site.name} · ${GUIDE_UI.footerTagline}`}</span>
      <nav aria-label="Footer">{FOOTER_LINKS.filter(l => l.href !== "/affiliate-disclosure" || amazonLinksOn()).map(l => <a key={l.href} href={th(l.href)}>{l.label}</a>)}</nav>
    </div></footer>
  </div>;
}
