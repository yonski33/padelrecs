import type { Niche } from "./types";

// Rating icons: a small perfume bottle (champagne-gold juice, violet outline and cap). Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const bottleTile = "M5.6 4.6h5.8l1.6 2v5.6a1.2 1.2 0 0 1-1.2 1.2H5.2A1.2 1.2 0 0 1 4 12.2V6.6z";
const capTile = "M6.6 1h3.8v3.6H6.6z";
const bottlePick = "M6.4 7h7.2l2.2 2.6v7.6a1.6 1.6 0 0 1-1.6 1.6H5.8a1.6 1.6 0 0 1-1.6-1.6V9.6z";
const capPick = "M7.8 1.6h4.4V7H7.8z";
const bottle = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='0 0 17 14'" : "viewBox='0 0 20 20'";
  const [body, cap] = size === "tile" ? [bottleTile, capTile] : [bottlePick, capPick];
  const w = size === "tile" ? 1.1 : 1.3;
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${cap}' fill='#4c1d95'/><path d='${body}' fill='#e9c46a' stroke='#4c1d95' stroke-width='${w}' stroke-linejoin='round'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${cap}' fill='#e7e2ee'/><path d='${body}' fill='#e7e2ee'/></svg>`);
};
const ogBottle = (juice: string, cap: string, stroke: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${capPick}" fill="${cap}"/><path d="${bottlePick}" fill="${juice}" stroke="${stroke}" stroke-width="1.3" stroke-linejoin="round"/></svg>`;

/** Who a fragrance is sold for: the catalogue shape, the type pages and the product drawing. */
export const FRAGRANCE_FOR = ["Men", "Women", "Unisex"];
/** Concentrations as makers and retailers write them. The catalogue keeps a value only where its source states it. */
export const CONCENTRATIONS = ["Cologne", "Eau de Toilette", "Eau de Toilette Intense", "Eau de Parfum", "Eau de Parfum Intense", "Parfum", "Parfum Intense", "Elixir", "Elixir de Parfum", "Extrait de Parfum", "Pure Parfum"];

export const fragrance: Niche = {
  id: "fragrance",
  schema: "fragrancerecs",
  site: {
    name: "FragranceRecs",
    domain: "fragrancerecs.com",
    wordmark: "fragrancerecs",
    descriptor: "real reviews of perfumes and colognes",
    footer: "kept by people with more bottles than days to wear them. No affiliate links.",
    analyticsId: "G-VB88Q9X0X1",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "fragrance", many: "fragrances", One: "Fragrance", Many: "Fragrances" },
  people: { one: "wearer", many: "wearers", One: "Wearer", Many: "Wearers" },
  // Fragrances are named by line and concentration (Sauvage Eau de Parfum, Sauvage Elixir), not years.
  productYears: false,
  productPath: "fragrances",
  scoreUnit: { one: "bottle", many: "bottles" },
  // White page, deep violet, one champagne-gold accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f7f5fa",
    "--ink": "#1c1726",
    "--ink-2": "#3f3850",
    "--ink-3": "#6f6880",
    "--line": "#e9e5f0",
    "--line-2": "#d9d2e4",
    "--green": "#4c1d95",
    "--green-ink": "#3b1574",
    "--green-wash": "#f3eefb",
    "--green-line": "#d9caf0",
    "--on-green": "#f5f0fd",
    "--on-green-muted": "#cbb8ec",
    "--lime": "#e9c46a",
    "--lime-wash": "#fcf5e2",
    "--lime-line": "#efd9a0",
    "--lime-ink": "#6b4e0b",
    "--lime-ink-2": "#533c08",
    "--score-on": bottle("tile", true),
    "--score-off": bottle("tile", false),
    "--score-pick-on": bottle("pick", true),
    "--score-pick-off": bottle("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#e4dded", "#b9a6dc", "#d8cfe6", "#f2e2b8"],
  og: {
    background: "#4c1d95",
    accent: "#e9c46a",
    muted: "#cbb8ec",
    text: "#f5f0fd",
    scoreOn: ogBottle("#e9c46a", "#f5f0fd", "#2e1065"),
    scoreOff: ogBottle("#6d45ad", "#6d45ad", "#6d45ad"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for fragrance: power = projection, control = longevity, comfort = the scent itself,
  // maneuverability = versatility (seasons, occasions), forgiveness = value.
  categories: [
    { column: "comfortRating", label: "Scent", hint: "how much you like the smell" },
    { column: "controlRating", label: "Longevity", hint: "how long it lasts on you" },
    { column: "powerRating", label: "Projection", hint: "how far it carries, sillage" },
    { column: "maneuverabilityRating", label: "Versatility", hint: "seasons and occasions it works for" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Experience", adminLabel: "Experience", options: [
      { value: "New to fragrance", hint: "A bottle or two", display: "new to fragrance" }, { value: "Enthusiast", hint: "A small collection", display: "fragrance enthusiast" }, { value: "Collector", hint: "Dozens of bottles", display: "collector" },
    ] },
    playingSide: { label: "Wears it for", adminLabel: "Wears it for", options: [
      { value: "Every day", display: "wears it every day" }, { value: "Work", display: "wears it to work" }, { value: "Evenings & dates", display: "wears it for evenings and dates" }, { value: "Special occasions", display: "wears it for special occasions" },
    ] },
    playingStyle: { label: "Climate", adminLabel: "Climate", options: [
      { value: "Hot", display: "hot climate" }, { value: "Mild", display: "mild climate" }, { value: "Cold", display: "cold climate" },
    ] },
    timeWithRacket: { label: "Time wearing it", adminLabel: "Time wearing it", options: [
      { value: "Sampled it", hint: "Sample or decant", display: "sampled it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared with padel: shape = who it is sold for, balance = concentration, weight = bottle sizes,
  // core = notes, surface = fragrance family. Each value is the source page's own wording; blank where it says nothing.
  specs: [
    { column: "shape", label: "For", max: 100, placeholder: "e.g. Men", options: FRAGRANCE_FOR },
    { column: "balance", label: "Concentration", max: 120, placeholder: "e.g. Eau de Parfum", options: CONCENTRATIONS },
    { column: "weight", label: "Sizes", max: 120, placeholder: "e.g. 1.7 oz, 3.4 oz" },
    { column: "core", label: "Notes", max: 200, placeholder: "e.g. Top: bergamot; Heart: lavender; Base: amber" },
    { column: "surface", label: "Fragrance family", max: 200, placeholder: "e.g. Woody Aromatic" },
  ],
  shapeFilter: FRAGRANCE_FOR,
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Men", slug: "mens-fragrances", label: "For men", intro: "Colognes and fragrances sold for men" },
    { shape: "Women", slug: "womens-fragrances", label: "For women", intro: "Perfumes and fragrances sold for women" },
    { shape: "Unisex", slug: "unisex-fragrances", label: "Unisex", intro: "Fragrances sold for everyone" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "long-lasting", tone: "pos" },
    { label: "strong projection", tone: "pos" },
    { label: "versatile", tone: "pos" },
    { label: "office-safe", tone: "pos" },
    { label: "compliment getter", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "weak projection", tone: "neg" },
    { label: "fades fast", tone: "neg" },
    { label: "smells cheap", tone: "neg" },
    { label: "synthetic", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "date night", tone: "neutral" },
    { label: "summer", tone: "neutral" },
    { label: "winter", tone: "neutral" },
    { label: "sweet", tone: "neutral" },
    { label: "fresh", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts): one per "For" type page, then trait lists from review tags.
  topLists: [
    { slug: "best-mens-fragrances", label: "For men", title: "Best Men’s Fragrances", minReviews: 10,
      intro: "The colognes and fragrances sold for men that wearers are most consistently happy with.", filters: [{ column: "shape", include: ["Men"] }] },
    { slug: "best-womens-fragrances", label: "For women", title: "Best Women’s Fragrances", minReviews: 10,
      intro: "The perfumes sold for women that wearers are most consistently happy with.", filters: [{ column: "shape", include: ["Women"] }] },
    { slug: "best-unisex-fragrances", label: "Unisex", title: "Best Unisex Fragrances", minReviews: 6,
      intro: "The fragrances sold for everyone that wearers are most consistently happy with.", filters: [{ column: "shape", include: ["Unisex"] }] },
    { slug: "longest-lasting-fragrances", label: "Longest-lasting", title: "Longest-Lasting Fragrances", minReviews: 8,
      intro: "Fragrances wearers keep saying last all day, with few reports that they fade fast.",
      trait: { tags: ["long-lasting"], minShare: 0.2, against: ["fades fast"], noun: "longevity" } },
    { slug: "best-compliment-getter-fragrances", label: "Compliment getters", title: "Best Compliment-Getting Fragrances", minReviews: 8,
      intro: "Fragrances wearers say get them noticed and complimented.",
      trait: { tags: ["compliment getter"], minShare: 0.15, noun: "compliments" } },
    { slug: "best-summer-fragrances", label: "Summer", title: "Best Summer Fragrances", minReviews: 8,
      intro: "Fragrances wearers reach for in hot weather: fresh, bright and easy to wear in the heat.",
      trait: { tags: ["summer", "fresh"], minShare: 0.2, noun: "summer wear or freshness" } },
    { slug: "best-winter-fragrances", label: "Winter", title: "Best Winter Fragrances", minReviews: 8,
      intro: "Fragrances wearers save for cold weather.",
      trait: { tags: ["winter"], minShare: 0.15, noun: "cold-weather wear" } },
    { slug: "best-office-fragrances", label: "Office", title: "Best Office-Safe Fragrances", minReviews: 8,
      intro: "Fragrances wearers call safe for work and versatile enough to wear most days.",
      trait: { tags: ["office-safe", "versatile"], minShare: 0.2, against: ["strong projection"], noun: "office wear or versatility" } },
    { slug: "best-value-fragrances", label: "Best value", title: "Best Value Fragrances", minReviews: 8,
      intro: "Fragrances wearers say are worth the money, without many complaints that they smell cheap.",
      trait: { tags: ["great value"], minShare: 0.15, against: ["overpriced", "smells cheap"], noun: "value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Fragrance retailer", "Forum", "Other"],
  examples: { brand: "Dior", model: "Sauvage Eau de Parfum", year: 2026, search: "sauvage" },
  form: {
    prompts: [["What does it remind you of?", "To me it smells like "], ["How long does it last?", "On my skin it lasts "], ["When do you wear it?", "I mostly wear it "]],
    tips: ["Which concentration you have (EDT, EDP, Parfum…) and the bottle size, if you know them", "How long it lasts on your skin and how far it projects", "When you wear it: seasons, work, evenings", "What it reminds you of, and how it compares to similar fragrances", "Whether you bought a full bottle, a decant or a sample"],
  },
  seo: {
    homeTitle: "FragranceRecs – Real Reviews of Perfumes and Colognes",
    homeDescription: "Browse real fragrance reviews from people who wear them, plus opinions collected from Reddit, YouTube, retailers and forums. Compare experiences with Dior, Chanel, Creed, Parfums de Marly, Lattafa, Armaf and more.",
    layoutDescription: "Real experiences with perfumes and colognes from people who wear them, plus opinions from Reddit, YouTube, retailers and forums with the source linked.",
    titleTemplate: "%s | FragranceRecs",
    catalog: { title: "All Fragrances – Wearer Reviews and Ratings", description: "Every perfume and cologne on FragranceRecs with community ratings. Filter by brand and who it’s for, then read what wearers say about each one." },
    brands: { title: "Fragrance Brands", description: "Browse perfumes and colognes by brand — Dior, Chanel, Yves Saint Laurent, Creed, Parfums de Marly, Lattafa, Armaf and more — and read real reviews of each one." },
    brand: brand => ({ title: `${brand} Fragrances – Wearer Reviews`, description: `Real reviews of ${brand} perfumes and colognes: scent, longevity, projection and value for every ${brand} fragrance on FragranceRecs.` }),
    product: name => ({ title: `${name} Reviews | FragranceRecs`, description: `Read real experiences with ${name}. Ratings for scent, longevity, projection and value, plus opinions from around the web.` }),
    productNotFound: "Fragrance not found | FragranceRecs",
    productCategory: "Fragrance",
    addReview: { title: "Add a Fragrance Review", description: "Wear a perfume or cologne? Share how it smells, lasts and projects on you in about two minutes. No account needed." },
    about: { title: "About", description: "Why FragranceRecs exists: fragrance opinions are scattered across Reddit, YouTube, retailers and forums. FragranceRecs collects them and lets people add their own." },
    ogAlt: "FragranceRecs – real reviews of perfumes and colognes",
    ogProductAlt: "Fragrance reviews on FragranceRecs",
    ogEyebrow: "Real reviews of perfumes and colognes",
    ogTitle: "Fragrance reviews from people who wear them",
    ogDetail: "From wearers, Reddit, YouTube, retailers and forums",
    ogFallbackTitle: "Fragrance reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other people how a fragrance actually wears on you. Takes about two minutes, no account needed.",
      howItWent: "how it smells and wears on you",
      aboutYou: "About you",
      aboutYouHint: "optional · helps people find wearers like them",
      howItPerforms: "How it wears",
      whoUsesIt: "Who's wearing it",
      triedIt: "Worn it?",
      triedOne: "Worn one?",
      triedOneOfThese: "Worn one of these?",
    },
    notFound: "We couldn’t find that fragrance or page. Maybe it was discontinued, maybe it was reformulated out of existence, maybe it never existed.",
    about: {
      heading: "Why FragranceRecs exists",
      paragraphs: [
        "Fragrance opinions are scattered across Reddit, YouTube, retailers and forums. FragranceRecs puts those experiences in one place and lets people add their own.",
        "A fragrance that works on one person won’t work on everyone. Skin, climate, the concentration and how someone wears it often tell you more than a score on its own.",
      ],
      sections: [
        { heading: "People, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from user submissions, and quotes from around the web stay separate from those ratings." },
        { heading: "Concentrations are separate", body: "An Eau de Toilette, Eau de Parfum, Parfum and Elixir of the same line smell and wear differently, so each has its own page. Catalogue details come from a maker’s or retailer’s page and stay blank where that page doesn’t say." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about fragrances you’ve actually worn and say which concentration you have." },
        { heading: "Your privacy", body: "An alias is optional, and so are experience, occasion and climate. If you leave an email address, it is stored privately with your submission and never included in public reviews." },
      ],
    },
  },
};
