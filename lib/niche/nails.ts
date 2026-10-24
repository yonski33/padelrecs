import type { Niche } from "./types";

// Rating icons: a polished nail, wine lacquer with a pink shine. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const NAIL_TILE = "M8.5 1.2C11 1.2 12.6 3.6 12.6 7V11.4C12.6 12.4 11.8 13.2 10.8 13.2H6.2C5.2 13.2 4.4 12.4 4.4 11.4V7C4.4 3.6 6 1.2 8.5 1.2Z";
const NAIL_PICK = "M10 1.8C13.4 1.8 15.4 5 15.4 9.6V16.2C15.4 17.6 14.3 18.6 12.9 18.6H7.1C5.7 18.6 4.6 17.6 4.6 16.2V9.6C4.6 5 6.6 1.8 10 1.8Z";
const nailIcon = (size: "tile" | "pick", on: boolean) => {
  const [box, path, shine, width] = size === "tile"
    ? ["width='17' height='14' viewBox='0 0 17 14'", NAIL_TILE, "M6.6 8C6.6 5.6 7.2 4 8.2 3.2", "1.2"]
    : ["viewBox='0 0 20 20'", NAIL_PICK, "M7.6 11.2C7.6 7.8 8.4 5.6 9.8 4.6", "1.6"];
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${path}' fill='#6b1538'/><path d='${shine}' fill='none' stroke='#f7a1c4' stroke-width='${width}' stroke-linecap='round'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${path}' fill='#efe3e7'/></svg>`);
};
const ogNail = (nail: string, shine: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${NAIL_PICK}" fill="${nail}"/><path d="M7.6 11.2C7.6 7.8 8.4 5.6 9.8 4.6" fill="none" stroke="${shine}" stroke-width="1.6" stroke-linecap="round"/></svg>`;

export const nails: Niche = {
  id: "nails",
  schema: "nailsrecs",
  site: {
    name: "NailsRecs",
    domain: "nailsrecs.com",
    wordmark: "nailsrecs",
    descriptor: "real reviews of nail polish, gel polish, base and top coats, press-on nails, nail treatments and cuticle oils",
    footer: "kept by people with a drawer full of top coats. No affiliate links.",
    // analyticsId: "G-XXXXXXXXXX", // add once the GA4 property for nailsrecs.com exists
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "user", many: "users", One: "User", Many: "Users" },
  // Makers name nail products by line and formula (Nail Lacquer, Infinite Shine, GelColor, Gel Couture, Miracle Gel), not by year.
  // Shades are not separate products: one entry covers every shade of its formula.
  productYears: false,
  productPath: "products",
  scoreUnit: { one: "nail", many: "nails" },
  // White page, wine-lacquer ink, one ballet-pink accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  // --lime is the pink, readable on the wine panels; the logo and rating icons use the same #f7a1c4.
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#fbf5f7",
    "--ink": "#2a1219",
    "--ink-2": "#4a3038",
    "--ink-3": "#7a646b",
    "--line": "#efe3e7",
    "--line-2": "#e2d0d6",
    "--green": "#6b1538",
    "--green-ink": "#520f2a",
    "--green-wash": "#f8edf1",
    "--green-line": "#e9cdd8",
    "--on-green": "#fbf0f4",
    "--on-green-muted": "#dfb3c4",
    "--lime": "#f7a1c4",
    "--lime-wash": "#fdf0f5",
    "--lime-line": "#f8cfdf",
    "--lime-ink": "#8a2650",
    "--lime-ink-2": "#6e1d40",
    "--score-on": nailIcon("tile", true),
    "--score-off": nailIcon("tile", false),
    "--score-pick-on": nailIcon("pick", true),
    "--score-pick-off": nailIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f7a1c4", "#e2d0d6", "#a86a83", "#f8cfdf", "#94a3b8"],
  og: {
    background: "#6b1538",
    accent: "#f7a1c4",
    muted: "#dfb3c4",
    text: "#fbf0f4",
    scoreOn: ogNail("#fbf0f4", "#f7a1c4"),
    scoreOff: ogNail("#8a3a5a", "#8a3a5a"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for nail products: power = wear, comfort = application,
  // maneuverability = finish, control = nail health, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Wear", hint: "how long it lasts before chipping, lifting or popping off" },
    { column: "comfortRating", label: "Application", hint: "brush, formula, self-leveling, drying or curing, fit" },
    { column: "maneuverabilityRating", label: "Finish", hint: "shine, opacity, colour as shown, how natural it looks" },
    { column: "controlRating", label: "Nail health", hint: "gentle on nails and cuticles, easy to remove, strength" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Your nails", adminLabel: "Natural nails", options: [
      { value: "Strong", display: "strong nails" }, { value: "Normal", display: "normal nails" }, { value: "Thin or bendy", display: "thin, bendy nails" },
      { value: "Brittle or peeling", display: "brittle, peeling nails" }, { value: "Recovering from gel or acrylic", display: "nails recovering from gel or acrylic" },
    ] },
    playingSide: { label: "How you do your nails", adminLabel: "Done at", options: [
      { value: "At home", display: "does their nails at home" }, { value: "At a salon", display: "gets their nails done at a salon" }, { value: "Both", display: "does their nails at home and at a salon" },
      { value: "Nail tech", hint: "does other people’s nails", display: "a nail tech" },
    ] },
    playingStyle: { label: "Usual length", adminLabel: "Usual length", options: [
      { value: "Short" }, { value: "Medium" }, { value: "Long" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried it", hint: "One or two manis", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type (regular or long-wear lacquer, soak-off gel, builder gel, top coat, strengthener…),
  // surface = key specs (air dry or LED/UV lamp, no-wipe, peel-off), core = formula as the page states it, weight = size as the page states it.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Nail polish", options: ["Nail polish", "Gel polish", "Base & top coat", "Press-on nails", "Nail treatment", "Cuticle oil"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Long-wear lacquer, Builder gel or Quick-dry top coat" },
    { column: "surface", label: "Key specs", max: 200, placeholder: "e.g. Air dry, or LED/UV lamp, no-wipe" },
    { column: "core", label: "Formula", max: 200, placeholder: "e.g. Vegan, plant-based" },
    { column: "weight", label: "Size", max: 120, placeholder: "e.g. 15 ml / 0.5 fl oz" },
  ],
  shapeFilter: ["Nail polish", "Gel polish", "Base & top coat", "Press-on nails", "Nail treatment", "Cuticle oil"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Nail polish", slug: "nail-polish", label: "Nail polish", intro: "Regular, long-wear and quick-dry nail polish lines, from drugstore to indie" },
    { shape: "Gel polish", slug: "gel-polish", label: "Gel", intro: "Soak-off and at-home gel polish, builder gels, soft gel extensions and dip powder" },
    { shape: "Base & top coat", slug: "base-and-top-coats", label: "Base & top coats", intro: "Base coats, top coats, quick-dry and matte top coats, gel base and no-wipe top coats, primers and ridge fillers" },
    { shape: "Press-on nails", slug: "press-on-nails", label: "Press-ons", intro: "Press-on nails with glue or adhesive tabs, reusable press-ons and nail strips" },
    { shape: "Nail treatment", slug: "nail-treatments", label: "Treatments", intro: "Nail strengtheners, hardeners, growth treatments and repair serums" },
    { shape: "Cuticle oil", slug: "cuticle-oils", label: "Cuticle oils", intro: "Cuticle oils, oil pens, roll-ons and cuticle balms" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "long-lasting", tone: "pos" },
    { label: "glossy", tone: "pos" },
    { label: "easy to apply", tone: "pos" },
    { label: "opaque in one coat", tone: "pos" },
    { label: "quick drying", tone: "pos" },
    { label: "self-leveling", tone: "pos" },
    { label: "gentle on nails", tone: "pos" },
    { label: "strengthened my nails", tone: "pos" },
    { label: "easy removal", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "chips easily", tone: "neg" },
    { label: "streaky", tone: "neg" },
    { label: "thick formula", tone: "neg" },
    { label: "strong smell", tone: "neg" },
    { label: "lifting", tone: "neg" },
    { label: "damaged my nails", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "needs two coats", tone: "neutral" },
    { label: "sheer", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-nail-polish", label: "Nail polish", title: "Best Nail Polish", minReviews: 5,
      intro: "The nail polish lines users are most consistently happy with.", filters: [{ column: "shape", include: ["Nail polish"] }] },
    { slug: "best-long-lasting-nail-polish", label: "Long-lasting", title: "Most Long-Lasting Nail Polish", minReviews: 5,
      intro: "The nail polish lines users most often call long-lasting.", filters: [{ column: "shape", include: ["Nail polish"] }], trait: { tags: ["long-lasting"], minShare: 0.25, against: ["chips easily"], noun: "the wear" } },
    { slug: "best-gel-nail-polish", label: "Gel polish", title: "Best Gel Nail Polish", minReviews: 5,
      intro: "The gel polishes, builder gels and gel systems users are most consistently happy with.", filters: [{ column: "shape", include: ["Gel polish"] }] },
    { slug: "best-nail-top-coats", label: "Base & top coats", title: "Best Nail Base and Top Coats", minReviews: 5,
      intro: "The base coats and top coats, regular and gel, users are most consistently happy with.", filters: [{ column: "shape", include: ["Base & top coat"] }] },
    { slug: "best-quick-dry-nail-top-coats", label: "Quick-dry top coats", title: "Best Quick-Dry Nail Top Coats", minReviews: 5,
      intro: "The quick-dry top coats users are most consistently happy with.", filters: [{ column: "shape", include: ["Base & top coat"] }, { column: "balance", include: ["Quick-dry top coat"] }] },
    { slug: "best-press-on-nails", label: "Press-ons", title: "Best Press-On Nails", minReviews: 5,
      intro: "The press-on nails users are most consistently happy with.", filters: [{ column: "shape", include: ["Press-on nails"] }] },
    { slug: "best-nail-strengtheners", label: "Treatments", title: "Best Nail Strengtheners and Treatments", minReviews: 5,
      intro: "The nail strengtheners, hardeners and repair treatments users are most consistently happy with.", filters: [{ column: "shape", include: ["Nail treatment"] }] },
    { slug: "best-cuticle-oils", label: "Cuticle oils", title: "Best Cuticle Oils", minReviews: 5,
      intro: "The cuticle oils and balms users are most consistently happy with.", filters: [{ column: "shape", include: ["Cuticle oil"] }] },
    { slug: "best-budget-nail-products", label: "Budget", title: "Best Budget Nail Products", minReviews: 5,
      intro: "The polishes, gels, coats, press-ons and treatments users most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Beauty retailer", "Forum", "Other"],
  examples: { brand: "OPI", model: "Infinite Shine", year: 2026, search: "infinite shine" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["How long did it last?", "On my nails it lasted "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how this compares", "Your natural nails and how you do them (at home, at a salon, with a lamp)", "How many coats, how it applied and how long it took to dry or cure", "How many days it lasted before chips, lifting or pop-offs", "Removal, any damage, smell, and whether it was worth the price"],
  },
  seo: {
    homeTitle: "NailsRecs – Real Reviews of Nail Polish, Gel Polish, Top Coats and Press-On Nails",
    homeDescription: "Browse real reviews of nail polish, gel polish, base and top coats, press-on nails, nail strengtheners and cuticle oils, plus opinions collected from Reddit, YouTube, beauty retailers and forums. Compare OPI, Essie, Sally Hansen, Holo Taco, CND, Olive & June, KISS, Aprés and more.",
    layoutDescription: "Real experiences with nail polish, gel polish, base and top coats, press-on nails, nail treatments and cuticle oils, plus opinions from Reddit, YouTube, beauty retailers and forums with the source linked.",
    titleTemplate: "%s | NailsRecs",
    catalog: { title: "All Nail Products – Reviews and Ratings", description: "Every nail polish, gel polish, base and top coat, press-on, nail treatment and cuticle oil on NailsRecs with community ratings. Filter by brand and category, then read what users say." },
    brands: { title: "Nail Brands", description: "Browse nail products by brand — OPI, Essie, Sally Hansen, Holo Taco, CND, Olive & June, KISS, Aprés, Static Nails, Seche and more — and read real reviews of each line." },
    brand: brand => ({ title: `${brand} Nail Products – Reviews`, description: `Real reviews of ${brand} nail products: ratings, strengths and weaknesses for every ${brand} product on NailsRecs.` }),
    product: name => ({ title: `${name} Reviews | NailsRecs`, description: `Read real experiences with ${name}. Ratings for wear, application, finish, nail health and value, plus opinions from around the web.` }),
    productNotFound: "Nail product not found | NailsRecs",
    productCategory: "Nail care",
    addReview: { title: "Add a Nail Product Review", description: "Used a nail polish, gel, top coat, press-on or treatment? Share how it worked for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why NailsRecs exists: nail product opinions are scattered across Reddit, YouTube, beauty retailers and forums. NailsRecs collects them and lets people add their own." },
    ogAlt: "NailsRecs – real reviews of nail products",
    ogProductAlt: "Nail product reviews on NailsRecs",
    ogEyebrow: "Real reviews of nail products",
    ogTitle: "Nail product reviews from people who wear them",
    ogDetail: "From users, Reddit, YouTube, beauty retailers and forums",
    ogFallbackTitle: "Nail product reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell others how a nail polish, gel, top coat, press-on or treatment actually worked for you. Takes about two minutes, no account needed.",
      howItWent: "how it wore",
      aboutYou: "About your nails",
      aboutYouHint: "optional · helps people find nails like theirs",
      howItPerforms: "How it performs",
      whoUsesIt: "Who's wearing it",
      triedIt: "Worn it?",
      triedOne: "Used it?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "We couldn’t find that product or page. Maybe it moved, maybe it was discontinued, maybe it rolled under the couch with the top coat cap.",
    about: {
      heading: "Why NailsRecs exists",
      paragraphs: [
        "Nail product opinions are scattered across Reddit, YouTube, beauty retailers and forums. NailsRecs puts those experiences in one place and lets people add their own.",
        "A polish that lasts a week on one person chips in a day on someone else. Knowing someone’s natural nails, how they apply it and what they used before often tells you more than a swatch or a score on its own.",
      ],
      sections: [
        { heading: "Users, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from user submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "NailsRecs is new. Submissions are moderated before publication, web reviews link to their sources, and product details come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about products you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
