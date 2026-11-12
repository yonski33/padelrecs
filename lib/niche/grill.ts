import type { Niche } from "./types";

// Rating icons: a flame, ember orange with a yellow core. Same tile sizes as the other niches (17×14 strip, 20×20 picker);
// the strip icon widens the 20×20 drawing's viewBox so the flame keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const flameShape = (outer: string, inner: string, q: string) =>
  `<path d=${q}M10 1.5c.6 3.2 5.5 5.6 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.3 1.1-3.8 2.3-4.8.1 1.7.8 2.8 1.9 3.3C8.2 7.2 9 4 10 1.5z${q} fill=${q}${outer}${q}/><path d=${q}M10 10c.3 1.4 2.4 2.4 2.4 4.4a2.4 2.4 0 0 1-4.8 0c0-1.6 1.6-2.6 2.4-4.4z${q} fill=${q}${inner}${q}/>`;
const flameIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? flameShape("#e8590c", "#fcc419", "'") : flameShape("#e4e1dd", "#f1efec", "'")}</svg>`);
};
const ogFlame = (outer: string, inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${flameShape(outer, inner, '"')}</svg>`;

export const GRILL_CATEGORIES = ["Pellet grills", "Smokers", "Kamado grills", "Gas grills", "Charcoal grills", "Griddles", "Portable grills", "Pizza ovens"];

export const grill: Niche = {
  id: "grill",
  schema: "grillrecs",
  site: {
    name: "GrillRecs",
    domain: "grillrecs.com",
    wordmark: "grillrecs",
    descriptor: "owner reviews of pellet grills, smokers, kamados, griddles and pizza ovens",
    footer: "kept by people who wrap at 165°F.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "grill", many: "grills", One: "Grill", Many: "Grills" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // Grills last for years and models change slowly, so a two-year-old review still describes the same grill.
  recentMonths: 24,
  // Names carry the generation where the maker changed it (Ironwood 885 vs Ironwood, Genesis II E-315 vs Genesis E-325s).
  productYears: false,
  productPath: "grills",
  amazon: { searchIndex: "LawnAndGarden", photos: true },
  scoreUnit: { one: "grill", many: "grills" },
  // Warm white page, charcoal ink and primary, one ember-orange accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f8f6f3",
    "--ink": "#141210",
    "--ink-2": "#3d3833",
    "--ink-3": "#6f6861",
    "--line": "#e8e4df",
    "--line-2": "#d6d0c9",
    "--green": "#141210",
    "--green-ink": "#0d0b09",
    "--green-wash": "#f3f1ee",
    "--green-line": "#d2ccc5",
    "--on-green": "#faf8f6",
    "--on-green-muted": "#aea69e",
    "--lime": "#e8590c",
    "--lime-wash": "#fff1e8",
    "--lime-line": "#fbc9a8",
    "--lime-ink": "#c2410c",
    "--lime-ink-2": "#9a3412",
    "--score-on": flameIcon("tile", true),
    "--score-off": flameIcon("tile", false),
    "--score-pick-on": flameIcon("pick", true),
    "--score-pick-off": flameIcon("pick", false),
  },
  chartColors: ["var(--green)", "#e8590c", "#d6d0c9", "#aea69e", "#fbc9a8", "#6f6861"],
  og: {
    background: "#141210",
    accent: "#e8590c",
    muted: "#aea69e",
    text: "#faf8f6",
    scoreOn: ogFlame("#e8590c", "#fcc419"),
    scoreOff: ogFlame("#36302b", "#141210"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for grills: power = heat control, maneuverability = cooking results, control = build &
  // durability, comfort = ease of use & cleanup, forgiveness = value. Approved by the owner 2026-11-12.
  categories: [
    { column: "powerRating", label: "Heat control", hint: "holding temp, hot spots, recovery" },
    { column: "maneuverabilityRating", label: "Cooking results", hint: "smoke flavor, sear, crust" },
    { column: "controlRating", label: "Build & durability", hint: "rust, paint, welds, electronics" },
    { column: "comfortRating", label: "Ease of use & cleanup", hint: "assembly, ash and grease, controller, app" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main cooking", adminLabel: "Main cooking", options: [
      { value: "Low & slow", display: "cooks mostly low and slow" }, { value: "Grilling & searing", display: "mostly grills and sears" },
      { value: "Griddle", display: "cooks mostly on the griddle" }, { value: "Pizza", display: "mostly makes pizza" }, { value: "A bit of everything", display: "cooks a bit of everything" },
    ] },
    playingSide: { label: "Climate", adminLabel: "Climate", options: [
      { value: "Cold winters", display: "cooks through cold winters" }, { value: "Hot & humid", display: "cooks in a hot, humid climate" }, { value: "Mild", display: "cooks in a mild climate" },
    ] },
    playingStyle: { label: "Experience", adminLabel: "Experience", options: [
      { value: "First grill", hint: "new to it" }, { value: "Upgraded", hint: "had one before" }, { value: "One of several", hint: "owns more than one" },
    ] },
    timeWithRacket: { label: "Time owning it", adminLabel: "Time owning it", options: [
      { value: "Tried briefly", hint: "A few cooks or returned it", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = fuel, surface = cooking area, core = temperature range, weight = connectivity.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Pellet grills", options: GRILL_CATEGORIES },
    { column: "balance", label: "Fuel", max: 120, placeholder: "e.g. Pellet" },
    { column: "surface", label: "Cooking area", max: 200, placeholder: "e.g. 970 sq in" },
    { column: "core", label: "Temperature range", max: 200, placeholder: "e.g. 165–500°F" },
    { column: "weight", label: "Connectivity", max: 120, placeholder: "e.g. WiFi" },
  ],
  shapeFilter: GRILL_CATEGORIES,
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths. Approved by the owner 2026-11-12.
  categoryPaths: true,
  typePages: [
    { shape: "Pellet grills", slug: "pellet-grills", label: "Pellet grills", seoLabel: "Pellet Grills", intro: "Traeger, Recteq, Pit Boss, Camp Chef, Weber, Grilla, Yoder and Z Grills pellet grills, one page per model and generation", one: "pellet grill" },
    { shape: "Smokers", slug: "smokers", label: "Smokers", seoLabel: "Smokers", intro: "Offset, vertical, drum, gravity-fed and electric smokers: Weber Smokey Mountain, Oklahoma Joe's, Masterbuilt, Old Country, Pit Barrel and more", one: "smoker" },
    { shape: "Kamado grills", slug: "kamado-grills", label: "Kamado grills", seoLabel: "Kamado Grills", intro: "Big Green Egg sizes, Kamado Joe Classic and Big Joe generations, Primo, Char-Griller Akorn and other kamados", one: "kamado" },
    { shape: "Gas grills", slug: "gas-grills", label: "Gas grills", seoLabel: "Gas Grills", intro: "Weber Spirit, Genesis and Summit, Napoleon, Broil King, Char-Broil and other propane and natural-gas grills", one: "gas grill" },
    { shape: "Charcoal grills", slug: "charcoal-grills", label: "Charcoal grills", seoLabel: "Charcoal Grills", intro: "Weber kettles, PK grills, barrel grills and other charcoal grills", one: "charcoal grill" },
    { shape: "Griddles", slug: "griddles", label: "Griddles", seoLabel: "Flat-Top Griddles", intro: "Blackstone, Camp Chef, Weber Slate, Traeger Flatrock, Pit Boss and other outdoor flat-top griddles", one: "griddle" },
    { shape: "Portable grills", slug: "portable-grills", label: "Portable grills", seoLabel: "Portable Grills", intro: "Weber Q and Traveler, tabletop and tailgate grills of every fuel", one: "portable grill" },
    { shape: "Pizza ovens", slug: "pizza-ovens", label: "Pizza ovens", seoLabel: "Outdoor Pizza Ovens", intro: "Ooni, Gozney, Solo Stove and other outdoor pizza ovens, gas, wood and electric", one: "pizza oven" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews. Approved by the owner 2026-11-12.
  tags: [
    { label: "holds temp well", tone: "pos" },
    { label: "great smoke flavor", tone: "pos" },
    { label: "great sear", tone: "pos" },
    { label: "even heat", tone: "pos" },
    { label: "fuel efficient", tone: "pos" },
    { label: "heats up fast", tone: "pos" },
    { label: "easy to clean", tone: "pos" },
    { label: "great app", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "easy assembly", tone: "pos" },
    { label: "great for beginners", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "great customer service", tone: "pos" },
    { label: "temp swings", tone: "neg" },
    { label: "hot spots", tone: "neg" },
    { label: "weak smoke flavor", tone: "neg" },
    { label: "rust", tone: "neg" },
    { label: "paint peeling", tone: "neg" },
    { label: "grease fires", tone: "neg" },
    { label: "auger jams", tone: "neg" },
    { label: "controller or app issues", tone: "neg" },
    { label: "igniter failure", tone: "neg" },
    { label: "leaks smoke", tone: "neg" },
    { label: "thin metal", tone: "neg" },
    { label: "hard to clean", tone: "neg" },
    { label: "poor customer service", tone: "neg" },
    { label: "assembly issues", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "needs mods", tone: "neutral" },
    { label: "cold-weather use", tone: "neutral" },
    { label: "WiFi", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough grills in it have reviews.
  topLists: [
    { slug: "best-pellet-grills", label: "Pellet", title: "Best Pellet Grills", minReviews: 5,
      intro: "The pellet grills owners are most consistently happy with.", filters: [{ column: "shape", include: ["Pellet grills"] }] },
    { slug: "best-smokers", label: "Smokers", title: "Best Smokers", minReviews: 5,
      intro: "The smokers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Smokers"] }] },
    { slug: "best-kamado-grills", label: "Kamado", title: "Best Kamado Grills", minReviews: 5,
      intro: "The kamados owners are most consistently happy with.", filters: [{ column: "shape", include: ["Kamado grills"] }] },
    { slug: "best-gas-grills", label: "Gas", title: "Best Gas Grills", minReviews: 5,
      intro: "The gas grills owners are most consistently happy with.", filters: [{ column: "shape", include: ["Gas grills"] }] },
    { slug: "best-griddles", label: "Griddles", title: "Best Flat-Top Griddles", minReviews: 5,
      intro: "The griddles owners are most consistently happy with.", filters: [{ column: "shape", include: ["Griddles"] }] },
    { slug: "best-pizza-ovens", label: "Pizza ovens", title: "Best Outdoor Pizza Ovens", minReviews: 5,
      intro: "The pizza ovens owners are most consistently happy with.", filters: [{ column: "shape", include: ["Pizza ovens"] }] },
    { slug: "best-grills-for-beginners", label: "Beginners", title: "Best Grills for Beginners", minReviews: 5,
      intro: "The grills and smokers owners most often call easy for a first-timer.", trait: { tags: ["great for beginners", "holds temp well"], minShare: 0.25, against: ["temp swings"], noun: "how easy it is to learn" } },
    { slug: "best-value-grills", label: "Value", title: "Best Value Grills", minReviews: 5,
      intro: "The grills owners most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Blog"],
  examples: { brand: "Traeger", model: "Ironwood XL", year: 2026, search: "ironwood" },
  form: {
    prompts: [["What did you have before?", "Before this I had "], ["What do you cook on it?", "I mostly cook "], ["Any issues?", "After a while I noticed "]],
    tips: ["What grill you had before, and how this compares", "What you cook on it and how often", "How it holds temperature, sears or smokes", "Build quality, rust, controller or app and any failures", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "GrillRecs – Real Owner Reviews of Pellet Grills, Smokers, Kamados and Griddles",
    homeDescription: "Browse real owner reviews of pellet grills, smokers, kamados, gas and charcoal grills, griddles and pizza ovens, plus experiences collected from Reddit, YouTube and forums. Compare Traeger, Weber, Big Green Egg, Kamado Joe, Blackstone, Recteq, Ooni and more, one page per model and generation.",
    layoutDescription: "Real owner experiences with grills, smokers, griddles and pizza ovens, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | GrillRecs",
    catalog: { title: "All Grills – Owner Reviews and Ratings", description: "Every grill, smoker, griddle and pizza oven on GrillRecs with owner ratings. Filter by brand and category, then read what owners say." },
    brands: { title: "Grill Brands", description: "Browse grills by brand — Traeger, Weber, Big Green Egg, Kamado Joe, Blackstone, Recteq, Pit Boss, Ooni and more — and read real owner reviews of each model." },
    brand: brand => ({ title: `${brand} Grills – Owner Reviews`, description: `Real owner reviews of ${brand} grills: ratings, strengths and weaknesses for every ${brand} model on GrillRecs.` }),
    product: name => ({ title: `${name} Reviews | GrillRecs`, description: `Read real owner experiences with the ${name}. Ratings for heat control, cooking results, build, ease of use and value, plus opinions from around the web.` }),
    productNotFound: "Grill not found | GrillRecs",
    productCategory: "Grills",
    addReview: { title: "Add a Grill Review", description: "Own a grill, smoker, griddle or pizza oven? Share how it actually cooks in about two minutes. No account needed." },
    about: { title: "About", description: "Why GrillRecs exists: grill opinions are scattered across Reddit, YouTube and forums. GrillRecs collects owners' first-hand experiences and lets owners add their own." },
    ogAlt: "GrillRecs – real owner reviews of grills and smokers",
    ogProductAlt: "Grill reviews on GrillRecs",
    ogEyebrow: "Owner reviews of grills",
    ogTitle: "Grill reviews from people who cook on them every weekend",
    ogDetail: "From owners, Reddit, YouTube and forums",
    ogFallbackTitle: "Grill reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other people how a grill, smoker, griddle or pizza oven actually cooks. Takes about two minutes, no account needed.",
      howItWent: "how it cooked for you",
      aboutYou: "About how you cook",
      aboutYouHint: "optional · helps people find owners like them",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's cooking on it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that grill or page. Maybe it moved, maybe it was discontinued, maybe someone let the fire go out.",
    about: {
      heading: "Why GrillRecs exists",
      paragraphs: [
        "Grill opinions are scattered across Reddit, YouTube and forums, and a first look rarely says how a smoker holds temperature in January or whether the firebox rusts through after two summers. GrillRecs puts owners’ experiences in one place and lets owners add their own.",
        "A grill that suits one cook won’t suit every cook. Knowing whether someone smokes brisket overnight or sears weeknight steaks, what climate they cook in and what they had before often tells you more than a spec sheet on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Rankings are counted from reviews: the ones owners write here and the ones quoted from around the web. Each is read as positive, mixed or negative. Grill pages link to Amazon, and GrillRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "One page per model and generation", body: "Makers refresh grills under almost the same name. Each generation has its own page (Traeger Ironwood 885 and the 2023 Ironwood XL, Weber Genesis II E-315 and Genesis E-325s, Kamado Joe Classic II and III), and a size gets its own page only when the maker sells it as a separate model." },
        { heading: "A work in progress", body: "GrillRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about grills you’ve actually cooked on and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
