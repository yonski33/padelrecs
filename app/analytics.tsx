"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";

const GA_ID = "G-GKZDEE5HBK";

/** Google Analytics (GA4). Rendered on the live site only (see layout) and never on admin pages. */
export function Analytics() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive"/>
    <Script id="ga-init" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `}</Script>
  </>;
}
