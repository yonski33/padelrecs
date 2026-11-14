import type { Niche } from "./types";

// Rating icons: a charged battery, electric green with a deep-navy edge. Same tile sizes as the other niches (17×14 strip,
// 20×20 picker); the strip icon widens the 20×20 drawing's viewBox so the battery keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const batteryShape = (fill: string, edge: string, q: string) =>
  `<rect x=${q}1.5${q} y=${q}5${q} width=${q}14.5${q} height=${q}10${q} rx=${q}2${q} fill=${q}${fill}${q} stroke=${q}${edge}${q} stroke-width=${q}1${q}/>`
  + `<rect x=${q}16${q} y=${q}8${q} width=${q}2.5${q} height=${q}4${q} rx=${q}0.8${q} fill=${q}${edge}${q}/>`;
const batteryIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? batteryShape("#2fbf71", "#0d2b3e", "'") : batteryShape("#e4e8eb", "#cfd6db", "'")}</svg>`);
};
const ogBattery = (fill: string, edge: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${batteryShape(fill, edge, '"')}</svg>`;

export const EBIKE_CATEGORIES = ["Commuter & city", "Cargo", "Folding", "Electric mountain bikes", "Road & gravel", "Fat-tire & moped-style", "Electric scooters"];

export const ebike: Niche = {
  id: "ebike",
  schema: "ebikerecs",
  site: {
    name: "EbikeRecs",
    domain: "ebikerecs.com",
    wordmark: "ebikerecs",
    descriptor: "rider reviews of e-bikes and e-scooters",
    footer: "kept by people who charge their ride every night.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "model", many: "models", One: "Model", Many: "Models" },
  people: { one: "rider", many: "riders", One: "Rider", Many: "Riders" },
  // E-bikes and scooters stay on sale for two to four years per generation, so a two-year-old review still describes the model.
  recentMonths: 24,
  // Names carry the maker's generation (RadRunner 3 Plus, Level.3, XP 4, Ninebot Max G2), never a model year.
  productYears: false,
  productPath: "models",
  amazon: { searchIndex: "SportsAndOutdoors", photos: true },
  scoreUnit: { one: "model", many: "models" },
  // White page, deep-navy primary, one electric-green accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f4f7f8",
    "--ink": "#13232e",
    "--ink-2": "#33454f",
    "--ink-3": "#647680",
    "--line": "#e4e8eb",
    "--line-2": "#cfd6db",
    "--green": "#0d2b3e",
    "--green-ink": "#081e2c",
    "--green-wash": "#ecf2f6",
    "--green-line": "#c2d3de",
    "--on-green": "#f5f9fb",
    "--on-green-muted": "#9db4c3",
    "--lime": "#2fbf71",
    "--lime-wash": "#e9f8f0",
    "--lime-line": "#a7e2c2",
    "--lime-ink": "#1b7f49",
    "--lime-ink-2": "#145f37",
    "--score-on": batteryIcon("tile", true),
    "--score-off": batteryIcon("tile", false),
    "--score-pick-on": batteryIcon("pick", true),
    "--score-pick-off": batteryIcon("pick", false),
  },
  chartColors: ["var(--green)", "#2fbf71", "#cfd6db", "#9db4c3", "#a7e2c2", "#647680"],
  og: {
    background: "#0d2b3e",
    accent: "#2fbf71",
    muted: "#9db4c3",
    text: "#f5f9fb",
    scoreOn: ogBattery("#2fbf71", "#2fbf71"),
    scoreOff: ogBattery("#2c4a5e", "#2c4a5e"),
  },
  ratingWords: { "5": "5 — love riding it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — wouldn’t buy again", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for e-bikes: power = motor, maneuverability = ride & handling,
  // control = range & battery, comfort = build & reliability, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Motor & power", hint: "hills, acceleration, how the assist feels" },
    { column: "maneuverabilityRating", label: "Ride & handling", hint: "comfort, stability, brakes, tires" },
    { column: "controlRating", label: "Range & battery", hint: "real-world range and charging" },
    { column: "comfortRating", label: "Build & reliability", hint: "how it holds up, repairs, parts" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Commuting", display: "commutes on it" }, { value: "Errands & kids", display: "runs errands and carries kids on it" },
      { value: "Leisure & fitness", display: "rides for fun and fitness" }, { value: "Trail & off-road", display: "rides trails" }, { value: "Delivery work", display: "rides it for delivery work" },
    ] },
    playingSide: { label: "Terrain", adminLabel: "Terrain", options: [
      { value: "Flat", display: "rides mostly flat routes" }, { value: "Rolling", display: "rides rolling routes" }, { value: "Hilly", display: "rides in hilly country" },
    ] },
    playingStyle: { label: "Rider", adminLabel: "Rider size", options: [
      { value: "Under 5'4\" / 163 cm", hint: "shorter rider" }, { value: "5'4\"–6'0\" / 163–183 cm", hint: "average height" },
      { value: "Over 6'0\" / 183 cm", hint: "taller rider" }, { value: "Heavier rider", hint: "near the weight limit" },
    ] },
    timeWithRacket: { label: "Time riding it", adminLabel: "Time riding it", options: [
      { value: "Tried briefly", hint: "A test ride or returned it", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, surface = type, balance = motor, core = battery, weight = weight.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Commuter & city", options: EBIKE_CATEGORIES },
    { column: "surface", label: "Type", max: 200, placeholder: "e.g. Step-through commuter" },
    { column: "balance", label: "Motor", max: 120, placeholder: "e.g. 750W rear hub" },
    { column: "core", label: "Battery", max: 200, placeholder: "e.g. 672 Wh" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 77 lbs" },
  ],
  shapeFilter: EBIKE_CATEGORIES,
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Model pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Commuter & city", slug: "commuter-ebikes", label: "Commuter & city", seoLabel: "Commuter and City E-Bikes", intro: "Commuter, city, comfort and step-through e-bikes", one: "commuter e-bike" },
    { shape: "Cargo", slug: "cargo-ebikes", label: "Cargo", seoLabel: "Cargo E-Bikes", intro: "Longtail, front-box and compact utility e-bikes for kids and groceries", one: "cargo e-bike" },
    { shape: "Folding", slug: "folding-ebikes", label: "Folding", seoLabel: "Folding E-Bikes", intro: "Folding e-bikes, from compact city folders to fat-tire folders", one: "folding e-bike" },
    { shape: "Electric mountain bikes", slug: "electric-mountain-bikes", label: "E-MTB", seoLabel: "Electric Mountain Bikes", intro: "Full-suspension and hardtail electric mountain bikes, full-power and lightweight", one: "e-MTB" },
    { shape: "Road & gravel", slug: "road-and-gravel-ebikes", label: "Road & gravel", seoLabel: "Road and Gravel E-Bikes", intro: "Drop-bar road and gravel e-bikes with light assist", one: "road or gravel e-bike" },
    { shape: "Fat-tire & moped-style", slug: "fat-tire-ebikes", label: "Fat-tire", seoLabel: "Fat-Tire and Moped-Style E-Bikes", intro: "Fat-tire all-terrain and moped-style e-bikes", one: "fat-tire e-bike" },
    { shape: "Electric scooters", slug: "electric-scooters", label: "E-scooters", seoLabel: "Electric Scooters", intro: "Commuter, long-range and performance electric kick scooters", one: "e-scooter" },
  ],
  rowDetail: { column: "surface", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "strong motor", tone: "pos" },
    { label: "great on hills", tone: "pos" },
    { label: "long range", tone: "pos" },
    { label: "comfortable ride", tone: "pos" },
    { label: "smooth assist", tone: "pos" },
    { label: "good brakes", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "easy to fold", tone: "pos" },
    { label: "portable", tone: "pos" },
    { label: "carries a lot", tone: "pos" },
    { label: "kid-friendly", tone: "pos" },
    { label: "reliable", tone: "pos" },
    { label: "good customer service", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "weak on hills", tone: "neg" },
    { label: "range below claims", tone: "neg" },
    { label: "harsh ride", tone: "neg" },
    { label: "jerky assist", tone: "neg" },
    { label: "weak brakes", tone: "neg" },
    { label: "heavy", tone: "neg" },
    { label: "flat tires", tone: "neg" },
    { label: "battery issues", tone: "neg" },
    { label: "display or controller issues", tone: "neg" },
    { label: "motor failure", tone: "neg" },
    { label: "rattles or creaks", tone: "neg" },
    { label: "poor customer service", tone: "neg" },
    { label: "hard to get parts", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "commuting", tone: "neutral" },
    { label: "hauling kids", tone: "neutral" },
    { label: "off-road", tone: "neutral" },
    { label: "heavier rider", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough models in it have reviews.
  topLists: [
    { slug: "best-commuter-ebikes", label: "Commuter", title: "Best Commuter E-Bikes", minReviews: 5,
      intro: "The commuter and city e-bikes riders are most consistently happy with.", filters: [{ column: "shape", include: ["Commuter & city"] }] },
    { slug: "best-cargo-ebikes", label: "Cargo", title: "Best Cargo E-Bikes", minReviews: 5,
      intro: "The cargo e-bikes riders are most consistently happy with.", filters: [{ column: "shape", include: ["Cargo"] }] },
    { slug: "best-folding-ebikes", label: "Folding", title: "Best Folding E-Bikes", minReviews: 5,
      intro: "The folding e-bikes riders are most consistently happy with.", filters: [{ column: "shape", include: ["Folding"] }] },
    { slug: "best-electric-mountain-bikes", label: "E-MTB", title: "Best Electric Mountain Bikes", minReviews: 5,
      intro: "The e-MTBs riders are most consistently happy with.", filters: [{ column: "shape", include: ["Electric mountain bikes"] }] },
    { slug: "best-gravel-and-road-ebikes", label: "Road & gravel", title: "Best Road and Gravel E-Bikes", minReviews: 5,
      intro: "The road and gravel e-bikes riders are most consistently happy with.", filters: [{ column: "shape", include: ["Road & gravel"] }] },
    { slug: "best-fat-tire-ebikes", label: "Fat-tire", title: "Best Fat-Tire E-Bikes", minReviews: 5,
      intro: "The fat-tire and moped-style e-bikes riders are most consistently happy with.", filters: [{ column: "shape", include: ["Fat-tire & moped-style"] }] },
    { slug: "best-electric-scooters", label: "E-scooters", title: "Best Electric Scooters", minReviews: 5,
      intro: "The electric scooters riders are most consistently happy with.", filters: [{ column: "shape", include: ["Electric scooters"] }] },
    { slug: "best-ebikes-for-hills", label: "Hills", title: "Best E-Bikes and Scooters for Hills", minReviews: 5,
      intro: "The models riders most often say climb well.", trait: { tags: ["great on hills", "strong motor"], minShare: 0.25, against: ["weak on hills"], noun: "the climbing" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Blog"],
  examples: { brand: "Aventon", model: "Level.3", year: 2026, search: "level" },
  form: {
    prompts: [["What did you ride before?", "Before this I rode "], ["Tell us about your rides", "I mostly ride "], ["Any issues?", "After a while I noticed "]],
    tips: ["Your height, weight and the terrain you ride", "What you rode before, and how this compares", "Real-world range and how the motor handles hills", "How it held up: repairs, parts, customer service", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "EbikeRecs – Real Rider Reviews of E-Bikes and E-Scooters",
    homeDescription: "Browse real rider reviews of commuter, cargo, folding, mountain, gravel and fat-tire e-bikes and electric scooters, plus experiences collected from Reddit, YouTube and forums. Compare Rad Power, Aventon, Lectric, Specialized, Trek, Segway and more.",
    layoutDescription: "Real rider experiences with e-bikes and electric scooters, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | EbikeRecs",
    catalog: { title: "All E-Bikes and E-Scooters – Rider Reviews and Ratings", description: "Every e-bike and e-scooter on EbikeRecs with rider ratings. Filter by brand and category, then read what owners say after real miles." },
    brands: { title: "E-Bike and E-Scooter Brands", description: "Browse e-bikes and electric scooters by brand — Rad Power, Aventon, Lectric, Specialized, Trek, Segway and more — and read real rider reviews of each model." },
    brand: brand => ({ title: `${brand} – Rider Reviews`, description: `Real rider reviews of ${brand} e-bikes and scooters: ratings, strengths and weaknesses for every ${brand} model on EbikeRecs.` }),
    product: name => ({ title: `${name} Reviews | EbikeRecs`, description: `Read real rider experiences with the ${name}. Ratings for motor and power, ride, range, build and value, plus opinions from around the web.` }),
    productNotFound: "Model not found | EbikeRecs",
    productCategory: "E-bikes and e-scooters",
    addReview: { title: "Add an E-Bike or Scooter Review", description: "Own an e-bike or electric scooter? Share how it actually rides, climbs and holds up in about two minutes. No account needed." },
    about: { title: "About", description: "Why EbikeRecs exists: e-bike opinions are scattered across Reddit, YouTube and forums. EbikeRecs collects riders' first-hand experiences and lets riders add their own." },
    ogAlt: "EbikeRecs – real rider reviews of e-bikes and e-scooters",
    ogProductAlt: "E-bike reviews on EbikeRecs",
    ogEyebrow: "Rider reviews of e-bikes",
    ogTitle: "E-bike and scooter reviews from people who ride them every day",
    ogDetail: "From riders, Reddit, YouTube and forums",
    ogFallbackTitle: "E-bike reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other riders how your e-bike or scooter actually rides, climbs and holds up. Takes about two minutes, no account needed.",
      howItWent: "how it rides",
      aboutYou: "About your riding",
      aboutYouHint: "optional · helps riders like you",
      howItPerforms: "How it rides",
      whoUsesIt: "Who rides it",
      triedIt: "Ridden it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that model or page. Maybe it moved, maybe it was discontinued, maybe the battery ran out halfway.",
    about: {
      heading: "Why EbikeRecs exists",
      paragraphs: [
        "E-bike opinions are scattered across Reddit, YouTube and forums, and a spec sheet rarely says whether a 750W hub really climbs your hill with a kid on the back, or how far the battery goes after the first winter. EbikeRecs puts riders’ experiences in one place and lets riders add their own.",
        "What suits one rider won’t suit every rider. Knowing whether a review comes from a 6'3\" commuter in a hilly city or a lighter rider on flat bike paths often tells you more than a star rating on its own.",
      ],
      sections: [
        { heading: "Riders, not promotions", body: "No sponsored rankings. No paid placements. Rankings are counted from reviews: the ones riders write here and the ones collected and summarized from around the web. Each is read as positive, mixed or negative. Model pages link to Amazon, and EbikeRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "One page per model and generation", body: "Makers refresh e-bikes under almost the same name. Each generation has its own page (RadRunner Plus and RadRunner 3 Plus, Level.2 and Level.3, XP 3.0 and XP 4, Ninebot Max G30 and Max G2), while frame styles, sizes, colours and battery options of one model share a page." },
        { heading: "Ride safely", body: "Check your local rules on e-bike classes, speed limits and where scooters may ride, wear a helmet, and charge batteries the way the maker says. Reviews describe what riders saw, not safety or legal advice." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about a model you have ridden yourself and be specific about your riding and what you saw." },
        { heading: "Your privacy", body: "An alias is optional, and so is everything about your riding. If you leave an email address, it is stored privately with your submission and never included in public reviews." },
      ],
    },
  },
};
