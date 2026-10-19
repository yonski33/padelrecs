import type { Niche } from "./types";

// Rating icons: an optic-yellow tennis ball with white seams, outlined in dark clay. Same tile sizes as padel (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const ballTile = svg("<svg xmlns='http://www.w3.org/2000/svg' width='17' height='14' viewBox='0 0 17 14'><circle cx='7' cy='7' r='6.1' fill='#dfe84a' stroke='#5a2412' stroke-width='1.3'/><path d='M2.4 4.4c2.2 1 2.2 4.2 0 5.2M11.6 4.4c-2.2 1-2.2 4.2 0 5.2' fill='none' stroke='#fff' stroke-width='1.1' stroke-linecap='round'/></svg>");
const ballTileOff = svg("<svg xmlns='http://www.w3.org/2000/svg' width='17' height='14' viewBox='0 0 17 14'><circle cx='7' cy='7' r='6' fill='#e3dccf'/></svg>");
const ballPick = svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><circle cx='10' cy='10' r='8.6' fill='#dfe84a' stroke='#5a2412' stroke-width='1.4'/><path d='M3.4 5.2c3.4 1.6 3.4 8 0 9.6M16.6 5.2c-3.4 1.6-3.4 8 0 9.6' fill='none' stroke='#fff' stroke-width='1.3' stroke-linecap='round'/></svg>");
const ballPickOff = svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><circle cx='10' cy='10' r='8.6' fill='#e3dccf'/></svg>");

export const tennis: Niche = {
  id: "tennis",
  schema: "tennisrecs",
  site: {
    name: "TennisRecs",
    domain: "tennisrecs.com",
    wordmark: "tennisrecs",
    descriptor: "player reviews of tennis rackets",
    footer: "kept by people who own too many rackets. No affiliate links.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "racket", many: "rackets", One: "Racket", Many: "Rackets" },
  people: { one: "player", many: "players", One: "Player", Many: "Players" },
  productPath: "rackets",
  scoreUnit: { one: "ball", many: "balls" },
  // Warm paper, clay-court terracotta, one optic-yellow accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#f6f4ee",
    "--surface": "#fffdf8",
    "--tint": "#efe9e1",
    "--ink": "#1f1a17",
    "--ink-2": "#45403b",
    "--ink-3": "#75706a",
    "--line": "#e4ddd2",
    "--line-2": "#d1c8ba",
    "--green": "#a6492a",
    "--green-ink": "#7d3519",
    "--green-wash": "#f6e6dd",
    "--green-line": "#e2bfae",
    "--on-green": "#f8ebe4",
    "--on-green-muted": "#e2b7a3",
    "--lime": "#dfe84a",
    "--lime-wash": "#f3f6cf",
    "--lime-line": "#cdd65a",
    "--lime-ink": "#444a12",
    "--lime-ink-2": "#353a0d",
    "--score-on": ballTile,
    "--score-off": ballTileOff,
    "--score-pick-on": ballPick,
    "--score-pick-off": ballPickOff,
  },
  chartColors: ["var(--green)", "var(--lime)", "#e0d9c2", "#d6b4a3"],
  og: {
    background: "#a6492a",
    accent: "#dfe84a",
    muted: "#e2b7a3",
    text: "#f6e3d9",
    scoreOn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6" fill="#dfe84a" stroke="#4a1d0e" stroke-width="1.4"/><path d="M3.4 5.2c3.4 1.6 3.4 8 0 9.6M16.6 5.2c-3.4 1.6-3.4 8 0 9.6" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    scoreOff: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6" fill="#c26a49"/></svg>`,
  },
  ratingWords: { "5": "5 — loved it", "4": "4 — really liked it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Spin is stored in the forgiveness_rating column (tennis has no forgiveness category).
  categories: [
    { column: "powerRating", label: "Power", hint: "serve, groundstroke pace" },
    { column: "controlRating", label: "Control", hint: "placement, depth" },
    { column: "forgivenessRating", label: "Spin", hint: "topspin, slice, kick serve" },
    { column: "comfortRating", label: "Comfort", hint: "vibration, arm" },
    { column: "maneuverabilityRating", label: "Maneuverability", hint: "swing speed, at the net" },
  ],
  profile: {
    playerLevel: { label: "Level", adminLabel: "Player level", options: [
      { value: "Beginner", hint: "NTRP 2.5 and below" }, { value: "Intermediate", hint: "NTRP 3.0–3.5" }, { value: "Advanced", hint: "NTRP 4.0–4.5" }, { value: "Competitive", hint: "NTRP 5.0+" },
    ] },
    playingSide: { label: "Backhand", adminLabel: "Backhand", options: [
      { value: "One-handed", display: "one-handed backhand" }, { value: "Two-handed", display: "two-handed backhand" },
    ] },
    playingStyle: { label: "Style", adminLabel: "Playing style", options: [{ value: "Baseliner" }, { value: "All-court" }, { value: "Serve & volley" }] },
    timeWithRacket: { label: "Time with racket", adminLabel: "Time with racket", options: [
      { value: "Tried briefly", hint: "A few sessions", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared with padel: shape holds head size, core the string pattern, surface the stiffness.
  specs: [
    { column: "shape", label: "Head size", max: 100, placeholder: "e.g. 100 sq in (645 cm²)" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 300 g (10.6 oz) unstrung" },
    { column: "balance", label: "Balance", max: 120, placeholder: "e.g. 320 mm (4 pts HL)" },
    { column: "core", label: "String pattern", max: 200, placeholder: "e.g. 16x19", options: ["16x19", "18x20", "16x20", "16x18"] },
    { column: "surface", label: "Stiffness", max: 200, placeholder: "e.g. 66 RA" },
  ],
  shapeFilter: [],
  rowDetail: { column: "core", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "easy power", tone: "pos" },
    { label: "great spin", tone: "pos" },
    { label: "good control", tone: "pos" },
    { label: "arm-friendly", tone: "pos" },
    { label: "stable", tone: "pos" },
    { label: "maneuverable", tone: "pos" },
    { label: "great on serve", tone: "pos" },
    { label: "forgiving", tone: "pos" },
    { label: "harsh on the arm", tone: "neg" },
    { label: "small sweet spot", tone: "neg" },
    { label: "unstable vs heavy balls", tone: "neg" },
    { label: "hard to swing", tone: "neg" },
    { label: "underpowered", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "crisp", tone: "neutral" },
    { label: "soft", tone: "neutral" },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Tennis shop", "Forum", "Other"],
  examples: { brand: "Babolat", model: "Pure Aero 98", year: 2026, search: "babolat" },
  form: {
    prompts: [["What did you switch from?", "Before this I played with "], ["Strings and tension?", "I strung it with "], ["Arm comfort?", "On my arm it "]],
    tips: ["What you played with before, and how this compares", "Your strings and tension, if you know them", "Where it shines and where it struggles", "Arm comfort, if that matters to you", "Customisation, like lead tape or a different grip"],
  },
  seo: {
    homeTitle: "TennisRecs – Real Player Reviews of Tennis Rackets",
    homeDescription: "Browse real tennis racket reviews from players and opinions collected from Reddit, YouTube, shops, and forums. Compare experiences across Wilson, Babolat, Head, Yonex, Prince, Tecnifibre, and more.",
    layoutDescription: "Real player experiences with tennis rackets, plus opinions from Reddit, YouTube, shops and forums with the source linked.",
    titleTemplate: "%s | TennisRecs",
    catalog: { title: "All Tennis Rackets – Player Reviews and Ratings", description: "Every tennis racket on TennisRecs with community ratings. Filter by brand, year and head size, then read what players say about each one." },
    brands: { title: "Tennis Racket Brands", description: "Browse tennis rackets by brand — Wilson, Babolat, Head, Yonex, Prince, Tecnifibre and more — and read real player reviews of each model." },
    brand: brand => ({ title: `${brand} Tennis Rackets – Player Reviews`, description: `Real player reviews of ${brand} tennis rackets: ratings, strengths and weaknesses for every ${brand} model on TennisRecs.` }),
    product: name => ({ title: `${name} Player Reviews | TennisRecs`, description: `Read real player experiences with the ${name}. Ratings for power, control, spin and comfort, and opinions from TennisRecs and around the web.` }),
    productNotFound: "Racket not found | TennisRecs",
    productCategory: "Tennis racket",
    addReview: { title: "Add a Tennis Racket Review", description: "Played with a tennis racket? Share how it felt on court in about two minutes. No account needed." },
    about: { title: "About", description: "Why TennisRecs exists: tennis racket opinions are scattered across Reddit, YouTube, shops and forums. TennisRecs collects them and lets players add their own." },
    ogAlt: "TennisRecs – real player reviews of tennis rackets",
    ogProductAlt: "Tennis racket player reviews on TennisRecs",
    ogEyebrow: "Player reviews of tennis rackets",
    ogTitle: "Real player reviews of tennis rackets",
    ogDetail: "From players, Reddit, YouTube, shops and forums",
    ogFallbackTitle: "Tennis racket reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other players how a racket actually played for you. Takes about two minutes, no account needed.",
      howItWent: "how it played",
      aboutYou: "About your game",
      aboutYouHint: "optional · helps people find players like them",
      howItPerforms: "How it plays",
      whoUsesIt: "Who's playing it",
      triedIt: "Played it?",
      triedOne: "Played one?",
      triedOneOfThese: "Played one of these?",
    },
    notFound: "We couldn’t find that racket or page. Maybe it moved, maybe it never existed, maybe the link just clipped the net cord.",
    about: {
      heading: "Why TennisRecs exists",
      paragraphs: [
        "Racket reviews are scattered across Reddit, YouTube, shops and forums. TennisRecs puts those experiences in one place and lets players add their own.",
        "A racket that works for one player won’t work for everyone. Knowing someone’s level, backhand, strings and time with a racket often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Players, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from player submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "TennisRecs is new. Player submissions are moderated before publication, web reviews link to their sources, and racket specifications come from the manufacturers’ published figures." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about rackets you’ve actually played with and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
