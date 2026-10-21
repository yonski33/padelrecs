import type { Niche } from "./types";

// Rating icons: a keycap seen from the front, violet with a lime top face. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const capTile = "M3 2.2h11a1.6 1.6 0 0 1 1.6 1.6v7.6a1.6 1.6 0 0 1-1.6 1.6h-11a1.6 1.6 0 0 1-1.6-1.6v-7.6a1.6 1.6 0 0 1 1.6-1.6z";
const topTile = "M4.6 3.6h7.8a1.1 1.1 0 0 1 1.1 1.1v3.6a1.1 1.1 0 0 1-1.1 1.1h-7.8a1.1 1.1 0 0 1-1.1-1.1v-3.6a1.1 1.1 0 0 1 1.1-1.1z";
const capPick = "M3.5 3h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2z";
const topPick = "M5.4 4.8h9.2a1.4 1.4 0 0 1 1.4 1.4v5a1.4 1.4 0 0 1-1.4 1.4h-9.2a1.4 1.4 0 0 1-1.4-1.4v-5a1.4 1.4 0 0 1 1.4-1.4z";
const cap = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='0 0 17 14'" : "viewBox='0 0 20 20'";
  const [c, t] = size === "tile" ? [capTile, topTile] : [capPick, topPick];
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${c}' fill='#6d28d9'/><path d='${t}' fill='#a3e635'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${c}' fill='#e6e1ef'/></svg>`);
};
const ogCap = (body: string, top: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${capPick}" fill="${body}"/><path d="${topPick}" fill="${top}"/></svg>`;

export const gaming: Niche = {
  id: "gaming",
  schema: "gamingrecs",
  site: {
    name: "GamingRecs",
    domain: "gamingrecs.com",
    wordmark: "gamingrecs",
    descriptor: "gamer reviews of gaming gear",
    footer: "kept by people with too many mice in a drawer. No affiliate links.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "gamer", many: "gamers", One: "Gamer", Many: "Gamers" },
  // Makers name each generation (V3, X2, Gen 2), so names carry the generation instead of a year.
  productYears: false,
  productPath: "gear",
  scoreUnit: { one: "key", many: "keys" },
  // White page, deep violet, one lime accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f6f4fa",
    "--ink": "#1a1625",
    "--ink-2": "#3d3650",
    "--ink-3": "#6c6580",
    "--line": "#e6e1ef",
    "--line-2": "#d3cbe1",
    "--green": "#6d28d9",
    "--green-ink": "#4c1d95",
    "--green-wash": "#f1ebfc",
    "--green-line": "#d4c2f5",
    "--on-green": "#f5f0ff",
    "--on-green-muted": "#cdbaf2",
    "--lime": "#a3e635",
    "--lime-wash": "#f3fbe3",
    "--lime-line": "#cdef8f",
    "--lime-ink": "#3f6212",
    "--lime-ink-2": "#33500e",
    "--score-on": cap("tile", true),
    "--score-off": cap("tile", false),
    "--score-pick-on": cap("pick", true),
    "--score-pick-off": cap("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#e6e1ef", "#cdbaf2", "#d9f2ac", "#bdb4cc"],
  og: {
    background: "#4c1d95",
    accent: "#a3e635",
    muted: "#cdbaf2",
    text: "#f5f0ff",
    scoreOn: ogCap("#7c3aed", "#a3e635"),
    scoreOff: ogCap("#6b4aa8", "#6b4aa8"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled so they fit every kind of gear: power = performance, control = build quality,
  // comfort = comfort, maneuverability = software & features, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Performance", hint: "sensor, switches, sound or picture" },
    { column: "comfortRating", label: "Comfort", hint: "shape, weight, fit for long sessions" },
    { column: "controlRating", label: "Build quality", hint: "materials, durability, no defects" },
    { column: "maneuverabilityRating", label: "Software & features", hint: "app, settings, extras" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main games", adminLabel: "Main games", options: [
      { value: "Competitive FPS", display: "plays competitive FPS" }, { value: "MOBA / strategy", display: "plays MOBA and strategy" }, { value: "MMO / RPG", display: "plays MMO and RPG" }, { value: "Racing / sim", display: "plays racing and sim" }, { value: "A bit of everything", display: "plays a bit of everything" },
    ] },
    playingSide: { label: "Platform", adminLabel: "Platform", options: [
      { value: "PC", display: "on PC" }, { value: "PlayStation", display: "on PlayStation" }, { value: "Xbox", display: "on Xbox" }, { value: "Switch", display: "on Switch" }, { value: "Several", display: "on several platforms" },
    ] },
    playingStyle: { label: "How much you play", adminLabel: "How much you play", options: [
      { value: "Casual", hint: "a few hours a week" }, { value: "Regular", hint: "most days" }, { value: "Hardcore", hint: "hours every day" }, { value: "Competitive", hint: "ranked, leagues or tournaments" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "In a shop or a few sessions", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, weight = weight, core = connection, surface = key specs, balance = form factor.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Mouse", options: ["Mouse", "Keyboard", "Headset", "Controller", "Monitor"] },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 60 g" },
    { column: "core", label: "Connection", max: 200, placeholder: "e.g. Wireless (2.4 GHz, Bluetooth)" },
    { column: "surface", label: "Key specs", max: 200, placeholder: "e.g. HERO 2 sensor, 8000 Hz polling" },
    { column: "balance", label: "Form factor", max: 120, placeholder: "e.g. Symmetrical" },
  ],
  shapeFilter: ["Mouse", "Keyboard", "Headset", "Controller", "Monitor"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Mouse", slug: "mice", label: "Mice", intro: "Gaming mice, wired and wireless, symmetrical and ergonomic" },
    { shape: "Keyboard", slug: "keyboards", label: "Keyboards", intro: "Mechanical, optical and Hall effect gaming keyboards" },
    { shape: "Headset", slug: "headsets", label: "Headsets", intro: "Gaming headsets and earbuds, open and closed-back" },
    { shape: "Controller", slug: "controllers", label: "Controllers", intro: "Gamepads for PC, PlayStation, Xbox and Switch" },
    { shape: "Monitor", slug: "monitors", label: "Monitors", intro: "High-refresh OLED, IPS and VA gaming monitors" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "great performance", tone: "pos" },
    { label: "comfortable", tone: "pos" },
    { label: "lightweight", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "great sound", tone: "pos" },
    { label: "great picture", tone: "pos" },
    { label: "good software", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "uncomfortable", tone: "neg" },
    { label: "bad software", tone: "neg" },
    { label: "connection issues", tone: "neg" },
    { label: "quality control issues", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "short battery life", tone: "neg" },
    { label: "wireless", tone: "neutral" },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Other"],
  examples: { brand: "Logitech", model: "G Pro X Superlight 2", year: 2026, search: "logitech" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["What do you play?", "I mostly play "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how this compares", "What you play and on which platform", "Comfort over long sessions, and your hand or head size if it matters", "Build quality, software and any defects", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "GamingRecs – Real Gamer Reviews of Gaming Gear",
    homeDescription: "Browse real reviews of gaming mice, keyboards, headsets, controllers and monitors from gamers, plus opinions collected from Reddit, YouTube, retailers and forums. Compare Logitech, Razer, SteelSeries, Corsair, ASUS, Sony and more.",
    layoutDescription: "Real gamer experiences with mice, keyboards, headsets, controllers and monitors, plus opinions from Reddit, YouTube, retailers and forums with the source linked.",
    titleTemplate: "%s | GamingRecs",
    catalog: { title: "All Gaming Gear – Gamer Reviews and Ratings", description: "Every mouse, keyboard, headset, controller and monitor on GamingRecs with community ratings. Filter by brand and category, then read what gamers say." },
    brands: { title: "Gaming Gear Brands", description: "Browse gaming gear by brand — Logitech, Razer, SteelSeries, Corsair, ASUS, HyperX, Sony and more — and read real gamer reviews of each product." },
    brand: brand => ({ title: `${brand} Gaming Gear – Gamer Reviews`, description: `Real gamer reviews of ${brand} gear: ratings, strengths and weaknesses for every ${brand} product on GamingRecs.` }),
    product: name => ({ title: `${name} Reviews | GamingRecs`, description: `Read real gamer experiences with the ${name}. Ratings for performance, comfort, build quality and value, plus opinions from around the web.` }),
    productNotFound: "Product not found | GamingRecs",
    productCategory: "Gaming gear",
    addReview: { title: "Add a Gaming Gear Review", description: "Used a gaming mouse, keyboard, headset, controller or monitor? Share how it held up in about two minutes. No account needed." },
    about: { title: "About", description: "Why GamingRecs exists: gaming gear opinions are scattered across Reddit, YouTube, retailers and forums. GamingRecs collects them and lets gamers add their own." },
    ogAlt: "GamingRecs – real gamer reviews of gaming gear",
    ogProductAlt: "Gaming gear reviews on GamingRecs",
    ogEyebrow: "Gamer reviews of gaming gear",
    ogTitle: "Gaming gear reviews from people who use it",
    ogDetail: "From gamers, Reddit, YouTube, retailers and forums",
    ogFallbackTitle: "Gaming gear reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other gamers how a piece of gear actually held up for you. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About your setup",
      aboutYouHint: "optional · helps people find gamers like them",
      howItPerforms: "How it performs",
      whoUsesIt: "Who's using it",
      triedIt: "Used it?",
      triedOne: "Used one?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "We couldn’t find that product or page. Maybe it moved, maybe it was discontinued, maybe it lagged out.",
    about: {
      heading: "Why GamingRecs exists",
      paragraphs: [
        "Gaming gear opinions are scattered across Reddit, YouTube, retailers and forums. GamingRecs puts those experiences in one place and lets gamers add their own.",
        "A mouse or headset that suits one person won’t suit everyone. Knowing what someone plays, on which platform and how long they’ve used it often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Gamers, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from gamer submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "GamingRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ and reviewers’ published figures." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about gear you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
