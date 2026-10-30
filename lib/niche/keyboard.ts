import type { Niche } from "./types";

// Rating icons: a keycap seen from the front, graphite with a red-orange top face (a Dolch-style accent key). Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const capTile = "M3 2.2h11a1.6 1.6 0 0 1 1.6 1.6v7.6a1.6 1.6 0 0 1-1.6 1.6h-11a1.6 1.6 0 0 1-1.6-1.6v-7.6a1.6 1.6 0 0 1 1.6-1.6z";
const topTile = "M4.6 3.6h7.8a1.1 1.1 0 0 1 1.1 1.1v3.6a1.1 1.1 0 0 1-1.1 1.1h-7.8a1.1 1.1 0 0 1-1.1-1.1v-3.6a1.1 1.1 0 0 1 1.1-1.1z";
const capPick = "M3.5 3h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2z";
const topPick = "M5.4 4.8h9.2a1.4 1.4 0 0 1 1.4 1.4v5a1.4 1.4 0 0 1-1.4 1.4h-9.2a1.4 1.4 0 0 1-1.4-1.4v-5a1.4 1.4 0 0 1 1.4-1.4z";
const cap = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='0 0 17 14'" : "viewBox='0 0 20 20'";
  const [c, t] = size === "tile" ? [capTile, topTile] : [capPick, topPick];
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${c}' fill='#2b2d33'/><path d='${t}' fill='#e5533d'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${c}' fill='#e4e5e9'/></svg>`);
};
const ogCap = (body: string, top: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${capPick}" fill="${body}"/><path d="${topPick}" fill="${top}"/></svg>`;

export const keyboard: Niche = {
  id: "keyboard",
  schema: "keyboardrecs",
  site: {
    name: "KeyboardRecs",
    domain: "keyboardrecs.com",
    wordmark: "keyboardrecs",
    descriptor: "real reviews of mechanical, rapid trigger and ergonomic keyboards, kits, switches and keycaps",
    footer: "kept by people with more keyboards than hands.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // The catalogue holds switches and keycaps too, but the menu says Keyboards: that is what visitors come for.
  navLabel: "Keyboards",
  recentMonths: 24,
  // Makers name each generation (V2, Mk3, Max, HE 8K), so names carry the generation instead of a year.
  productYears: false,
  productPath: "products",
  amazon: { searchIndex: "Computers" },
  scoreUnit: { one: "key", many: "keys" },
  // White page, graphite ink, one red-orange accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f6f6f8",
    "--ink": "#17181c",
    "--ink-2": "#3a3d45",
    "--ink-3": "#6b6f7a",
    "--line": "#e4e5e9",
    "--line-2": "#d2d4da",
    "--green": "#2b2d33",
    "--green-ink": "#17181c",
    "--green-wash": "#f1f2f4",
    "--green-line": "#d6d8de",
    "--on-green": "#ffffff",
    "--on-green-muted": "#c3c6ce",
    "--lime": "#e5533d",
    "--lime-wash": "#fdeeeb",
    "--lime-line": "#f6c2b8",
    "--lime-ink": "#b3321f",
    "--lime-ink-2": "#8f2717",
    "--score-on": cap("tile", true),
    "--score-off": cap("tile", false),
    "--score-pick-on": cap("pick", true),
    "--score-pick-off": cap("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#e4e5e9", "#f6c2b8", "#9a9ea8", "#c3c6ce"],
  og: {
    background: "#2b2d33",
    accent: "#e5533d",
    muted: "#c3c6ce",
    text: "#ffffff",
    scoreOn: ogCap("#4a4d55", "#e5533d"),
    scoreOff: ogCap("#3a3d45", "#3a3d45"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for keyboards: power = typing feel, comfort = sound, control = build quality,
  // maneuverability = software & features, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Typing feel", hint: "switches, stabilizers, how keys feel and respond" },
    { column: "comfortRating", label: "Sound", hint: "thocky, clacky, rattly or quiet" },
    { column: "controlRating", label: "Build quality", hint: "case, plate, keycaps, no defects" },
    { column: "maneuverabilityRating", label: "Software & features", hint: "QMK/VIA or app, wireless, rapid trigger, hot-swap" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Typing and work", display: "types and works on it" }, { value: "Programming", display: "codes on it" },
      { value: "Gaming", display: "games on it" }, { value: "Gaming and typing", display: "games and types on it" },
    ] },
    playingSide: { label: "Computer", adminLabel: "Computer", options: [
      { value: "Windows", display: "on Windows" }, { value: "Mac", display: "on a Mac" }, { value: "Linux", display: "on Linux" }, { value: "Several", display: "on several computers" },
    ] },
    playingStyle: { label: "Keyboard experience", adminLabel: "Experience", options: [
      { value: "First mechanical", hint: "my first mechanical keyboard" }, { value: "A few boards", hint: "owned a few" }, { value: "Enthusiast", hint: "mods, lubes, swaps" }, { value: "Builder", hint: "builds custom boards" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "In a shop or a few days", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, weight = weight, core = connection, surface = switches, balance = layout.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Mechanical keyboard", options: ["Rapid trigger keyboard", "Mechanical keyboard", "Low-profile keyboard", "Keyboard kit", "Ergonomic keyboard", "Switches", "Keycaps"] },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 1.2 kg" },
    { column: "core", label: "Connection", max: 200, placeholder: "e.g. Wireless (2.4 GHz, Bluetooth) + wired" },
    { column: "surface", label: "Switches", max: 200, placeholder: "e.g. Hall effect magnetic, 8000 Hz" },
    { column: "balance", label: "Layout", max: 120, placeholder: "e.g. 75%" },
  ],
  shapeFilter: ["Rapid trigger keyboard", "Mechanical keyboard", "Low-profile keyboard", "Keyboard kit", "Ergonomic keyboard", "Switches", "Keycaps"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths. Approved by the owner 2026-10-30.
  categoryPaths: true,
  typePages: [
    { shape: "Rapid trigger keyboard", slug: "rapid-trigger-keyboards", label: "Rapid trigger", seoLabel: "Rapid Trigger Keyboards", intro: "Hall effect, TMR and analog keyboards with adjustable actuation and rapid trigger", one: "Rapid trigger" },
    { shape: "Mechanical keyboard", slug: "mechanical-keyboards", label: "Mechanical", seoLabel: "Mechanical Keyboards", intro: "Prebuilt mechanical keyboards, from gaming boards to enthusiast customs", one: "Mechanical" },
    { shape: "Low-profile keyboard", slug: "low-profile-keyboards", label: "Low-profile", seoLabel: "Low-Profile Keyboards", intro: "Slim mechanical and low-profile keyboards", one: "Low-profile" },
    { shape: "Keyboard kit", slug: "keyboard-kits", label: "Kits", seoLabel: "Custom Keyboard Kits", intro: "Barebones and custom keyboard kits you build with your own switches and keycaps", one: "Kit" },
    { shape: "Ergonomic keyboard", slug: "ergonomic-keyboards", label: "Ergonomic", seoLabel: "Ergonomic Keyboards", intro: "Split and ergonomic keyboards", one: "Ergonomic" },
    { shape: "Switches", slug: "switches", label: "Switches", seoLabel: "Keyboard Switches", intro: "Linear, tactile, clicky, silent and magnetic switches", one: "Switch" },
    { shape: "Keycaps", slug: "keycaps", label: "Keycaps", seoLabel: "Keycap Sets", intro: "Keycap sets", one: "Keycaps" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews. The first fifteen are GamingRecs'
  // bank, so the reviews that moved from there (2026-10-30) keep their tags.
  tags: [
    { label: "great performance", tone: "pos" },
    { label: "comfortable", tone: "pos" },
    { label: "lightweight", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "great sound", tone: "pos" },
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
    { label: "smooth switches", tone: "pos" },
    { label: "great stabilizers", tone: "pos" },
    { label: "good rapid trigger", tone: "pos" },
    { label: "easy to mod", tone: "pos" },
    { label: "rattly stabilizers", tone: "neg" },
    { label: "chatter", tone: "neg" },
    { label: "keycap shine", tone: "neg" },
    { label: "loud", tone: "neutral" },
    { label: "quiet", tone: "neutral" },
    { label: "hot-swappable", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-rapid-trigger-keyboards", label: "Rapid trigger", title: "Best Rapid Trigger Keyboards", minReviews: 5,
      intro: "The Hall effect and analog keyboards owners are most consistently happy with.", filters: [{ column: "shape", include: ["Rapid trigger keyboard"] }] },
    { slug: "best-mechanical-keyboards", label: "Mechanical", title: "Best Mechanical Keyboards", minReviews: 5,
      intro: "The mechanical keyboards owners are most consistently happy with.", filters: [{ column: "shape", include: ["Mechanical keyboard"] }] },
    { slug: "best-low-profile-keyboards", label: "Low-profile", title: "Best Low-Profile Keyboards", minReviews: 5,
      intro: "The low-profile keyboards owners are most consistently happy with.", filters: [{ column: "shape", include: ["Low-profile keyboard"] }] },
    { slug: "best-keyboard-kits", label: "Kits", title: "Best Custom Keyboard Kits", minReviews: 5,
      intro: "The keyboard kits builders are most consistently happy with.", filters: [{ column: "shape", include: ["Keyboard kit"] }] },
    { slug: "best-ergonomic-keyboards", label: "Ergonomic", title: "Best Ergonomic Keyboards", minReviews: 5,
      intro: "The split and ergonomic keyboards owners are most consistently happy with.", filters: [{ column: "shape", include: ["Ergonomic keyboard"] }] },
    { slug: "best-keyboard-switches", label: "Switches", title: "Best Keyboard Switches", minReviews: 5,
      intro: "The switches owners are most consistently happy with.", filters: [{ column: "shape", include: ["Switches"] }] },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Other"],
  examples: { brand: "Keychron", model: "Q1 Max", year: 2026, search: "keychron" },
  form: {
    prompts: [["What did you use before?", "Before this I typed on "], ["What do you use it for?", "I mostly use it for "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how this compares", "Which switches and keycaps you run, stock or swapped", "How it sounds and feels after a few weeks", "Build quality, stabilizers, software and any defects", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "KeyboardRecs – Real Reviews of Mechanical Keyboards, Switches and Keycaps",
    homeDescription: "Browse real reviews of mechanical, rapid trigger, low-profile and ergonomic keyboards, custom kits, switches and keycaps, plus experiences collected from Reddit, YouTube and forums. Compare Keychron, Wooting, NuPhy, Razer, Logitech, Corsair and more.",
    layoutDescription: "Real experiences with mechanical, rapid trigger and ergonomic keyboards, kits, switches and keycaps, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | KeyboardRecs",
    catalog: { title: "All Keyboards, Switches and Keycaps – Reviews and Ratings", description: "Every keyboard, kit, switch and keycap set on KeyboardRecs with community ratings. Filter by category and brand, then read what owners say." },
    brands: { title: "Keyboard Brands", description: "Browse keyboards by brand — Keychron, Wooting, NuPhy, Razer, Logitech, Corsair, Gateron and more — and read real reviews of each product." },
    brand: brand => ({ title: `${brand} Keyboards – Reviews`, description: `Real reviews of ${brand} keyboards and parts: ratings, strengths and weaknesses for every ${brand} product on KeyboardRecs.` }),
    product: name => ({ title: `${name} Reviews | KeyboardRecs`, description: `Read real experiences with the ${name}. Ratings for typing feel, sound, build quality and value, plus opinions from around the web.` }),
    productNotFound: "Product not found | KeyboardRecs",
    productCategory: "Keyboards",
    addReview: { title: "Add a Keyboard Review", description: "Used a keyboard, kit, switch or keycap set? Share how it feels and holds up in about two minutes. No account needed." },
    about: { title: "About", description: "Why KeyboardRecs exists: keyboard opinions are scattered across Reddit, YouTube and forums. KeyboardRecs collects them and lets owners add their own." },
    ogAlt: "KeyboardRecs – real reviews of keyboards",
    ogProductAlt: "Keyboard reviews on KeyboardRecs",
    ogEyebrow: "Real reviews of keyboards",
    ogTitle: "Keyboard reviews from people who type on them",
    ogDetail: "From owners, Reddit, YouTube and forums",
    ogFallbackTitle: "Keyboard reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell others how a keyboard, kit, switch or keycap set actually works for you. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About your setup",
      aboutYouHint: "optional · helps people find owners like them",
      howItPerforms: "How it types",
      whoUsesIt: "Who owns it",
      triedIt: "Used it?",
      triedOne: "Used one?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "We couldn’t find that product or page. Maybe it moved, maybe it was discontinued, maybe a key got stuck.",
    about: {
      heading: "Why KeyboardRecs exists",
      paragraphs: [
        "Keyboard opinions are scattered across Reddit, YouTube and forums, and most review videos come with a discount code. KeyboardRecs puts first-hand experiences in one place and lets owners add their own.",
        "A board that sounds perfect to one person is too loud for another. Knowing what someone uses it for, which switches they run and how long they’ve had it often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Ratings come from owner submissions, and external comments stay separate from those ratings. Product pages link to Amazon, and KeyboardRecs may earn a commission when you buy through those links; that never changes a rating or ranking." },
        { heading: "A work in progress", body: "KeyboardRecs is new. Submissions are moderated before publication, web reviews link to their sources, and product names and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about boards and parts you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
