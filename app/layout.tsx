export const dynamic = "force-dynamic";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Source_Serif_4, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import "./visual.css";
import { SiteHeader } from "./site-header";
import { lightFont } from "./light-font";
import { LogoIcon } from "./icons";
import { Analytics } from "./analytics";
import { niche, catalogPath } from "../lib/niche";
import { amazonLinksOn } from "../lib/amazon-offer";
import { rankedSlugs } from "./rankings/lists";

const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-display" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans" });
// Editorial headings on product pages (2026-11 redesign).
// The home page headline: heavy condensed italic, like the owner's mockup.
const headline = Barlow_Condensed({ subsets: ["latin"], weight: ["800"], style: ["italic"], variable: "--font-headline" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"], style: ["normal", "italic"], variable: "--font-serif" });

export const metadata: Metadata = { metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"), title: {default: niche.seo.homeTitle, template: niche.seo.titleTemplate}, description: niche.seo.layoutDescription, openGraph: { siteName: niche.site.name, type: "website" },
  // Each niche's tab and home-screen icons live in public/niches/<niche> (scripts/niche-icons.tsx makes new ones).
  icons: { icon: [{ url: `/niches/${niche.id}/favicon.ico`, sizes: "48x48", type: "image/x-icon" }, { url: `/niches/${niche.id}/icon.svg`, sizes: "any", type: "image/svg+xml" }], apple: [{ url: `/niches/${niche.id}/apple-icon.png`, sizes: "180x180", type: "image/png" }] },
  twitter: { card: "summary_large_image" } };

export default async function Layout({children}: {children: React.ReactNode}) {
  const ranked = await rankedSlugs();
  return <html lang="en" className={`${display.variable} ${sans.variable} ${serif.variable} ${headline.variable}`} style={niche.theme as CSSProperties}>{/* The light design (owner, 2026-11-12): one rounded sans and calm colours on every page. */}<body className={`lt-site ${lightFont.variable}`}>
    <SiteHeader ranked={ranked}/>
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
    </div>{niche.site.notice && <p className="wrap footer-notice">{niche.site.notice}</p>}</footer>
    {/* Small pop-ups (signal explainer, "More" menus) close when you click anywhere else (owner, 2026-11-13). */}
    <script dangerouslySetInnerHTML={{ __html: `document.addEventListener("click",function(e){document.querySelectorAll("details.sig-pop[open],details.lc-more[open],details.sig-info[open]").forEach(function(d){if(!d.contains(e.target))d.removeAttribute("open")})})` }}/>
    {process.env.VERCEL_ENV === "production" && niche.site.analyticsId && <Analytics id={niche.site.analyticsId}/>}
  </body></html>;
}
