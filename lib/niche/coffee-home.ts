// CoffeeRecs home below the list (PM 2026-11-18, design v2): the rankings tiles, the "how we score" strip and these questions.
// `{top:beginner}` names the two top products for a newcomer from the live list. Expert voice, from Grok's match profile.
import type { HomeFaq } from "./types";

export const coffeeHome: { faq: HomeFaq[] } = { faq: [
  { q: "Best first espresso machine?",
    a: "One that heats fast, has a real steam wand and forgives a little: a thermoblock or a single boiler with a PID. "
      + "Leave room in the budget for an espresso-capable grinder. The top matches for newcomers right now: {top:beginner}.",
    link: "See the beginner list →", href: "/?kind=espresso&level=beginner#match" },
  { q: "Grinder or machine first?",
    a: "The grinder sets the ceiling on espresso. Many say spend more on it than the machine; others say cheap grinders have caught "
      + "up and temperature control matters as much. Either way, a filter-only grinder can't make espresso.",
    link: "See espresso grinders →", href: "/?kind=grinder&drink=espresso#match" },
  { q: "Lattes every morning: which machine?",
    a: "A heat exchanger or a dual boiler brews and steams without a long wait. A thermoblock is fine for the odd latte, "
      + "not for several in a row.",
    link: "See machines for milk drinks →", href: "/?kind=espresso&drink=milk#match" },
  { q: "Do I need a gooseneck kettle?",
    a: "Only for pour-over, where the pour is part of the brew. For French press, AeroPress or tea any kettle works.",
    link: "See kettles →", href: "/?kind=kettle#match" },
  { q: "What does the match % mean?",
    a: "How well a product fits what you make, your level and your budget. It is not a quality score; the barista score is separate.",
    link: "How we score →", href: "/how-we-make-these#match" },
] };
