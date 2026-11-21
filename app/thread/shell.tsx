// Every Thread page: the header, the page, the footer (README "Footer": "How the score works", never "How we score").
import type { ReactNode } from "react";
import { ThreadHeader, type Section } from "./live/header";
import { th } from "../../lib/thread/look";
import { GUIDE_UI } from "../../lib/thread/copy";
import { amazonLinksOn } from "../../lib/amazon-offer";
import { niche } from "../../lib/niche";
import { liveStoryTotal } from "./stories-data";

/** PadelRecs (v3 handoff 2026-11-21): "How rankings work" in place of the score page (no 0-100 score on its pages). */
export const FOOTER_LINKS = [{ label: "About", href: "/about" }, niche.id === "padel" || niche.id === "audio" ? { label: "How rankings work", href: "/how-rankings-work" } : { label: "How the score works", href: "/how-we-make-these" }, { label: "Affiliate disclosure", href: "/affiliate-disclosure" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "/privacy" }];

export async function Shell({ active = null, children }: { active?: Section; children: ReactNode }) {
  // Member stories (PadelRecs pilot): the header link shows once one story is live (0 elsewhere, or before the migration).
  const stories = (await liveStoryTotal()) > 0;
  // PickleballRecs has its own colours and fonts (owner 2026-11-19: the handoff README tokens), scoped by th-pb in thread.css.
  return <div className={niche.id === "pickleball" ? "th th-pb" : niche.id === "skin" ? "th th-skin" : niche.id === "stackrecs" ? "th th-stack"
    : niche.id === "discgolf" ? "th th-dg" : niche.id === "padel" ? "th th-pr" : niche.id === "audio" ? "th th-audio" : niche.id === "simracing" ? "th th-pr th-srv3" : niche.id === "tennis" ? "th th-pr th-tnv3" : "th"}>
    <ThreadHeader active={active} {...(stories ? { stories } : {})}/>
    {children}
    <footer className="th-foot"><div className="th-foot-in">
      <span>{niche.id === "stackrecs" ? `${niche.site.name} · Scores come only from votes and reviews.` : `${niche.site.name} · ${GUIDE_UI.footerTagline}`}</span>
      <nav aria-label="Footer">{FOOTER_LINKS.filter(l => l.href !== "/affiliate-disclosure" || amazonLinksOn()).map(l => <a key={l.href} href={th(l.href)}>{l.label}</a>)}</nav>
    </div></footer>
  </div>;
}
