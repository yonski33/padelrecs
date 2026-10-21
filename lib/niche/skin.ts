import type { Niche } from "./types";

// Rating icons: a small peach drop outlined in plum. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const dropTile = "M7 1.2C9.6 4.4 11.4 6.8 11.4 9C11.4 11.5 9.4 13.2 7 13.2C4.6 13.2 2.6 11.5 2.6 9C2.6 6.8 4.4 4.4 7 1.2Z";
const dropPick = "M10 1.6C13.6 6 16.2 9.4 16.2 12.6C16.2 16.1 13.4 18.6 10 18.6C6.6 18.6 3.8 16.1 3.8 12.6C3.8 9.4 6.4 6 10 1.6Z";
const shine = (size: "tile" | "pick") => size === "tile" ? "M5 9.6C5 8.6 5.5 7.6 6.2 6.8" : "M7.2 13.4C7.2 11.9 7.9 10.5 9 9.3";
const drop = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='0 0 17 14'" : "viewBox='0 0 20 20'";
  const d = size === "tile" ? dropTile : dropPick;
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${d}' fill='#f3a683' stroke='#5e2a52' stroke-width='${size === "tile" ? 1.2 : 1.4}' stroke-linejoin='round'/><path d='${shine(size)}' fill='none' stroke='#fff' stroke-opacity='.7' stroke-width='1.1' stroke-linecap='round'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${d}' fill='#efe2dd'/></svg>`);
};
const ogDrop = (on: boolean) => on
  ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${dropPick}" fill="#f3a683" stroke="#4a1f40" stroke-width="1.4" stroke-linejoin="round"/></svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${dropPick}" fill="#9a5a8b"/></svg>`;

export const skin: Niche = {
  id: "skin",
  schema: "skinrecs",
  site: {
    name: "SkinRecs",
    domain: "skinrecs.com",
    wordmark: "skinrecs",
    descriptor: "real reviews of skincare products",
    footer: "kept by people with too many half-used bottles. No affiliate links.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "user", many: "users", One: "User", Many: "Users" },
  productYears: false,
  productPath: "products",
  scoreUnit: { one: "drop", many: "drops" },
  // Warm ivory paper, soft berry, one peach accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#fbf5f2",
    "--surface": "#fffcfb",
    "--tint": "#f8f1ee",
    "--ink": "#2b1d24",
    "--ink-2": "#4a3a40",
    "--ink-3": "#76666c",
    "--line": "#f1e6e2",
    "--line-2": "#e6d6d0",
    "--green": "#7d3a6e",
    "--green-ink": "#5e2a52",
    "--green-wash": "#f7eef4",
    "--green-line": "#e6d0e0",
    "--on-green": "#f8edf4",
    "--on-green-muted": "#e2c8db",
    "--lime": "#f3a683",
    "--lime-wash": "#fdefe7",
    "--lime-line": "#f4cdb9",
    "--lime-ink": "#6b3420",
    "--lime-ink-2": "#55281a",
    "--score-on": drop("tile", true),
    "--score-off": drop("tile", false),
    "--score-pick-on": drop("pick", true),
    "--score-pick-off": drop("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#ece0db", "#dcc3d4", "#c4b2ab", "#f0d4c6"],
  og: { background: "#7d3a6e", accent: "#f3a683", muted: "#e2c8db", text: "#f8edf4", scoreOn: ogDrop(true), scoreOff: ogDrop(false) },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Stored in the existing rating columns; only the labels are skincare.
  categories: [
    { column: "powerRating", label: "Results", hint: "did it do what it promised" },
    { column: "controlRating", label: "Texture", hint: "feel, absorption, no residue" },
    { column: "comfortRating", label: "Gentleness", hint: "no irritation or breakouts" },
    { column: "maneuverabilityRating", label: "Scent", hint: "pleasant, or none at all" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Skin type", adminLabel: "Skin type", options: [
      { value: "Dry", display: "dry skin" }, { value: "Oily", display: "oily skin" }, { value: "Combination", display: "combination skin" }, { value: "Normal", display: "normal skin" }, { value: "Sensitive", display: "sensitive skin" },
    ] },
    playingSide: { label: "Main concern", adminLabel: "Main concern", options: [
      { value: "Acne", display: "for acne" }, { value: "Aging", display: "for aging" }, { value: "Dark spots", display: "for dark spots" }, { value: "Dryness", display: "for dryness" }, { value: "Redness", display: "for redness" }, { value: "Sensitivity", display: "for sensitivity" },
    ] },
    playingStyle: { label: "Age", adminLabel: "Age range", options: [
      { value: "Under 25", display: "under 25" }, { value: "25–34", display: "age 25–34" }, { value: "35–44", display: "age 35–44" }, { value: "45–54", display: "age 45–54" }, { value: "55+", display: "age 55+" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "A few uses", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = product type, weight = size, core = key ingredients, surface = skin types, balance = fragrance.
  specs: [
    { column: "shape", label: "Type", max: 100, placeholder: "e.g. Moisturizer", options: ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Eye cream", "Exfoliant", "Mask", "Treatment"] },
    { column: "weight", label: "Size", max: 120, placeholder: "e.g. 50 ml / 1.7 fl oz" },
    { column: "core", label: "Key ingredients", max: 200, placeholder: "e.g. Ceramides, hyaluronic acid" },
    { column: "surface", label: "Skin types", max: 200, placeholder: "e.g. Dry to very dry" },
    { column: "balance", label: "Fragrance", max: 120, placeholder: "e.g. Fragrance-free", options: ["Fragrance-free", "Contains fragrance"] },
  ],
  shapeFilter: ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Eye cream", "Exfoliant", "Mask", "Treatment"],
  rowDetail: { column: "weight", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "hydrating", tone: "pos" },
    { label: "lightweight", tone: "pos" },
    { label: "absorbs quickly", tone: "pos" },
    { label: "gentle", tone: "pos" },
    { label: "cleared breakouts", tone: "pos" },
    { label: "evened skin tone", tone: "pos" },
    { label: "no white cast", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "broke me out", tone: "neg" },
    { label: "irritating", tone: "neg" },
    { label: "stinging", tone: "neg" },
    { label: "greasy", tone: "neg" },
    { label: "pills under makeup", tone: "neg" },
    { label: "strong scent", tone: "neg" },
    { label: "rich texture", tone: "neutral" },
    { label: "fragrance-free", tone: "neutral" },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Beauty retailer", "Forum", "Other"],
  examples: { brand: "CeraVe", model: "Moisturizing Cream", year: 2026, search: "cerave" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["How long until results?", "I noticed a difference after "], ["Any irritation?", "On my skin it "]],
    tips: ["What you used before, and how this compares", "Your skin type and what you hoped it would fix", "How long it took to see a difference, if at all", "Texture and scent, and whether it works under makeup or sunscreen", "Any irritation, breakouts or stinging"],
  },
  seo: {
    homeTitle: "SkinRecs – Real User Reviews of Skincare Products",
    homeDescription: "Browse real skincare reviews from people who used the products, plus opinions collected from Reddit, YouTube, retailers and forums. Compare experiences across CeraVe, La Roche-Posay, The Ordinary, Paula’s Choice and more.",
    layoutDescription: "Real experiences with skincare products from people who used them, plus opinions from Reddit, YouTube, retailers and forums with the source linked.",
    titleTemplate: "%s | SkinRecs",
    catalog: { title: "All Skincare Products – User Reviews and Ratings", description: "Every skincare product on SkinRecs with community ratings. Filter by brand and type, then read what people say about each one." },
    brands: { title: "Skincare Brands", description: "Browse skincare products by brand — CeraVe, La Roche-Posay, The Ordinary, Paula’s Choice, Neutrogena and more — and read real user reviews of each one." },
    brand: brand => ({ title: `${brand} Skincare – User Reviews`, description: `Real user reviews of ${brand} skincare: ratings, results, texture and gentleness for every ${brand} product on SkinRecs.` }),
    product: name => ({ title: `${name} Reviews | SkinRecs`, description: `Read real experiences with ${name}. Ratings for results, texture and gentleness, by skin type, plus opinions from around the web.` }),
    productNotFound: "Product not found | SkinRecs",
    productCategory: "Skincare product",
    addReview: { title: "Add a Skincare Review", description: "Used a skincare product? Share how it worked on your skin in about two minutes. No account needed." },
    about: { title: "About", description: "Why SkinRecs exists: skincare opinions are scattered across Reddit, YouTube, retailers and forums. SkinRecs collects them and lets people add their own." },
    ogAlt: "SkinRecs – real user reviews of skincare products",
    ogProductAlt: "Skincare product reviews on SkinRecs",
    ogEyebrow: "Real reviews of skincare products",
    ogTitle: "Skincare reviews from people who used it",
    ogDetail: "From users, Reddit, YouTube, retailers and forums",
    ogFallbackTitle: "Skincare reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other people how a product actually worked on your skin. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About your skin",
      aboutYouHint: "optional · helps people with similar skin find your review",
      howItPerforms: "How it performs",
      whoUsesIt: "Who's using it",
      triedIt: "Used it?",
      triedOne: "Used one?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "We couldn’t find that product or page. Maybe it moved, maybe it was discontinued, maybe it never existed.",
    about: {
      heading: "Why SkinRecs exists",
      paragraphs: [
        "Skincare opinions are scattered across Reddit, YouTube, retailers and forums. SkinRecs puts those experiences in one place and lets people add their own.",
        "A product that works for one person won’t work for everyone. Knowing someone’s skin type, what they were trying to fix and how long they used it often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "People, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from user submissions, and quotes from around the web stay separate from those ratings." },
        { heading: "Not medical advice", body: "Reviews describe personal experiences, not dermatological advice. Patch-test new products, and talk to a dermatologist or doctor about persistent skin problems, allergies or prescription treatments." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about products you’ve actually used and be specific about your skin and what changed." },
        { heading: "Your privacy", body: "An alias is optional, and so are skin type, concern and age range. If you leave an email address, it is stored privately with your submission and never included in public reviews." },
      ],
    },
  },
};
