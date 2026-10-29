import type { Niche } from "./types";

// Rating icons: a cooking pot, terracotta with a butter-yellow lid. Same tile sizes as the other niches (17×14 strip, 20×20 picker);
// the strip tile widens the 20×20 drawing's viewBox so it keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
// Body with its two side handles and the lid knob in the pot colour, the lid in the accent colour.
const POT = "M5.2 8.5H14.8A2.2 2.2 0 0 1 17 10.7V14.8A2.2 2.2 0 0 1 14.8 17H5.2A2.2 2.2 0 0 1 3 14.8V10.7A2.2 2.2 0 0 1 5.2 8.5ZM1.8 9.6H3V11.6H1.8A1 1 0 0 1 1.8 9.6ZM17 9.6H18.2A1 1 0 0 1 18.2 11.6H17ZM10 3A1.6 1.6 0 1 1 10 6.2A1.6 1.6 0 1 1 10 3Z";
const LID = "M3 7.2H17";
const pot = (body: string, lid: string, q: string) =>
  `<path d=${q}${POT}${q} fill=${q}${body}${q}/><path d=${q}${LID}${q} fill=${q}none${q} stroke=${q}${lid}${q} stroke-width=${q}2${q} stroke-linecap=${q}round${q}/>`;
const potIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? pot("#9a3412", "#f6c453", "'") : pot("#f1e6dd", "#f1e6dd", "'")}</svg>`);
};
const ogPot = (body: string, lid: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${pot(body, lid, '"')}</svg>`;

export const kitchen: Niche = {
  id: "kitchen",
  schema: "kitchenrecs",
  site: {
    name: "KitchenRecs",
    domain: "kitchenrecs.com",
    wordmark: "kitchenrecs",
    descriptor: "real reviews of air fryers, countertop ovens, blenders, stand mixers, food processors and multicookers",
    footer: "kept by people whose counters are running out of room.",
    analyticsId: "G-S1MRX3VYPL",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "appliance", many: "appliances", One: "Appliance", Many: "Appliances" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  recentMonths: 36,
  // Makers name countertop appliances by line and model number (Ninja AF101, DZ201; Breville BOV900; Vitamix 5200, A3500), not by year.
  // Colours are not separate products; regional versions with their own model number are.
  productYears: false,
  productPath: "appliances",
  amazon: { searchIndex: "HomeAndKitchen" },
  scoreUnit: { one: "pot", many: "pots" },
  // White page, terracotta ink, one butter-yellow accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#fcf7f3",
    "--ink": "#2b1a12",
    "--ink-2": "#4d3529",
    "--ink-3": "#7d685d",
    "--line": "#f1e6dd",
    "--line-2": "#e5d3c5",
    "--green": "#9a3412",
    "--green-ink": "#7c2d12",
    "--green-wash": "#fbefe8",
    "--green-line": "#f0cdbb",
    "--on-green": "#fff7ed",
    "--on-green-muted": "#f2c3a7",
    "--lime": "#f6c453",
    "--lime-wash": "#fef8e7",
    "--lime-line": "#f9e2a6",
    "--lime-ink": "#8a5a00",
    "--lime-ink-2": "#6e4700",
    "--score-on": potIcon("tile", true),
    "--score-off": potIcon("tile", false),
    "--score-pick-on": potIcon("pick", true),
    "--score-pick-off": potIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f6c453", "#e5d3c5", "#c2410c", "#f9e2a6", "#94a3b8"],
  og: {
    background: "#9a3412",
    accent: "#f6c453",
    muted: "#f2c3a7",
    text: "#fff7ed",
    scoreOn: ogPot("#fff7ed", "#f6c453"),
    scoreOff: ogPot("#b8552c", "#b8552c"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — disappointed", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for appliances: power = cooking or blending results, comfort = ease of use,
  // maneuverability = cleaning, control = build quality, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Results", hint: "how well it cooks, crisps, blends, kneads or chops" },
    { column: "comfortRating", label: "Ease of use", hint: "controls, presets, app, how quickly you get going" },
    { column: "maneuverabilityRating", label: "Cleaning", hint: "baskets, jars, bowls and lids, dishwasher-safe parts" },
    { column: "controlRating", label: "Build quality", hint: "materials, noise, how it has held up" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price and the counter space" },
  ],
  profile: {
    playerLevel: { label: "Who you cook for", adminLabel: "Household", options: [
      { value: "Just me", display: "cooks for one" }, { value: "Two of us", display: "cooks for two" },
      { value: "Family of 3–4", display: "cooks for a family of 3–4" }, { value: "Family of 5+", display: "cooks for five or more" },
    ] },
    playingSide: { label: "How often you use it", adminLabel: "Use", options: [
      { value: "Daily", display: "uses it daily" }, { value: "A few times a week", display: "uses it a few times a week" },
      { value: "Weekly", display: "uses it weekly" }, { value: "Now and then", display: "uses it now and then" },
    ] },
    playingStyle: { label: "Cooking experience", adminLabel: "Experience", options: [
      { value: "Beginner" }, { value: "Home cook" }, { value: "Keen home cook" }, { value: "Cooks professionally", hint: "chef or caterer" },
    ] },
    timeWithRacket: { label: "Time owning it", adminLabel: "Time owning it", options: [
      { value: "Tried it", hint: "Borrowed or a few uses", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type (basket or dual-basket air fryer, toaster oven, high-speed blender, bowl-lift mixer…),
  // surface = capacity as the maker states it, core = the maker's model number, weight = power as the maker states it.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Air fryer", options: ["Air fryer", "Countertop oven", "Blender", "Stand mixer", "Food processor", "Multicooker"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Dual-basket air fryer, High-speed blender or Bowl-lift stand mixer" },
    { column: "surface", label: "Capacity", max: 120, placeholder: "e.g. 6.5 qt or 4.7 L" },
    { column: "core", label: "Model number", max: 120, placeholder: "e.g. AF101, BOV900" },
    { column: "weight", label: "Power", max: 60, placeholder: "e.g. 1700 W" },
  ],
  shapeFilter: ["Air fryer", "Countertop oven", "Blender", "Stand mixer", "Food processor", "Multicooker"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Air fryer", slug: "air-fryers", label: "Air fryers", intro: "Basket, dual-basket, stacked and glass air fryers" },
    { shape: "Countertop oven", slug: "countertop-ovens", label: "Countertop ovens", intro: "Toaster ovens, air fryer ovens, flip-up and double ovens and steam ovens" },
    { shape: "Blender", slug: "blenders", label: "Blenders", intro: "Personal, portable, full-size and high-speed blenders and blender kitchen systems" },
    { shape: "Stand mixer", slug: "stand-mixers", label: "Stand mixers", intro: "Tilt-head and bowl-lift stand mixers and kitchen machines" },
    { shape: "Food processor", slug: "food-processors", label: "Food processors", intro: "Food processors from compact to 16-cup" },
    { shape: "Multicooker", slug: "multicookers", label: "Multicookers", intro: "Electric pressure cookers, multicookers and pressure cooker–air fryer combos" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "crispy results", tone: "pos" },
    { label: "cooks evenly", tone: "pos" },
    { label: "fast", tone: "pos" },
    { label: "smooth blends", tone: "pos" },
    { label: "powerful", tone: "pos" },
    { label: "easy to use", tone: "pos" },
    { label: "easy to clean", tone: "pos" },
    { label: "quiet", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "uneven cooking", tone: "neg" },
    { label: "hard to clean", tone: "neg" },
    { label: "loud", tone: "neg" },
    { label: "coating peeled", tone: "neg" },
    { label: "plastic smell", tone: "neg" },
    { label: "broke down", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "bulky", tone: "neutral" },
    { label: "small capacity", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-air-fryers", label: "Air fryers", title: "Best Air Fryers", minReviews: 5,
      intro: "The air fryers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Air fryer"] }] },
    { slug: "best-dual-basket-air-fryers", label: "Dual-basket air fryers", title: "Best Dual-Basket Air Fryers", minReviews: 5,
      intro: "The two-basket and stacked air fryers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Air fryer"] }, { column: "balance", include: ["Dual-basket"] }] },
    { slug: "best-crispy-air-fryers", label: "Crispiest", title: "Air Fryers With the Crispiest Results", minReviews: 5,
      intro: "The air fryers and air fryer ovens owners most often say crisp food well.", filters: [{ column: "shape", include: ["Air fryer", "Countertop oven"] }], trait: { tags: ["crispy results"], minShare: 0.25, against: ["uneven cooking"], noun: "crispy results" } },
    { slug: "best-countertop-ovens", label: "Countertop ovens", title: "Best Countertop and Toaster Ovens", minReviews: 5,
      intro: "The toaster ovens, air fryer ovens and steam ovens owners are most consistently happy with.", filters: [{ column: "shape", include: ["Countertop oven"] }] },
    { slug: "best-blenders", label: "Blenders", title: "Best Blenders", minReviews: 5,
      intro: "The blenders owners are most consistently happy with, from personal to high-speed.", filters: [{ column: "shape", include: ["Blender"] }] },
    { slug: "best-high-speed-blenders", label: "High-speed blenders", title: "Best High-Speed Blenders", minReviews: 5,
      intro: "The high-speed blenders owners are most consistently happy with.", filters: [{ column: "shape", include: ["Blender"] }, { column: "balance", include: ["High-speed"] }] },
    { slug: "best-stand-mixers", label: "Stand mixers", title: "Best Stand Mixers", minReviews: 5,
      intro: "The stand mixers and kitchen machines owners are most consistently happy with.", filters: [{ column: "shape", include: ["Stand mixer"] }] },
    { slug: "best-food-processors", label: "Food processors", title: "Best Food Processors", minReviews: 5,
      intro: "The food processors owners are most consistently happy with.", filters: [{ column: "shape", include: ["Food processor"] }] },
    { slug: "best-multicookers", label: "Multicookers", title: "Best Multicookers and Electric Pressure Cookers", minReviews: 5,
      intro: "The Instant Pots, Ninja Foodis and other multicookers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Multicooker"] }] },
    { slug: "best-easy-to-clean-kitchen-appliances", label: "Easy to clean", title: "Easiest Kitchen Appliances to Clean", minReviews: 5,
      intro: "The countertop appliances owners most often call easy to clean.", trait: { tags: ["easy to clean"], minShare: 0.25, against: ["hard to clean"], noun: "cleaning" } },
    { slug: "best-budget-kitchen-appliances", label: "Budget", title: "Best Budget Kitchen Appliances", minReviews: 5,
      intro: "The air fryers, ovens, blenders, mixers and multicookers owners most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Other"],
  examples: { brand: "Ninja", model: "Foodi DualZone DZ201", year: 2026, search: "dualzone" },
  form: {
    prompts: [["What did you have before?", "Before this I used "], ["What do you make in it?", "I mostly use it for "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you had before, and how this compares", "What you cook or blend in it and how often", "How the results turned out: crispness, evenness, smoothness, dough", "Cleaning, noise, counter space and the presets or app", "How it has held up and whether it was worth the price"],
  },
  seo: {
    homeTitle: "KitchenRecs – Real Reviews of Air Fryers, Countertop Ovens, Blenders and Stand Mixers",
    homeDescription: "Browse real owner reviews of air fryers, toaster and countertop ovens, blenders, stand mixers, food processors and multicookers, plus opinions collected from Reddit, YouTube, retailers and forums. Compare Ninja, Instant Pot, Cosori, Breville, Vitamix, KitchenAid, Kenwood, Philips and more.",
    layoutDescription: "Real experiences with air fryers, countertop ovens, blenders, stand mixers, food processors and multicookers, plus opinions from Reddit, YouTube, retailers and forums with the source linked.",
    titleTemplate: "%s | KitchenRecs",
    catalog: { title: "All Kitchen Appliances – Reviews and Ratings", description: "Every air fryer, countertop oven, blender, stand mixer, food processor and multicooker on KitchenRecs with owner ratings. Filter by brand and category, then read what owners say." },
    brands: { title: "Kitchen Appliance Brands", description: "Browse countertop appliances by brand — Ninja, Instant Pot, Cosori, Breville, Vitamix, Blendtec, Nutribullet, KitchenAid, Kenwood, Philips and more — and read real reviews of each model." },
    brand: brand => ({ title: `${brand} Appliances – Reviews`, description: `Real owner reviews of ${brand} countertop appliances: ratings, strengths and weaknesses for every ${brand} model on KitchenRecs.` }),
    product: name => ({ title: `${name} Reviews | KitchenRecs`, description: `Read real owner experiences with the ${name}. Ratings for results, ease of use, cleaning, build quality and value, plus opinions from around the web.` }),
    productNotFound: "Appliance not found | KitchenRecs",
    productCategory: "Kitchen appliances",
    addReview: { title: "Add a Kitchen Appliance Review", description: "Own an air fryer, countertop oven, blender, stand mixer, food processor or multicooker? Share how it works for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why KitchenRecs exists: kitchen appliance opinions are scattered across Reddit, YouTube, retailers and forums. KitchenRecs collects them and lets owners add their own." },
    ogAlt: "KitchenRecs – real reviews of kitchen appliances",
    ogProductAlt: "Kitchen appliance reviews on KitchenRecs",
    ogEyebrow: "Real reviews of kitchen appliances",
    ogTitle: "Kitchen appliance reviews from people who cook with them",
    ogDetail: "From owners, Reddit, YouTube, retailers and forums",
    ogFallbackTitle: "Kitchen appliance reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell others how an air fryer, oven, blender, mixer, food processor or multicooker actually works in your kitchen. Takes about two minutes, no account needed.",
      howItWent: "how it works for you",
      aboutYou: "About your kitchen",
      aboutYouHint: "optional · helps people find kitchens like theirs",
      howItPerforms: "How it performs",
      whoUsesIt: "Who's cooking with it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that appliance or page. Maybe it moved, maybe it was discontinued, maybe it’s at the back of the cupboard behind the bread maker.",
    about: {
      heading: "Why KitchenRecs exists",
      paragraphs: [
        "Kitchen appliance opinions are scattered across Reddit, YouTube, retailers and forums. KitchenRecs puts those experiences in one place and lets owners add their own.",
        "An air fryer that is perfect for one person is too small for a family of five, and a blender that is fine for smoothies may not survive nut butter. Knowing who someone cooks for, what they make and what they had before often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Ratings come from owner submissions, and external comments stay separate from those ratings. Appliance pages link to Amazon, and KitchenRecs may earn a commission when you buy through those links; that never changes a rating or ranking." },
        { heading: "A work in progress", body: "KitchenRecs is new. Submissions are moderated before publication, web reviews link to their sources, and product details come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about appliances you actually own or have used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
