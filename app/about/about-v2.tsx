import "../pages-v2.css";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { niche, v2copy } from "../../lib/niche";

// About in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/A6t4DobUqJSqSjrWDdymkS), PadelRecs only.
// The owner's words from the mockup. "Spotted something off?" goes to the contact form: the site has no public inbox address.
const w = niche.words, p = niche.people, site = niche.site.name.toLowerCase();
const Sport = v2copy.sport ? v2copy.sport[0].toUpperCase() + v2copy.sport.slice(1) + " forums" : "Forums";
const SOURCES = [
  [`${p.Many} on ${site}`, `Owners at every level share how a ${w.one} actually plays for them.`],
  ["YouTube reviewers", `People who test ${w.many} for a living. We watch, summarise and link back.`],
  [Sport, `Long threads where ${p.many} compare, argue and report back after months of use.`],
] as const;
const BELIEFS = [
  [`${p.Many} and pros, together.`, "Reviewers know the specs. Owners know how it feels after month three. You need both."],
  ["Best for you > best.", `A dream ${w.one} for one ${p.one} is a nightmare for another. That's why there's a match %.`],
  ["Say the catch.", `Every ${w.one} has one. We put it right next to the good stuff, not in the fine print.`],
  ["Two minutes, not twenty.", "Scannable first. The long version is there if you want it."],
] as const;

export default function AboutV2() {
  return <main className={`pg2 ${qtFontVars}`}>
    <div className="pg2-wrap about">
      <section className="pg2-hero">
        <div className="pg2-k">{`// about ${site}`}</div>
        <h1>We got tired of <span className="hl">guessing</span>.</h1>
        <p className="pg2-lede">{`Every ${w.one} is "the best" according to someone. We wanted the honest picture: what ${p.many} who own them say, and what trusted reviewers found after real court time.`}</p>
      </section>
      <section className="pg2-two">
        <div className="pg2-story">
          <p>{v2copy.aboutStory[0]}</p>
          <p>{`${v2copy.aboutStory[1]} `}<em>your</em> game.</p>
        </div>
        <div className="pg2-card shadow"><span className="pg2-badge">three sources</span>
          {SOURCES.map(([t, b]) => <div key={t} className="pg2-src"><b>{t}</b><span>{b}</span></div>)}</div>
      </section>
      <section>
        <h2>What we believe</h2>
        <div className="pg2-beliefs">{BELIEFS.map(([t, b], i) => <div key={t} className={`pg2-belief b${i}`}><b>{t}</b><span>{b}</span></div>)}</div>
      </section>
      <section className="pg2-note">
        <span className="pg2-t">How we keep the lights on</span>
        <span className="pg2-small">{`Some "check price" links are affiliate links. If you buy through one, the shop pays us a small cut. It covers hosting. It never changes a ranking or a match %. Brands can't pay to be listed, ranked or reviewed. `}<a href="/how-we-make-these">How we make these →</a></span>
      </section>
      <section className="pg2-ctas">
        <div className="pg2-card lime shadow"><span className="pg2-t">{`Own a ${w.one}? You're part of this.`}</span>
          <span className="pg2-small">{"Every review makes the next person's choice easier."}</span>
          <a className="pg2-btn dark" href="/add-review">+ add a review</a></div>
        <div className="pg2-card"><span className="pg2-t">Spotted something off?</span>
          <span className="pg2-small">{`A wrong spec, a missing ${w.one}, a bad summary? Tell us and we'll fix it.`}</span>
          <a className="pg2-mono" href="/contact">tell us →</a></div>
      </section>
    </div>
    <V2Footer/>
  </main>;
}
