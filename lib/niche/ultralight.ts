import type { Niche } from "./types";

// Rating icons: a small trekking-pole tent, a trail-brown fly over a sky-blue door. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const tentIcon = (size: "tile" | "pick", on: boolean) => {
  const [box, fly, door] = size === "tile"
    ? ["width='17' height='14' viewBox='0 0 17 14'", "M8.5 1.2L15.8 12.8H1.2z", "M8.5 5.6L11.2 12.8H5.8z"]
    : ["viewBox='0 0 20 20'", "M10 2L18.5 17H1.5z", "M10 7.6L13.2 17H6.8z"];
  const [shell, glass] = on ? ["#4a3426", "#38bdf8"] : ["#e7e2dc", "#e7e2dc"];
  const rim = on ? "#f5f1ec" : "#ffffff";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${fly}' fill='${shell}' stroke-linejoin='round'/><path d='${door}' fill='${glass}' stroke='${rim}' stroke-width='${size === "tile" ? 0.8 : 1}' stroke-linejoin='round'/></svg>`);
};
const ogTent = (shell: string, glass: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 2L18.5 17H1.5z" fill="${shell}"/><path d="M10 7.6L13.2 17H6.8z" fill="${glass}"/></svg>`;

export const ultralight: Niche = {
  id: "ultralight",
  schema: "ultralightrecs",
  site: {
    name: "UltralightRecs",
    domain: "ultralightrecs.com",
    wordmark: "ultralightrecs",
    descriptor: "hiker reviews of ultralight tents, backpacks, sleeping pads and quilts",
    footer: "kept by people who weigh their toothbrush. No affiliate links.",
    // analyticsId: "G-XXXXXXXXXX", // add once the GA4 property for ultralightrecs.com exists
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "hiker", many: "hikers", One: "Hiker", Many: "Hikers" },
  // Makers name models without years (X-Mid Pro 2, NeoAir XLite NXT, Arc Haul Ultra), so no years.
  productYears: false,
  productPath: "gear",
  scoreUnit: { one: "tent", many: "tents" },
  // White page, trail-brown ink, one sky-blue accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  // --lime is a lighter sky blue so it stays readable on the brown panels; the logo and rating icons use #38bdf8.
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f7f5f2",
    "--ink": "#2a211b",
    "--ink-2": "#4b3f36",
    "--ink-3": "#7a6d63",
    "--line": "#e7e2dc",
    "--line-2": "#d8d1c9",
    "--green": "#4a3426",
    "--green-ink": "#35251b",
    "--green-wash": "#f4efea",
    "--green-line": "#dccfc3",
    "--on-green": "#f5f1ec",
    "--on-green-muted": "#c4b5a8",
    "--lime": "#7dd3fc",
    "--lime-wash": "#f0f9ff",
    "--lime-line": "#bae6fd",
    "--lime-ink": "#0369a1",
    "--lime-ink-2": "#075985",
    "--score-on": tentIcon("tile", true),
    "--score-off": tentIcon("tile", false),
    "--score-pick-on": tentIcon("pick", true),
    "--score-pick-off": tentIcon("pick", false),
  },
  chartColors: ["var(--green)", "#38bdf8", "#d8d1c9", "#a8998c", "#bae6fd", "#94a3b8"],
  og: {
    background: "#4a3426",
    accent: "#7dd3fc",
    muted: "#c4b5a8",
    text: "#f5f1ec",
    scoreOn: ogTent("#f5f1ec", "#7dd3fc"),
    scoreOff: ogTent("#6b5243", "#6b5243"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for backpacking gear: power = weight & packability, comfort = comfort,
  // maneuverability = performance (weather protection, warmth, load carry), control = durability, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Weight & packability", hint: "weight and packed size for what it does" },
    { column: "comfortRating", label: "Comfort", hint: "how it carries, sleeps or lives" },
    { column: "maneuverabilityRating", label: "Performance", hint: "weather protection, warmth, load carrying, setup" },
    { column: "controlRating", label: "Durability", hint: "fabric, seams, zippers and valves over the miles" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Thru-hiking", display: "uses it for thru-hiking" }, { value: "Section hiking", display: "uses it for section hikes" }, { value: "Weekend backpacking", display: "uses it for weekend trips" },
      { value: "Fastpacking", display: "uses it for fastpacking" }, { value: "Bikepacking / packrafting", display: "uses it for bikepacking and packrafting" }, { value: "A bit of everything", display: "uses it for a bit of everything" },
    ] },
    playingSide: { label: "Experience", adminLabel: "Experience", options: [
      { value: "New to backpacking", display: "new to backpacking" }, { value: "A few trips a year", display: "out a few trips a year" }, { value: "Experienced", display: "an experienced backpacker" }, { value: "Thru-hiker", display: "a thru-hiker" },
    ] },
    playingStyle: { label: "Base weight", adminLabel: "Base weight", options: [
      { value: "Under 10 lb", hint: "under 4.5 kg" }, { value: "10–15 lb", hint: "4.5–7 kg" }, { value: "15–20 lb", hint: "7–9 kg" }, { value: "Over 20 lb", hint: "over 9 kg" }, { value: "Not sure" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried it", hint: "In a shop or borrowed", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type (trekking-pole tent, frameless pack, air pad, quilt…),
  // surface = capacity / warmth (people, litres, R-value or temperature), core = main material, weight = weight as the maker states it.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Shelter", options: ["Shelter", "Backpack", "Sleeping pad", "Quilt & bag"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Trekking-pole tent" },
    { column: "surface", label: "Capacity / warmth", max: 120, placeholder: "e.g. 2 person, 55 L, R 4.5 or 20°F" },
    { column: "core", label: "Material", max: 200, placeholder: "e.g. Dyneema Composite Fabric" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 794 g (28 oz)" },
  ],
  shapeFilter: ["Shelter", "Backpack", "Sleeping pad", "Quilt & bag"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Shelter", slug: "tents", label: "Tents & shelters", intro: "Ultralight tents, pyramids and tarps: trekking-pole, semi-freestanding and freestanding" },
    { shape: "Backpack", slug: "backpacks", label: "Backpacks", intro: "Ultralight backpacking packs, from frameless to framed packs for long carries" },
    { shape: "Sleeping pad", slug: "sleeping-pads", label: "Sleeping pads", intro: "Insulated air pads, foam pads and self-inflating pads for backpacking" },
    { shape: "Quilt & bag", slug: "quilts", label: "Quilts & bags", intro: "Down and synthetic backpacking quilts and ultralight sleeping bags" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "light", tone: "pos" },
    { label: "packs small", tone: "pos" },
    { label: "comfortable", tone: "pos" },
    { label: "warm", tone: "pos" },
    { label: "weatherproof", tone: "pos" },
    { label: "durable", tone: "pos" },
    { label: "easy setup", tone: "pos" },
    { label: "roomy", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "condensation", tone: "neg" },
    { label: "cold", tone: "neg" },
    { label: "leaks", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "uncomfortable", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "noisy", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-ultralight-tents", label: "Tents", title: "Best Ultralight Tents", minReviews: 5,
      intro: "The ultralight tents and shelters hikers are most consistently happy with.", filters: [{ column: "shape", include: ["Shelter"] }] },
    { slug: "best-trekking-pole-tents", label: "Trekking-pole tents", title: "Best Trekking Pole Tents", minReviews: 5,
      intro: "The trekking-pole tents hikers are most consistently happy with.", filters: [{ column: "balance", include: ["Trekking-pole"] }] },
    { slug: "best-freestanding-tents", label: "Freestanding tents", title: "Best Ultralight Freestanding Tents", minReviews: 5,
      intro: "The freestanding and semi-freestanding tents hikers are most consistently happy with.", filters: [{ column: "balance", include: ["Freestanding", "Semi-freestanding"] }] },
    { slug: "best-ultralight-backpacks", label: "Backpacks", title: "Best Ultralight Backpacks", minReviews: 5,
      intro: "The ultralight backpacking packs hikers are most consistently happy with.", filters: [{ column: "shape", include: ["Backpack"] }] },
    { slug: "best-ultralight-sleeping-pads", label: "Sleeping pads", title: "Best Ultralight Sleeping Pads", minReviews: 5,
      intro: "The backpacking sleeping pads hikers are most consistently happy with.", filters: [{ column: "shape", include: ["Sleeping pad"] }] },
    { slug: "best-ultralight-quilts", label: "Quilts", title: "Best Ultralight Backpacking Quilts", minReviews: 5,
      intro: "The backpacking quilts hikers are most consistently happy with.", filters: [{ column: "balance", include: ["Quilt"] }] },
    { slug: "best-ultralight-sleeping-bags", label: "Sleeping bags", title: "Best Ultralight Sleeping Bags", minReviews: 5,
      intro: "The ultralight sleeping bags hikers are most consistently happy with.", filters: [{ column: "balance", include: ["Sleeping"] }] },
    { slug: "best-budget-ultralight-gear", label: "Budget", title: "Best Budget Ultralight Gear", minReviews: 5,
      intro: "The tents, packs, pads and quilts hikers most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Outdoor shop", "Forum", "Other"],
  examples: { brand: "Durston", model: "X-Mid Pro 2", year: 2026, search: "durston" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["Where did you take it?", "I used it on "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how this compares", "Where you took it (trail, season, weather) and for how many nights", "Weight, packed size and comfort", "How it handled wind, rain, cold or heavy loads", "Durability, defects and whether it was worth the price"],
  },
  seo: {
    homeTitle: "UltralightRecs – Real Hiker Reviews of Ultralight Tents, Backpacks, Sleeping Pads and Quilts",
    homeDescription: "Browse real reviews of ultralight tents, backpacks, sleeping pads and quilts from hikers and thru-hikers, plus opinions collected from Reddit, YouTube, outdoor shops and forums. Compare Durston, Zpacks, Hyperlite Mountain Gear, Gossamer Gear, Tarptent, ULA, Therm-a-Rest, NEMO, Enlightened Equipment and more.",
    layoutDescription: "Real hiker experiences with ultralight tents, backpacks, sleeping pads and quilts, plus opinions from Reddit, YouTube, outdoor shops and forums with the source linked.",
    titleTemplate: "%s | UltralightRecs",
    catalog: { title: "All Ultralight Gear – Hiker Reviews and Ratings", description: "Every ultralight tent, backpack, sleeping pad and quilt on UltralightRecs with community ratings. Filter by brand and category, then read what hikers say." },
    brands: { title: "Ultralight Gear Brands", description: "Browse ultralight gear by brand — Durston, Zpacks, Hyperlite Mountain Gear, Gossamer Gear, Tarptent, ULA, Therm-a-Rest, NEMO, Enlightened Equipment and more — and read real hiker reviews of each model." },
    brand: brand => ({ title: `${brand} Gear – Hiker Reviews`, description: `Real hiker reviews of ${brand} gear: ratings, strengths and weaknesses for every ${brand} product on UltralightRecs.` }),
    product: name => ({ title: `${name} Reviews | UltralightRecs`, description: `Read real hiker experiences with the ${name}. Ratings for weight, comfort, performance, durability and value, plus opinions from around the web.` }),
    productNotFound: "Gear not found | UltralightRecs",
    productCategory: "Backpacking gear",
    addReview: { title: "Add a Gear Review", description: "Carried a tent, pack, pad or quilt? Share how it held up on trail in about two minutes. No account needed." },
    about: { title: "About", description: "Why UltralightRecs exists: ultralight gear opinions are scattered across Reddit, YouTube, outdoor shops and forums. UltralightRecs collects them and lets hikers add their own." },
    ogAlt: "UltralightRecs – real hiker reviews of ultralight gear",
    ogProductAlt: "Ultralight gear reviews on UltralightRecs",
    ogEyebrow: "Hiker reviews of ultralight gear",
    ogTitle: "Ultralight gear reviews from people who carry it",
    ogDetail: "From hikers, Reddit, YouTube, outdoor shops and forums",
    ogFallbackTitle: "Ultralight gear reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other hikers how a piece of gear actually held up on trail. Takes about two minutes, no account needed.",
      howItWent: "how it held up on trail",
      aboutYou: "About your hiking",
      aboutYouHint: "optional · helps people find hikers like them",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's carrying it",
      triedIt: "Carried it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that gear or page. Maybe it moved, maybe it was discontinued, maybe it got cut from the pack to save weight.",
    about: {
      heading: "Why UltralightRecs exists",
      paragraphs: [
        "Ultralight gear opinions are scattered across Reddit, YouTube, outdoor shops and forums. UltralightRecs puts those experiences in one place and lets hikers add their own.",
        "Gear that suits one hiker won’t suit everyone. Knowing where someone hikes, in what weather, with what base weight and what they carried before often tells you more than a spec sheet or a score on its own.",
      ],
      sections: [
        { heading: "Hikers, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from hiker submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "UltralightRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about gear you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
