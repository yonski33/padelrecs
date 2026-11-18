// TennisRecs home below the list (owner 2026-11-18, v11c switch): the rankings tiles, the "how we score" strip and these
// questions. `{top:beginner}` / `{top:arm}` name the two top rackets for that pick from the live list. No guide links yet:
// tennis has no /guide page.
import type { HomeFaq } from "./types";

export const tennisHome: { faq: HomeFaq[] } = { faq: [
  { q: "Best racket for beginners?",
    a: "A 100 to 105 sq in head, about 280 to 300 g and an open 16x19 pattern: easy depth and a big sweet spot. "
      + "The top beginner matches right now: {top:beginner}.",
    link: "See the beginner list →", href: "/?level=beginner#match" },
  { q: "Best racket for tennis elbow?",
    a: "A flexible frame (low RA) with a bit more weight soaks up shock; very light, stiff frames pass it on. "
      + "Players with arm pain rank {top:arm} first.",
    link: "See arm-friendly rackets →", href: "/?arm=1#match" },
  { q: "98 or 100 sq in?",
    a: "A 100 is more forgiving with easier depth; a 98 gives more precision and feel for clean, full swings.",
    link: "See control rackets →", href: "/?style=control#match" },
  { q: "16x19 or 18x20?",
    a: "16x19 is open: more spin and launch. 18x20 is dense: a flatter, more controlled ball that needs a fast swing.",
    link: "See spin and power rackets →", href: "/?style=power#match" },
  { q: "What does the match % mean?",
    a: "How well a racket fits the style, level and arm you picked. It is not a quality score; the player score is separate.",
    link: "How we score →", href: "/how-we-make-these#match" },
] };
