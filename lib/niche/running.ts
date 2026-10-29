import type { Niche } from "./types";

// Rating icons: an amber running shoe outlined in dark teal. Same tile sizes as padel (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const shoe = "M1.6 10.4V6.3c0-1.4 1.1-2.3 2.4-1.9l2 1.3c1.3.8 2.7 1.3 4.2 1.6l3.1.7c1.5.4 2.4 1.3 2.5 2.4z";
const sole = "M1.2 10.4h14.6v1.2c0 .6-.4 1-1 1H2.2c-.6 0-1-.4-1-1z";
const shoeTile = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='17' height='14' viewBox='0 0 17 14'><path d='${shoe}' fill='#ffb703' stroke='#0b3d39' stroke-width='1.1' stroke-linejoin='round'/><path d='${sole}' fill='#0b3d39'/></svg>`);
const shoeTileOff = svg(`<svg xmlns='http://www.w3.org/2000/svg' width='17' height='14' viewBox='0 0 17 14'><path d='${shoe}' fill='#dfe6e4'/><path d='${sole}' fill='#dfe6e4'/></svg>`);
const shoePick = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><g transform='translate(1.5 3) scale(1.0)'><path d='${shoe}' fill='#ffb703' stroke='#0b3d39' stroke-width='1.2' stroke-linejoin='round'/><path d='${sole}' fill='#0b3d39'/></g></svg>`);
const shoePickOff = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><g transform='translate(1.5 3)'><path d='${shoe}' fill='#dfe6e4'/><path d='${sole}' fill='#dfe6e4'/></g></svg>`);
const ogShoe = (fill: string, stroke: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><g transform="translate(1.5 3)"><path d="${shoe}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/><path d="${sole}" fill="${stroke}"/></g></svg>`;

export const running: Niche = {
  id: "running",
  schema: "runningrecs",
  site: {
    name: "RunningRecs",
    domain: "runningrecs.com",
    wordmark: "runningrecs",
    descriptor: "runner reviews of running shoes",
    footer: "kept by people who own too many running shoes.",
    analyticsId: "G-VFQHV30LZX",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "shoe", many: "shoes", One: "Shoe", Many: "Shoes" },
  people: { one: "runner", many: "runners", One: "Runner", Many: "Runners" },
  recentMonths: 24,
  // Makers number versions (Pegasus 42, Ghost 17), so names carry the version instead of a year.
  productYears: false,
  productPath: "shoes",
  amazon: { searchIndex: "Fashion" },
  scoreUnit: { one: "shoe", many: "shoes" },
  // White page, track-side teal, one amber accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f1f5f4",
    "--ink": "#152321",
    "--ink-2": "#3b4a48",
    "--ink-3": "#6a7876",
    "--line": "#dde6e4",
    "--line-2": "#c6d3d0",
    "--green": "#0f766e",
    "--green-ink": "#0b5852",
    "--green-wash": "#e1f1ee",
    "--green-line": "#a9d6cf",
    "--on-green": "#e6f6f3",
    "--on-green-muted": "#9ccfc6",
    "--lime": "#ffb703",
    "--lime-wash": "#fff4d6",
    "--lime-line": "#f2c94c",
    "--lime-ink": "#5a4100",
    "--lime-ink-2": "#463300",
    "--score-on": shoeTile,
    "--score-off": shoeTileOff,
    "--score-pick-on": shoePick,
    "--score-pick-off": shoePickOff,
  },
  chartColors: ["var(--green)", "var(--lime)", "#cfe0dc", "#9ccfc6", "#f2d9a0", "#b9c7c4"],
  og: {
    background: "#0f766e",
    accent: "#ffb703",
    muted: "#9ccfc6",
    text: "#e6f6f3",
    scoreOn: ogShoe("#ffb703", "#073b36"),
    scoreOff: ogShoe("#3f9a91", "#3f9a91"),
  },
  ratingWords: { "5": "5 — loved it", "4": "4 — really liked it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled: power = responsiveness, control = stability, forgiveness = cushioning, maneuverability = durability.
  categories: [
    { column: "forgivenessRating", label: "Cushioning", hint: "softness, protection on long runs" },
    { column: "powerRating", label: "Responsiveness", hint: "bounce, energy return, speed" },
    { column: "controlRating", label: "Stability", hint: "support, cornering, landing" },
    { column: "comfortRating", label: "Comfort & fit", hint: "upper, width, lockdown" },
    { column: "maneuverabilityRating", label: "Durability", hint: "outsole and midsole after miles" },
  ],
  profile: {
    playerLevel: { label: "Running", adminLabel: "Weekly distance", options: [
      { value: "Beginner", hint: "under 15 km / 10 mi a week" }, { value: "Recreational", hint: "15–40 km / 10–25 mi a week" }, { value: "Serious", hint: "40–80 km / 25–50 mi a week" }, { value: "High mileage", hint: "80 km / 50 mi + a week" },
    ] },
    playingSide: { label: "Gait", adminLabel: "Gait", options: [
      { value: "Neutral", display: "neutral gait" }, { value: "Overpronation", display: "overpronates" }, { value: "Supination", display: "supinates" },
    ] },
    playingStyle: { label: "Mostly runs", adminLabel: "Mostly runs", options: [{ value: "Easy & long runs" }, { value: "Workouts & races" }, { value: "Trails" }] },
    timeWithRacket: { label: "Distance in the shoe", adminLabel: "Distance in the shoe", options: [
      { value: "Tried briefly", hint: "A run or two", display: "tried briefly" }, { value: "Under 100 km", hint: "< 60 mi" }, { value: "100–300 km", hint: "60–190 mi" }, { value: "300–600 km", hint: "190–370 mi" }, { value: "More than 600 km", hint: "370 mi +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared with padel: shape holds the category, balance the stack height, core the drop, surface the plate.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Daily trainer", options: ["Daily trainer", "Max cushion", "Stability", "Tempo", "Racing", "Trail"] },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 283 g (10 oz), men's" },
    { column: "balance", label: "Stack height", max: 120, placeholder: "e.g. 37 mm heel / 27 mm forefoot" },
    { column: "core", label: "Drop", max: 200, placeholder: "e.g. 10 mm" },
    { column: "surface", label: "Plate", max: 200, placeholder: "e.g. Carbon plate", options: ["None", "Carbon plate", "Nylon / composite plate", "Rock plate"] },
  ],
  shapeFilter: ["Daily trainer", "Max cushion", "Stability", "Tempo", "Racing", "Trail"],
  typePages: [
    { shape: "Daily trainer", slug: "daily-trainers", label: "Daily trainers", intro: "Everyday shoes for easy and steady miles" },
    { shape: "Max cushion", slug: "max-cushion", label: "Max cushion", intro: "The softest, highest-stack shoes for long and recovery runs" },
    { shape: "Stability", slug: "stability", label: "Stability", intro: "Supportive shoes for runners who overpronate" },
    { shape: "Tempo", slug: "tempo", label: "Tempo", intro: "Light, bouncy shoes for workouts and uptempo runs" },
    { shape: "Racing", slug: "racing", label: "Racing", intro: "Plated race-day super shoes and racing flats" },
    { shape: "Trail", slug: "trail", label: "Trail", intro: "Trail and off-road shoes" },
  ],
  rowDetail: { column: "core", suffix: " drop" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "great cushioning", tone: "pos" },
    { label: "responsive", tone: "pos" },
    { label: "stable", tone: "pos" },
    { label: "comfortable fit", tone: "pos" },
    { label: "breathable", tone: "pos" },
    { label: "great for long runs", tone: "pos" },
    { label: "fast", tone: "pos" },
    { label: "durable", tone: "pos" },
    { label: "narrow fit", tone: "neg" },
    { label: "heel slip", tone: "neg" },
    { label: "wears out fast", tone: "neg" },
    { label: "unstable", tone: "neg" },
    { label: "blisters", tone: "neg" },
    { label: "heavy", tone: "neg" },
    { label: "firm", tone: "neutral" },
    { label: "soft", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts): overall, then one list per shoe category that has enough reviews.
  topLists: [
    { slug: "best-running-shoes", label: "Best overall", title: "Best Running Shoes", minReviews: 15,
      intro: "The running shoes runners are most consistently happy with, among shoes enough runners have reviewed." },
    { slug: "best-running-racing-shoes", formerSlugs: ["best-racing-shoes"], label: "Racing shoes", title: "Best Running Racing Shoes", minReviews: 10,
      intro: "The race-day running shoes runners are most consistently happy with.", filters: [{ column: "shape", include: ["Racing"] }] },
    { slug: "best-max-cushion-running-shoes", label: "Max cushion", title: "Best Max Cushion Running Shoes", minReviews: 10,
      intro: "The softest, highest-stack shoes runners are most consistently happy with.", filters: [{ column: "shape", include: ["Max cushion"] }] },
    { slug: "best-tempo-running-shoes", label: "Tempo shoes", title: "Best Tempo Running Shoes", minReviews: 8,
      intro: "The light, bouncy workout shoes runners are most consistently happy with.", filters: [{ column: "shape", include: ["Tempo"] }] },
    { slug: "best-daily-trainers", label: "Daily trainers", title: "Best Daily Trainers", minReviews: 8,
      intro: "The everyday running shoes runners are most consistently happy with.", filters: [{ column: "shape", include: ["Daily trainer"] }] },
    { slug: "best-trail-running-shoes", label: "Trail shoes", title: "Best Trail Running Shoes", minReviews: 8,
      intro: "The trail shoes runners are most consistently happy with.", filters: [{ column: "shape", include: ["Trail"] }] },
    { slug: "best-running-shoes-for-long-runs", label: "For long runs", title: "Best Running Shoes for Long Runs", minReviews: 10,
      intro: "Shoes runners call great for long runs and well cushioned.",
      trait: { tags: ["great for long runs", "great cushioning"], minShare: 0.2, noun: "long runs or cushioning" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Running shop", "Forum", "Other"],
  examples: { brand: "Nike", model: "Pegasus 42", year: 2026, search: "nike" },
  form: {
    prompts: [["What did you run in before?", "Before this I ran in "], ["How many miles?", "I've put about "], ["Fit and sizing?", "For fit, I "]],
    tips: ["What you ran in before, and how this compares", "How far you've run in it, and on what kind of runs", "Fit: width, length, whether you went up half a size", "Where it shines and where it struggles", "Any blisters, rubbing or wear after the miles"],
  },
  seo: {
    homeTitle: "RunningRecs – Real Runner Reviews of Running Shoes",
    homeDescription: "Browse real running shoe reviews from runners and opinions collected from Reddit, YouTube, shops, and forums. Compare experiences across Nike, ASICS, Brooks, HOKA, Saucony, New Balance, adidas, On and more.",
    layoutDescription: "Real runner experiences with running shoes, plus opinions from Reddit, YouTube, shops and forums with the source linked.",
    titleTemplate: "%s | RunningRecs",
    catalog: { title: "All Running Shoes – Runner Reviews and Ratings", description: "Every running shoe on RunningRecs with community ratings. Filter by brand and category, then read what runners say about each one." },
    brands: { title: "Running Shoe Brands", description: "Browse running shoes by brand — Nike, ASICS, Brooks, HOKA, Saucony, New Balance, adidas, On and more — and read real runner reviews of each model." },
    brand: brand => ({ title: `${brand} Running Shoes – Runner Reviews`, description: `Real runner reviews of ${brand} running shoes: ratings, strengths and weaknesses for every ${brand} model on RunningRecs.` }),
    product: name => ({ title: `${name} Runner Reviews | RunningRecs`, description: `Read real runner experiences with the ${name}. Ratings for cushioning, responsiveness, stability and fit, and opinions from RunningRecs and around the web.` }),
    productNotFound: "Shoe not found | RunningRecs",
    productCategory: "Running shoe",
    addReview: { title: "Add a Running Shoe Review", description: "Run in a pair? Share how it felt on the road or trail in about two minutes. No account needed." },
    about: { title: "About", description: "Why RunningRecs exists: running shoe opinions are scattered across Reddit, YouTube, shops and forums. RunningRecs collects them and lets runners add their own." },
    ogAlt: "RunningRecs – real runner reviews of running shoes",
    ogProductAlt: "Running shoe reviews on RunningRecs",
    ogEyebrow: "Runner reviews of running shoes",
    ogTitle: "Real runner reviews of running shoes",
    ogDetail: "From runners, Reddit, YouTube, shops and forums",
    ogFallbackTitle: "Running shoe reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other runners how a shoe actually felt for you. Takes about two minutes, no account needed.",
      howItWent: "how it ran",
      aboutYou: "About your running",
      aboutYouHint: "optional · helps people find runners like them",
      howItPerforms: "How it runs",
      whoUsesIt: "Who's running in it",
      triedIt: "Run in it?",
      triedOne: "Run in a pair?",
      triedOneOfThese: "Run in one of these?",
    },
    notFound: "We couldn’t find that shoe or page. Maybe it moved, maybe it never existed, maybe the link took a wrong turn on the trail.",
    about: {
      heading: "Why RunningRecs exists",
      paragraphs: [
        "Running shoe reviews are scattered across Reddit, YouTube, shops and forums. RunningRecs puts those experiences in one place and lets runners add their own.",
        "A shoe that works for one runner won’t work for everyone. Knowing someone’s mileage, gait, foot shape and how far they’ve gone in a pair often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Runners, not promotions", body: "No sponsored rankings. No paid placements. Ratings come from runner submissions, and external comments stay separate from those ratings. Shoe pages link to Amazon, and RunningRecs may earn a commission when you buy through those links; that never changes a rating or ranking." },
        { heading: "A work in progress", body: "RunningRecs is new. Runner submissions are moderated before publication, web reviews link to their sources, and shoe specifications come from the brands’ published figures." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about shoes you’ve actually run in and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
