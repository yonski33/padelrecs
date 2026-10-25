import type { Niche } from "./types";

// Rating icons: a six-armed snowflake, glacier blue with a coral centre. Same tile sizes as the other niches (17×14 strip, 20×20 picker);
// the strip tile widens the 20×20 drawing's viewBox so it keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const ARMS = "M10 1.6V18.4M2.7 5.8L17.3 14.2M2.7 14.2L17.3 5.8";
const TIPS = "M7.6 2.8L10 5.2L12.4 2.8M7.6 17.2L10 14.8L12.4 17.2M2.6 8.4L5.9 7.5L5 4.3M17.4 11.6L14.1 12.5L15 15.7M2.6 11.6L5.9 12.5L5 15.7M17.4 8.4L14.1 7.5L15 4.3";
const flakeIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  const [ink, dot] = on ? ["#0c4a6e", "#ff7a59"] : ["#dde7ee", "#dde7ee"];
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${ARMS} ${TIPS}' fill='none' stroke='${ink}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><circle cx='10' cy='10' r='2.3' fill='${dot}'/></svg>`);
};
const ogFlake = (ink: string, dot: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${ARMS} ${TIPS}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="10" r="2.3" fill="${dot}"/></svg>`;

export const snowboard: Niche = {
  id: "snowboard",
  schema: "snowboardrecs",
  site: {
    name: "SnowboardRecs",
    domain: "snowboardrecs.com",
    wordmark: "snowboardrecs",
    descriptor: "rider reviews of all-mountain, freestyle and freeride snowboards and splitboards",
    footer: "kept by people who check the snow report before the weather report. No affiliate links.",
    analyticsId: "G-7EGLY6ZMS1",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "board", many: "boards", One: "Board", Many: "Boards" },
  people: { one: "rider", many: "riders", One: "Rider", Many: "Riders" },
  // Makers update boards every season and retailers sell them by model year ("Burton Custom 2026"), so names carry the year, as on PadelRecs.
  // Colourways and sizes (including wides) are one product; women's-only models keep their own names (Feelgood, Yeasayer, Twin Sister).
  productYears: true,
  productPath: "snowboards",
  scoreUnit: { one: "snowflake", many: "snowflakes" },
  // White page, glacier-blue ink, one coral accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f4f8fb",
    "--ink": "#0f2233",
    "--ink-2": "#2f4558",
    "--ink-3": "#617687",
    "--line": "#dde7ee",
    "--line-2": "#c8d6e1",
    "--green": "#0c4a6e",
    "--green-ink": "#083651",
    "--green-wash": "#eaf3f9",
    "--green-line": "#c3dbeb",
    "--on-green": "#f0f8fd",
    "--on-green-muted": "#a7c8dd",
    "--lime": "#ff7a59",
    "--lime-wash": "#fff3ef",
    "--lime-line": "#ffd2c4",
    "--lime-ink": "#b4381a",
    "--lime-ink-2": "#8f2c14",
    "--score-on": flakeIcon("tile", true),
    "--score-off": flakeIcon("tile", false),
    "--score-pick-on": flakeIcon("pick", true),
    "--score-pick-off": flakeIcon("pick", false),
  },
  chartColors: ["var(--green)", "#ff7a59", "#c8d6e1", "#38bdf8", "#ffd2c4", "#94a3b8"],
  og: {
    background: "#0c4a6e",
    accent: "#ff7a59",
    muted: "#a7c8dd",
    text: "#f0f8fd",
    scoreOn: ogFlake("#f0f8fd", "#ff7a59"),
    scoreOff: ogFlake("#2c6688", "#2c6688"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — disappointed", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for snowboards: power = pop, comfort = carving, maneuverability = playfulness,
  // control = stability at speed, forgiveness = forgiveness (catch-free, easy to ride).
  categories: [
    { column: "powerRating", label: "Pop", hint: "ollies, jumps and energy out of turns" },
    { column: "comfortRating", label: "Carving", hint: "edge hold and how it holds a turn on groomers and ice" },
    { column: "maneuverabilityRating", label: "Playfulness", hint: "butters, presses, spins and riding switch" },
    { column: "controlRating", label: "Stability", hint: "how calm it stays at speed and in chop" },
    { column: "forgivenessRating", label: "Forgiveness", hint: "how easy it is to ride and how rarely it catches an edge" },
  ],
  profile: {
    playerLevel: { label: "Riding level", adminLabel: "Level", options: [
      { value: "Beginner", hint: "first seasons, linking turns" }, { value: "Intermediate", hint: "blues and some blacks" },
      { value: "Advanced", hint: "whole mountain" }, { value: "Expert", hint: "anything, any condition" },
    ] },
    playingSide: { label: "Where you ride", adminLabel: "Terrain", options: [
      { value: "All over the mountain", display: "rides all over the mountain" }, { value: "Park", display: "rides mostly park" },
      { value: "Groomers", display: "rides mostly groomers" }, { value: "Powder and trees", display: "rides mostly powder and trees" },
      { value: "Backcountry", display: "rides backcountry" },
    ] },
    playingStyle: { label: "Riding style", adminLabel: "Style", options: [
      { value: "Freestyle" }, { value: "All-mountain" }, { value: "Freeride" }, { value: "Carving" },
    ] },
    timeWithRacket: { label: "Time on it", adminLabel: "Time on it", options: [
      { value: "Demo", hint: "A demo or a few runs", display: "demoed it" }, { value: "A few days", hint: "< 10 days" }, { value: "Part of a season", hint: "10+ days" }, { value: "One season", hint: "1 season" }, { value: "Several seasons", hint: "2 seasons +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category (from evo's terrain list), balance = terrain as evo lists it, surface = the profile (camber/rocker)
  // in the maker's own words, core = board shape (directional, directional twin, true twin), weight = flex as the page states it.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. All-mountain snowboard", options: ["All-mountain snowboard", "Freestyle snowboard", "Freeride snowboard", "Splitboard"] },
    { column: "balance", label: "Terrain", max: 120, placeholder: "e.g. All-Mountain, Freeride" },
    { column: "surface", label: "Profile", max: 120, placeholder: "e.g. Camber, Flying V or Hybrid C2X" },
    { column: "core", label: "Shape", max: 120, placeholder: "e.g. Directional Twin" },
    { column: "weight", label: "Flex", max: 60, placeholder: "e.g. Medium or 6/10" },
  ],
  shapeFilter: ["All-mountain snowboard", "Freestyle snowboard", "Freeride snowboard", "Splitboard"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "All-mountain snowboard", slug: "all-mountain-snowboards", label: "All-mountain", intro: "Boards for riding the whole mountain, from groomers to side hits" },
    { shape: "Freestyle snowboard", slug: "freestyle-snowboards", label: "Freestyle & park", intro: "Twins and park boards for jumps, rails, butters and riding switch" },
    { shape: "Freeride snowboard", slug: "freeride-snowboards", label: "Freeride & powder", intro: "Directional, tapered and powder boards for steeps, trees and deep days" },
    { shape: "Splitboard", slug: "splitboards", label: "Splitboards", intro: "Splitboards for touring up and riding down in the backcountry" },
  ],
  rowDetail: { column: "surface", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "poppy", tone: "pos" },
    { label: "great edge hold", tone: "pos" },
    { label: "stable at speed", tone: "pos" },
    { label: "playful", tone: "pos" },
    { label: "easy to butter", tone: "pos" },
    { label: "floats in powder", tone: "pos" },
    { label: "forgiving", tone: "pos" },
    { label: "damp", tone: "pos" },
    { label: "great for beginners", tone: "pos" },
    { label: "rides switch well", tone: "pos" },
    { label: "durable", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "catchy", tone: "neg" },
    { label: "chattery", tone: "neg" },
    { label: "washes out", tone: "neg" },
    { label: "sinks in powder", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "stiff", tone: "neutral" },
    { label: "soft", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Model years are real here, so lists keep to the last three (maxAgeYears 2). Each appears once enough boards in it have reviews.
  topLists: [
    { slug: "best-snowboards", label: "Best overall", title: "Best Snowboards", minReviews: 8, maxAgeYears: 2,
      intro: "The boards riders are most consistently happy with, among boards enough riders have reviewed." },
    { slug: "best-all-mountain-snowboards", label: "All-mountain", title: "Best All-Mountain Snowboards", minReviews: 5, maxAgeYears: 2,
      intro: "The all-mountain boards riders are most consistently happy with.", filters: [{ column: "shape", include: ["All-mountain snowboard"] }] },
    { slug: "best-freestyle-snowboards", label: "Freestyle & park", title: "Best Freestyle and Park Snowboards", minReviews: 5, maxAgeYears: 2,
      intro: "The freestyle and park boards riders are most consistently happy with.", filters: [{ column: "shape", include: ["Freestyle snowboard"] }] },
    { slug: "best-freeride-snowboards", label: "Freeride & powder", title: "Best Freeride and Powder Snowboards", minReviews: 5, maxAgeYears: 2,
      intro: "The freeride and powder boards riders are most consistently happy with.", filters: [{ column: "shape", include: ["Freeride snowboard"] }] },
    { slug: "best-splitboards", label: "Splitboards", title: "Best Splitboards", minReviews: 5, maxAgeYears: 2,
      intro: "The splitboards riders are most consistently happy with.", filters: [{ column: "shape", include: ["Splitboard"] }] },
    { slug: "best-beginner-snowboards", label: "For beginners", title: "Best Snowboards for Beginners", minReviews: 5, maxAgeYears: 2,
      intro: "Boards riders most often call forgiving or great for beginners, without many complaints about catching edges.",
      trait: { tags: ["great for beginners", "forgiving"], minShare: 0.2, against: ["catchy"], noun: "forgiveness" } },
    { slug: "best-carving-snowboards", label: "For carving", title: "Best Snowboards for Carving", minReviews: 5, maxAgeYears: 2,
      intro: "Boards riders most often praise for edge hold and stability at speed.",
      trait: { tags: ["great edge hold", "stable at speed"], minShare: 0.25, against: ["washes out", "chattery"], noun: "edge hold or stability" } },
    { slug: "best-powder-snowboards", label: "For powder", title: "Best Snowboards for Powder", minReviews: 5, maxAgeYears: 2,
      intro: "Boards riders most often say float well in deep snow.",
      trait: { tags: ["floats in powder"], minShare: 0.25, against: ["sinks in powder"], noun: "float in powder" } },
    { slug: "most-playful-snowboards", label: "Most playful", title: "Most Playful Snowboards", minReviews: 5, maxAgeYears: 2,
      intro: "Boards riders most often call playful, poppy or easy to butter.",
      trait: { tags: ["playful", "easy to butter", "poppy"], minShare: 0.25, noun: "playfulness or pop" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Snowboard shop", "Forum", "Other"],
  examples: { brand: "Burton", model: "Custom", year: 2026, search: "custom" },
  form: {
    prompts: [["What did you ride before?", "Before this I rode "], ["Where do you ride it?", "I mostly ride it "], ["Any issues?", "After a few days I noticed "]],
    tips: ["What you rode before, and how this compares", "Where you ride it: groomers, park, trees, powder or backcountry", "Your size, the board's length and your bindings and stance", "Pop, edge hold, stability at speed and how forgiving it is", "How it has held up, and whether it was worth the price"],
  },
  seo: {
    homeTitle: "SnowboardRecs – Real Reviews of All-Mountain, Freestyle and Freeride Snowboards",
    homeDescription: "Browse real rider reviews of all-mountain, freestyle, freeride and powder snowboards and splitboards, plus opinions collected from Reddit, YouTube, shops and forums. Compare Burton, Lib Tech, GNU, Jones, CAPiTA, Never Summer, Ride, Salomon and more by model year.",
    layoutDescription: "Real experiences with snowboards and splitboards, plus opinions from Reddit, YouTube, shops and forums with the source linked.",
    titleTemplate: "%s | SnowboardRecs",
    catalog: { title: "All Snowboards – Reviews and Ratings", description: "Every snowboard and splitboard on SnowboardRecs with rider ratings. Filter by brand, category and model year, then read what riders say." },
    brands: { title: "Snowboard Brands", description: "Browse snowboards by brand — Burton, Lib Tech, GNU, Jones, CAPiTA, Never Summer, Ride, Salomon, Rome, Arbor, Yes., Nitro, K2 and Bataleon — and read real reviews of each model." },
    brand: brand => ({ title: `${brand} Snowboards – Reviews`, description: `Real rider reviews of ${brand} snowboards: ratings, strengths and weaknesses for every ${brand} board on SnowboardRecs.` }),
    product: name => ({ title: `${name} Reviews | SnowboardRecs`, description: `Read real rider experiences with the ${name}. Ratings for pop, carving, playfulness, stability and forgiveness, plus opinions from around the web.` }),
    productNotFound: "Board not found | SnowboardRecs",
    productCategory: "Snowboards",
    addReview: { title: "Add a Snowboard Review", description: "Ride a snowboard or splitboard? Share how it rides for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why SnowboardRecs exists: snowboard opinions are scattered across Reddit, YouTube, shops and forums. SnowboardRecs collects them and lets riders add their own." },
    ogAlt: "SnowboardRecs – real reviews of snowboards",
    ogProductAlt: "Snowboard reviews on SnowboardRecs",
    ogEyebrow: "Real reviews of snowboards",
    ogTitle: "Snowboard reviews from people who ride them",
    ogDetail: "From riders, Reddit, YouTube, shops and forums",
    ogFallbackTitle: "Snowboard reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other riders how a snowboard or splitboard actually rides for you. Takes about two minutes, no account needed.",
      howItWent: "how it rides",
      aboutYou: "About your riding",
      aboutYouHint: "optional · helps people find riders like them",
      howItPerforms: "How it rides",
      whoUsesIt: "Who's riding it",
      triedIt: "Ridden it?",
      triedOne: "Ridden one?",
      triedOneOfThese: "Ridden one of these?",
    },
    notFound: "We couldn’t find that board or page. Maybe it moved, maybe it was last season’s, maybe it’s still in the lift line.",
    about: {
      heading: "Why SnowboardRecs exists",
      paragraphs: [
        "Snowboard opinions are scattered across Reddit, YouTube, shops and forums. SnowboardRecs puts those experiences in one place and lets riders add their own.",
        "A board that is perfect for one rider is a handful for another. Knowing someone's level, where they ride, their size and what they rode before often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Riders, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from rider submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "SnowboardRecs is new. Submissions are moderated before publication, web reviews link to their sources, and board details come from the shop and maker pages linked for each board." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about boards you have actually ridden and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
