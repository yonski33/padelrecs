import type { Niche } from "./types";

// Rating icons: a coin, navy with a gold rim. Same tile sizes as the other niches (17×14 strip, 20×20 picker);
// the strip tile widens the 20×20 drawing's viewBox so it keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
// Coin face in the coin colour, its rim and centre bar in the accent colour.
const coin = (face: string, rim: string, q: string) =>
  `<circle cx=${q}10${q} cy=${q}10${q} r=${q}8.2${q} fill=${q}${face}${q}/><circle cx=${q}10${q} cy=${q}10${q} r=${q}5.6${q} fill=${q}none${q} stroke=${q}${rim}${q} stroke-width=${q}1.6${q}/><path d=${q}M10 7.4V12.6${q} stroke=${q}${rim}${q} stroke-width=${q}1.8${q} stroke-linecap=${q}round${q}/>`;
const coinIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? coin("#14335c", "#e0b84c", "'") : coin("#e3e9f1", "#e3e9f1", "'")}</svg>`);
};
const ogCoin = (face: string, rim: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${coin(face, rim, '"')}</svg>`;

export const money: Niche = {
  id: "money",
  schema: "moneyrecs",
  site: {
    name: "MoneyRecs",
    domain: "moneyrecs.com",
    wordmark: "moneyrecs",
    descriptor: "real experiences with credit cards, banks, brokerages, budgeting apps, tax software and money transfers",
    footer: "kept by people who read the fine print.",
    analyticsId: "G-WZWZ18PDKG",
    adminLoginHint: "Use the email and password for your Recs admin account.",
    // YMYL: every page says this in the footer. Product pages also carry the provider's page and the date in their description.
    notice: "MoneyRecs shares people’s own experiences with financial products. It is not financial advice, and nothing here is a recommendation for your situation. Rates, fees and terms change; check the provider’s site before you apply or open an account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "customer", many: "customers", One: "Customer", Many: "Customers" },
  // Card terms, rates and apps change fast; older experiences stay on product pages.
  recentMonths: 24,
  // Financial products are named by the provider's product name, not by year.
  productYears: false,
  productPath: "products",
  // No Amazon (or any affiliate) links on MoneyRecs: product pages link to the provider's own site ("Visit site", lib/product-links.ts).
  website: {},
  scoreUnit: { one: "coin", many: "coins" },
  // White page, navy ink, one gold accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f5f8fb",
    "--ink": "#0f1c2e",
    "--ink-2": "#2c3d55",
    "--ink-3": "#5f6f85",
    "--line": "#e3e9f1",
    "--line-2": "#cfd8e4",
    "--green": "#14335c",
    "--green-ink": "#0e2747",
    "--green-wash": "#eaf0f7",
    "--green-line": "#c3d2e6",
    "--on-green": "#f5f8fb",
    "--on-green-muted": "#a9bcd6",
    "--lime": "#e0b84c",
    "--lime-wash": "#fdf7e7",
    "--lime-line": "#f1dea6",
    "--lime-ink": "#7a5a00",
    "--lime-ink-2": "#5f4600",
    "--score-on": coinIcon("tile", true),
    "--score-off": coinIcon("tile", false),
    "--score-pick-on": coinIcon("pick", true),
    "--score-pick-off": coinIcon("pick", false),
  },
  chartColors: ["var(--green)", "#e0b84c", "#cfd8e4", "#3b6ea8", "#f1dea6", "#94a3b8"],
  og: {
    background: "#14335c",
    accent: "#e0b84c",
    muted: "#a9bcd6",
    text: "#f5f8fb",
    scoreOn: ogCoin("#f5f8fb", "#e0b84c"),
    scoreOff: ogCoin("#2f4d78", "#2f4d78"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — disappointed", "1": "1 — regret it" },
  // Fixed rating columns, relabelled for financial products: power = value (rewards, rate, what you get), forgiveness = fees,
  // comfort = app and website, control = customer service, maneuverability = reliability (transfers arriving, no freezes or outages).
  categories: [
    { column: "powerRating", label: "Value", hint: "rewards, rate or features for what it costs you" },
    { column: "forgivenessRating", label: "Fees", hint: "how clear and fair the fees and exchange rates are" },
    { column: "comfortRating", label: "App & website", hint: "how easy it is to use day to day" },
    { column: "controlRating", label: "Customer service", hint: "how support handled your questions or problems" },
    { column: "maneuverabilityRating", label: "Reliability", hint: "transfers arriving on time, no surprise holds, freezes or outages" },
  ],
  profile: {
    playerLevel: { label: "Experience with money products", adminLabel: "Experience", options: [
      { value: "Just starting out", display: "is just starting out" }, { value: "Some experience", display: "has some experience" }, { value: "Very experienced", display: "is very experienced" },
    ] },
    playingSide: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Everyday spending", display: "uses it for everyday spending" }, { value: "Travel", display: "uses it for travel" },
      { value: "Saving", display: "uses it for saving" }, { value: "Investing", display: "uses it for investing" },
      { value: "Taxes and budgeting", display: "uses it for taxes and budgeting" }, { value: "Sending money abroad", display: "uses it to send money abroad" },
      { value: "Business", display: "uses it for a business" },
    ] },
    playingStyle: { label: "Account type", adminLabel: "Account type", options: [
      { value: "Personal" }, { value: "Joint or household" }, { value: "Small business" }, { value: "Self-employed" },
    ] },
    timeWithRacket: { label: "Time as a customer", adminLabel: "Time as a customer", options: [
      { value: "Tried it", hint: "Opened it, then left", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type, weight = fees (annual fee, monthly fee, commissions, pricing or fee model),
  // surface = rates and rewards (APY with its "as of" date, rewards rate, intro APR as stated), core = minimum deposit or account minimum.
  // Only what the provider's own page states on the checked date; never estimated.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Savings", options: ["Travel rewards card", "Cash-back card", "Starter card", "Business card", "Savings", "Checking", "Brokerage", "Robo-advisor", "Budgeting app", "Tax software", "Money transfer"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Secured credit card or Online high-yield savings account" },
    { column: "weight", label: "Fees", max: 200, placeholder: "e.g. $95 annual fee, as stated by the provider" },
    { column: "surface", label: "Rates & rewards", max: 200, placeholder: "e.g. 3.50% APY as of 2026-10-29, as stated by the provider" },
    { column: "core", label: "Minimum", max: 120, placeholder: "e.g. No minimum deposit" },
  ],
  shapeFilter: ["Travel rewards card", "Cash-back card", "Starter card", "Business card", "Savings", "Checking", "Brokerage", "Robo-advisor", "Budgeting app", "Tax software", "Money transfer"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Travel rewards card", slug: "travel-cards", label: "Travel cards", seoLabel: "Travel Credit Cards", intro: "Travel rewards, airline and hotel credit cards" },
    { shape: "Cash-back card", slug: "cash-back-cards", label: "Cash-back cards", seoLabel: "Cash-Back Credit Cards", intro: "Flat-rate, category and rotating cash-back credit cards" },
    { shape: "Starter card", slug: "starter-cards", label: "Starter cards", seoLabel: "Starter Credit Cards", intro: "Secured, student and credit-builder cards" },
    { shape: "Business card", slug: "business-cards", label: "Business cards", seoLabel: "Business Credit Cards", intro: "Small-business credit and charge cards" },
    { shape: "Savings", slug: "savings", label: "Savings", seoLabel: "High-Yield Savings Accounts", intro: "High-yield savings and cash accounts" },
    { shape: "Checking", slug: "checking", label: "Checking", seoLabel: "Checking Accounts", intro: "Checking accounts, online banks and cash management accounts" },
    { shape: "Brokerage", slug: "brokerages", label: "Brokerages", seoLabel: "Online Brokerages", intro: "Brokerage accounts and investing apps" },
    { shape: "Robo-advisor", slug: "robo-advisors", label: "Robo-advisors", seoLabel: "Robo-Advisors", intro: "Automated investing services" },
    { shape: "Budgeting app", slug: "budgeting-apps", label: "Budgeting", seoLabel: "Budgeting Apps", intro: "Budgeting and money-tracking apps" },
    { shape: "Tax software", slug: "tax-software", label: "Tax software", seoLabel: "Tax Software", intro: "Online tax filing software" },
    { shape: "Money transfer", slug: "money-transfer", label: "Money transfer", seoLabel: "Money Transfer Services", intro: "International transfers and multi-currency accounts: fees, exchange rates, speed, freezes and support" },
  ],
  // The type, never a rate, on catalogue rows: rates and fees only appear on product pages next to the checked date.
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "great rewards", tone: "pos" },
    { label: "good rate", tone: "pos" },
    { label: "low fees", tone: "pos" },
    { label: "good exchange rate", tone: "pos" },
    { label: "fast transfers", tone: "pos" },
    { label: "easy to use", tone: "pos" },
    { label: "helpful support", tone: "pos" },
    { label: "great travel perks", tone: "pos" },
    { label: "reliable", tone: "pos" },
    { label: "easy to cancel", tone: "pos" },
    { label: "hidden fees", tone: "neg" },
    { label: "account frozen", tone: "neg" },
    { label: "poor support", tone: "neg" },
    { label: "buggy app", tone: "neg" },
    { label: "slow transfers", tone: "neg" },
    { label: "rate dropped", tone: "neg" },
    { label: "hard to redeem", tone: "neg" },
    { label: "hard to cancel", tone: "neg" },
    { label: "annual fee", tone: "neutral" },
    { label: "online only", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-travel-credit-cards", label: "Travel cards", title: "Best-Reviewed Travel Credit Cards", minReviews: 5,
      intro: "The travel rewards cards cardholders are most consistently happy with.", filters: [{ column: "shape", include: ["Travel rewards card"] }] },
    { slug: "best-cash-back-credit-cards", label: "Cash-back cards", title: "Best-Reviewed Cash-Back Credit Cards", minReviews: 5,
      intro: "The cash-back cards cardholders are most consistently happy with.", filters: [{ column: "shape", include: ["Cash-back card"] }] },
    { slug: "best-starter-credit-cards", label: "Starter cards", title: "Best-Reviewed Starter and Credit-Builder Cards", minReviews: 5,
      intro: "The secured, student and credit-builder cards cardholders are most consistently happy with.", filters: [{ column: "shape", include: ["Starter card"] }] },
    { slug: "best-business-credit-cards", label: "Business cards", title: "Best-Reviewed Business Credit Cards", minReviews: 5,
      intro: "The business cards owners are most consistently happy with.", filters: [{ column: "shape", include: ["Business card"] }] },
    { slug: "best-high-yield-savings-accounts", label: "Savings", title: "Best-Reviewed High-Yield Savings Accounts", minReviews: 5,
      intro: "The savings and cash accounts customers are most consistently happy with.", filters: [{ column: "shape", include: ["Savings"] }] },
    { slug: "best-checking-accounts", label: "Checking", title: "Best-Reviewed Checking Accounts and Online Banks", minReviews: 5,
      intro: "The checking accounts and online banks customers are most consistently happy with.", filters: [{ column: "shape", include: ["Checking"] }] },
    { slug: "best-brokerage-accounts", label: "Brokerages", title: "Best-Reviewed Brokerages and Investing Apps", minReviews: 5,
      intro: "The brokerages and investing apps customers are most consistently happy with.", filters: [{ column: "shape", include: ["Brokerage"] }] },
    { slug: "best-robo-advisors", label: "Robo-advisors", title: "Best-Reviewed Robo-Advisors", minReviews: 5,
      intro: "The automated investing services customers are most consistently happy with.", filters: [{ column: "shape", include: ["Robo-advisor"] }] },
    { slug: "best-budgeting-apps", label: "Budgeting apps", title: "Best-Reviewed Budgeting Apps", minReviews: 5,
      intro: "The budgeting apps users are most consistently happy with.", filters: [{ column: "shape", include: ["Budgeting app"] }] },
    { slug: "best-tax-software", label: "Tax software", title: "Best-Reviewed Tax Software", minReviews: 5,
      intro: "The tax software filers are most consistently happy with.", filters: [{ column: "shape", include: ["Tax software"] }] },
    { slug: "best-money-transfer-services", label: "Money transfer", title: "Best-Reviewed Money Transfer Services", minReviews: 5,
      intro: "The international transfer services and multi-currency accounts customers are most consistently happy with.", filters: [{ column: "shape", include: ["Money transfer"] }] },
    { slug: "best-money-apps-for-support", label: "Helpful support", title: "Financial Products Customers Say Have Helpful Support", minReviews: 5,
      intro: "The cards, banks, brokerages and apps customers most often say have helpful support.", trait: { tags: ["helpful support"], minShare: 0.25, against: ["poor support"], noun: "helpful support" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Forum", "Other"],
  examples: { brand: "Chase", model: "Sapphire Preferred", year: 2026, search: "sapphire" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["What do you use it for?", "I mostly use it for "], ["Any issues?", "One thing that went wrong was "]],
    tips: ["What you used before, and how this compares", "What you use it for and how long you’ve had it", "Fees, rates or rewards as you actually experienced them", "The app, support, transfers and any holds or freezes", "Please don’t include account numbers, balances or referral links"],
  },
  seo: {
    homeTitle: "MoneyRecs – Real Experiences With Credit Cards, Banks, Brokerages and Money Apps",
    homeDescription: "Read first-hand experiences with US credit cards, high-yield savings, checking accounts, brokerages, robo-advisors, budgeting apps, tax software and money transfer services, collected from Reddit, YouTube and forums. Not financial advice.",
    layoutDescription: "First-hand experiences with credit cards, banks, brokerages, budgeting apps, tax software and money transfers, with the source linked. Not financial advice.",
    titleTemplate: "%s | MoneyRecs",
    catalog: { title: "All Financial Products – Customer Experiences", description: "Every credit card, savings and checking account, brokerage, robo-advisor, budgeting app, tax software and transfer service on MoneyRecs with customer ratings. Not financial advice." },
    brands: { title: "Banks, Card Issuers and Money Apps", description: "Browse financial products by provider — Chase, American Express, Capital One, Citi, Ally, Marcus, Fidelity, Schwab, Vanguard, YNAB, TurboTax, Wise and more — and read customers’ own experiences." },
    brand: brand => ({ title: `${brand} – Customer Experiences`, description: `Customers’ own experiences with ${brand} products: ratings for value, fees, app, support and reliability. Not financial advice.` }),
    product: name => ({ title: `${name} Reviews | MoneyRecs`, description: `Read customers’ first-hand experiences with ${name}: value, fees, app, customer service and reliability, plus opinions from around the web. Not financial advice.` }),
    productNotFound: "Product not found | MoneyRecs",
    productCategory: "Financial products",
    addReview: { title: "Share Your Experience With a Financial Product", description: "Used a credit card, bank, brokerage, budgeting app, tax software or transfer service? Share your own experience in about two minutes. No account needed." },
    about: { title: "About", description: "Why MoneyRecs exists: experiences with cards, banks and money apps are scattered across Reddit, YouTube and forums. MoneyRecs collects first-hand ones. Not financial advice." },
    ogAlt: "MoneyRecs – real experiences with financial products",
    ogProductAlt: "Customer experiences on MoneyRecs",
    ogEyebrow: "Real experiences with financial products",
    ogTitle: "Cards, banks and money apps, from the people who use them",
    ogDetail: "From customers, Reddit, YouTube and forums",
    ogFallbackTitle: "Financial product experiences",
  },
  copy: {
    ui: {
      formIntro: "Tell others how a card, bank, brokerage, app or transfer service has actually worked for you. Takes about two minutes, no account needed. Share your own experience, not advice for others.",
      howItWent: "how it has worked for you",
      aboutYou: "About you",
      aboutYouHint: "optional · helps people find experiences like theirs",
      howItPerforms: "How it rates",
      whoUsesIt: "Who's using it",
      triedIt: "Used it?",
      triedOne: "Used one?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "We couldn’t find that product or page. It may have been renamed or discontinued.",
    about: {
      heading: "Why MoneyRecs exists",
      paragraphs: [
        "Experiences with credit cards, banks, brokerages and money apps are scattered across Reddit, YouTube and forums, and buried under referral links. MoneyRecs puts first-hand experiences in one place and lets customers add their own.",
        "MoneyRecs is not financial advice. Reviews are people’s own experiences, not recommendations for your situation. Rates, fees and terms change often; the provider’s own site is always the reference.",
      ],
      sections: [
        { heading: "Experiences, not promotions", body: "No sponsored rankings, no paid placements and no referral links. We leave out posts from referral-link posters, company representatives, affiliates and employees. Product pages link to the provider’s own site." },
        { heading: "Product facts", body: "Fees, rates and minimums come only from the provider’s own page, with the date they were read. Blank means the page didn’t state it when we checked. Always confirm current terms with the provider." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about products you have actually used, and please leave out account numbers, balances and other personal financial details." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
