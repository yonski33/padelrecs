import type { Niche } from "./types";

// Rating icons: a shuttlecock (white feather skirt, cork base) outlined in deep crimson. Same tile sizes as padel (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const shuttleTile = svg("<svg xmlns='http://www.w3.org/2000/svg' width='17' height='14' viewBox='0 0 17 14'><path d='M2.2 1h9.6L9 8.6H5z' fill='#fff' stroke='#7f1d1d' stroke-width='1.1' stroke-linejoin='round'/><path d='M5.6 1.4L6.3 8.4M8.4 1.4L7.7 8.4' stroke='#7f1d1d' stroke-width='.7'/><path d='M4.6 8.6h4.8v1.6a2.4 2.4 0 0 1-4.8 0z' fill='#fbbf24' stroke='#7f1d1d' stroke-width='1.1'/></svg>");
const shuttleTileOff = svg("<svg xmlns='http://www.w3.org/2000/svg' width='17' height='14' viewBox='0 0 17 14'><path d='M2.2 1h9.6L9 8.6H5z' fill='#ece4e4'/><path d='M4.6 8.6h4.8v1.6a2.4 2.4 0 0 1-4.8 0z' fill='#ece4e4'/></svg>");
const shuttlePick = svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path d='M3 1.6h14L13.2 12.4H6.8z' fill='#fff' stroke='#7f1d1d' stroke-width='1.3' stroke-linejoin='round'/><path d='M8 2.2L8.9 12M12 2.2L11.1 12' stroke='#7f1d1d' stroke-width='.9'/><path d='M6.6 12.4h6.8v2.4a3.4 3.4 0 0 1-6.8 0z' fill='#fbbf24' stroke='#7f1d1d' stroke-width='1.3'/></svg>");
const shuttlePickOff = svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path d='M3 1.6h14L13.2 12.4H6.8z' fill='#ece4e4'/><path d='M6.6 12.4h6.8v2.4a3.4 3.4 0 0 1-6.8 0z' fill='#ece4e4'/></svg>");
const ogShuttle = (skirt: string, cork: string, stroke: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M3 1.6h14L13.2 12.4H6.8z" fill="${skirt}" stroke="${stroke}" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.6 12.4h6.8v2.4a3.4 3.4 0 0 1-6.8 0z" fill="${cork}" stroke="${stroke}" stroke-width="1.3"/></svg>`;

/** Racket lines as the makers name them; the catalog's "Series" field holds one of these. */
export const BADMINTON_SERIES = ["Astrox", "Nanoflare", "Arcsaber", "Thruster", "Auraspeed", "DriveX", "Jetspeed", "Axforce", "Halbertec", "Aeronaut", "BladeX", "Tectonic"];

export const badminton: Niche = {
  id: "badminton",
  schema: "badmintonrecs",
  site: {
    name: "BadmintonRecs",
    domain: "badmintonrecs.com",
    wordmark: "badmintonrecs",
    descriptor: "player reviews of badminton rackets",
    footer: "kept by people who restring more often than they should. No affiliate links.",
    // analyticsId: "G-XXXXXXXXXX", // add once the GA4 property for badmintonrecs.com exists
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "racket", many: "rackets", One: "Racket", Many: "Rackets" },
  people: { one: "player", many: "players", One: "Player", Many: "Players" },
  // Makers name models by line and number (Astrox 99 Pro, Thruster Ryuga II Pro, Axforce 100), not years.
  productYears: false,
  productPath: "rackets",
  scoreUnit: { one: "shuttle", many: "shuttles" },
  // White page, deep crimson, one cork-amber accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f8f4f4",
    "--ink": "#1f1718",
    "--ink-2": "#463c3d",
    "--ink-3": "#776c6d",
    "--line": "#ebe2e2",
    "--line-2": "#dacdcd",
    "--green": "#9f1239",
    "--green-ink": "#7f1d1d",
    "--green-wash": "#fbeaee",
    "--green-line": "#efc3cf",
    "--on-green": "#fdf0f3",
    "--on-green-muted": "#f0b6c4",
    "--lime": "#fbbf24",
    "--lime-wash": "#fef6dc",
    "--lime-line": "#f5d77a",
    "--lime-ink": "#7a4d05",
    "--lime-ink-2": "#5e3b04",
    "--score-on": shuttleTile,
    "--score-off": shuttleTileOff,
    "--score-pick-on": shuttlePick,
    "--score-pick-off": shuttlePickOff,
  },
  chartColors: ["var(--green)", "var(--lime)", "#e5d9d9", "#d9a0ae"],
  og: {
    background: "#9f1239",
    accent: "#fbbf24",
    muted: "#f0b6c4",
    text: "#fdf0f3",
    scoreOn: ogShuttle("#ffffff", "#fbbf24", "#5c0f24"),
    scoreOff: ogShuttle("#b9445f", "#b9445f", "#b9445f"),
  },
  ratingWords: { "5": "5 — loved it", "4": "4 — really liked it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for badminton: maneuverability = speed (drives, defence, at the net),
  // forgiveness = forgiveness (sweet spot, off-centre hits), comfort = feel (repulsion, shock, arm).
  categories: [
    { column: "powerRating", label: "Power", hint: "smashes, clears" },
    { column: "controlRating", label: "Control", hint: "net play, drops, placement" },
    { column: "maneuverabilityRating", label: "Speed", hint: "drives, defence, quick exchanges" },
    { column: "forgivenessRating", label: "Forgiveness", hint: "sweet spot, off-centre hits" },
    { column: "comfortRating", label: "Feel", hint: "repulsion, shock, arm and shoulder" },
  ],
  profile: {
    playerLevel: { label: "Level", adminLabel: "Player level", options: [
      { value: "Beginner", hint: "Learning the strokes" }, { value: "Intermediate", hint: "Regular club play" }, { value: "Advanced", hint: "League or tournament" }, { value: "Competitive", hint: "Regional level and up" },
    ] },
    playingSide: { label: "Plays", adminLabel: "Main game", options: [
      { value: "Singles", display: "mostly plays singles" }, { value: "Doubles", display: "mostly plays doubles" }, { value: "Mixed", display: "mostly plays mixed" }, { value: "All of them", display: "plays singles and doubles" },
    ] },
    playingStyle: { label: "Style", adminLabel: "Playing style", options: [{ value: "Attacking" }, { value: "All-round" }, { value: "Defensive" }] },
    timeWithRacket: { label: "Time with racket", adminLabel: "Time with racket", options: [
      { value: "Tried briefly", hint: "A few sessions", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared with padel: shape holds the maker's racket line, core the shaft flex in the maker's own words
  // (Yonex "Hi-Flex", Li-Ning "Hard flexible", Victor's 1–5 dot scale), surface the maker's tension limit.
  specs: [
    { column: "shape", label: "Series", max: 100, placeholder: "e.g. Astrox", options: BADMINTON_SERIES },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 4U (avg 83 g), 3U (avg 88 g)" },
    { column: "balance", label: "Balance", max: 120, placeholder: "e.g. Head heavy (305 mm)" },
    { column: "core", label: "Flex", max: 200, placeholder: "e.g. Stiff" },
    { column: "surface", label: "String tension", max: 200, placeholder: "e.g. 4U: 20–28 lbs; 3U: 21–29 lbs" },
  ],
  shapeFilter: [],
  rowDetail: { column: "weight", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "easy power", tone: "pos" },
    { label: "steep smashes", tone: "pos" },
    { label: "good control", tone: "pos" },
    { label: "fast handling", tone: "pos" },
    { label: "great in defence", tone: "pos" },
    { label: "forgiving", tone: "pos" },
    { label: "stable", tone: "pos" },
    { label: "comfortable", tone: "pos" },
    { label: "tiring", tone: "neg" },
    { label: "small sweet spot", tone: "neg" },
    { label: "slow to swing", tone: "neg" },
    { label: "underpowered", tone: "neg" },
    { label: "demanding", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "crisp", tone: "neutral" },
    { label: "soft", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Lists go by review tags: balance and flex are written too many ways to filter on.
  topLists: [
    { slug: "best-badminton-rackets", label: "Best overall", title: "Best Badminton Rackets", minReviews: 10,
      intro: "The rackets players are most consistently happy with, among rackets enough players have reviewed." },
    { slug: "best-power-badminton-rackets", label: "Best for power", title: "Best Badminton Rackets for Power", minReviews: 8,
      intro: "Rackets players keep describing as powerful, on smashes and clears.",
      trait: { tags: ["easy power", "steep smashes"], minShare: 0.15, against: ["underpowered"], noun: "power or smashes" } },
    { slug: "best-control-badminton-rackets", label: "Best for control", title: "Best Badminton Rackets for Control", minReviews: 8,
      intro: "Rackets players praise for control and stability at the net and on placement.",
      trait: { tags: ["good control", "stable"], minShare: 0.2, noun: "control or stability" } },
    { slug: "best-doubles-badminton-rackets", label: "Best for speed", title: "Best Badminton Rackets for Speed and Defence", minReviews: 8,
      intro: "Rackets players say are quick in drives, defence and fast exchanges, as in doubles.",
      trait: { tags: ["fast handling", "great in defence"], minShare: 0.2, against: ["slow to swing"], noun: "speed or defence" } },
    { slug: "best-beginner-badminton-rackets", label: "Most forgiving", title: "Most Forgiving Badminton Rackets", minReviews: 8,
      intro: "Rackets players call forgiving or comfortable, without many complaints that they are demanding.",
      trait: { tags: ["forgiving", "comfortable"], minShare: 0.2, against: ["demanding"], noun: "forgiveness or comfort" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Badminton shop", "Forum", "Other"],
  examples: { brand: "Yonex", model: "Astrox 99 Pro", year: 2026, search: "yonex" },
  form: {
    prompts: [["What did you switch from?", "Before this I played with "], ["Strings and tension?", "I strung it with "], ["Singles or doubles?", "I mostly play "]],
    tips: ["What you played with before, and how this compares", "Your strings and tension, if you know them", "Where it shines and where it struggles: smashes, drives, net, defence", "Weight class and grip, if you know them", "Arm or shoulder comfort, if that matters to you"],
  },
  seo: {
    homeTitle: "BadmintonRecs – Real Player Reviews of Badminton Rackets",
    homeDescription: "Browse real badminton racket reviews from players and opinions collected from Reddit, forums, YouTube and shops. Compare experiences across Yonex, Victor, Li-Ning and more.",
    layoutDescription: "Real player experiences with badminton rackets, plus opinions from Reddit, forums, YouTube and shops with the source linked.",
    titleTemplate: "%s | BadmintonRecs",
    catalog: { title: "All Badminton Rackets – Player Reviews and Ratings", description: "Every badminton racket on BadmintonRecs with community ratings. Filter by brand and series, then read what players say about each one." },
    brands: { title: "Badminton Racket Brands", description: "Browse badminton rackets by brand — Yonex, Victor, Li-Ning and more — and read real player reviews of each model." },
    brand: brand => ({ title: `${brand} Badminton Rackets – Player Reviews`, description: `Real player reviews of ${brand} badminton rackets: ratings, strengths and weaknesses for every ${brand} model on BadmintonRecs.` }),
    product: name => ({ title: `${name} Player Reviews | BadmintonRecs`, description: `Read real player experiences with the ${name}. Ratings for power, control, speed and feel, and opinions from BadmintonRecs and around the web.` }),
    productNotFound: "Racket not found | BadmintonRecs",
    productCategory: "Badminton racket",
    addReview: { title: "Add a Badminton Racket Review", description: "Played with a badminton racket? Share how it felt on court in about two minutes. No account needed." },
    about: { title: "About", description: "Why BadmintonRecs exists: badminton racket opinions are scattered across Reddit, forums, YouTube and shops. BadmintonRecs collects them and lets players add their own." },
    ogAlt: "BadmintonRecs – real player reviews of badminton rackets",
    ogProductAlt: "Badminton racket player reviews on BadmintonRecs",
    ogEyebrow: "Player reviews of badminton rackets",
    ogTitle: "Real player reviews of badminton rackets",
    ogDetail: "From players, Reddit, forums, YouTube and shops",
    ogFallbackTitle: "Badminton racket reviews",
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
    notFound: "We couldn’t find that racket or page. Maybe it moved, maybe it never existed, maybe the link just clipped the tape.",
    about: {
      heading: "Why BadmintonRecs exists",
      paragraphs: [
        "Racket reviews are scattered across Reddit, forums, YouTube and shops. BadmintonRecs puts those experiences in one place and lets players add their own.",
        "A racket that works for one player won’t work for everyone. Knowing someone’s level, whether they play singles or doubles, their strings and their time with a racket often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Players, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from player submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "BadmintonRecs is new. Player submissions are moderated before publication, web reviews link to their sources, and racket specifications come from the manufacturers’ published figures." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about rackets you’ve actually played with and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
