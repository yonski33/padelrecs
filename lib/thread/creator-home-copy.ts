// The creators home's per-site words (app/thread/live/creators-home.tsx, app/thread/creators-home-body.tsx): the hero title
// and line, its drawing, the Shape filter's values and their chip colours, and the product word in the list headings.
// PickleballRecs' entry holds the words the page was built with, so its home renders as before; a site moving onto the
// creators home (PadelRecs, owner 2026-11-24: "pickleball ... the default copy for the sites") adds its own entry here.
// Pure data, no imports, so client and server both read it.

export type HomeCopy = {
  /** The hero's h1. */ title: string;
  /** The line under it. */ line: string;
  /** The hero drawing (live/creators-home.tsx HeroArt). */ art: "paddle" | "racket";
  /** The fine-tune Shape values, in order. */ shapes: string[];
  /** The type chip's colour per shape (the just-in cards). */ shapeBg: Record<string, string>;
  /** "paddle" / "paddles" in the list title, sort menu and Show more. */ one: string; many: string;
};

const PICKLEBALL: HomeCopy = {
  title: "Every pickleball paddle review, summed up",
  line: "Reviews from YouTube, blogs and Reddit, read and summed up so you don't have to.",
  art: "paddle",
  shapes: ["Widebody", "Standard", "Elongated", "Hybrid"],
  shapeBg: { Widebody: "oklch(0.94 0.06 125)", Standard: "oklch(0.94 0.04 250)", Elongated: "oklch(0.93 0.05 35)", Hybrid: "oklch(0.94 0.04 250)" },
  one: "paddle", many: "paddles",
};

const HOME_COPY: Record<string, HomeCopy> = {
  pickleball: PICKLEBALL,
  // PadelRecs (2026-11-24): its creator reviews are YouTube; Reddit and forum posts are summed up on the racket pages.
  padel: {
    title: "Every padel racket review, summed up",
    line: "Reviews from YouTube and Reddit, read and summed up so you don't have to.",
    art: "racket",
    shapes: ["Round", "Teardrop", "Diamond", "Hybrid"],
    shapeBg: { Round: "oklch(0.94 0.06 125)", Teardrop: "oklch(0.94 0.04 250)", Diamond: "oklch(0.93 0.05 35)", Hybrid: "oklch(0.94 0.04 250)" },
    one: "racket", many: "rackets",
  },
};

export const homeCopyFor = (nicheId: string): HomeCopy => HOME_COPY[nicheId] ?? PICKLEBALL;
