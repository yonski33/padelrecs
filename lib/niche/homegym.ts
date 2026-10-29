import type { Niche } from "./types";

// Rating icons: a weight plate seen face-on, plate-yellow with a dark collar hole and a raised rim. Same tile sizes as the
// other niches (17×14 strip, 20×20 picker); the strip tile widens the 20×20 drawing's viewBox so the plate stays round.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const plate = (fill: string, rim: string, hole: string, q: string) =>
  `<circle cx=${q}10${q} cy=${q}10${q} r=${q}8.4${q} fill=${q}${fill}${q}/><circle cx=${q}10${q} cy=${q}10${q} r=${q}5.6${q} fill=${q}none${q} stroke=${q}${rim}${q} stroke-width=${q}1.1${q}/><circle cx=${q}10${q} cy=${q}10${q} r=${q}2${q} fill=${q}${hole}${q}/>`;
const plateIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? plate("#f5b300", "#1f2937", "#1f2937", "'") : plate("#e5e7eb", "#d1d5db", "#ffffff", "'")}</svg>`);
};
const ogPlate = (fill: string, rim: string, hole: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${plate(fill, rim, hole, '"')}</svg>`;

export const homegym: Niche = {
  id: "homegym",
  schema: "homegymrecs",
  site: {
    name: "HomeGymRecs",
    domain: "homegymrecs.com",
    wordmark: "homegymrecs",
    descriptor: "real reviews of adjustable dumbbells, power racks, benches, barbells, plates, cable machines and cardio gear",
    footer: "kept by people who train in garages, spare rooms and basements.",
    analyticsId: "G-FJCY7164W9",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "item", many: "items", One: "Item", Many: "Items" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  recentMonths: 36,
  // Makers name home gym gear by line and model (REP PR-4000 vs PR-5000, Bowflex SelectTech 552 vs 1090, PowerBlock Pro 50
  // vs Commercial Pro 50), not by year. Heights, depths, lb or kg versions and colours of one model are one product.
  productYears: false,
  productPath: "equipment",
  amazon: { searchIndex: "SportsAndOutdoors" },
  scoreUnit: { one: "plate", many: "plates" },
  // White page, charcoal ink, one plate-yellow accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f8f8f7",
    "--ink": "#111827",
    "--ink-2": "#374151",
    "--ink-3": "#6b7280",
    "--line": "#ececea",
    "--line-2": "#dcdcd8",
    "--green": "#1f2937",
    "--green-ink": "#111827",
    "--green-wash": "#f1f2f4",
    "--green-line": "#d4d7dd",
    "--on-green": "#ffffff",
    "--on-green-muted": "#c3c8d1",
    "--lime": "#f5b300",
    "--lime-wash": "#fff8e1",
    "--lime-line": "#fde7a3",
    "--lime-ink": "#8a6100",
    "--lime-ink-2": "#6b4b00",
    "--score-on": plateIcon("tile", true),
    "--score-off": plateIcon("tile", false),
    "--score-pick-on": plateIcon("pick", true),
    "--score-pick-off": plateIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f5b300", "#dcdcd8", "#dc2626", "#fde7a3", "#94a3b8"],
  og: {
    background: "#1f2937",
    accent: "#f5b300",
    muted: "#c3c8d1",
    text: "#ffffff",
    scoreOn: ogPlate("#f5b300", "#1f2937", "#1f2937"),
    scoreOff: ogPlate("#374151", "#4b5563", "#1f2937"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — disappointed", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for gym gear: power = build quality, comfort = ease of use (adjusting, swapping
  // weights, setup), maneuverability = space (footprint, folding, ceiling height), control = stability, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Build quality", hint: "steel, welds, finish, knurling, how it has held up" },
    { column: "comfortRating", label: "Ease of use", hint: "adjusting, changing weights, attachments, assembly" },
    { column: "maneuverabilityRating", label: "Space", hint: "footprint, folding or storing it, ceiling height" },
    { column: "controlRating", label: "Stability", hint: "wobble, rattle, how solid it feels under load" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price and the space" },
  ],
  profile: {
    playerLevel: { label: "Training experience", adminLabel: "Experience", options: [
      { value: "Beginner", display: "beginner" }, { value: "Intermediate", display: "intermediate lifter" },
      { value: "Advanced", display: "advanced lifter" }, { value: "Competitive", display: "competes", hint: "powerlifting, weightlifting, CrossFit" },
    ] },
    playingSide: { label: "Where you train", adminLabel: "Space", options: [
      { value: "Garage", display: "trains in a garage" }, { value: "Basement", display: "trains in a basement" },
      { value: "Spare room", display: "trains in a spare room" }, { value: "Apartment", display: "trains in an apartment" },
      { value: "Outdoors", display: "trains outdoors" },
    ] },
    playingStyle: { label: "Main training", adminLabel: "Training", options: [
      { value: "Powerlifting" }, { value: "Bodybuilding" }, { value: "Olympic lifting" }, { value: "CrossFit / conditioning" }, { value: "General fitness" },
    ] },
    timeWithRacket: { label: "Time owning it", adminLabel: "Time owning it", options: [
      { value: "Tried it", hint: "Used a friend's or a gym's", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type (power rack, half rack, FID bench, power bar, bumper plates, functional
  // trainer, air bike…), surface = load as the maker states it (dumbbell weight range, rack rating, bar weight, weight stack),
  // core = build (upright size, steel gauge, hole size, bar shaft), weight = the item's own weight.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Rack", options: ["Dumbbells", "Rack", "Bench", "Barbell", "Plates", "Machine", "Cardio"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Power rack, FID bench, Power bar or Functional trainer" },
    { column: "surface", label: "Load", max: 120, placeholder: "e.g. 5–52.5 lb, 1000 lb rated or 200 lb stack" },
    { column: "core", label: "Build", max: 120, placeholder: "e.g. 3×3 in uprights, 11-gauge steel, 1 in holes" },
    { column: "weight", label: "Item weight", max: 60, placeholder: "e.g. 180 lb" },
  ],
  shapeFilter: ["Dumbbells", "Rack", "Bench", "Barbell", "Plates", "Machine", "Cardio"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Dumbbells", slug: "dumbbells", label: "Dumbbells", intro: "Adjustable dumbbells and fixed hex, rubber-coated and urethane dumbbells" },
    { shape: "Rack", slug: "racks", label: "Racks", intro: "Power racks, half racks, folding and wall-mounted racks and squat stands" },
    { shape: "Bench", slug: "benches", label: "Benches", intro: "Flat, adjustable, FID and folding weight benches" },
    { shape: "Barbell", slug: "barbells", label: "Barbells", intro: "Multipurpose, power, weightlifting, deadlift, trap and specialty bars" },
    { shape: "Plates", slug: "plates", label: "Plates", intro: "Bumper, competition, iron, urethane and calibrated plates" },
    { shape: "Machine", slug: "machines", label: "Machines", intro: "Functional trainers, all-in-one trainers, cable towers, Smith machines, lat pulldowns, belt squats and leg presses" },
    { shape: "Cardio", slug: "cardio", label: "Cardio", intro: "Rowers, air bikes, exercise bikes, ski ergs and treadmills" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "solid build", tone: "pos" },
    { label: "stable", tone: "pos" },
    { label: "smooth", tone: "pos" },
    { label: "quick to adjust", tone: "pos" },
    { label: "space-saving", tone: "pos" },
    { label: "easy assembly", tone: "pos" },
    { label: "great knurling", tone: "pos" },
    { label: "quiet", tone: "pos" },
    { label: "accurate weights", tone: "pos" },
    { label: "good attachments", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "wobbly", tone: "neg" },
    { label: "rattles", tone: "neg" },
    { label: "rust or chipping", tone: "neg" },
    { label: "awkward to adjust", tone: "neg" },
    { label: "hard to assemble", tone: "neg" },
    { label: "loud", tone: "neg" },
    { label: "quality control issues", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "bulky", tone: "neutral" },
    { label: "needs a tall ceiling", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-adjustable-dumbbells", label: "Adjustable dumbbells", title: "Best Adjustable Dumbbells", minReviews: 5,
      intro: "The adjustable dumbbells owners are most consistently happy with.", filters: [{ column: "shape", include: ["Dumbbells"] }, { column: "balance", include: ["Adjustable"] }] },
    { slug: "best-power-racks", label: "Power racks", title: "Best Power Racks for a Home Gym", minReviews: 5,
      intro: "The power racks, half racks and squat stands owners are most consistently happy with.", filters: [{ column: "shape", include: ["Rack"] }] },
    { slug: "best-folding-home-gym-racks", label: "Folding racks", title: "Best Folding and Wall-Mounted Racks", minReviews: 5,
      intro: "The folding and wall-mounted racks owners are most consistently happy with.", filters: [{ column: "shape", include: ["Rack"] }, { column: "balance", include: ["Folding", "Wall-mounted"] }] },
    { slug: "best-home-gym-benches", label: "Benches", title: "Best Weight Benches for a Home Gym", minReviews: 5,
      intro: "The flat, adjustable and FID benches owners are most consistently happy with.", filters: [{ column: "shape", include: ["Bench"] }] },
    { slug: "best-home-gym-barbells", label: "Barbells", title: "Best Barbells for a Home Gym", minReviews: 5,
      intro: "The barbells owners are most consistently happy with.", filters: [{ column: "shape", include: ["Barbell"] }] },
    { slug: "best-home-gym-weight-plates", label: "Plates", title: "Best Weight Plates for a Home Gym", minReviews: 5,
      intro: "The bumper, iron and calibrated plates owners are most consistently happy with.", filters: [{ column: "shape", include: ["Plates"] }] },
    { slug: "best-home-gym-functional-trainers", label: "Cable machines", title: "Best Functional Trainers and Cable Machines", minReviews: 5,
      intro: "The functional trainers, all-in-one trainers and cable towers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Machine"] }] },
    { slug: "best-home-gym-cardio", label: "Cardio", title: "Best Home Gym Cardio Machines", minReviews: 5,
      intro: "The rowers, air bikes, ski ergs and treadmills owners are most consistently happy with.", filters: [{ column: "shape", include: ["Cardio"] }] },
    { slug: "most-stable-home-gym-equipment", label: "Most stable", title: "The Most Stable Home Gym Equipment", minReviews: 5,
      intro: "The racks, benches and machines owners most often call stable.", filters: [{ column: "shape", include: ["Rack", "Bench", "Machine"] }], trait: { tags: ["stable"], minShare: 0.25, against: ["wobbly"], noun: "stability" } },
    { slug: "best-budget-home-gym-equipment", label: "Budget", title: "Best Budget Home Gym Equipment", minReviews: 5,
      intro: "The home gym gear owners most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Other"],
  examples: { brand: "REP Fitness", model: "PR-4000", year: 2026, search: "pr-4000" },
  form: {
    prompts: [["What did you have before?", "Before this I used "], ["How do you use it?", "I mostly use it for "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you had before, or the gym you trained at, and how this compares", "What you use it for and how often", "How solid it feels under load, and how quick it is to adjust or change weights", "Assembly, footprint and ceiling height in your space", "How it has held up and whether it was worth the price"],
  },
  seo: {
    homeTitle: "HomeGymRecs – Real Reviews of Adjustable Dumbbells, Power Racks, Benches and Home Gym Gear",
    homeDescription: "Browse real owner reviews of adjustable dumbbells, power racks, weight benches, barbells, plates, functional trainers, rowers and air bikes, plus opinions collected from Reddit, YouTube, retailers and forums. Compare REP Fitness, Titan, Bowflex, PowerBlock, Force USA, Bells of Steel, PRx, Ironmaster, Concept2 and more.",
    layoutDescription: "Real experiences with home gym equipment — dumbbells, racks, benches, barbells, plates, machines and cardio gear — plus opinions from Reddit, YouTube, retailers and forums with the source linked.",
    titleTemplate: "%s | HomeGymRecs",
    catalog: { title: "All Home Gym Equipment – Reviews and Ratings", description: "Every adjustable dumbbell, rack, bench, barbell, plate, cable machine and cardio machine on HomeGymRecs with owner ratings. Filter by brand and category, then read what owners say." },
    brands: { title: "Home Gym Equipment Brands", description: "Browse home gym gear by brand — REP Fitness, Titan Fitness, Bowflex, PowerBlock, Force USA, Bells of Steel, PRx Performance, Ironmaster, Concept2 and more — and read real reviews of each model." },
    brand: brand => ({ title: `${brand} Home Gym Equipment – Reviews`, description: `Real owner reviews of ${brand} home gym equipment: ratings, strengths and weaknesses for every ${brand} model on HomeGymRecs.` }),
    product: name => ({ title: `${name} Reviews | HomeGymRecs`, description: `Read real owner experiences with the ${name}. Ratings for build quality, ease of use, space, stability and value, plus opinions from around the web.` }),
    productNotFound: "Equipment not found | HomeGymRecs",
    productCategory: "Home gym equipment",
    addReview: { title: "Add a Home Gym Equipment Review", description: "Own adjustable dumbbells, a rack, a bench, a barbell, plates, a cable machine or a rower? Share how it works for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why HomeGymRecs exists: home gym opinions are scattered across Reddit, YouTube, retailers and forums. HomeGymRecs collects them and lets owners add their own." },
    ogAlt: "HomeGymRecs – real reviews of home gym equipment",
    ogProductAlt: "Home gym equipment reviews on HomeGymRecs",
    ogEyebrow: "Real reviews of home gym equipment",
    ogTitle: "Home gym reviews from people who lift with it",
    ogDetail: "From owners, Reddit, YouTube, retailers and forums",
    ogFallbackTitle: "Home gym equipment reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell others how your dumbbells, rack, bench, barbell, plates, cable machine or cardio machine actually holds up in your home gym. Takes about two minutes, no account needed.",
      howItWent: "how it works for you",
      aboutYou: "About your training",
      aboutYouHint: "optional · helps people find home gyms like theirs",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's training with it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that equipment or page. Maybe it moved, maybe it was discontinued, maybe it’s under a pile of plates in the corner of the garage.",
    about: {
      heading: "Why HomeGymRecs exists",
      paragraphs: [
        "Home gym opinions are scattered across Reddit, YouTube, retailers and forums. HomeGymRecs puts those experiences in one place and lets owners add their own.",
        "A rack that is perfect in a garage with a 9-foot ceiling won’t fit a basement, and dumbbells that are fine for curls may be slow to change between supersets. Knowing where someone trains, how they train and what they had before often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Ratings come from owner submissions, and external comments stay separate from those ratings. Item pages link to Amazon, and HomeGymRecs may earn a commission when you buy through those links; that never changes a rating or ranking." },
        { heading: "A work in progress", body: "HomeGymRecs is new. Submissions are moderated before publication, web reviews link to their sources, and product details come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about equipment you actually own or have used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
