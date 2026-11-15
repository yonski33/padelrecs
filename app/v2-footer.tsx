import { amazonLinksOn } from "../lib/amazon-offer";
import { v2copy } from "../lib/niche";

/** The design-v2 footer (owner 2026-11-15, Claude Design mockups). Neutral wording: forums aren't named first (owner). */
export function V2Footer() {
  return <footer className="v2-foot"><div className="v2-footin">
    <span>{`we read forums, YouTube & your reviews, count the verdicts, write one honest line. no sponsored picks${v2copy.emoji ? ` ${v2copy.emoji}` : ""}`}</span>
    <nav aria-label="Footer"><a href="/about">about</a><a href="/how-we-make-these">how we score</a>{amazonLinksOn() && <a href="/affiliate-disclosure">affiliate note</a>}<a href="/contact">contact</a></nav>
  </div></footer>;
}
