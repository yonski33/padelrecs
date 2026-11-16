import "./skin-product.css";
import "./pages-beauty.css";
import { niche, v2copy } from "../../lib/niche";
import { V2Footer } from "../v2-footer";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";

/** About, for SkinRecs in the owner's beauty design (Claude Design "SkinRecs about", 2026-11-16). The story is the site's own
 *  (niche.v2copy.aboutStory), not the mock's placeholder "group chat" one; the rest is the mock's words. */
const site = niche.site.name.toLowerCase();
const SOURCES = [
  [`People on ${site}`, "Reviewers of every skin type share how a product actually behaved on them."],
  ["YouTube reviewers", "Skincare creators and dermatologists. We watch, summarise and link back."],
  ["Skincare forums", "Long threads where people compare routines and report back after months."],
];
const BELIEFS = [
  ["Real skin and experts, together.", "Experts know the ingredients. Reviewers know how it feels in week six. You need both.", "rose"],
  ["Best for you beats best.", "A holy grail for one person is a breakout for another. That's why there's a match %.", ""],
  ["Say the catch.", "Every product has one. We put it right next to the good stuff, not in the fine print.", "sage"],
  ["Two minutes, not twenty.", "Scannable first. The long version is there if you want it.", ""],
];

export default function AboutBeauty() {
  return <main className={`bp ba ${bpFontVars}`}>
    <style>{bpBodyFonts}</style>
    <div className="ba-wrap">
      <section className="ba-hero"><div className="bs-k">{`about ${site}`}</div>
        <h1>We got tired of <em>guessing</em>.</h1>
        <p>{"Every product is “holy grail” according to someone. We wanted the honest picture: what people with skin like yours actually say, and what trusted reviewers found after weeks of use."}</p></section>
      <section className="ba-two">
        <div className="ba-story"><p>{v2copy.aboutStory[0]}</p><p>{`${v2copy.aboutStory[1]} `}<em>your</em>{` ${v2copy.aboutLast ?? "skin"}.`}</p></div>
        <div className="ba-src"><span className="bp-tag sm">three sources</span>{SOURCES.map(([t, b]) => <div key={t}><b>{t}</b><span>{b}</span></div>)}</div>
      </section>
      <section><h2>What we believe</h2>
        <div className="ba-beliefs">{BELIEFS.map(([t, b, c]) => <div key={t} className={c || undefined}><b>{t}</b><span>{b}</span></div>)}</div></section>
      <section className="ba-note"><b>How we keep the lights on</b>
        <span>{"Some “check price” links are affiliate links. If you buy through one, the shop pays us a small cut. It covers hosting. It never changes a ranking or a match %. Brands can't pay to be listed, ranked or reviewed. "}<a href="/how-we-make-these">How we score →</a></span></section>
      <section className="ba-note pink"><b>{"We're not dermatologists"}</b>
        <span>{"We count what real people report. That's useful for picking a moisturizer, not for diagnosing a rash. For eczema, rosacea, persistent acne or anything that worries you, see a dermatologist."}</span></section>
      <section className="ba-ctas">
        <div className="sage"><b>{"Used something? You're part of this."}</b><span>{"Every review makes the next person's choice easier."}</span><a className="bp-btn" href="/add-review">+ add a review</a></div>
        <div><b>Spotted something off?</b><span>{"A wrong ingredient, a missing product, a bad summary? Tell us and we'll fix it."}</span><a className="ba-mono" href="/contact">get in touch →</a></div>
      </section>
    </div>
    <V2Footer/>
  </main>;
}
