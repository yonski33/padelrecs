// Every Thread page: the header, the page, the footer (README "Footer": "How the score works", never "How we score").
import { v3Site } from "../../lib/thread/sites";
import type { ReactNode } from "react";
import { ThreadHeader, type Section } from "./live/header";
import { th } from "../../lib/thread/look";
import { GUIDE_UI } from "../../lib/thread/copy";
import { amazonLinksOn } from "../../lib/amazon-offer";
import { niche } from "../../lib/niche";
import { liveStoryTotal } from "./stories-data";
const STORIES_IN_MENU = false;

/** The v3 sites (padel, audio, sim racing): "How rankings work" in place of the score page (no score on their pages; the old
 *  address 308s there, next.config.ts). */
export const FOOTER_LINKS = [{ label: "About", href: "/about" }, v3Site(niche.id) ? { label: "How rankings work", href: "/how-rankings-work" } : { label: "How the score works", href: "/how-we-make-these" }, { label: "Affiliate disclosure", href: "/affiliate-disclosure" }, { label: "Contact", href: "/contact" }, { label: "Privacy", href: "/privacy" }];

export async function Shell({ active = null, children }: { active?: Section; children: ReactNode }) {
  // Member stories (PadelRecs pilot): no header link (owner 2026-11-27: "remove the stories from padel menu"); the /stories
  // pages stay. Set STORIES_IN_MENU to bring it back.
  const stories = STORIES_IN_MENU && (await liveStoryTotal()) > 0;
  // PickleballRecs has its own colours and fonts (owner 2026-11-19: the handoff README tokens), scoped by th-pb in thread.css.
  return <div className={niche.id === "pickleball" ? "th th-pb" : niche.id === "laptop" ? "th th-pb th-lt" : niche.id === "coffee" ? "th th-pb th-cf" : niche.id === "skin" ? "th th-skin" : niche.id === "stackrecs" ? "th th-stack"
    : niche.id === "discgolf" ? "th th-dg" : niche.id === "padel" ? "th th-pr" : niche.id === "audio" ? "th th-audio" : niche.id === "simracing" ? "th th-pr th-srv3" : niche.id === "tennis" ? "th th-pr th-tnv3" : "th"}>
    <ThreadHeader active={active} {...(stories ? { stories } : {})}/>
    {children}
    <footer className="th-foot"><div className="th-foot-in">
      <span>{niche.id === "stackrecs" ? `${niche.site.name} · Scores come only from votes and reviews.` : `${niche.site.name} · ${GUIDE_UI.footerTagline}`}</span>
      <nav aria-label="Footer">{FOOTER_LINKS.filter(l => l.href !== "/affiliate-disclosure" || amazonLinksOn()).map(l => <a key={l.href} href={th(l.href)}>{l.label}</a>)}</nav>
    </div></footer>
  </div>;
}
