import "./skin-product.css";
import "./pages-beauty.css";
import "./more-beauty.css";
import Link from "next/link";
import { niche } from "../../lib/niche";
import { V2Footer } from "../v2-footer";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";

/** The affiliate note for SkinRecs in the owner's beauty design (Claude Design "SkinRecs affiliate note", 2026-11-16). Same facts
 *  as the classic page, including the Amazon Associates wording word for word. "User scores" says what is true here: they come
 *  from reviews (site reviews and reviews collected from around the web), never from links or brands. */
const site = niche.site.name.toLowerCase();
const STEPS = [
  "Each product page and every ranking list has a “check price” button for each product.",
  "It goes to that product on Amazon when we can find it there, or to an Amazon search for its name when we can't.",
  `Those links carry our Amazon Associates tag, so Amazon can tell the visit came from ${site}.`,
];
const BGS = ["oklch(0.9 0.06 20)", "oklch(0.92 0.14 98)", "oklch(0.93 0.05 155)"];
const NEVERS = [
  ["User scores", "Come only from reviews, never from links or brands."],
  ["Rankings", "Are worked out from those reviews, nothing else."],
  ["Who gets listed", "No brand or retailer pays to be listed, rated or ranked."],
  ["The button", "Every product gets the same button, whether its reviews are glowing or harsh."],
];

export default function AffiliateBeauty({ updated }: { updated: string }) {
  return <main className={`bp bf ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="bf-wrap">
      <section className="bf-hero"><div className="bs-k">affiliate note</div>
        <h1>How we <em>earn</em> a little</h1>
        <p>{`Some links on ${site} are affiliate links. If you follow one and buy something, ${site} may earn a small commission.`}</p>
        <div className="bf-same"><i aria-hidden="true">✓</i><b>You pay the same price either way.</b></div></section>
      <section><h2>How it works</h2>
        <ol className="bf-steps">{STEPS.map((t, i) => <li key={t}><i style={{ background: BGS[i] }}>{i + 1}</i><span>{t}</span></li>)}</ol>
        <p className="bf-aside">Commissions help pay for hosting and for keeping the catalog up to date.</p></section>
      <section><h2>What affiliate links never change</h2>
        <div className="bf-nevers">{NEVERS.map(([t, b]) => <div key={t}><i aria-hidden="true">✕</i><span><b>{t}</b><small>{b}</small></span></div>)}</div></section>
      <section className="ba-note"><span className="bf-cap">Amazon Associates Program</span>
        <span>{`${site} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, ${site} earns from qualifying purchases.`}</span></section>
      <section><h2>Questions</h2>
        <p className="bf-aside">{`${site} only links to retailers. It doesn't sell anything or show prices, and we don't control Amazon's pages, prices or policies.`}</p>
        <div className="bf-row"><Link className="bf-ghost" href="/about">read about the project →</Link><Link className="bp-btn" href="/contact">ask us something</Link></div>
        <span className="bs-mono">{`last updated: ${updated}`}</span></section>
    </div>
    <V2Footer/>
  </main>;
}
