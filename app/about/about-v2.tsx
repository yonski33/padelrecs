import "../pages-v2.css";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";

// About in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/A6t4DobUqJSqSjrWDdymkS), PadelRecs only.
// The owner's words from the mockup. "Spotted something off?" goes to the contact form: the site has no public inbox address.
const SOURCES = [
  ["Players on padelrecs", "Owners at every level share how a racket actually plays for them."],
  ["YouTube reviewers", "People who test rackets for a living. We watch, summarise and link back."],
  ["Padel forums", "Long threads where players compare, argue and report back after months of use."],
] as const;
const BELIEFS = [
  ["Players and pros, together.", "Reviewers know the specs. Owners know how it feels after month three. You need both."],
  ["Best for you > best.", "A dream racket for one player is a nightmare for another. That's why there's a match %."],
  ["Say the catch.", "Every racket has one. We put it right next to the good stuff, not in the fine print."],
  ["Two minutes, not twenty.", "Scannable first. The long version is there if you want it."],
] as const;

export default function AboutV2() {
  return <main className={`pg2 ${qtFontVars}`}>
    <div className="pg2-wrap about">
      <section className="pg2-hero">
        <div className="pg2-k">{"// about padelrecs"}</div>
        <h1>We got tired of <span className="hl">guessing</span>.</h1>
        <p className="pg2-lede">{`Every racket is "the best" according to someone. We wanted the honest picture: what players who own them say, and what trusted reviewers found after real court time.`}</p>
      </section>
      <section className="pg2-two">
        <div className="pg2-story">
          <p>padelrecs started at a club bar. Three of us had bought rackets off hype, hated two of them, and couldn&apos;t find a straight answer anywhere. Just spec sheets, sponsored reviews and 20-minute videos.</p>
          <p>So we built the thing we wanted: one place that brings player reviews, YouTube reviewers and padel forums together, counts it honestly, and tells you if a racket fits <em>your</em> game.</p>
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
        <div className="pg2-card lime shadow"><span className="pg2-t">{"Own a racket? You're part of this."}</span>
          <span className="pg2-small">{"Every review makes the next person's choice easier."}</span>
          <a className="pg2-btn dark" href="/add-review">+ add a review</a></div>
        <div className="pg2-card"><span className="pg2-t">Spotted something off?</span>
          <span className="pg2-small">{"A wrong spec, a missing racket, a bad summary? Tell us and we'll fix it."}</span>
          <a className="pg2-mono" href="/contact">tell us →</a></div>
      </section>
    </div>
    <V2Footer/>
  </main>;
}
