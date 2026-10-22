import type { Niche } from "./types";

// Rating icons: a white golf ball on a sand-gold tee, outlined in fairway green. Same tile sizes as padel (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const ball = "M8.5 1.2a4.6 4.6 0 1 1 0 9.2a4.6 4.6 0 1 1 0-9.2z";
const tee = "M5.6 10.6h5.8l-1.8 1.3v1.6h-2.2v-1.6z";
const ballTile = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='17' height='14' viewBox='0 0 17 14'><path d='${tee}' fill='#d9a441'/><path d='${ball}' fill='#ffffff' stroke='#14532d' stroke-width='1.1'/></svg>`);
const ballTileOff = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='17' height='14' viewBox='0 0 17 14'><path d='${tee}' fill='#dfe6e1'/><path d='${ball}' fill='#dfe6e1'/></svg>`);
const ballPick = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><g transform='translate(1.5 3)'><path d='${tee}' fill='#d9a441'/><path d='${ball}' fill='#ffffff' stroke='#14532d' stroke-width='1.2'/></g></svg>`);
const ballPickOff = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><g transform='translate(1.5 3)'><path d='${tee}' fill='#dfe6e1'/><path d='${ball}' fill='#dfe6e1'/></g></svg>`);
const ogBall = (fill: string, stroke: string, teeFill: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><g transform="translate(1.5 3)"><path d="${tee}" fill="${teeFill}"/><path d="${ball}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/></g></svg>`;

export const golf: Niche = {
  id: "golf",
  schema: "golfrecs",
  site: {
    name: "GolfRecs",
    domain: "golfrecs.com",
    wordmark: "golfrecs",
    descriptor: "golfer reviews of drivers",
    footer: "kept by people who spend too long at the range. No affiliate links.",
    analyticsId: "G-8Y0MW4Y4QZ",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "driver", many: "drivers", One: "Driver", Many: "Drivers" },
  people: { one: "golfer", many: "golfers", One: "Golfer", Many: "Golfers" },
  // Makers name each generation (Qi35, Qi4D, G440), so names carry the generation instead of a year.
  productYears: false,
  productPath: "drivers",
  scoreUnit: { one: "ball", many: "balls" },
  // White page, fairway green, one sand-gold accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f2f6f3",
    "--ink": "#14211a",
    "--ink-2": "#394a40",
    "--ink-3": "#67786e",
    "--line": "#dce6df",
    "--line-2": "#c4d3c9",
    "--green": "#166534",
    "--green-ink": "#0f4a26",
    "--green-wash": "#e3f1e7",
    "--green-line": "#a8d4b5",
    "--on-green": "#e8f6ec",
    "--on-green-muted": "#a3cfb0",
    "--lime": "#d9a441",
    "--lime-wash": "#fbf1dc",
    "--lime-line": "#e8c57a",
    "--lime-ink": "#5c3f06",
    "--lime-ink-2": "#473004",
    "--score-on": ballTile,
    "--score-off": ballTileOff,
    "--score-pick-on": ballPick,
    "--score-pick-off": ballPickOff,
  },
  chartColors: ["var(--green)", "var(--lime)", "#cfe2d5", "#a3cfb0", "#f0dcae", "#b8c8bd"],
  og: {
    background: "#166534",
    accent: "#d9a441",
    muted: "#a3cfb0",
    text: "#e8f6ec",
    scoreOn: ogBall("#ffffff", "#0b3a1d", "#d9a441"),
    scoreOff: ogBall("#3f8a5a", "#3f8a5a", "#3f8a5a"),
  },
  ratingWords: { "5": "5 — loved it", "4": "4 — really liked it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled: power = distance, control = accuracy, forgiveness = forgiveness, comfort = feel & sound, maneuverability = looks at address.
  categories: [
    { column: "powerRating", label: "Distance", hint: "ball speed, carry and roll" },
    { column: "controlRating", label: "Accuracy", hint: "keeping it in the fairway" },
    { column: "forgivenessRating", label: "Forgiveness", hint: "off-centre hits, toe and heel" },
    { column: "comfortRating", label: "Feel & sound", hint: "impact feel, sound off the face" },
    { column: "maneuverabilityRating", label: "Looks", hint: "shape and confidence at address" },
  ],
  profile: {
    playerLevel: { label: "Handicap", adminLabel: "Handicap", options: [
      { value: "Beginner", hint: "new, or no handicap yet" }, { value: "High handicap", hint: "20+" }, { value: "Mid handicap", hint: "10–19" }, { value: "Low handicap", hint: "0–9" }, { value: "Scratch or better", hint: "0 or plus" },
    ] },
    playingSide: { label: "Swing speed", adminLabel: "Driver swing speed", options: [
      { value: "Under 85 mph", display: "swings under 85 mph" }, { value: "85–95 mph", display: "swings 85–95 mph" }, { value: "95–105 mph", display: "swings 95–105 mph" }, { value: "105 mph +", display: "swings 105 mph +" },
    ] },
    playingStyle: { label: "Usual miss", adminLabel: "Usual miss", options: [{ value: "Slice / fade" }, { value: "Hook / draw" }, { value: "Both ways" }, { value: "Mostly straight" }] },
    timeWithRacket: { label: "Time with the driver", adminLabel: "Time with the driver", options: [
      { value: "Tried briefly", hint: "A fitting or range session", display: "tried briefly" }, { value: "A few rounds", hint: "under 10 rounds" }, { value: "A season", hint: "10–40 rounds" }, { value: "More than a season", hint: "40 rounds +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared with padel: shape holds the category, weight the lofts, balance the head size, core the stock shaft, surface the hosel.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Max forgiveness", options: ["Low spin", "Max forgiveness", "Draw", "Lightweight", "Mini driver"] },
    { column: "weight", label: "Lofts", max: 120, placeholder: "e.g. 9°, 10.5°, 12°" },
    { column: "balance", label: "Head size", max: 120, placeholder: "e.g. 460 cc" },
    { column: "core", label: "Stock shaft", max: 200, placeholder: "e.g. Fujikura Ventus TR" },
    { column: "surface", label: "Adjustable hosel", max: 200, placeholder: "e.g. Yes", options: ["Yes", "No"] },
  ],
  shapeFilter: ["Low spin", "Max forgiveness", "Draw", "Lightweight", "Mini driver"],
  typePages: [
    { shape: "Low spin", slug: "low-spin-drivers", label: "Low spin", intro: "Lower-spinning drivers for faster swings and players fighting a high ball flight" },
    { shape: "Max forgiveness", slug: "forgiving-drivers", label: "Max forgiveness", intro: "The most stable, highest-MOI heads for keeping mishits in play" },
    { shape: "Draw", slug: "draw-drivers", label: "Draw", intro: "Draw-biased drivers that help straighten a slice" },
    { shape: "Lightweight", slug: "lightweight-drivers", label: "Lightweight", intro: "Lighter builds for moderate swing speeds" },
    { shape: "Mini driver", slug: "mini-drivers", label: "Mini drivers", intro: "Smaller-headed drivers that sit between a driver and a 3-wood" },
  ],
  rowDetail: { column: "weight", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "long", tone: "pos" },
    { label: "forgiving", tone: "pos" },
    { label: "straight", tone: "pos" },
    { label: "great feel", tone: "pos" },
    { label: "great sound", tone: "pos" },
    { label: "low spin", tone: "pos" },
    { label: "easy launch", tone: "pos" },
    { label: "looks great", tone: "pos" },
    { label: "small sweet spot", tone: "neg" },
    { label: "too much spin", tone: "neg" },
    { label: "hard to launch", tone: "neg" },
    { label: "slice bias", tone: "neg" },
    { label: "loud", tone: "neg" },
    { label: "harsh feel", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "adjustable", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Few drivers have many reviews yet, so the minimums are lower than on other sites.
  topLists: [
    { slug: "best-golf-drivers", label: "Best overall", title: "Best Golf Drivers", minReviews: 8,
      intro: "The drivers golfers are most consistently happy with, among drivers enough golfers have reviewed." },
    { slug: "most-forgiving-golf-drivers", label: "Most forgiving", title: "Most Forgiving Golf Drivers", minReviews: 6,
      intro: "Drivers golfers call forgiving and straight.",
      trait: { tags: ["forgiving", "straight"], minShare: 0.2, against: ["small sweet spot"], noun: "forgiveness or accuracy" } },
    { slug: "longest-golf-drivers", label: "Longest", title: "Longest Golf Drivers", minReviews: 6,
      intro: "Drivers golfers keep describing as long.",
      trait: { tags: ["long", "low spin"], minShare: 0.2, against: ["too much spin"], noun: "distance or low spin" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Golf shop", "Forum", "Other"],
  examples: { brand: "TaylorMade", model: "Qi4D", year: 2026, search: "taylormade" },
  form: {
    prompts: [["What did you play before?", "Before this I hit a "], ["How was it fitted?", "I play it at "], ["Your miss?", "My usual miss is "]],
    tips: ["What driver you played before, and how this compares", "Loft, shaft and settings you play it with", "Ball speed, carry or spin numbers if you have them", "Where it shines and where it struggles", "How it handles mishits off the toe and heel"],
  },
  seo: {
    homeTitle: "GolfRecs – Real Golfer Reviews of Drivers",
    homeDescription: "Browse real driver reviews from golfers and opinions collected from Reddit, YouTube, golf shops and forums. Compare experiences across TaylorMade, Callaway, Ping, Titleist, Cobra, Mizuno, Srixon and more.",
    layoutDescription: "Real golfer experiences with drivers, plus opinions from Reddit, YouTube, golf shops and forums with the source linked.",
    titleTemplate: "%s | GolfRecs",
    catalog: { title: "All Drivers – Golfer Reviews and Ratings", description: "Every driver on GolfRecs with community ratings. Filter by brand and category, then read what golfers say about each one." },
    brands: { title: "Driver Brands", description: "Browse drivers by brand — TaylorMade, Callaway, Ping, Titleist, Cobra, Mizuno, Srixon and more — and read real golfer reviews of each model." },
    brand: brand => ({ title: `${brand} Drivers – Golfer Reviews`, description: `Real golfer reviews of ${brand} drivers: ratings, strengths and weaknesses for every ${brand} model on GolfRecs.` }),
    product: name => ({ title: `${name} Golfer Reviews | GolfRecs`, description: `Read real golfer experiences with the ${name}. Ratings for distance, accuracy, forgiveness and feel, and opinions from GolfRecs and around the web.` }),
    productNotFound: "Driver not found | GolfRecs",
    productCategory: "Golf driver",
    addReview: { title: "Add a Driver Review", description: "Hit one on the course or at a fitting? Share how it played in about two minutes. No account needed." },
    about: { title: "About", description: "Why GolfRecs exists: driver opinions are scattered across Reddit, YouTube, golf shops and forums. GolfRecs collects them and lets golfers add their own." },
    ogAlt: "GolfRecs – real golfer reviews of drivers",
    ogProductAlt: "Driver reviews on GolfRecs",
    ogEyebrow: "Golfer reviews of drivers",
    ogTitle: "Real golfer reviews of drivers",
    ogDetail: "From golfers, Reddit, YouTube, golf shops and forums",
    ogFallbackTitle: "Driver reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other golfers how a driver actually played for you. Takes about two minutes, no account needed.",
      howItWent: "how it played",
      aboutYou: "About your game",
      aboutYouHint: "optional · helps people find golfers like them",
      howItPerforms: "How it plays",
      whoUsesIt: "Who's gaming it",
      triedIt: "Hit it?",
      triedOne: "Hit one?",
      triedOneOfThese: "Hit one of these?",
    },
    notFound: "We couldn’t find that driver or page. Maybe it moved, maybe it never existed, maybe the link sliced into the trees.",
    about: {
      heading: "Why GolfRecs exists",
      paragraphs: [
        "Driver reviews are scattered across Reddit, YouTube, golf shops and forums. GolfRecs puts those experiences in one place and lets golfers add their own.",
        "A driver that works for one golfer won’t work for everyone. Knowing someone’s swing speed, handicap, usual miss and how long they’ve played it often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Golfers, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from golfer submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "GolfRecs is new. Golfer submissions are moderated before publication, web reviews link to their sources, and driver specifications come from published figures." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about drivers you’ve actually hit and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
