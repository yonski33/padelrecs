// DiscGolfRecs home below the list (owner 2026-11-17): the rankings tiles, the "how we score" strip and these Questions, as on
// PickleballRecs. Answers must agree with the disc guide (lib/niche/discgolf-guide.ts) and the lists: {top:beginner} /
// {top:arm} (arm = a slower arm) are the live list's first two. Lines ≤105 characters.
import type { HomeFaq } from "./types";

export const discgolfHome: { faq: HomeFaq[] } = { faq: [
  { q: "Best discs for beginners?",
    a: "Start with a putter, a midrange and an understable fairway driver: slower discs fly as rated without "
      + "a big arm. The top beginner matches right now: {top:beginner}.",
    link: "See the beginner list →", href: "/?level=beginner#match" },
  { q: "What do the flight numbers mean?",
    a: "Speed is how hard it must be thrown, glide how long it stays up, turn how far it drifts right early and "
      + "fade how hard it hooks left at the end (right-hand backhand). They assume a big, clean arm.",
    link: "Flight numbers explained →", href: "/guide#flight" },
  { q: "Understable or overstable?",
    a: "Understable turns over and helps a slower arm fly straight and far. Overstable fights the wind and hooks "
      + "left at the end, reliable for big arms and forehands. Not sure? Stable.",
    link: "Stability explained →", href: "/guide#stability" },
  { q: "What does the match % mean?",
    a: "How well a disc fits the disc type, level and arm speed you picked. It is not a quality score; the thrower score is separate.",
    link: "How we score →", href: "/how-we-make-these#match" },
  { q: "Is anything sponsored?",
    a: "No. Brands can't pay for a place or a better summary. Some \"check price\" links earn a small commission, "
      + "and they never change the order.",
    link: "How we make these →", href: "/how-we-make-these" },
] };
