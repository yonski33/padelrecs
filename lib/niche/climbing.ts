import type { Niche } from "./types";

// Rating icons: a climbing hold, petrol blue with a rope-orange bolt hole. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const HOLD_TILE = "M3.2 9.6C1.6 7.2 2.6 3.6 5.6 2.4 8.2 1.3 10.4 2.6 12.6 2.2 15 1.8 16.4 4.4 15.6 6.8 14.9 9 15.6 11 13.6 12.3 11.4 13.7 8.6 12.4 6.6 12.6 4.8 12.8 3.9 10.8 3.2 9.6Z";
const HOLD_PICK = "M3.4 13.8C1.4 10.6 2.8 5.6 6.6 4 9.8 2.6 12.4 4.2 15 3.6 17.8 3 19.4 6.4 18.4 9.6 17.6 12.4 18.4 15 16 16.6 13.4 18.4 10 16.8 7.6 17 5.4 17.2 4.3 15.4 3.4 13.8Z";
const holdIcon = (size: "tile" | "pick", on: boolean) => {
  const [box, path, bolt] = size === "tile"
    ? ["width='17' height='14' viewBox='0 0 17 14'", HOLD_TILE, "<circle cx='9' cy='7.3' r='1.7'"]
    : ["viewBox='0 0 20 20'", HOLD_PICK, "<circle cx='10.8' cy='10.4' r='2.1'"];
  const [rock, hole] = on ? ["#0f4c5c", "#fb8c3c"] : ["#e2e8ea", "#ffffff"];
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${path}' fill='${rock}'/>${bolt} fill='${hole}'/></svg>`);
};
const ogHold = (rock: string, hole: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${HOLD_PICK}" fill="${rock}"/><circle cx="10.8" cy="10.4" r="2.1" fill="${hole}"/></svg>`;

export const climbing: Niche = {
  id: "climbing",
  schema: "climbingrecs",
  site: {
    name: "ClimbingRecs",
    domain: "climbingrecs.com",
    wordmark: "climbingrecs",
    descriptor: "climber reviews of climbing shoes, harnesses, belay devices, ropes, chalk bags and crash pads",
    footer: "kept by people who know their shoe size in three brands.",
    analyticsId: "G-LDTENY2PVS",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "climber", many: "climbers", One: "Climber", Many: "Climbers" },
  recentMonths: 36,
  // Makers name gear by model, version and volume (Instinct VSR LV, Shaman 2S, Drone 2 HV, GRIGRI+, Mega Jul), not by year.
  productYears: false,
  productPath: "gear",
  amazon: { searchIndex: "SportsAndOutdoors" },
  scoreUnit: { one: "hold", many: "holds" },
  // White page, petrol-blue ink, one rope-orange accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  // --lime is the rope orange, readable on the petrol panels; the logo and rating icons use the same #fb8c3c.
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f4f8f9",
    "--ink": "#14262c",
    "--ink-2": "#34484f",
    "--ink-3": "#647980",
    "--line": "#e2e8ea",
    "--line-2": "#cfd9dc",
    "--green": "#0f4c5c",
    "--green-ink": "#0a3743",
    "--green-wash": "#ebf3f5",
    "--green-line": "#c6dce1",
    "--on-green": "#f2f8f9",
    "--on-green-muted": "#a9c7ce",
    "--lime": "#fb8c3c",
    "--lime-wash": "#fff4ec",
    "--lime-line": "#fdd2b3",
    "--lime-ink": "#a64708",
    "--lime-ink-2": "#853806",
    "--score-on": holdIcon("tile", true),
    "--score-off": holdIcon("tile", false),
    "--score-pick-on": holdIcon("pick", true),
    "--score-pick-off": holdIcon("pick", false),
  },
  chartColors: ["var(--green)", "#fb8c3c", "#cfd9dc", "#7f9aa1", "#fdd2b3", "#94a3b8"],
  og: {
    background: "#0f4c5c",
    accent: "#fb8c3c",
    muted: "#a9c7ce",
    text: "#f2f8f9",
    scoreOn: ogHold("#f2f8f9", "#fb8c3c"),
    scoreOff: ogHold("#2f6876", "#2f6876"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for climbing gear: power = performance, comfort = comfort,
  // maneuverability = ease of use, control = durability, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Performance", hint: "edging, hooking, grip, braking or cushioning: how well it does its job" },
    { column: "comfortRating", label: "Comfort", hint: "on your feet, on your hips, in your hands" },
    { column: "maneuverabilityRating", label: "Ease of use", hint: "fit and sizing, threading, handling, carrying" },
    { column: "controlRating", label: "Durability", hint: "rubber, stitching, sheath and foam over time" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Climbing level", adminLabel: "Climbing level", options: [
      { value: "New to climbing", display: "new to climbing" }, { value: "Intermediate", hint: "around V3–V5 or 5.10–5.11", display: "an intermediate climber" },
      { value: "Advanced", hint: "around V6–V9 or 5.12–5.13", display: "an advanced climber" }, { value: "Elite", hint: "V10+ or 5.14+", display: "an elite climber" },
    ] },
    playingSide: { label: "Main style", adminLabel: "Main style", options: [
      { value: "Bouldering", display: "mostly boulders" }, { value: "Sport", display: "mostly sport climbs" }, { value: "Trad", display: "mostly climbs trad" },
      { value: "Multi-pitch / alpine", display: "mostly climbs multi-pitch and alpine" }, { value: "A bit of everything", display: "climbs a bit of everything" },
    ] },
    playingStyle: { label: "Where you climb", adminLabel: "Where you climb", options: [
      { value: "Mostly indoors", hint: "gym" }, { value: "Mostly outdoors", hint: "crag" }, { value: "Both" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried it", hint: "Demo, rental or borrowed", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type (closure for shoes, rope type, belay device type, chalk bag or bucket…),
  // surface = key specs (rubber, rope range, diameter, landing size), core = main material, weight = weight as the page states it.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Climbing shoe", options: ["Climbing shoe", "Harness", "Belay device", "Rope", "Chalk bag", "Crash pad"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Velcro, Assisted braking or Single rope" },
    { column: "surface", label: "Key specs", max: 200, placeholder: "e.g. Vibram XS Grip 2, 3.5 mm or 8.5–11 mm ropes" },
    { column: "core", label: "Material", max: 200, placeholder: "e.g. Microfiber and leather upper" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 175 g" },
  ],
  shapeFilter: ["Climbing shoe", "Harness", "Belay device", "Rope", "Chalk bag", "Crash pad"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Climbing shoe", slug: "climbing-shoes", label: "Shoes", seoLabel: "Climbing Shoes", intro: "Climbing shoes for bouldering, sport, trad and the gym: velcro, lace-up and slippers, flat to aggressive" },
    { shape: "Harness", slug: "harnesses", label: "Harnesses", seoLabel: "Climbing Harnesses", intro: "Climbing harnesses for the gym, sport, trad, alpine and kids" },
    { shape: "Belay device", slug: "belay-devices", label: "Belay devices", seoLabel: "Belay Devices", intro: "Tube and guide-mode belay devices, assisted-braking devices like the GRIGRI, figure 8s and belay assists" },
    { shape: "Rope", slug: "ropes", label: "Ropes", seoLabel: "Climbing Ropes", intro: "Dynamic single, half and twin climbing ropes, dry-treated and not" },
    { shape: "Chalk bag", slug: "chalk-bags", label: "Chalk bags", seoLabel: "Chalk Bags", intro: "Chalk bags and bouldering chalk buckets" },
    { shape: "Crash pad", slug: "crash-pads", label: "Crash pads", seoLabel: "Crash Pads", intro: "Bouldering crash pads, from sit-start pads to highball pads" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "comfortable", tone: "pos" },
    { label: "sensitive", tone: "pos" },
    { label: "precise edging", tone: "pos" },
    { label: "great heel hooks", tone: "pos" },
    { label: "great toe hooks", tone: "pos" },
    { label: "sticky rubber", tone: "pos" },
    { label: "smooth belaying", tone: "pos" },
    { label: "lightweight", tone: "pos" },
    { label: "durable", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "painful", tone: "neg" },
    { label: "stretches a lot", tone: "neg" },
    { label: "wears out fast", tone: "neg" },
    { label: "heavy", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "runs small", tone: "neutral" },
    { label: "needs break-in", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-climbing-shoes", label: "Climbing shoes", title: "Best Climbing Shoes", minReviews: 5,
      intro: "The climbing shoes climbers are most consistently happy with.", filters: [{ column: "shape", include: ["Climbing shoe"] }] },
    { slug: "best-comfortable-climbing-shoes", label: "Comfortable shoes", title: "Most Comfortable Climbing Shoes", minReviews: 5,
      intro: "The climbing shoes climbers most often call comfortable.", filters: [{ column: "shape", include: ["Climbing shoe"] }], trait: { tags: ["comfortable"], minShare: 0.25, against: ["painful"], noun: "the comfort" } },
    { slug: "best-climbing-harnesses", label: "Harnesses", title: "Best Climbing Harnesses", minReviews: 5,
      intro: "The climbing harnesses climbers are most consistently happy with.", filters: [{ column: "shape", include: ["Harness"] }] },
    { slug: "best-belay-devices", label: "Belay devices", title: "Best Belay Devices", minReviews: 5,
      intro: "The belay devices climbers are most consistently happy with.", filters: [{ column: "shape", include: ["Belay device"] }] },
    { slug: "best-assisted-braking-belay-devices", label: "Assisted braking", title: "Best Assisted-Braking Belay Devices", minReviews: 5,
      intro: "The assisted-braking belay devices, cam and camless, climbers are most consistently happy with.", filters: [{ column: "shape", include: ["Belay device"] }, { column: "balance", include: ["Assisted braking", "Cam assisted braking"] }] },
    { slug: "best-climbing-ropes", label: "Ropes", title: "Best Climbing Ropes", minReviews: 5,
      intro: "The dynamic climbing ropes climbers are most consistently happy with.", filters: [{ column: "shape", include: ["Rope"] }] },
    { slug: "best-chalk-bags", label: "Chalk bags", title: "Best Climbing Chalk Bags", minReviews: 5,
      intro: "The chalk bags and chalk buckets climbers are most consistently happy with.", filters: [{ column: "shape", include: ["Chalk bag"] }] },
    { slug: "best-crash-pads", label: "Crash pads", title: "Best Bouldering Crash Pads", minReviews: 5,
      intro: "The bouldering crash pads climbers are most consistently happy with.", filters: [{ column: "shape", include: ["Crash pad"] }] },
    { slug: "best-budget-climbing-gear", label: "Budget", title: "Best Budget Climbing Gear", minReviews: 5,
      intro: "The shoes, harnesses, belay devices, ropes and pads climbers most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Climbing retailer", "Forum", "Other"],
  examples: { brand: "Scarpa", model: "Instinct VSR", year: 2026, search: "instinct" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["What do you climb in it?", "I mostly use it for "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how this compares", "What you climb with it (bouldering, sport, trad, gym) and how often", "Fit and sizing: your street size, the size you took and how it broke in", "Edging, hooking, smearing, braking or landing: what it's good and bad at", "Durability, defects and whether it was worth the price"],
  },
  seo: {
    homeTitle: "ClimbingRecs – Real Climber Reviews of Climbing Shoes, Harnesses, Belay Devices and Crash Pads",
    homeDescription: "Browse real reviews of climbing shoes, harnesses, belay devices, ropes, chalk bags and crash pads from climbers, plus opinions collected from Reddit, YouTube, climbing retailers and forums. Compare Scarpa, Evolv, Black Diamond, Petzl, Mad Rock, Butora, So iLL, Edelrid, Beal, Organic and more.",
    layoutDescription: "Real climber experiences with climbing shoes, harnesses, belay devices, ropes, chalk bags and crash pads, plus opinions from Reddit, YouTube, climbing retailers and forums with the source linked.",
    titleTemplate: "%s | ClimbingRecs",
    catalog: { title: "All Climbing Gear – Climber Reviews and Ratings", description: "Every climbing shoe, harness, belay device, rope, chalk bag and crash pad on ClimbingRecs with community ratings. Filter by brand and category, then read what climbers say." },
    brands: { title: "Climbing Gear Brands", description: "Browse climbing gear by brand — Scarpa, Evolv, Black Diamond, Petzl, Mad Rock, Butora, So iLL, Edelrid, Beal, Organic and more — and read real climber reviews of each model." },
    brand: brand => ({ title: `${brand} Climbing Gear – Climber Reviews`, description: `Real climber reviews of ${brand} climbing gear: ratings, strengths and weaknesses for every ${brand} product on ClimbingRecs.` }),
    product: name => ({ title: `${name} Reviews | ClimbingRecs`, description: `Read real climber experiences with the ${name}. Ratings for performance, comfort, ease of use, durability and value, plus opinions from around the web.` }),
    productNotFound: "Climbing gear not found | ClimbingRecs",
    productCategory: "Climbing equipment",
    addReview: { title: "Add a Climbing Gear Review", description: "Climb in a pair of shoes, a harness or with a belay device? Share how it works for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why ClimbingRecs exists: climbing gear opinions are scattered across Reddit, YouTube, climbing retailers and forums. ClimbingRecs collects them and lets climbers add their own." },
    ogAlt: "ClimbingRecs – real climber reviews of climbing gear",
    ogProductAlt: "Climbing gear reviews on ClimbingRecs",
    ogEyebrow: "Climber reviews of climbing gear",
    ogTitle: "Climbing gear reviews from people who climb in it",
    ogDetail: "From climbers, Reddit, YouTube, climbing retailers and forums",
    ogFallbackTitle: "Climbing gear reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other climbers how a pair of shoes, a harness or a belay device actually works for you. Takes about two minutes, no account needed.",
      howItWent: "how it climbs",
      aboutYou: "About your climbing",
      aboutYouHint: "optional · helps people find climbers like them",
      howItPerforms: "How it performs",
      whoUsesIt: "Who's climbing with it",
      triedIt: "Climbed with it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that gear or page. Maybe it moved, maybe it was discontinued, maybe it’s still at the bottom of someone’s crag pack.",
    about: {
      heading: "Why ClimbingRecs exists",
      paragraphs: [
        "Climbing gear opinions are scattered across Reddit, YouTube, climbing retailers and forums. ClimbingRecs puts those experiences in one place and lets climbers add their own.",
        "Gear that suits one climber won’t suit everyone. Knowing someone’s foot shape and size, what they climb and what they used before often tells you more than a spec sheet or a score on its own.",
      ],
      sections: [
        { heading: "Climbers, not promotions", body: "No sponsored rankings. No paid placements. Ratings come from climber submissions, and external comments stay separate from those ratings. Product pages link to Amazon, and ClimbingRecs may earn a commission when you buy through those links; that never changes a rating or ranking." },
        { heading: "A work in progress", body: "ClimbingRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about gear you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
