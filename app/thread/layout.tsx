import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./thread.css";

// The Thread preview (lib/thread/look.ts): reached only through ?look=thread, so it stays out of search until the owner flips it.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** The handoff's fonts (README "Typography"): Barlow Condensed for headings and badges, Atkinson Hyperlegible for text, and a
 *  digits-only Barlow stacked first so numbers get a plain zero. React hoists the stylesheets into <head>. */
const FONTS = [
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&text=0123456789&display=swap",
];

export default function ThreadLayout({ children }: { children: ReactNode }) {
  return <>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
    {FONTS.map(href => <link key={href} rel="stylesheet" href={href} precedence="default"/>)}
    {children}
  </>;
}
