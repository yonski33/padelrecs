import type { Niche } from "./types";

// Rating icons: a roasted coffee bean, dark-roast brown with a crema-coloured crease. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const beanIcon = (size: "tile" | "pick", on: boolean) => {
  const [box, bean, crease] = size === "tile"
    ? ["width='17' height='14' viewBox='0 0 17 14'", "<ellipse cx='8.5' cy='7' rx='5.2' ry='6.3' transform='rotate(28 8.5 7)'", "M10.3 1.9C7.4 4.4 9.8 8.6 6.7 12.1"]
    : ["viewBox='0 0 20 20'", "<ellipse cx='10' cy='10' rx='6.3' ry='8.6' transform='rotate(28 10 10)'", "M12.3 2.6C8.6 6 11.6 12.6 7.7 17.4"];
  const [shell, crema] = on ? ["#4a2511", "#f0a35e"] : ["#e9e1da", "#ffffff"];
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${bean} fill='${shell}'/><path d='${crease}' fill='none' stroke='${crema}' stroke-width='${size === "tile" ? 1.1 : 1.4}' stroke-linecap='round'/></svg>`);
};
const ogBean = (shell: string, crema: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="6.3" ry="8.6" transform="rotate(28 10 10)" fill="${shell}"/><path d="M12.3 2.6C8.6 6 11.6 12.6 7.7 17.4" fill="none" stroke="${crema}" stroke-width="1.4" stroke-linecap="round"/></svg>`;

export const coffee: Niche = {
  id: "coffee",
  schema: "coffeerecs",
  site: {
    name: "CoffeeRecs",
    domain: "coffeerecs.com",
    wordmark: "coffeerecs",
    descriptor: "home barista reviews of espresso machines, grinders, brewers, kettles and scales",
    footer: "kept by people who weigh their beans to a tenth of a gram. No affiliate links.",
    // analyticsId: "G-XXXXXXXXXX", // add once the GA4 property for coffeerecs.com exists
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "home barista", many: "home baristas", One: "Home barista", Many: "Home baristas" },
  // Makers name gear by model and generation (Barista Express Impress, Encore ESP Pro, Ode Gen 2, GO 2.0), not by year.
  productYears: false,
  productPath: "gear",
  scoreUnit: { one: "bean", many: "beans" },
  // White page, dark-roast ink, one crema accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  // --lime is the crema orange, readable on the dark-roast panels; the logo and rating icons use the same #f0a35e.
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#faf6f3",
    "--ink": "#2b1a12",
    "--ink-2": "#4d3a30",
    "--ink-3": "#7d6a60",
    "--line": "#e9e1da",
    "--line-2": "#dbcfc6",
    "--green": "#4a2511",
    "--green-ink": "#36190b",
    "--green-wash": "#f6eee9",
    "--green-line": "#e2d0c4",
    "--on-green": "#fbf4ee",
    "--on-green-muted": "#d2b8a6",
    "--lime": "#f0a35e",
    "--lime-wash": "#fff5eb",
    "--lime-line": "#fbd7b2",
    "--lime-ink": "#9a4a0c",
    "--lime-ink-2": "#7c3a09",
    "--score-on": beanIcon("tile", true),
    "--score-off": beanIcon("tile", false),
    "--score-pick-on": beanIcon("pick", true),
    "--score-pick-off": beanIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f0a35e", "#dbcfc6", "#a8907f", "#fbd7b2", "#94a3b8"],
  og: {
    background: "#4a2511",
    accent: "#f0a35e",
    muted: "#d2b8a6",
    text: "#fbf4ee",
    scoreOn: ogBean("#fbf4ee", "#f0a35e"),
    scoreOff: ogBean("#6e4632", "#6e4632"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for coffee gear: power = coffee quality, comfort = ease of use,
  // maneuverability = consistency, control = build quality, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Coffee quality", hint: "how good the coffee it helps you make tastes" },
    { column: "comfortRating", label: "Ease of use", hint: "workflow, learning curve, cleaning" },
    { column: "maneuverabilityRating", label: "Consistency", hint: "temperature, grind or weight, shot after shot" },
    { column: "controlRating", label: "Build quality", hint: "materials, fit and finish, how it holds up" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main drink", adminLabel: "Main drink", options: [
      { value: "Espresso", display: "mostly drinks espresso" }, { value: "Milk drinks", display: "mostly makes milk drinks" }, { value: "Pour-over", display: "mostly brews pour-over" },
      { value: "Drip / batch brew", display: "mostly makes drip coffee" }, { value: "AeroPress / immersion", display: "mostly brews AeroPress or immersion" }, { value: "A bit of everything", display: "makes a bit of everything" },
    ] },
    playingSide: { label: "Experience", adminLabel: "Experience", options: [
      { value: "New to home coffee", display: "new to home coffee" }, { value: "A year or two", display: "brewing at home for a year or two" }, { value: "Experienced home barista", display: "an experienced home barista" }, { value: "Works as a barista", display: "a working barista" },
    ] },
    playingStyle: { label: "Cups a day", adminLabel: "Cups a day", options: [
      { value: "1", hint: "one a day" }, { value: "2–3", hint: "two or three" }, { value: "4 or more", hint: "four or more" }, { value: "Not sure" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried it", hint: "In a shop or borrowed", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type (dual boiler, flat burr electric, hand grinder, pour-over dripper…),
  // surface = key specs (burrs, boiler, portafilter, capacity), core = main material, weight = weight as the page states it.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Grinder", options: ["Espresso machine", "Grinder", "Brewer", "Kettle", "Scale"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Flat burr electric" },
    { column: "surface", label: "Key specs", max: 160, placeholder: "e.g. 64 mm flat burrs, 58 mm group or 0.9 L" },
    { column: "core", label: "Material", max: 200, placeholder: "e.g. Stainless steel" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 4.6 kg (10.1 lb)" },
  ],
  shapeFilter: ["Espresso machine", "Grinder", "Brewer", "Kettle", "Scale"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Espresso machine", slug: "espresso-machines", label: "Espresso machines", intro: "Home espresso machines: single boiler, heat exchanger, dual boiler, thermoblock and manual lever" },
    { shape: "Grinder", slug: "grinders", label: "Grinders", intro: "Electric and hand coffee grinders for espresso, pour-over and everything in between" },
    { shape: "Brewer", slug: "brewers", label: "Brewers", intro: "Pour-over drippers, AeroPress and immersion brewers, French presses and drip coffee makers" },
    { shape: "Kettle", slug: "kettles", label: "Kettles", intro: "Gooseneck and electric kettles for pour-over and tea" },
    { shape: "Scale", slug: "scales", label: "Scales", intro: "Espresso and brew scales with timers" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "great espresso", tone: "pos" },
    { label: "consistent", tone: "pos" },
    { label: "easy to use", tone: "pos" },
    { label: "fast heat-up", tone: "pos" },
    { label: "great steam", tone: "pos" },
    { label: "low retention", tone: "pos" },
    { label: "quiet", tone: "pos" },
    { label: "well built", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "inconsistent", tone: "neg" },
    { label: "messy", tone: "neg" },
    { label: "loud", tone: "neg" },
    { label: "static", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "learning curve", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-espresso-machines", label: "Espresso machines", title: "Best Home Espresso Machines", minReviews: 5,
      intro: "The home espresso machines home baristas are most consistently happy with.", filters: [{ column: "shape", include: ["Espresso machine"] }] },
    { slug: "best-dual-boiler-espresso-machines", label: "Dual boilers", title: "Best Dual Boiler Espresso Machines", minReviews: 5,
      intro: "The dual boiler espresso machines home baristas are most consistently happy with.", filters: [{ column: "shape", include: ["Espresso machine"] }, { column: "balance", include: ["Dual boiler"] }] },
    { slug: "best-coffee-grinders", label: "Grinders", title: "Best Coffee Grinders", minReviews: 5,
      intro: "The electric and hand coffee grinders home baristas are most consistently happy with.", filters: [{ column: "shape", include: ["Grinder"] }] },
    { slug: "best-hand-coffee-grinders", label: "Hand grinders", title: "Best Hand Coffee Grinders", minReviews: 5,
      intro: "The manual coffee grinders home baristas are most consistently happy with.", filters: [{ column: "shape", include: ["Grinder"] }, { column: "balance", include: ["Hand grinder"] }] },
    { slug: "best-pour-over-coffee-makers", label: "Pour-over", title: "Best Pour-Over Coffee Makers", minReviews: 5,
      intro: "The pour-over drippers and brewers home baristas are most consistently happy with.", filters: [{ column: "shape", include: ["Brewer"] }, { column: "balance", include: ["Pour-over"] }] },
    { slug: "best-drip-coffee-makers", label: "Drip coffee makers", title: "Best Drip Coffee Makers", minReviews: 5,
      intro: "The drip coffee makers home baristas are most consistently happy with.", filters: [{ column: "shape", include: ["Brewer"] }, { column: "balance", include: ["Drip coffee maker"] }] },
    { slug: "best-coffee-kettles", label: "Kettles", title: "Best Pour-Over Coffee Kettles", minReviews: 5,
      intro: "The gooseneck and electric kettles home baristas are most consistently happy with.", filters: [{ column: "shape", include: ["Kettle"] }] },
    { slug: "best-coffee-scales", label: "Scales", title: "Best Coffee Scales", minReviews: 5,
      intro: "The espresso and brew scales home baristas are most consistently happy with.", filters: [{ column: "shape", include: ["Scale"] }] },
    { slug: "best-budget-coffee-gear", label: "Budget", title: "Best Budget Coffee Gear", minReviews: 5,
      intro: "The machines, grinders, brewers, kettles and scales home baristas most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Coffee retailer", "Forum", "Other"],
  examples: { brand: "Breville", model: "Bambino Plus", year: 2026, search: "bambino" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["What do you make with it?", "I mostly make "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how this compares", "What you make with it (espresso, milk drinks, pour-over) and how often", "Workflow, heat-up time, noise and cleaning", "What you pair it with (grinder, machine, kettle, beans)", "Reliability, defects and whether it was worth the price"],
  },
  seo: {
    homeTitle: "CoffeeRecs – Real Home Barista Reviews of Espresso Machines, Grinders and Coffee Gear",
    homeDescription: "Browse real reviews of espresso machines, coffee grinders, pour-over drippers, kettles and scales from home baristas, plus opinions collected from Reddit, YouTube, coffee retailers and forums. Compare Breville, Baratza, Fellow, Hario, Timemore, Comandante, 1Zpresso, Niche, Lelit, Profitec, Rancilio, Gaggia and more.",
    layoutDescription: "Real home barista experiences with espresso machines, grinders, brewers, kettles and scales, plus opinions from Reddit, YouTube, coffee retailers and forums with the source linked.",
    titleTemplate: "%s | CoffeeRecs",
    catalog: { title: "All Coffee Gear – Home Barista Reviews and Ratings", description: "Every espresso machine, grinder, brewer, kettle and scale on CoffeeRecs with community ratings. Filter by brand and category, then read what home baristas say." },
    brands: { title: "Coffee Gear Brands", description: "Browse coffee gear by brand — Breville, Baratza, Fellow, Hario, Timemore, Comandante, 1Zpresso, Niche, Lelit, Profitec, Rancilio, Gaggia and more — and read real home barista reviews of each model." },
    brand: brand => ({ title: `${brand} Coffee Gear – Home Barista Reviews`, description: `Real home barista reviews of ${brand} coffee gear: ratings, strengths and weaknesses for every ${brand} product on CoffeeRecs.` }),
    product: name => ({ title: `${name} Reviews | CoffeeRecs`, description: `Read real home barista experiences with the ${name}. Ratings for coffee quality, ease of use, consistency, build quality and value, plus opinions from around the web.` }),
    productNotFound: "Coffee gear not found | CoffeeRecs",
    productCategory: "Coffee equipment",
    addReview: { title: "Add a Coffee Gear Review", description: "Own an espresso machine, grinder, brewer, kettle or scale? Share how it works for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why CoffeeRecs exists: coffee gear opinions are scattered across Reddit, YouTube, coffee retailers and forums. CoffeeRecs collects them and lets home baristas add their own." },
    ogAlt: "CoffeeRecs – real home barista reviews of coffee gear",
    ogProductAlt: "Coffee gear reviews on CoffeeRecs",
    ogEyebrow: "Home barista reviews of coffee gear",
    ogTitle: "Coffee gear reviews from people who brew with it",
    ogDetail: "From home baristas, Reddit, YouTube, coffee retailers and forums",
    ogFallbackTitle: "Coffee gear reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other home baristas how a machine, grinder or brewer actually works for you. Takes about two minutes, no account needed.",
      howItWent: "how it works day to day",
      aboutYou: "About your coffee",
      aboutYouHint: "optional · helps people find home baristas like them",
      howItPerforms: "How it performs",
      whoUsesIt: "Who's brewing with it",
      triedIt: "Brewed with it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that gear or page. Maybe it moved, maybe it was discontinued, maybe it went the way of last week’s beans.",
    about: {
      heading: "Why CoffeeRecs exists",
      paragraphs: [
        "Coffee gear opinions are scattered across Reddit, YouTube, coffee retailers and forums. CoffeeRecs puts those experiences in one place and lets home baristas add their own.",
        "Gear that suits one person won’t suit everyone. Knowing what someone drinks, what grinder or machine they pair it with and what they used before often tells you more than a spec sheet or a score on its own.",
      ],
      sections: [
        { heading: "Home baristas, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from home barista submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "CoffeeRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ and retailers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about gear you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
