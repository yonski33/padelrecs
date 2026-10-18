export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "./site-header";
import { BallIcon } from "./icons";
import { Analytics } from "./analytics";

const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-display" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = { metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"), title: {default: "PadelRecs – Real Player Reviews of Padel Rackets", template: "%s | PadelRecs"}, description: "Real player experiences with padel rackets, plus opinions from Reddit, YouTube, shops and forums with the source linked.", openGraph: { siteName: "PadelRecs", type: "website" }, twitter: { card: "summary_large_image" } };

export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="en" className={`${display.variable} ${sans.variable}`}><body>
    <SiteHeader/>
    <div className="site">{children}</div>
    <footer className="site-footer"><div className="wrap">
      <span className="footer-line"><BallIcon/>padelrecs.com — kept by people who own too many rackets. No affiliate links.</span>
      <nav aria-label="Footer">
        <a href="/about">About this project</a>
        <a href="/rackets">All rackets</a>
      </nav>
    </div></footer>
    {process.env.VERCEL_ENV === "production" && <Analytics/>}
  </body></html>;
}
