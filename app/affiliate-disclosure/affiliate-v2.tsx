import "../pages-v2.css";
import { niche } from "../../lib/niche";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";

// The affiliate note in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/JaiVm2obBaB3a9gsAkFBkY),
// PadelRecs only. Same facts as the classic page (page.tsx), including the Amazon Associates wording.
const site = niche.site.name, one = niche.words.one;
const STEPS = [
  `Each ${one} page and every ranking list has a "Check price on Amazon" button for each ${one}.`,
  `It goes to that ${one} on Amazon when we can find it there, or to an Amazon search for its name when we can't.`,
  `Those links carry our Amazon Associates tag, so Amazon can tell the visit came from ${site}.`,
];
const NEVERS = [
  ["Ratings", `Come only from ${niche.people.one} reviews. Experiences collected from around the web are kept separate.`],
  ["Rankings", "Are worked out from those reviews, nothing else."],
  ["Who gets listed", "No brand or retailer pays to be listed, rated or ranked."],
  ["The button", `Every ${one} gets the same Amazon button, whether its reviews are glowing or harsh.`],
] as const;

export default function AffiliateV2({ updated }: { updated: string }) {
  return <main className={`pg2 ${qtFontVars}`}>
    <div className="pg2-wrap aff">
      <section className="pg2-hero">
        <div className="pg2-k">{"// affiliate note"}</div>
        <h1>How we <span className="hl">earn</span> a little</h1>
        <p className="pg2-lede">{`Some links on ${site} are affiliate links. If you follow one and buy something, ${site} may earn a small commission.`}</p>
        <div className="pg2-same"><i aria-hidden="true">✓</i><b>You pay the same price either way.</b></div>
      </section>
      <section className="pg2-sec">
        <h2>How it works</h2>
        <ol className="pg2-steps">{STEPS.map((t, i) => <li key={i}><i aria-hidden="true">{i + 1}</i><span>{t}</span></li>)}</ol>
        <p className="pg2-aside">Commissions help pay for hosting and for keeping the catalog up to date.</p>
      </section>
      <section className="pg2-sec">
        <h2>What affiliate links never change</h2>
        <div className="pg2-nevers">{NEVERS.map(([t, b]) => <div key={t} className="pg2-never"><i aria-hidden="true">✕</i><span><b>{t}</b><small>{b}</small></span></div>)}</div>
      </section>
      <section className="pg2-note">
        <span className="pg2-cap">Amazon Associates Program</span>
        <p>{`${site} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, ${site} earns from qualifying purchases.`}</p>
      </section>
      <section className="pg2-sec">
        <h2>Questions</h2>
        <p>{`${site} only links to retailers. It doesn't sell anything or show prices, and we don't control Amazon's pages, prices or policies.`}</p>
        <div className="pg2-row"><a className="pg2-btn" href="/about">read about the project →</a><a className="pg2-btn dark" href="/contact">ask us something</a></div>
        <span className="pg2-updated">{`last updated: ${updated}`}</span>
      </section>
    </div>
    <V2Footer/>
  </main>;
}
