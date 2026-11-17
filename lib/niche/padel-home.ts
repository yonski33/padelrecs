// PadelRecs home below the list (owner 2026-11-17): the rankings tiles, the "how we score" strip and these Questions, as on
// PickleballRecs. Answers must agree with the guide (lib/niche/padel-guide.ts) and the lists: {top:beginner} / {top:arm} are
// the live list's first two (curated lists lead, db/curated/padel.json). Lines ≤105 characters.
import type { HomeFaq } from "./types";

export const padelHome: { faq: HomeFaq[] } = { faq: [
  { q: "Best racket for beginners?",
    a: "A round shape, a soft core and a low balance: the biggest sweet spot, so mishits still go over. "
      + "The top beginner matches right now: {top:beginner}.",
    link: "See the beginner list →", href: "/?level=beginner#match" },
  { q: "Round, teardrop or diamond?",
    a: "Round for control and forgiveness, teardrop for a bit of both, diamond for the most power with the smallest "
      + "sweet spot. Unless your technique is clean, start round or teardrop.",
    link: "Shapes explained →", href: "/guide#shape" },
  { q: "Best racket for a sore elbow?",
    a: "A soft core that soaks up vibration matters most; foam cores do it best. "
      + "Players with arm pain rank {top:arm} first.",
    link: "See arm-friendly rackets →", href: "/?arm=1#match" },
  { q: "What does the match % mean?",
    a: "How well a racket fits the style, level and arm you picked. It is not a quality score; the player score is separate.",
    link: "How we score →", href: "/how-we-make-these#match" },
  { q: "Is anything sponsored?",
    a: "No. Brands can't pay for a place or a better summary. Some \"check price\" links earn a small commission, "
      + "and they never change the order.",
    link: "How we make these →", href: "/how-we-make-these" },
] };
