// PadelRecs 404, v3 (owner design 2026-11-21, design_handoff_padelrecs_v3 "Not Found v3"): the big 404, one line, a search
// box that opens the catalogue's search, and four ways in. Rendered by app/not-found.tsx on padel only (every padel page is
// a Thread page); the stylesheet is all .th-scoped, so it changes nothing on other pages.
import "./thread.css";
import { Shell } from "./shell";
import { th } from "../../lib/thread/look";

const FONTS = ["https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Atkinson+Hyperlegible:wght@400;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Barlow:wght@400;700&text=0123456789&display=swap"];
const WAYS = [["All rackets", "/rackets"], ["Rankings", "/rankings"], ["Guides", "/guide"], ["Home", "/"]] as const;

export async function PadelNotFound() {
  return <>
    {FONTS.map(href => <link key={href} rel="stylesheet" href={href} precedence="default"/>)}
    <Shell>
      <main className="th-main thi3">
        <section className="th-card thi3-404">
          <span className="big" aria-hidden="true">404</span>
          <h1 className="th-h1">This page is not here</h1>
          <p>The link may be old, or the racket may have been renamed. Try a search or start from one of these.</p>
          <form className="thi3-search" action={th("/rackets")} role="search">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>
            <input name="q" type="search" placeholder="Search rackets" aria-label="Search rackets"/>
          </form>
          <div className="thi3-ways">{WAYS.map(([l, h]) => <a key={h} href={th(h)}>{l}</a>)}</div>
        </section>
      </main>
    </Shell>
  </>;
}
