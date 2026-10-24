import type { Niche } from "./types";

// Rating icons: an orange table tennis ball with a seam and a highlight, outlined in table blue. Same tile sizes as the
// other niches (17×14 strip, 20×20 picker); the strip tile widens the 20×20 drawing's viewBox so the ball stays round.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const BALL = "<circle cx='10' cy='10' r='7.6'";
const SEAM = "M3.6 11.6C7 9.4 13 9.4 16.4 11.6";
const ballIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  const marks = on
    ? `${BALL} fill='#f97316' stroke='#16306b' stroke-width='1.4'/><path d='${SEAM}' fill='none' stroke='#16306b' stroke-width='.9' stroke-opacity='.45'/><circle cx='7.4' cy='6.8' r='1.6' fill='#fff' fill-opacity='.75'/>`
    : `${BALL} fill='#e3e8f2'/>`;
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${marks}</svg>`);
};
const ogBall = (fill: string, stroke: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.6" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/><path d="${SEAM}" fill="none" stroke="${stroke}" stroke-width=".9" stroke-opacity=".45"/></svg>`;

export const tabletennis: Niche = {
  id: "tabletennis",
  schema: "tabletennisrecs",
  site: {
    name: "TableTennisRecs",
    domain: "tabletennisrecs.com",
    wordmark: "tabletennisrecs",
    descriptor: "player reviews of table tennis blades, rubbers and rackets",
    footer: "kept by people who own more rubbers than blades. No affiliate links.",
    // analyticsId: set once the GA property for tabletennisrecs.com exists.
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "player", many: "players", One: "Player", Many: "Players" },
  // Makers name blades and rubbers by line and version (Viscaria, Tenergy 05 FX, Dignics 09C, Hurricane 3 Neo), not by year.
  // Handle shapes (flared, straight, anatomic, penhold), sponge thicknesses, hardness degrees and colours are one product;
  // versions sold under their own names stay separate (Hurricane 3 vs Hurricane 3 Neo vs Hurricane 3 National).
  productYears: false,
  productPath: "equipment",
  scoreUnit: { one: "ball", many: "balls" },
  // White page, table blue, one ball-orange accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f4f6fb",
    "--ink": "#121a2e",
    "--ink-2": "#343f5a",
    "--ink-3": "#646f88",
    "--line": "#e3e8f2",
    "--line-2": "#cdd5e5",
    "--green": "#1e3a8a",
    "--green-ink": "#16306b",
    "--green-wash": "#ecf0fa",
    "--green-line": "#c6d1ec",
    "--on-green": "#f2f5fd",
    "--on-green-muted": "#aebde3",
    "--lime": "#f97316",
    "--lime-wash": "#fff3ea",
    "--lime-line": "#fdd0ad",
    "--lime-ink": "#b4480a",
    "--lime-ink-2": "#8c3808",
    "--score-on": ballIcon("tile", true),
    "--score-off": ballIcon("tile", false),
    "--score-pick-on": ballIcon("pick", true),
    "--score-pick-off": ballIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f97316", "#cdd5e5", "#60a5fa", "#fdd0ad", "#94a3b8"],
  og: {
    background: "#1e3a8a",
    accent: "#f97316",
    muted: "#aebde3",
    text: "#f2f5fd",
    scoreOn: ogBall("#f97316", "#0f2257"),
    scoreOff: ogBall("#3a55a0", "#3a55a0"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for table tennis: power = speed, maneuverability = spin, control = control,
  // forgiveness = forgiveness (consistency on off-centre and mistimed shots), comfort = feel (dwell, vibration, sound).
  categories: [
    { column: "powerRating", label: "Speed", hint: "how fast the ball comes off it" },
    { column: "maneuverabilityRating", label: "Spin", hint: "loops, serves and pushes" },
    { column: "controlRating", label: "Control", hint: "short game, blocks and placement" },
    { column: "forgivenessRating", label: "Forgiveness", hint: "how often a mistimed shot still lands" },
    { column: "comfortRating", label: "Feel", hint: "dwell, vibration and feedback" },
  ],
  profile: {
    playerLevel: { label: "Level", adminLabel: "Player level", options: [
      { value: "Beginner", hint: "Learning the strokes" }, { value: "Intermediate", hint: "Regular club play" },
      { value: "Advanced", hint: "League or tournament" }, { value: "Competitive", hint: "Rated 2000+ or national level" },
    ] },
    playingSide: { label: "Grip", adminLabel: "Grip", options: [
      { value: "Shakehand", display: "plays shakehand" }, { value: "Penhold", display: "plays penhold" },
    ] },
    playingStyle: { label: "Style", adminLabel: "Playing style", options: [
      { value: "Looper" }, { value: "All-round" }, { value: "Blocker / pips" }, { value: "Chopper" },
    ] },
    timeWithRacket: { label: "Time with it", adminLabel: "Time with it", options: [
      { value: "Tried briefly", hint: "A few sessions", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = type, balance = the blade's speed class (OFF, ALL+…) as the shop states it, core = the blade's
  // plies or the rubber's surface (inverted, short or long pips), surface = the rubber's sponge hardness (in the maker's own
  // scale) and thicknesses, weight = the blade's weight as the page states it. Blank where the page gives none.
  specs: [
    { column: "shape", label: "Type", max: 100, placeholder: "e.g. Blade", options: ["Blade", "Rubber", "Pre-assembled racket"] },
    { column: "balance", label: "Class", max: 60, placeholder: "e.g. OFF or ALL+" },
    { column: "core", label: "Construction", max: 120, placeholder: "e.g. 5W+2ALC or Inverted" },
    { column: "surface", label: "Sponge", max: 160, placeholder: "e.g. Hardness 47.5 · 1.9, 2.1 mm, Max" },
    { column: "weight", label: "Weight", max: 60, placeholder: "e.g. 86 g" },
  ],
  shapeFilter: ["Blade", "Rubber", "Pre-assembled racket"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Not plain /rackets: on sites whose catalogue lives elsewhere that address redirects to the catalogue (next.config.ts).
  typePages: [
    { shape: "Blade", slug: "blades", label: "Blades", intro: "Table tennis blades: all-wood and carbon, from allround to the fastest offensive blades" },
    { shape: "Rubber", slug: "rubbers", label: "Rubbers", intro: "Inverted, short-pips and long-pips rubbers: tensioned European and Japanese rubbers and tacky Chinese ones" },
    { shape: "Pre-assembled racket", slug: "pre-assembled-rackets", label: "Pre-assembled rackets", intro: "Ready-made rackets with the rubbers already glued on, for starting out or a step up" },
  ],
  rowDetail: { column: "core", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "fast", tone: "pos" },
    { label: "spinny", tone: "pos" },
    { label: "great control", tone: "pos" },
    { label: "great for looping", tone: "pos" },
    { label: "solid blocks", tone: "pos" },
    { label: "good short game", tone: "pos" },
    { label: "good feel", tone: "pos" },
    { label: "forgiving", tone: "pos" },
    { label: "great for beginners", tone: "pos" },
    { label: "consistent", tone: "pos" },
    { label: "durable", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "too fast", tone: "neg" },
    { label: "hard to control", tone: "neg" },
    { label: "loses grip fast", tone: "neg" },
    { label: "too heavy", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "high throw", tone: "neutral" },
    { label: "low throw", tone: "neutral" },
    { label: "hard", tone: "neutral" },
    { label: "soft", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-table-tennis-blades", label: "Blades", title: "Best Table Tennis Blades", minReviews: 5,
      intro: "The blades players are most consistently happy with, among blades enough players have reviewed.", filters: [{ column: "shape", include: ["Blade"] }] },
    { slug: "best-table-tennis-rubbers", label: "Rubbers", title: "Best Table Tennis Rubbers", minReviews: 5,
      intro: "The rubbers players are most consistently happy with, among rubbers enough players have reviewed.", filters: [{ column: "shape", include: ["Rubber"] }] },
    { slug: "best-spin-table-tennis-rubbers", label: "Spinniest rubbers", title: "Best Table Tennis Rubbers for Spin", minReviews: 5,
      intro: "Rubbers players most often call spinny or great for looping.", filters: [{ column: "shape", include: ["Rubber"] }],
      trait: { tags: ["spinny", "great for looping"], minShare: 0.25, noun: "spin or looping" } },
    { slug: "best-control-table-tennis-blades", label: "Control blades", title: "Best Table Tennis Blades for Control", minReviews: 5,
      intro: "Blades players praise for control and a good short game, without many complaints that they are hard to control.", filters: [{ column: "shape", include: ["Blade"] }],
      trait: { tags: ["great control", "good short game", "solid blocks"], minShare: 0.25, against: ["hard to control", "too fast"], noun: "control" } },
    { slug: "best-beginner-table-tennis-equipment", label: "For beginners", title: "Best Table Tennis Equipment for Beginners", minReviews: 5,
      intro: "Blades, rubbers and rackets players most often call forgiving or great for beginners.",
      trait: { tags: ["great for beginners", "forgiving"], minShare: 0.2, against: ["hard to control", "too fast"], noun: "forgiveness" } },
    { slug: "best-pre-assembled-table-tennis-rackets", label: "Pre-assembled rackets", title: "Best Pre-assembled Table Tennis Rackets", minReviews: 5,
      intro: "The ready-made rackets players are most consistently happy with.", filters: [{ column: "shape", include: ["Pre-assembled racket"] }] },
    { slug: "best-value-table-tennis-equipment", label: "Best value", title: "Best Value Table Tennis Equipment", minReviews: 5,
      intro: "The blades, rubbers and rackets players most often call great value or durable.",
      trait: { tags: ["great value", "durable"], minShare: 0.25, against: ["overpriced", "loses grip fast"], noun: "value or durability" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Table tennis shop", "Forum", "Other"],
  examples: { brand: "Butterfly", model: "Viscaria", year: 2026, search: "viscaria" },
  form: {
    prompts: [["What did you use before?", "Before this I played with "], ["What is it paired with?", "I use it with "], ["Forehand or backhand?", "I have it on my "]],
    tips: ["What you used before, and how this compares", "The rest of your setup: the blade or rubbers it is paired with, thickness and side", "Where it shines and where it struggles: loops, blocks, serves, short game, away from the table", "How fast it lost grip or speed, if it did", "Your level and style, if you like"],
  },
  seo: {
    homeTitle: "TableTennisRecs – Real Player Reviews of Table Tennis Blades, Rubbers and Rackets",
    homeDescription: "Browse real table tennis blade, rubber and racket reviews from players and opinions collected from Reddit, forums, YouTube and shops. Compare Butterfly, Stiga, DHS, Yasaka, Tibhar, XIOM, Donic, Nittaku, Andro, JOOLA, Victas and more.",
    layoutDescription: "Real player experiences with table tennis blades, rubbers and rackets, plus opinions from Reddit, forums, YouTube and shops with the source linked.",
    titleTemplate: "%s | TableTennisRecs",
    catalog: { title: "All Table Tennis Equipment – Player Reviews and Ratings", description: "Every table tennis blade, rubber and pre-assembled racket on TableTennisRecs with community ratings. Filter by brand and type, then read what players say." },
    brands: { title: "Table Tennis Brands", description: "Browse table tennis blades and rubbers by brand — Butterfly, Stiga, DHS, Yasaka, Tibhar, XIOM, Donic, Nittaku, Andro, JOOLA, Victas — and read real player reviews of each model." },
    brand: brand => ({ title: `${brand} Table Tennis Blades and Rubbers – Player Reviews`, description: `Real player reviews of ${brand} table tennis equipment: ratings, strengths and weaknesses for every ${brand} blade and rubber on TableTennisRecs.` }),
    product: name => ({ title: `${name} Player Reviews | TableTennisRecs`, description: `Read real player experiences with the ${name}. Ratings for speed, spin, control, forgiveness and feel, and opinions from TableTennisRecs and around the web.` }),
    productNotFound: "Product not found | TableTennisRecs",
    productCategory: "Table tennis equipment",
    addReview: { title: "Add a Table Tennis Review", description: "Played with a blade, rubber or racket? Share how it plays for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why TableTennisRecs exists: table tennis equipment opinions are scattered across Reddit, forums, YouTube and shops. TableTennisRecs collects them and lets players add their own." },
    ogAlt: "TableTennisRecs – real player reviews of table tennis equipment",
    ogProductAlt: "Table tennis equipment player reviews on TableTennisRecs",
    ogEyebrow: "Player reviews of table tennis equipment",
    ogTitle: "Real player reviews of blades and rubbers",
    ogDetail: "From players, Reddit, forums, YouTube and shops",
    ogFallbackTitle: "Table tennis equipment reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other players how a blade, rubber or racket actually played for you. Takes about two minutes, no account needed.",
      howItWent: "how it played",
      aboutYou: "About your game",
      aboutYouHint: "optional · helps people find players like them",
      howItPerforms: "How it plays",
      whoUsesIt: "Who's playing it",
      triedIt: "Played it?",
      triedOne: "Played one?",
      triedOneOfThese: "Played one of these?",
    },
    notFound: "We couldn’t find that blade, rubber or page. Maybe it moved, maybe it was discontinued, maybe it’s still rolling under the next table.",
    about: {
      heading: "Why TableTennisRecs exists",
      paragraphs: [
        "Blade and rubber reviews are scattered across Reddit, forums, YouTube and shops. TableTennisRecs puts those experiences in one place and lets players add their own.",
        "A setup that works for one player won’t work for everyone. Knowing someone’s level, grip and style, what the rubber was paired with and how long they played it often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Players, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from player submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "TableTennisRecs is new. Player submissions are moderated before publication, web reviews link to their sources, and specifications come from the shop pages linked for each product." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about equipment you’ve actually played with and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
