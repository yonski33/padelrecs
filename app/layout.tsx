export const dynamic = "force-dynamic";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "./site-header";
import { LogoIcon } from "./icons";
import { Analytics } from "./analytics";
import { niche, catalogPath } from "../lib/niche";
import { amazonLinksOn } from "../lib/amazon-offer";

const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-display" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = { metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"), title: {default: niche.seo.homeTitle, template: niche.seo.titleTemplate}, description: niche.seo.layoutDescription, openGraph: { siteName: niche.site.name, type: "website" },
  // Each niche's tab and home-screen icons live in public/niches/<niche> (scripts/niche-icons.tsx makes new ones).
  icons: { icon: [{ url: `/niches/${niche.id}/favicon.ico`, sizes: "48x48", type: "image/x-icon" }, { url: `/niches/${niche.id}/icon.svg`, sizes: "any", type: "image/svg+xml" }], apple: [{ url: `/niches/${niche.id}/apple-icon.png`, sizes: "180x180", type: "image/png" }] },
  twitter: { card: "summary_large_image" } };

export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="en" className={`${display.variable} ${sans.variable}`} style={niche.theme as CSSProperties}><body>
    <SiteHeader/>
    <div className="site">{children}</div>
    <footer className="site-footer"><div className="wrap">
      <span className="footer-line"><LogoIcon/>{`${niche.site.domain} — ${niche.site.footer}`}</span>
      <nav aria-label="Footer">
        <a href="/about">About this project</a>
        <a href={catalogPath}>{`All ${niche.words.many}`}</a>
        <a href="/brands">Brands</a>
        {amazonLinksOn() && <a href="/affiliate-disclosure">Affiliate disclosure</a>}
        <a href="/contact">Contact</a>
      </nav>
    </div></footer>
    {process.env.VERCEL_ENV === "production" && niche.site.analyticsId && <Analytics id={niche.site.analyticsId}/>}
  </body></html>;
}
