import type { Niche } from "./types";

// Rating icons: a pair of headphones, ink headband over violet ear cups. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const phones = (size: "tile" | "pick", on: boolean) => {
  const [box, band, w, cups] = size === "tile"
    ? ["width='17' height='14' viewBox='0 0 17 14'", "M4 9.5V7.6a4.5 4.5 0 0 1 9 0V9.5", 1.5, [[2.4, 8.4], [11.4, 8.4], [3.2, 4.6, 1.2]]]
    : ["viewBox='0 0 20 20'", "M4.5 11.5V9.5a5.5 5.5 0 0 1 11 0V11.5", 1.9, [[2.6, 10.2], [13.4, 10.2], [4, 6.2, 1.5]]];
  const [[x1, y1], [x2, y2], [cw, ch, rx]] = cups as number[][];
  const [stroke, fill] = on ? ["#1b1f3b", "#7c3aed"] : ["#e3e5ef", "#e3e5ef"];
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${band}' fill='none' stroke='${stroke}' stroke-width='${w}' stroke-linecap='round'/><rect x='${x1}' y='${y1}' width='${cw}' height='${ch}' rx='${rx}' fill='${fill}'/><rect x='${x2}' y='${y2}' width='${cw}' height='${ch}' rx='${rx}' fill='${fill}'/></svg>`);
};
const ogPhones = (band: string, cup: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M4.5 11.5V9.5a5.5 5.5 0 0 1 11 0V11.5" fill="none" stroke="${band}" stroke-width="1.9" stroke-linecap="round"/><rect x="2.6" y="10.2" width="4" height="6.2" rx="1.5" fill="${cup}"/><rect x="13.4" y="10.2" width="4" height="6.2" rx="1.5" fill="${cup}"/></svg>`;

export const audio: Niche = {
  id: "audio",
  schema: "audiorecs",
  site: {
    name: "AudioRecs",
    domain: "audiorecs.com",
    wordmark: "audiorecs",
    descriptor: "listener reviews of headphones, IEMs and earbuds",
    footer: "kept by people who own more cables than they need. No affiliate links.",
    // analyticsId: add the GA4 measurement id ("G-…") once the owner creates the property.
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "listener", many: "listeners", One: "Listener", Many: "Listeners" },
  // Makers put the generation in the name (Sony WH-1000XM6, AirPods Pro 3, Sennheiser Momentum 4), so no years.
  productYears: false,
  productPath: "gear",
  scoreUnit: { one: "pair", many: "pairs" },
  // White page, deep ink, one violet accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  // --lime is a lighter violet so it stays readable on the ink panels; the logo and rating icons use #7c3aed.
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f5f5fa",
    "--ink": "#14162b",
    "--ink-2": "#3a3d56",
    "--ink-3": "#6b6e85",
    "--line": "#e3e5ef",
    "--line-2": "#cbcedd",
    "--green": "#1b1f3b",
    "--green-ink": "#10122a",
    "--green-wash": "#ecedf5",
    "--green-line": "#c3c6db",
    "--on-green": "#f3f3fa",
    "--on-green-muted": "#a9acc7",
    "--lime": "#a78bfa",
    "--lime-wash": "#f3edff",
    "--lime-line": "#cbb3f7",
    "--lime-ink": "#4c1d95",
    "--lime-ink-2": "#3b1677",
    "--score-on": phones("tile", true),
    "--score-off": phones("tile", false),
    "--score-pick-on": phones("pick", true),
    "--score-pick-off": phones("pick", false),
  },
  chartColors: ["var(--green)", "#7c3aed", "#cbcedd", "#a9acc7", "#cbb3f7", "#94a3b8"],
  og: {
    background: "#1b1f3b",
    accent: "#a78bfa",
    muted: "#a9acc7",
    text: "#f3f3fa",
    scoreOn: ogPhones("#f3f3fa", "#a78bfa"),
    scoreOff: ogPhones("#3a3f66", "#3a3f66"),
  },
  ratingWords: { "5": "5 — love them", "4": "4 — really like them", "3": "3 — they’re fine", "2": "2 — not for me", "1": "1 — regret buying them" },
  // Fixed rating columns, relabelled for headphones: power = sound, comfort = comfort & fit, control = build quality,
  // maneuverability = features (noise cancelling, battery, app, mic, connection), forgiveness = value.
  categories: [
    { column: "powerRating", label: "Sound", hint: "tuning, detail, bass, soundstage" },
    { column: "comfortRating", label: "Comfort & fit", hint: "long sessions, clamp, fit and seal" },
    { column: "controlRating", label: "Build quality", hint: "materials, durability, cables and hinges" },
    { column: "maneuverabilityRating", label: "Features", hint: "noise cancelling, battery, app, mic, connection" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Home listening", display: "listens mostly at home" }, { value: "Commuting / travel", display: "listens on the commute and travelling" }, { value: "Work / calls", display: "uses them for work and calls" },
      { value: "Gym / sports", display: "uses them for workouts" }, { value: "Studio / mixing", display: "uses them for studio work" }, { value: "A bit of everything", display: "uses them for a bit of everything" },
    ] },
    playingSide: { label: "Experience", adminLabel: "Experience", options: [
      { value: "Casual listener", display: "a casual listener" }, { value: "Enthusiast", display: "an audio enthusiast" }, { value: "Audiophile", display: "an audiophile" }, { value: "Audio pro", display: "works in audio" },
    ] },
    playingStyle: { label: "Sound you like", adminLabel: "Sound you like", options: [
      { value: "Neutral", hint: "flat, accurate" }, { value: "Warm / bassy", hint: "full low end" }, { value: "Bright / detailed", hint: "crisp treble" }, { value: "V-shaped", hint: "big bass and treble" }, { value: "No preference" },
    ] },
    timeWithRacket: { label: "Time using them", adminLabel: "Time using them", options: [
      { value: "Tried them", hint: "In a shop or a meet", display: "tried them" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = form (open-back, closed-back, on-ear…), weight = connection, core = driver, surface = notes.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Headphones", options: ["Headphones", "IEMs", "Earbuds"] },
    { column: "balance", label: "Form", max: 120, placeholder: "e.g. Over-ear, open-back" },
    { column: "weight", label: "Connection", max: 120, placeholder: "e.g. Wireless" },
    { column: "core", label: "Driver", max: 200, placeholder: "e.g. Planar magnetic" },
    { column: "surface", label: "Notes", max: 200, placeholder: "e.g. Active noise cancelling" },
  ],
  shapeFilter: ["Headphones", "IEMs", "Earbuds"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Headphones", slug: "headphones", label: "Headphones", intro: "Over-ear and on-ear headphones, wired and wireless, open-back and closed-back" },
    { shape: "IEMs", slug: "iems", label: "IEMs", intro: "Wired in-ear monitors, from budget single dynamics to multi-driver hybrids" },
    { shape: "Earbuds", slug: "earbuds", label: "Earbuds", intro: "True wireless earbuds, with and without noise cancelling" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "detailed", tone: "pos" },
    { label: "great bass", tone: "pos" },
    { label: "wide soundstage", tone: "pos" },
    { label: "comfortable", tone: "pos" },
    { label: "great noise cancelling", tone: "pos" },
    { label: "long battery life", tone: "pos" },
    { label: "great mic", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "harsh treble", tone: "neg" },
    { label: "muddy", tone: "neg" },
    { label: "uncomfortable", tone: "neg" },
    { label: "connection issues", tone: "neg" },
    { label: "build quality issues", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "warm", tone: "neutral" },
    { label: "bright", tone: "neutral" },
  ],
  topLists: [
    { slug: "best-headphones", label: "Headphones", title: "Best Headphones", minReviews: 6,
      intro: "The over-ear and on-ear headphones listeners are most consistently happy with.", filters: [{ column: "shape", include: ["Headphones"] }] },
    { slug: "best-noise-cancelling-headphones", label: "Noise cancelling", title: "Best Noise Cancelling Headphones and Earbuds", minReviews: 6,
      intro: "The headphones and earbuds listeners most often praise for their noise cancelling.",
      trait: { tags: ["great noise cancelling"], minShare: 0.25, noun: "the noise cancelling" } },
    { slug: "best-iems", label: "IEMs", title: "Best IEMs", minReviews: 6,
      intro: "The in-ear monitors listeners are most consistently happy with.", filters: [{ column: "shape", include: ["IEMs"] }] },
    { slug: "best-wireless-earbuds", label: "Earbuds", title: "Best Wireless Earbuds", minReviews: 6,
      intro: "The true wireless earbuds listeners are most consistently happy with.", filters: [{ column: "shape", include: ["Earbuds"] }] },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Audio shop", "Forum", "Other"],
  examples: { brand: "Sennheiser", model: "HD 600", year: 2026, search: "sennheiser" },
  form: {
    prompts: [["What did you use before?", "Before these I used "], ["What do you drive them with?", "I listen on "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how these compare", "What you listen to, and on what (phone, DAC/amp, laptop)", "Comfort over long sessions, and which tips or pads you use", "Noise cancelling, battery, mic and connection if they have them", "Build quality, defects and whether they were worth the price"],
  },
  seo: {
    homeTitle: "AudioRecs – Real Listener Reviews of Headphones, IEMs and Earbuds",
    homeDescription: "Browse real reviews of headphones, IEMs and wireless earbuds from listeners, plus opinions collected from Reddit, YouTube, audio shops and forums. Compare Sony, Sennheiser, Apple, Bose, Audio-Technica, Beyerdynamic, HIFIMAN, Moondrop and more.",
    layoutDescription: "Real listener experiences with headphones, IEMs and earbuds, plus opinions from Reddit, YouTube, audio shops and forums with the source linked.",
    titleTemplate: "%s | AudioRecs",
    catalog: { title: "All Headphones, IEMs and Earbuds – Listener Reviews and Ratings", description: "Every pair of headphones, IEMs and earbuds on AudioRecs with community ratings. Filter by brand and category, then read what listeners say." },
    brands: { title: "Headphone Brands", description: "Browse headphones, IEMs and earbuds by brand — Sony, Sennheiser, Apple, Bose, Audio-Technica, Beyerdynamic, HIFIMAN, Moondrop and more — and read real listener reviews of each model." },
    brand: brand => ({ title: `${brand} Headphones – Listener Reviews`, description: `Real listener reviews of ${brand} headphones, IEMs and earbuds: ratings, strengths and weaknesses for every ${brand} model on AudioRecs.` }),
    product: name => ({ title: `${name} Reviews | AudioRecs`, description: `Read real listener experiences with the ${name}. Ratings for sound, comfort, build quality, features and value, plus opinions from around the web.` }),
    productNotFound: "Headphones not found | AudioRecs",
    productCategory: "Headphones",
    addReview: { title: "Add a Headphone Review", description: "Own a pair of headphones, IEMs or earbuds? Share how they sound and fit in about two minutes. No account needed." },
    about: { title: "About", description: "Why AudioRecs exists: headphone opinions are scattered across Reddit, YouTube, audio shops and forums. AudioRecs collects them and lets listeners add their own." },
    ogAlt: "AudioRecs – real listener reviews of headphones",
    ogProductAlt: "Headphone reviews on AudioRecs",
    ogEyebrow: "Listener reviews of headphones, IEMs and earbuds",
    ogTitle: "Headphone reviews from people who listen to them",
    ogDetail: "From listeners, Reddit, YouTube, audio shops and forums",
    ogFallbackTitle: "Headphone reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other listeners how a pair actually sounds and fits for you. Takes about two minutes, no account needed.",
      howItWent: "how they sound",
      aboutYou: "About your listening",
      aboutYouHint: "optional · helps people find listeners like them",
      howItPerforms: "How they sound",
      whoUsesIt: "Who's listening",
      triedIt: "Heard them?",
      triedOne: "Own a pair?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find those headphones or that page. Maybe it moved, maybe it was discontinued, maybe it’s tangled at the bottom of a bag.",
    about: {
      heading: "Why AudioRecs exists",
      paragraphs: [
        "Headphone opinions are scattered across Reddit, YouTube, audio shops and forums. AudioRecs puts those experiences in one place and lets listeners add their own.",
        "A pair that suits one listener won’t suit everyone. Knowing what someone listens to, what they drive them with, which tips or pads they use and what they had before often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Listeners, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from listener submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "AudioRecs is new. Submissions are moderated before publication, web reviews link to their sources, and product details come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about headphones you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
