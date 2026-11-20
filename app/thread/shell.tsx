// Every Thread page: the header, the page, the footer (README "Footer": "How the score works", never "How we score").
import type { ReactNode } from "react";
import { ThreadHeader, type Section } from "./live/header";
import { th } from "../../lib/thread/look";
import { GUIDE_UI } from "../../lib/thread/copy";
import { amazonLinksOn } from "../../lib/amazon-offer";
import { niche } from "../../lib/niche";

export const FOOTER_LINKS = [{ label: "About", href: "/about" }, { label: "How the score works", href: "/how-we-make-these" }, { label: "Affiliate disclosure", href: "/affiliate-disclosure" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "/privacy" }];

export function Shell({ active = null, children }: { active?: Section; children: ReactNode }) {
  // PickleballRecs has its own colours and fonts (owner 2026-11-19: the handoff README tokens), scoped by th-pb in thread.css.
  return <div className={niche.id === "pickleball" ? "th th-pb" : niche.id === "skin" ? "th th-skin" : niche.id === "stackrecs" ? "th th-stack"
    : niche.id === "discgolf" ? "th th-dg" : "th"}>
    <ThreadHeader active={active}/>
    {children}
    <footer className="th-foot"><div className="th-foot-in">
      <span>{niche.id === "stackrecs" ? `${niche.site.name} · Scores come only from votes and reviews.` : `${niche.site.name} · ${GUIDE_UI.footerTagline}`}</span>
      <nav aria-label="Footer">{FOOTER_LINKS.filter(l => l.href !== "/affiliate-disclosure" || amazonLinksOn()).map(l => <a key={l.href} href={th(l.href)}>{l.label}</a>)}</nav>
    </div></footer>
  </div>;
}
