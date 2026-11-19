// StackRecs "How the score works" (also served for /about): the bias rule and the freshness rule in plain words
// (plan PR #517 sections 6 and 7). Never claims testing.
import type { Metadata } from "next";
import { Shell } from "../../shell";
import { niche } from "../../../../lib/niche";
import { FULL_MONTHS, HALF_LIFE_MONTHS, CUTOFF_MONTHS } from "../../../../lib/stack/score";
import { MIN_SIGNAL_REVIEWS } from "../../../../lib/signal";

export const metadata: Metadata = { title: "How the score works", description: `How ${niche.site.name} scores tools: votes and reviews only, newer opinions weigh more, commission-blind.`,
  alternates: { canonical: "/how-we-make-these" } };

const SECTIONS: [string, string[]][] = [
  ["Votes and reviews only", [
    "A score comes from opinions and nothing else: reviews written here, one-tap votes, and reviews from Reddit, YouTube, blogs and forums.",
    `A tool needs ${MIN_SIGNAL_REVIEWS} opinions before it gets a score. Until then it says New.`,
    "Nobody sets a score by hand, and no list here is hand-picked. Rankings follow the score, or the votes on a ranking about votes.",
  ]],
  ["Commission-blind", [
    "Some tools pay a commission when someone signs up through a Try it link. Most don't, including every coding agent listed.",
    "A commission never changes a score, an order or a match. The scoring code has no way to see it.",
    "Claude Code is treated like any other tool. The site is built with AI coding agents, Claude Code among them, so this rule matters here.",
  ]],
  ["Newer opinions weigh more", [
    `Tools change every few months. An opinion counts fully for ${FULL_MONTHS} months, then half as much every ${HALF_LIFE_MONTHS} months after that.`,
    `After ${CUTOFF_MONTHS} months it leaves the score. It stays on the page to read.`,
    "Every review carries the version it was about where it's known. Reviews of a version two or more majors back count half.",
  ]],
  ["Find my match", [
    "Your picks gate tools by budget and rank them by who people say each tool is best for. A tool with too few reports there gets no match %.",
  ]],
];

export default function StackScore() {
  return <Shell>
    <main className="th-main"><div className="th-col">
      <section className="th-card th-hero"><h1 className="th-h1">How the score works</h1></section>
      {SECTIONS.map(([h, ps]) => <section key={h} className="th-card th-sec"><h2 className="th-h3">{h}</h2>{ps.map(p => <p key={p} className="th-lead" style={{ margin: 0 }}>{p}</p>)}</section>)}
    </div></main>
  </Shell>;
}
