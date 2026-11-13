import type { Niche } from "./types";

// Rating icons: a lightning bolt, safety yellow with a charcoal edge. Same tile sizes as the other niches (17×14 strip,
// 20×20 picker); the strip icon widens the 20×20 drawing's viewBox so the bolt keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const boltShape = (fill: string, edge: string, q: string) =>
  `<path d=${q}M11.8 1.5 4 11.2h5.3l-1.1 7.3L16 8.6h-5.3l1.1-7.1z${q} fill=${q}${fill}${q} stroke=${q}${edge}${q} stroke-width=${q}1${q} stroke-linejoin=${q}round${q}/>`;
const boltIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? boltShape("#f5b400", "#16181b", "'") : boltShape("#e6e4df", "#d3d0c9", "'")}</svg>`);
};
const ogBolt = (fill: string, edge: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${boltShape(fill, edge, '"')}</svg>`;

export const TOOL_CATEGORIES = ["Drills & drivers", "Saws", "Oscillating & multi-tools", "Sanders", "Grinders", "Nailers", "Outdoor power", "Battery platforms"];

export const tool: Niche = {
  id: "tool",
  schema: "toolrecs",
  site: {
    name: "ToolRecs",
    domain: "toolrecs.com",
    wordmark: "toolrecs",
    descriptor: "owner reviews of power tools and battery platforms",
    footer: "kept by people who measure twice.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "tool", many: "tools", One: "Tool", Many: "Tools" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // Tools stay on sale for years under one model number, so a two-year-old review still describes the same tool.
  recentMonths: 24,
  // Names carry the maker's model number (DCD800 vs DCD805, 2904 vs 2804), which already pins the generation.
  productYears: false,
  productPath: "tools",
  amazon: { searchIndex: "ToolsAndHomeImprovement", photos: true },
  scoreUnit: { one: "tool", many: "tools" },
  // White page, charcoal ink and primary, one safety-yellow accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f7f7f5",
    "--ink": "#16181b",
    "--ink-2": "#3a3d42",
    "--ink-3": "#6b6e73",
    "--line": "#e6e5e1",
    "--line-2": "#d3d1cb",
    "--green": "#16181b",
    "--green-ink": "#0e1012",
    "--green-wash": "#f2f2ef",
    "--green-line": "#cfcdc7",
    "--on-green": "#f8f8f6",
    "--on-green-muted": "#a9abaf",
    "--lime": "#f5b400",
    "--lime-wash": "#fff7dc",
    "--lime-line": "#f7d977",
    "--lime-ink": "#8a6500",
    "--lime-ink-2": "#6b4e00",
    "--score-on": boltIcon("tile", true),
    "--score-off": boltIcon("tile", false),
    "--score-pick-on": boltIcon("pick", true),
    "--score-pick-off": boltIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f5b400", "#d3d1cb", "#a9abaf", "#f7d977", "#6b6e73"],
  og: {
    background: "#16181b",
    accent: "#f5b400",
    muted: "#a9abaf",
    text: "#f8f8f6",
    scoreOn: ogBolt("#f5b400", "#f5b400"),
    scoreOff: ogBolt("#3a3d42", "#3a3d42"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for power tools: power = power & performance, maneuverability = battery & runtime,
  // control = build & durability, comfort = ergonomics, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Power & performance", hint: "torque, speed, cut quality" },
    { column: "maneuverabilityRating", label: "Battery & runtime", hint: "runtime, charging, battery life" },
    { column: "controlRating", label: "Build & durability", hint: "how it holds up on the job" },
    { column: "comfortRating", label: "Ergonomics", hint: "weight, balance, vibration, noise" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Pro / trade", display: "uses it for work" }, { value: "Serious DIY", display: "does serious DIY" },
      { value: "Occasional home use", display: "uses it around the house" }, { value: "Woodworking", display: "mostly does woodworking" }, { value: "Yard work", display: "mostly does yard work" },
    ] },
    playingSide: { label: "Work", adminLabel: "Work", options: [
      { value: "Construction & framing", display: "works in construction" }, { value: "Electrical, plumbing & HVAC", display: "works in the trades" },
      { value: "Automotive", display: "works on cars" }, { value: "Furniture & cabinetry", display: "builds furniture and cabinets" }, { value: "Home & yard", display: "works on the home and yard" },
    ] },
    playingStyle: { label: "Platform", adminLabel: "Platform experience", options: [
      { value: "First tool on it", hint: "new to the platform" }, { value: "Switched platforms", hint: "came from another brand" }, { value: "Several platforms", hint: "runs more than one" },
    ] },
    timeWithRacket: { label: "Time owning it", adminLabel: "Time owning it", options: [
      { value: "Tried briefly", hint: "A few uses or returned it", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = battery platform, surface = tool type, core = key spec, weight = weight.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Drills & drivers", options: TOOL_CATEGORIES },
    { column: "balance", label: "Platform", max: 120, placeholder: "e.g. Milwaukee M18 FUEL" },
    { column: "surface", label: "Tool type", max: 200, placeholder: "e.g. Hammer drill" },
    { column: "core", label: "Key spec", max: 200, placeholder: "e.g. 1,400 in-lbs" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 3.2 lbs (bare tool)" },
  ],
  shapeFilter: TOOL_CATEGORIES,
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Drills & drivers", slug: "drills-and-drivers", label: "Drills & drivers", seoLabel: "Drills and Impact Drivers", intro: "Cordless drill/drivers, hammer drills, impact drivers and compact impact wrenches from DeWalt, Milwaukee, Makita, Ryobi, Bosch and more, one page per model number", one: "drill or driver" },
    { shape: "Saws", slug: "saws", label: "Saws", seoLabel: "Circular, Miter and Table Saws", intro: "Circular, track, miter and jobsite table saws, cordless and corded", one: "saw" },
    { shape: "Oscillating & multi-tools", slug: "oscillating-tools", label: "Multi-tools", seoLabel: "Oscillating Multi-Tools", intro: "Oscillating multi-tools for plunge cuts, trim and detail work", one: "multi-tool" },
    { shape: "Sanders", slug: "sanders", label: "Sanders", seoLabel: "Sanders", intro: "Random orbit, sheet, belt and detail sanders, from Festool to Ryobi", one: "sander" },
    { shape: "Grinders", slug: "grinders", label: "Grinders", seoLabel: "Angle Grinders", intro: "Cordless and corded angle grinders and die grinders", one: "grinder" },
    { shape: "Nailers", slug: "nailers", label: "Nailers", seoLabel: "Nail Guns", intro: "Framing, finish, brad, pin and roofing nailers, cordless and pneumatic", one: "nailer" },
    { shape: "Outdoor power", slug: "outdoor-power", label: "Outdoor power", seoLabel: "Battery String Trimmers, Blowers and Mowers", intro: "Battery string trimmers, leaf blowers, lawn mowers, hedge trimmers and chainsaws from Ego, Milwaukee, DeWalt, Ryobi and more", one: "outdoor tool" },
    { shape: "Battery platforms", slug: "battery-platforms", label: "Battery platforms", seoLabel: "Power Tool Battery Platforms", intro: "The battery systems themselves: how packs, chargers, warranty and tool range hold up over years, from M18 and 20V MAX to ONE+ and Ego 56V", one: "battery platform" },
  ],
  rowDetail: { column: "surface", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "powerful", tone: "pos" },
    { label: "long runtime", tone: "pos" },
    { label: "lightweight", tone: "pos" },
    { label: "compact", tone: "pos" },
    { label: "well balanced", tone: "pos" },
    { label: "low vibration", tone: "pos" },
    { label: "accurate cuts", tone: "pos" },
    { label: "great dust collection", tone: "pos" },
    { label: "precise control", tone: "pos" },
    { label: "quiet", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "great battery platform", tone: "pos" },
    { label: "good warranty support", tone: "pos" },
    { label: "underpowered", tone: "neg" },
    { label: "short runtime", tone: "neg" },
    { label: "heavy", tone: "neg" },
    { label: "overheats", tone: "neg" },
    { label: "battery issues", tone: "neg" },
    { label: "chuck or bit issues", tone: "neg" },
    { label: "inaccurate", tone: "neg" },
    { label: "poor dust collection", tone: "neg" },
    { label: "broke early", tone: "neg" },
    { label: "trigger or switch failure", tone: "neg" },
    { label: "loud", tone: "neg" },
    { label: "cheap feel", tone: "neg" },
    { label: "expensive batteries", tone: "neg" },
    { label: "poor warranty support", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "pro use", tone: "neutral" },
    { label: "DIY use", tone: "neutral" },
    { label: "switched platforms", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough tools in it have reviews.
  topLists: [
    { slug: "best-drills", label: "Drills", title: "Best Cordless Drills", minReviews: 5,
      intro: "The drill/drivers and hammer drills owners are most consistently happy with.", filters: [{ column: "surface", include: ["Drill/driver", "Hammer drill"] }] },
    { slug: "best-impact-drivers", label: "Impact drivers", title: "Best Impact Drivers", minReviews: 5,
      intro: "The impact drivers owners are most consistently happy with.", filters: [{ column: "surface", include: ["Impact driver"] }] },
    { slug: "best-saws", label: "Saws", title: "Best Power Saws", minReviews: 5,
      intro: "The circular, miter and table saws owners are most consistently happy with.", filters: [{ column: "shape", include: ["Saws"] }] },
    { slug: "best-nailers", label: "Nailers", title: "Best Nail Guns", minReviews: 5,
      intro: "The nailers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Nailers"] }] },
    { slug: "best-outdoor-power-tools", label: "Outdoor", title: "Best Battery Outdoor Power Tools", minReviews: 5,
      intro: "The string trimmers, blowers and mowers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Outdoor power"] }] },
    { slug: "best-battery-platforms", label: "Platforms", title: "Best Power Tool Battery Platforms", minReviews: 5,
      intro: "The battery systems owners are most consistently happy with.", filters: [{ column: "shape", include: ["Battery platforms"] }] },
    { slug: "most-powerful-tools", label: "Power", title: "Most Powerful Power Tools", minReviews: 5,
      intro: "The tools owners most often call powerful.", trait: { tags: ["powerful"], minShare: 0.25, against: ["underpowered"], noun: "the power" } },
    { slug: "best-value-tools", label: "Value", title: "Best Value Power Tools", minReviews: 5,
      intro: "The tools owners most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Blog"],
  examples: { brand: "Milwaukee", model: "M18 FUEL Hammer Drill 2904", year: 2026, search: "2904" },
  form: {
    prompts: [["What did you have before?", "Before this I had "], ["What do you use it for?", "I mostly use it for "], ["Any issues?", "After a while I noticed "]],
    tips: ["Which tool or platform you had before, and how this compares", "What jobs you use it for and how often", "Power, runtime and how it handles in the hand", "Build quality, failures and any warranty claims", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "ToolRecs – Real Owner Reviews of Power Tools and Battery Platforms",
    homeDescription: "Browse real owner reviews of cordless drills, impact drivers, saws, sanders, grinders, nailers and battery outdoor tools, plus experiences collected from Reddit, YouTube and forums. Compare DeWalt, Milwaukee, Makita, Ryobi, Bosch, Ego and more, one page per model number.",
    layoutDescription: "Real owner experiences with power tools and battery platforms, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | ToolRecs",
    catalog: { title: "All Power Tools – Owner Reviews and Ratings", description: "Every power tool and battery platform on ToolRecs with owner ratings. Filter by brand and category, then read what owners say." },
    brands: { title: "Power Tool Brands", description: "Browse power tools by brand — DeWalt, Milwaukee, Makita, Ryobi, Bosch, Metabo HPT, Ego, Festool and more — and read real owner reviews of each model." },
    brand: brand => ({ title: `${brand} Tools – Owner Reviews`, description: `Real owner reviews of ${brand} power tools: ratings, strengths and weaknesses for every ${brand} model on ToolRecs.` }),
    product: name => ({ title: `${name} Reviews | ToolRecs`, description: `Read real owner experiences with the ${name}. Ratings for power, battery and runtime, build, ergonomics and value, plus opinions from around the web.` }),
    productNotFound: "Tool not found | ToolRecs",
    productCategory: "Tools",
    addReview: { title: "Add a Tool Review", description: "Own a drill, saw, nailer or battery mower? Share how it actually holds up in about two minutes. No account needed." },
    about: { title: "About", description: "Why ToolRecs exists: tool opinions are scattered across Reddit, YouTube and forums. ToolRecs collects owners' first-hand experiences and lets owners add their own." },
    ogAlt: "ToolRecs – real owner reviews of power tools",
    ogProductAlt: "Power tool reviews on ToolRecs",
    ogEyebrow: "Owner reviews of power tools",
    ogTitle: "Power tool reviews from people who use them on the job",
    ogDetail: "From owners, Reddit, YouTube and forums",
    ogFallbackTitle: "Power tool reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other people how a drill, saw, nailer or battery tool actually holds up. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About how you use it",
      aboutYouHint: "optional · helps people find owners like them",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's using it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that tool or page. Maybe it moved, maybe it was discontinued, maybe the battery died.",
    about: {
      heading: "Why ToolRecs exists",
      paragraphs: [
        "Tool opinions are scattered across Reddit, YouTube and forums, and a first look rarely says whether a drill’s chuck still holds after two years on a job site or how many batteries a mower really needs. ToolRecs puts owners’ experiences in one place and lets owners add their own.",
        "A tool that suits one person won’t suit everyone. Knowing whether someone frames houses every day or hangs shelves twice a year, and which battery platform they were already on, often tells you more than a spec sheet on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Rankings are counted from reviews: the ones owners write here and the ones quoted from around the web. Each is read as positive, mixed or negative. Tool pages link to Amazon, and ToolRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "One page per model number", body: "Makers refresh tools under almost the same name. Each model number has its own page (DeWalt DCD800 and DCD805, Milwaukee’s Gen 3 and Gen 4 hammer drills, Makita XFD12 and XFD13), while kit and bare-tool versions of one tool share a page." },
        { heading: "A work in progress", body: "ToolRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about tools you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
