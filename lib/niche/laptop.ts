import type { Niche } from "./types";

// Rating icons: an open laptop (screen above a thin base), graphite with an electric-blue screen. Same tile sizes as the
// other niches (17×14 strip, 20×20 picker); the strip icon widens the 20×20 drawing's viewBox so the laptop keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const laptopShape = (body: string, screen: string, q: string) =>
  `<rect x=${q}3.5${q} y=${q}3.5${q} width=${q}13${q} height=${q}9${q} rx=${q}1.2${q} fill=${q}${body}${q}/><rect x=${q}5${q} y=${q}5${q} width=${q}10${q} height=${q}6${q} rx=${q}.4${q} fill=${q}${screen}${q}/><path d=${q}M1 14.2h18l-1.2 1.8H2.2z${q} fill=${q}${body}${q}/>`;
const laptopIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? laptopShape("#1e293b", "#3b82f6", "'") : laptopShape("#e2e8f0", "#f1f5f9", "'")}</svg>`);
};
const ogLaptop = (body: string, screen: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${laptopShape(body, screen, '"')}</svg>`;

export const LAPTOP_CATEGORIES = ["Ultrabook", "Gaming", "Business", "Creator", "2-in-1", "Chromebook", "MacBook"];

export const laptop: Niche = {
  id: "laptop",
  schema: "laptoprecs",
  site: {
    name: "LaptopRecs",
    domain: "laptoprecs.com",
    wordmark: "laptoprecs",
    descriptor: "owner reviews of ultrabooks, gaming laptops, business laptops, creator laptops, 2-in-1s, Chromebooks and MacBooks",
    footer: "kept by people who have opinions about hinges.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "laptop", many: "laptops", One: "Laptop", Many: "Laptops" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // Most lines get a new generation every year, so a year-old review is already about last year's model at best.
  recentMonths: 12,
  // Makers name each generation (X1 Carbon Gen 13, MacBook Air 13 (M4), Zephyrus G14 (2025), XPS 13 9350), so names
  // carry it and there is no separate model year.
  productYears: false,
  productPath: "laptops",
  amazon: { searchIndex: "Computers", photos: true },
  scoreUnit: { one: "laptop", many: "laptops" },
  // White page, graphite ink and primary, one electric-blue accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f5f7fa",
    "--ink": "#111827",
    "--ink-2": "#374151",
    "--ink-3": "#6b7280",
    "--line": "#e5e7eb",
    "--line-2": "#d1d5db",
    "--green": "#1e293b",
    "--green-ink": "#0f172a",
    "--green-wash": "#f0f3f8",
    "--green-line": "#cbd3df",
    "--on-green": "#f8fafc",
    "--on-green-muted": "#aab4c4",
    "--lime": "#3b82f6",
    "--lime-wash": "#eff6ff",
    "--lime-line": "#bfdbfe",
    "--lime-ink": "#1d4ed8",
    "--lime-ink-2": "#1e40af",
    "--score-on": laptopIcon("tile", true),
    "--score-off": laptopIcon("tile", false),
    "--score-pick-on": laptopIcon("pick", true),
    "--score-pick-off": laptopIcon("pick", false),
  },
  chartColors: ["var(--green)", "#3b82f6", "#d1d5db", "#aab4c4", "#bfdbfe", "#94a3b8"],
  og: {
    background: "#1e293b",
    accent: "#3b82f6",
    muted: "#aab4c4",
    text: "#f8fafc",
    scoreOn: ogLaptop("#f8fafc", "#3b82f6"),
    scoreOff: ogLaptop("#334155", "#1e293b"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for laptops: power = performance, control = display, maneuverability = battery,
  // comfort = build & keyboard, forgiveness = value. Approved by the owner 2026-11-12.
  categories: [
    { column: "powerRating", label: "Performance", hint: "speed, thermals, fan noise" },
    { column: "controlRating", label: "Display", hint: "sharpness, brightness, colour, refresh rate" },
    { column: "maneuverabilityRating", label: "Battery life", hint: "hours away from the charger" },
    { column: "comfortRating", label: "Build & keyboard", hint: "keyboard, trackpad, hinge, speakers, materials" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Gaming", display: "uses it mostly for gaming" }, { value: "School", display: "uses it for school" }, { value: "Office work", display: "uses it for office work" },
      { value: "Programming", display: "uses it for programming" }, { value: "Photo / video editing", display: "uses it for photo and video editing" }, { value: "A bit of everything", display: "uses it for a bit of everything" },
    ] },
    playingSide: { label: "Operating system", adminLabel: "Operating system", options: [
      { value: "Windows", display: "on Windows" }, { value: "macOS", display: "on macOS" }, { value: "Linux", display: "on Linux" }, { value: "ChromeOS", display: "on ChromeOS" },
    ] },
    playingStyle: { label: "Where it lives", adminLabel: "Where it lives", options: [
      { value: "Mostly on a desk", hint: "plugged in most of the time" }, { value: "Carried daily", hint: "class, office, café" }, { value: "Travels a lot", hint: "flights and hotels" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "In a shop or returned it", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = processor, core = graphics, surface = display, weight = weight.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Gaming", options: LAPTOP_CATEGORIES },
    { column: "balance", label: "Processor", max: 200, placeholder: "e.g. AMD Ryzen AI 9 HX 370" },
    { column: "core", label: "Graphics", max: 200, placeholder: "e.g. NVIDIA GeForce RTX 5070 Ti" },
    { column: "surface", label: "Display", max: 200, placeholder: "e.g. 14\" 2880×1800 OLED, 120 Hz" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 3.31 lb" },
  ],
  shapeFilter: LAPTOP_CATEGORIES,
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths. Approved by the owner 2026-11-12.
  categoryPaths: true,
  typePages: [
    { shape: "Ultrabook", slug: "ultrabooks", label: "Everyday & ultrabooks", seoLabel: "Ultrabooks and Everyday Laptops", intro: "Thin and light everyday laptops: Dell XPS, HP OmniBook, Zenbook, Yoga Slim, Surface Laptop, Framework and more", one: "Ultrabook" },
    { shape: "Gaming", slug: "gaming-laptops", label: "Gaming", seoLabel: "Gaming Laptops", intro: "Gaming laptops from budget RTX 4050 machines to 18\" desktop replacements", one: "Gaming laptop" },
    { shape: "Business", slug: "business-laptops", label: "Business", seoLabel: "Business Laptops", intro: "ThinkPad, Dell Pro and Latitude, EliteBook and ProBook laptops for work", one: "Business laptop" },
    { shape: "Creator", slug: "creator-laptops", label: "Creator & workstation", seoLabel: "Creator Laptops and Mobile Workstations", intro: "Laptops for photo, video, 3D and engineering work: ProArt, ZBook, Dell Pro Max, ThinkPad P and more", one: "Creator laptop" },
    { shape: "2-in-1", slug: "2-in-1-laptops", label: "2-in-1", seoLabel: "2-in-1 Laptops", intro: "Convertible and detachable laptops with touch and pen, from Surface Pro to Yoga and Spectre x360", one: "2-in-1" },
    { shape: "Chromebook", slug: "chromebooks", label: "Chromebooks", seoLabel: "Chromebooks", intro: "Chromebook Plus and premium Chromebooks for school, work and travel", one: "Chromebook" },
    { shape: "MacBook", slug: "macbooks", label: "MacBooks", seoLabel: "MacBooks", intro: "MacBook Air and MacBook Pro, one page per size and chip", one: "MacBook" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews. Approved by the owner 2026-11-12.
  tags: [
    { label: "fast", tone: "pos" },
    { label: "cool and quiet", tone: "pos" },
    { label: "great battery life", tone: "pos" },
    { label: "great display", tone: "pos" },
    { label: "great keyboard", tone: "pos" },
    { label: "great trackpad", tone: "pos" },
    { label: "great speakers", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "light and portable", tone: "pos" },
    { label: "Linux friendly", tone: "pos" },
    { label: "repairable", tone: "pos" },
    { label: "upgradeable", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "good support", tone: "pos" },
    { label: "runs hot", tone: "neg" },
    { label: "loud fans", tone: "neg" },
    { label: "short battery life", tone: "neg" },
    { label: "throttling", tone: "neg" },
    { label: "coil whine", tone: "neg" },
    { label: "screen issues", tone: "neg" },
    { label: "PWM flicker", tone: "neg" },
    { label: "hinge issues", tone: "neg" },
    { label: "keyboard issues", tone: "neg" },
    { label: "trackpad issues", tone: "neg" },
    { label: "build quality issues", tone: "neg" },
    { label: "driver or software issues", tone: "neg" },
    { label: "bloatware", tone: "neg" },
    { label: "poor support", tone: "neg" },
    { label: "battery swelling", tone: "neg" },
    { label: "died early", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "heavy", tone: "neg" },
    { label: "weak webcam", tone: "neg" },
    { label: "OLED", tone: "neutral" },
    { label: "glossy", tone: "neutral" },
    { label: "matte", tone: "neutral" },
    { label: "soldered RAM", tone: "neutral" },
    { label: "bought used or refurbished", tone: "neutral" },
    { label: "returned it", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough laptops in it have reviews.
  topLists: [
    { slug: "best-ultrabooks", label: "Ultrabooks", title: "Best Ultrabooks", minReviews: 5,
      intro: "The thin and light everyday laptops owners are most consistently happy with.", filters: [{ column: "shape", include: ["Ultrabook"] }] },
    { slug: "best-gaming-laptops", label: "Gaming", title: "Best Gaming Laptops", minReviews: 5,
      intro: "The gaming laptops owners are most consistently happy with.", filters: [{ column: "shape", include: ["Gaming"] }] },
    { slug: "best-business-laptops", label: "Business", title: "Best Business Laptops", minReviews: 5,
      intro: "The ThinkPads, Dell Pro, Latitude and EliteBook laptops owners are most consistently happy with.", filters: [{ column: "shape", include: ["Business"] }] },
    { slug: "best-creator-laptops", label: "Creator", title: "Best Creator Laptops", minReviews: 5,
      intro: "The creator laptops and mobile workstations owners are most consistently happy with.", filters: [{ column: "shape", include: ["Creator"] }] },
    { slug: "best-2-in-1-laptops", label: "2-in-1", title: "Best 2-in-1 Laptops", minReviews: 5,
      intro: "The convertible and detachable laptops owners are most consistently happy with.", filters: [{ column: "shape", include: ["2-in-1"] }] },
    { slug: "best-chromebooks", label: "Chromebooks", title: "Best Chromebooks", minReviews: 5,
      intro: "The Chromebooks owners are most consistently happy with.", filters: [{ column: "shape", include: ["Chromebook"] }] },
    { slug: "best-macbooks", label: "MacBooks", title: "Best MacBooks", minReviews: 5,
      intro: "The MacBook Air and MacBook Pro models owners are most consistently happy with.", filters: [{ column: "shape", include: ["MacBook"] }] },
    { slug: "best-battery-life-laptops", label: "Battery life", title: "Best Laptops for Battery Life", minReviews: 5,
      intro: "The laptops owners most often praise for battery life.", trait: { tags: ["great battery life"], minShare: 0.25, against: ["short battery life"], noun: "the battery life" } },
    { slug: "best-budget-laptops", label: "Budget", title: "Best Budget Laptops", minReviews: 5,
      intro: "The laptops owners most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Blog"],
  examples: { brand: "Lenovo", model: "ThinkPad X1 Carbon Gen 13", year: 2026, search: "thinkpad" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["What do you use it for?", "I mostly use it for "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how this compares", "What you use it for, and which configuration you have (CPU, GPU, screen)", "Performance, heat and fan noise, battery life", "Keyboard, trackpad, screen, build and any defects", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "LaptopRecs – Real Owner Reviews of Gaming, Business and Everyday Laptops",
    homeDescription: "Browse real owner reviews of ultrabooks, gaming laptops, business laptops, creator laptops, 2-in-1s, Chromebooks and MacBooks, plus experiences collected from Reddit, YouTube and forums. Compare Apple, Lenovo ThinkPad and Legion, Dell, HP, ASUS ROG, Razer, MSI, Framework and more.",
    layoutDescription: "Real owner experiences with laptops of every kind, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | LaptopRecs",
    catalog: { title: "All Laptops – Owner Reviews and Ratings", description: "Every ultrabook, gaming, business, creator, 2-in-1, Chromebook and MacBook on LaptopRecs with owner ratings. Filter by brand and category, then read what owners say." },
    brands: { title: "Laptop Brands", description: "Browse laptops by brand — Apple, Lenovo, Dell, HP, ASUS, Acer, MSI, Razer, Microsoft, Framework and more — and read real owner reviews of each model." },
    brand: brand => ({ title: `${brand} Laptops – Owner Reviews`, description: `Real owner reviews of ${brand} laptops: ratings, strengths and weaknesses for every ${brand} laptop on LaptopRecs.` }),
    product: name => ({ title: `${name} Reviews | LaptopRecs`, description: `Read real owner experiences with the ${name}. Ratings for performance, display, battery life, build and value, plus opinions from around the web.` }),
    productNotFound: "Laptop not found | LaptopRecs",
    productCategory: "Laptops",
    addReview: { title: "Add a Laptop Review", description: "Own a laptop? Share how it actually works for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why LaptopRecs exists: laptop opinions are scattered across Reddit, YouTube and forums. LaptopRecs collects owners' first-hand experiences and lets owners add their own." },
    ogAlt: "LaptopRecs – real owner reviews of laptops",
    ogProductAlt: "Laptop reviews on LaptopRecs",
    ogEyebrow: "Owner reviews of laptops",
    ogTitle: "Laptop reviews from people who use them every day",
    ogDetail: "From owners, Reddit, YouTube and forums",
    ogFallbackTitle: "Laptop reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other people how a laptop actually works for you. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About how you use it",
      aboutYouHint: "optional · helps people find owners like them",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's using it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that laptop or page. Maybe it moved, maybe it was discontinued, maybe it went to sleep and never woke up.",
    about: {
      heading: "Why LaptopRecs exists",
      paragraphs: [
        "Laptop opinions are scattered across Reddit, YouTube and forums, and launch-day reviews rarely say how a laptop holds up after a year. LaptopRecs puts owners’ experiences in one place and lets owners add their own.",
        "A laptop that suits one person won’t suit everyone. Knowing what someone uses it for, which configuration they bought and what they had before often tells you more than a benchmark or a score on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Rankings are counted from reviews: the ones owners write here and the ones quoted from around the web. Each is read as positive, mixed or negative. Laptop pages link to Amazon, and LaptopRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "One page per generation", body: "Laptops are refreshed every year under almost the same name. Each generation has its own page (ThinkPad X1 Carbon Gen 12 and Gen 13, MacBook Air M3 and M4), and RAM, storage and screen options of one model share a page." },
        { heading: "A work in progress", body: "LaptopRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about laptops you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
