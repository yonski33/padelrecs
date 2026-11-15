import type { Niche } from "./types";

// Rating icons: a robot vacuum seen from above (round body, bumper arc, sensor dot), cyan with a navy edge.
// Same tile sizes as the other niches (17×14 strip, 20×20 picker); the strip icon widens the 20×20 drawing's viewBox.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const botShape = (fill: string, edge: string, q: string) =>
  `<circle cx=${q}10${q} cy=${q}10${q} r=${q}8.2${q} fill=${q}${fill}${q} stroke=${q}${edge}${q} stroke-width=${q}1.1${q}/>`
  + `<path d=${q}M4.6 7.2a6.4 6.4 0 0 1 10.8 0${q} fill=${q}none${q} stroke=${q}${edge}${q} stroke-width=${q}1.1${q} stroke-linecap=${q}round${q}/>`
  + `<circle cx=${q}10${q} cy=${q}11${q} r=${q}2.1${q} fill=${q}${edge}${q}/>`;
const botIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? botShape("#1fa2c4", "#22355a", "'") : botShape("#e6e9ef", "#cfd5df", "'")}</svg>`);
};
const ogBot = (fill: string, edge: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${botShape(fill, edge, '"')}</svg>`;

export const VACUUM_CATEGORIES = ["Robot vacuums", "Cordless stick vacuums", "Upright vacuums", "Canister vacuums", "Handheld vacuums", "Wet/dry floor cleaners", "Carpet cleaners"];

export const vacuum: Niche = {
  id: "vacuum",
  schema: "vacuumrecs",
  site: {
    name: "VacuumRecs",
    domain: "vacuumrecs.com",
    wordmark: "vacuumrecs",
    descriptor: "owner reviews of robot, stick, upright and canister vacuums",
    footer: "kept by people who have untangled a brush roll at midnight.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "vacuum", many: "vacuums", One: "Vacuum", Many: "Vacuums" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // Vacuums stay on sale for years, and battery and reliability reports only come after long use, so two years still describes the model.
  recentMonths: 24,
  // Names carry the maker's model or generation (V15 Detect vs Gen5detect, Qrevo Curv vs Saros 10R), never a model year.
  productYears: false,
  productPath: "products",
  amazon: { searchIndex: "HomeAndKitchen", photos: true },
  scoreUnit: { one: "vacuum", many: "vacuums" },
  // White page, navy primary, one cyan accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f5f7fa",
    "--ink": "#18223a",
    "--ink-2": "#384360",
    "--ink-3": "#68728a",
    "--line": "#e6e9ef",
    "--line-2": "#cfd5df",
    "--green": "#22355a",
    "--green-ink": "#182844",
    "--green-wash": "#eef1f7",
    "--green-line": "#c5cee0",
    "--on-green": "#f6f8fc",
    "--on-green-muted": "#a9b6d0",
    "--lime": "#1fa2c4",
    "--lime-wash": "#e8f6fa",
    "--lime-line": "#a6dceb",
    "--lime-ink": "#0f6f88",
    "--lime-ink-2": "#0b5568",
    "--score-on": botIcon("tile", true),
    "--score-off": botIcon("tile", false),
    "--score-pick-on": botIcon("pick", true),
    "--score-pick-off": botIcon("pick", false),
  },
  chartColors: ["var(--green)", "#1fa2c4", "#cfd5df", "#a9b6d0", "#a6dceb", "#68728a"],
  og: {
    background: "#22355a",
    accent: "#1fa2c4",
    muted: "#a9b6d0",
    text: "#f6f8fc",
    scoreOn: ogBot("#1fa2c4", "#f6f8fc"),
    scoreOff: ogBot("#3a4d74", "#3a4d74"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — disappointed", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for vacuums: power = cleaning, maneuverability = navigation & handling,
  // control = ease of maintenance, comfort = reliability, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Cleaning", hint: "suction and pickup on carpet, hard floors and pet hair" },
    { column: "maneuverabilityRating", label: "Navigation & handling", hint: "how a robot maps and avoids things, or how a vacuum steers and reaches" },
    { column: "controlRating", label: "Ease of maintenance", hint: "emptying, brush rolls, filters, the dock and the app" },
    { column: "comfortRating", label: "Reliability", hint: "how it holds up: battery, motor, dock, breakdowns" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Home", adminLabel: "Home", options: [
      { value: "Apartment", display: "cleans an apartment" }, { value: "House", display: "cleans a house" },
      { value: "Multi-floor house", display: "cleans a multi-floor house" },
    ] },
    playingSide: { label: "Floors", adminLabel: "Floors", options: [
      { value: "Mostly hard floors", display: "has mostly hard floors" }, { value: "Mixed", display: "has mixed floors" },
      { value: "Mostly carpet", display: "has mostly carpet" },
    ] },
    playingStyle: { label: "Pets", adminLabel: "Pets", options: [
      { value: "No pets", hint: "no shedding pets" }, { value: "Pets", hint: "one shedding pet" }, { value: "Several pets", hint: "lots of pet hair" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "A few days or returned it", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, surface = type, balance = suction, core = runtime (or "Corded"), weight = key spec.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Robot vacuums", options: VACUUM_CATEGORIES },
    { column: "surface", label: "Type", max: 200, placeholder: "e.g. Robot vacuum-mop with self-empty, self-wash dock" },
    { column: "balance", label: "Suction", max: 120, placeholder: "e.g. 10,000 Pa" },
    { column: "core", label: "Runtime", max: 120, placeholder: "e.g. 60 min, or Corded" },
    { column: "weight", label: "Key spec", max: 160, placeholder: "e.g. 0.76 L bin, laser dust detection" },
  ],
  shapeFilter: VACUUM_CATEGORIES,
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Robot vacuums", slug: "robot-vacuums", label: "Robot vacuums", seoLabel: "Robot Vacuums", intro: "Robot vacuums and robot vacuum-mop combos, with and without self-emptying and self-washing docks", one: "robot vacuum" },
    { shape: "Cordless stick vacuums", slug: "stick-vacuums", label: "Stick vacuums", seoLabel: "Cordless Stick Vacuums", intro: "Cordless stick vacuums from Dyson, Shark, Samsung, Tineco, Dreame and more", one: "stick vacuum" },
    { shape: "Upright vacuums", slug: "upright-vacuums", label: "Upright vacuums", seoLabel: "Upright Vacuums", intro: "Bagged and bagless upright vacuums, including lift-away models", one: "upright vacuum" },
    { shape: "Canister vacuums", slug: "canister-vacuums", label: "Canister vacuums", seoLabel: "Canister Vacuums", intro: "Bagged and bagless canister vacuums, from Miele to Henry", one: "canister vacuum" },
    { shape: "Handheld vacuums", slug: "handheld-vacuums", label: "Handheld vacuums", seoLabel: "Handheld Vacuums", intro: "Cordless and corded handheld vacuums for stairs, cars and quick messes", one: "handheld vacuum" },
    { shape: "Wet/dry floor cleaners", slug: "wet-dry-floor-cleaners", label: "Wet/dry cleaners", seoLabel: "Wet/Dry Floor Cleaners", intro: "Floor washers that vacuum and mop hard floors in one pass", one: "floor cleaner" },
    { shape: "Carpet cleaners", slug: "carpet-cleaners", label: "Carpet cleaners", seoLabel: "Carpet Cleaners", intro: "Upright carpet cleaners and portable spot cleaners for carpets, rugs and upholstery", one: "carpet cleaner" },
  ],
  rowDetail: { column: "surface", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "strong suction", tone: "pos" },
    { label: "great on carpet", tone: "pos" },
    { label: "great on hard floors", tone: "pos" },
    { label: "handles pet hair", tone: "pos" },
    { label: "no hair tangles", tone: "pos" },
    { label: "smart navigation", tone: "pos" },
    { label: "good obstacle avoidance", tone: "pos" },
    { label: "great mopping", tone: "pos" },
    { label: "reliable dock", tone: "pos" },
    { label: "long battery life", tone: "pos" },
    { label: "quiet", tone: "pos" },
    { label: "lightweight", tone: "pos" },
    { label: "easy to empty", tone: "pos" },
    { label: "great app", tone: "pos" },
    { label: "well made", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "weak suction", tone: "neg" },
    { label: "hair wraps brush", tone: "neg" },
    { label: "gets stuck", tone: "neg" },
    { label: "poor obstacle avoidance", tone: "neg" },
    { label: "streaky mopping", tone: "neg" },
    { label: "smells", tone: "neg" },
    { label: "dock problems", tone: "neg" },
    { label: "short battery life", tone: "neg" },
    { label: "battery died", tone: "neg" },
    { label: "loud", tone: "neg" },
    { label: "heavy", tone: "neg" },
    { label: "buggy app", tone: "neg" },
    { label: "clogs", tone: "neg" },
    { label: "broke quickly", tone: "neg" },
    { label: "poor support", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "pet owner", tone: "neutral" },
    { label: "large home", tone: "neutral" },
    { label: "small apartment", tone: "neutral" },
    { label: "stairs", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-robot-vacuums", label: "Robots", title: "Best Robot Vacuums", minReviews: 5,
      intro: "The robot vacuums and vacuum-mop combos owners are most consistently happy with.", filters: [{ column: "shape", include: ["Robot vacuums"] }] },
    { slug: "best-robot-vacuum-mops", label: "Robot mops", title: "Best Robot Vacuum-Mop Combos", minReviews: 5,
      intro: "The robots owners most often praise for mopping as well as vacuuming.", filters: [{ column: "shape", include: ["Robot vacuums"] }],
      trait: { tags: ["great mopping"], minShare: 0.2, against: ["streaky mopping", "smells"], noun: "the mopping" } },
    { slug: "best-cordless-stick-vacuums", label: "Stick", title: "Best Cordless Stick Vacuums", minReviews: 5,
      intro: "The cordless stick vacuums owners are most consistently happy with.", filters: [{ column: "shape", include: ["Cordless stick vacuums"] }] },
    { slug: "best-upright-vacuums", label: "Upright", title: "Best Upright Vacuums", minReviews: 5,
      intro: "The upright vacuums owners are most consistently happy with.", filters: [{ column: "shape", include: ["Upright vacuums"] }] },
    { slug: "best-canister-vacuums", label: "Canister", title: "Best Canister Vacuums", minReviews: 5,
      intro: "The canister vacuums owners are most consistently happy with.", filters: [{ column: "shape", include: ["Canister vacuums"] }] },
    { slug: "best-handheld-vacuums", label: "Handheld", title: "Best Handheld Vacuums", minReviews: 5,
      intro: "The handheld vacuums owners are most consistently happy with.", filters: [{ column: "shape", include: ["Handheld vacuums"] }] },
    { slug: "best-wet-dry-vacuums", label: "Wet/dry", title: "Best Wet/Dry Floor Cleaners", minReviews: 5,
      intro: "The vacuum-and-mop floor washers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Wet/dry floor cleaners"] }] },
    { slug: "best-carpet-cleaners", label: "Carpet", title: "Best Carpet Cleaners", minReviews: 5,
      intro: "The carpet and spot cleaners owners are most consistently happy with.", filters: [{ column: "shape", include: ["Carpet cleaners"] }] },
    { slug: "best-vacuums-for-pet-hair", label: "Pet hair", title: "Best Vacuums for Pet Hair", minReviews: 5,
      intro: "The vacuums owners most often say handle pet hair without tangling.", trait: { tags: ["handles pet hair", "no hair tangles"], minShare: 0.2, against: ["hair wraps brush", "clogs"], noun: "pet hair" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Blog"],
  examples: { brand: "Dyson", model: "V15 Detect", year: 2026, search: "v15" },
  form: {
    prompts: [["What did you have before?", "Before this I had "], ["Tell us about your home", "We have "], ["Any issues?", "After a while I noticed "]],
    tips: ["Your floors, home size and any pets", "What you had before, and how this compares", "How it cleans: carpet, hard floors, hair", "How it held up: battery, brush roll, dock", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "VacuumRecs – Real Owner Reviews of Robot, Stick and Upright Vacuums",
    homeDescription: "Browse real owner reviews of robot vacuums, cordless stick vacuums, upright and canister vacuums, handhelds, wet/dry floor cleaners and carpet cleaners, plus experiences from Reddit, YouTube and forums. Compare Dyson, Roborock, Shark, Dreame, Roomba and more.",
    layoutDescription: "Real owner experiences with robot, stick, upright and canister vacuums, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | VacuumRecs",
    catalog: { title: "All Vacuums – Owner Reviews and Ratings", description: "Every vacuum on VacuumRecs with owner ratings. Filter by brand and category, then read what owners say after months of use." },
    brands: { title: "Vacuum Brands", description: "Browse vacuums by brand — Dyson, Roborock, Shark, Dreame, iRobot, Ecovacs, Miele, Bissell and more — and read real owner reviews of each model." },
    brand: brand => ({ title: `${brand} Vacuums – Owner Reviews`, description: `Real owner reviews of ${brand} vacuums: ratings, strengths and weaknesses for every ${brand} model on VacuumRecs.` }),
    product: name => ({ title: `${name} Reviews | VacuumRecs`, description: `Read real owner experiences with the ${name}. Ratings for cleaning, navigation and handling, maintenance, reliability and value, plus opinions from around the web.` }),
    productNotFound: "Vacuum not found | VacuumRecs",
    productCategory: "Vacuums",
    addReview: { title: "Add a Vacuum Review", description: "Own a robot, stick or upright vacuum? Share how it actually cleans and holds up in about two minutes. No account needed." },
    about: { title: "About", description: "Why VacuumRecs exists: vacuum opinions are scattered across Reddit, YouTube and forums. VacuumRecs collects owners' first-hand experiences and lets owners add their own." },
    ogAlt: "VacuumRecs – real owner reviews of vacuums",
    ogProductAlt: "Vacuum reviews on VacuumRecs",
    ogEyebrow: "Owner reviews of vacuums",
    ogTitle: "Vacuum reviews from people who empty the bin every week",
    ogDetail: "From owners, Reddit, YouTube and forums",
    ogFallbackTitle: "Vacuum reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other owners how your robot, stick or upright vacuum actually cleans and holds up. Takes about two minutes, no account needed.",
      howItWent: "how it cleans for you",
      aboutYou: "About your home",
      aboutYouHint: "optional · helps owners with similar floors",
      howItPerforms: "How it cleans",
      whoUsesIt: "Who owns it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that vacuum or page. Maybe it moved, maybe it was discontinued, maybe the robot got stuck under the couch.",
    about: {
      heading: "Why VacuumRecs exists",
      paragraphs: [
        "Vacuum opinions are scattered across Reddit, YouTube and forums, and launch-week reviews rarely say whether a robot still docks reliably after a year or whether a stick’s battery lasts past its warranty. VacuumRecs puts owners’ experiences in one place and lets owners add their own.",
        "What works in one home won’t suit every home. Knowing whether a review comes from a small apartment with hard floors or a carpeted house with two shedding dogs often tells you more than a star rating on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Rankings are counted from reviews: the ones owners write here and the ones collected and summarized from around the web. Each is read as positive, mixed or negative. Repair shops, sellers and sponsored reviewers are left out. Product pages link to Amazon, and VacuumRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "One page per model and generation", body: "Makers refresh vacuums under almost the same name. Each generation has its own page (Dyson V15 Detect and Gen5detect, Roborock S8 MaxV Ultra and Saros 10R, Roomba j7+ and Combo j9+), and colour or retailer versions of one model share a page." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about a vacuum you own and be specific about your floors, your home and what you saw." },
        { heading: "Your privacy", body: "An alias is optional, and so are your home and floor details. If you leave an email address, it is stored privately with your submission and never included in public reviews." },
      ],
    },
  },
};
