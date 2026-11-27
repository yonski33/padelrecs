"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";

/**
 * Google Analytics (GA4). Rendered on the live site only (see layout) and never on admin pages. The ID is per niche.
 *
 * Internal and automated visits are not counted. GA's own opt-out flag (`ga-disable-<ID>`) is set before `config` when:
 * - the browser was marked internal: open any page once with `?internal=1` (per site; `?internal=0` undoes it);
 * - the browser is automated (`navigator.webdriver`) or headless, or is an app/agent browser (Electron);
 * - the user agent looks like a bot or crawler.
 */
export function Analytics({ id: GA_ID }: { id: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/funtimes") || pathname.startsWith("/account")) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive"/>
    <Script id="ga-init" strategy="afterInteractive">{`
      (function(){
        var skip = false;
        try {
          var q = location.search;
          if (/[?&]internal=1(&|$)/.test(q)) localStorage.setItem('recs_internal', '1');
          if (/[?&]internal=0(&|$)/.test(q)) localStorage.removeItem('recs_internal');
          skip = localStorage.getItem('recs_internal') === '1';
        } catch (e) {}
        var ua = navigator.userAgent || '';
        if (navigator.webdriver || /HeadlessChrome|Electron|Playwright|Puppeteer|Lighthouse|bot|crawl|spider|slurp/i.test(ua)) skip = true;
        if (skip) window['ga-disable-${GA_ID}'] = true;
      })();
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `}</Script>
  </>;
}
