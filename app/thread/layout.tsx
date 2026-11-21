import type { ReactNode } from "react";
import "./thread.css";
// SimRacingRecs' accent on the v3 pages (generated, scoped to .th-srv3; padel untouched).
import "./sr-colors.css";
import { niche } from "../../lib/niche";

// Indexable: Thread serves the live addresses (lib/thread/look.ts THREAD_DEFAULT); each page reuses the live page's metadata.

/** The handoff's fonts (README "Typography"): Barlow Condensed for headings and badges, Atkinson Hyperlegible for text, and a
 *  digits-only Barlow stacked first so numbers get a plain zero. React hoists the stylesheets into <head>. */
const FONTS = [
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&text=0123456789&display=swap",
];
/** DiscGolfRecs' own (design_handoff_discgolfrecs README "Design tokens"): Familjen Grotesk for headings and badges. */
const SITE_FONTS: Record<string, string[]> = { discgolf: ["https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&display=swap"],
  /** PadelRecs v3 (design_handoff_padelrecs_v3 README "Tokens"): Inter for text, Barlow Condensed up to 900 for headings. */
  padel: ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Barlow+Condensed:wght@800;900&display=swap"],
  /** AudioRecs (design_handoff_audiorecs README): Archivo Narrow for headings. */
  audio: ["https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@600;700&display=swap"] };
/** SimRacingRecs uses the PadelRecs v3 look (owner 2026-11-21), so the same fonts. */
SITE_FONTS.simracing = SITE_FONTS.padel;

export default function ThreadLayout({ children }: { children: ReactNode }) {
  return <>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
    {[...FONTS, ...(SITE_FONTS[niche.id] ?? [])].map(href => <link key={href} rel="stylesheet" href={href} precedence="default"/>)}
    {children}
  </>;
}
