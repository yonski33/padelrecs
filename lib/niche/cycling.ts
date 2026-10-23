import type { Niche } from "./types";

// Rating icons: a bicycle wheel, navy tyre around a yellow rim with spokes and hub. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const wheel = (size: "tile" | "pick", on: boolean) => {
  const [box, cx, cy, r, w] = size === "tile" ? ["width='17' height='14' viewBox='0 0 17 14'", 8.5, 7, 5.6, 1.6] : ["viewBox='0 0 20 20'", 10, 10, 7.8, 2];
  const k = r * 0.62, d = k * 0.707;
  const spokes = `M${cx - k} ${cy}H${cx + k}M${cx} ${cy - k}V${cy + k}M${cx - d} ${cy - d}L${cx + d} ${cy + d}M${cx - d} ${cy + d}L${cx + d} ${cy - d}`;
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><circle cx='${cx}' cy='${cy}' r='${r}' fill='none' stroke='#12355b' stroke-width='${w}'/><circle cx='${cx}' cy='${cy}' r='${r - w}' fill='none' stroke='#f5c400' stroke-width='${w * 0.55}'/><path d='${spokes}' stroke='#12355b' stroke-width='${w * 0.32}'/><circle cx='${cx}' cy='${cy}' r='${r * 0.16}' fill='#12355b'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><circle cx='${cx}' cy='${cy}' r='${r}' fill='none' stroke='#e1e6ee' stroke-width='${w}'/></svg>`);
};
const ogWheel = (tyre: string, rim: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.8" fill="none" stroke="${tyre}" stroke-width="2"/><circle cx="10" cy="10" r="5.8" fill="none" stroke="${rim}" stroke-width="1.1"/><path d="M5.2 10H14.8M10 5.2V14.8M6.6 6.6L13.4 13.4M6.6 13.4L13.4 6.6" stroke="${tyre}" stroke-width=".65"/><circle cx="10" cy="10" r="1.25" fill="${tyre}"/></svg>`;

export const cycling: Niche = {
  id: "cycling",
  schema: "cyclingrecs",
  site: {
    name: "CyclingRecs",
    domain: "cyclingrecs.com",
    wordmark: "cyclingrecs",
    descriptor: "rider reviews of road, gravel and mountain bikes",
    footer: "kept by people who check the weather before anything else. No affiliate links.",
    analyticsId: "G-EENFGQMCKG",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "bike", many: "bikes", One: "Bike", Many: "Bikes" },
  people: { one: "rider", many: "riders", One: "Rider", Many: "Riders" },
  // One product per model and frame tier; makers that name generations put them in the name (Trek Domane SL Gen 5, Tarmac SL9).
  productYears: false,
  productPath: "bikes",
  scoreUnit: { one: "wheel", many: "wheels" },
  // White page, deep road navy, one maillot-jaune yellow accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f3f6fa",
    "--ink": "#0f1b2d",
    "--ink-2": "#334155",
    "--ink-3": "#64748b",
    "--line": "#e1e6ee",
    "--line-2": "#c8d1de",
    "--green": "#12355b",
    "--green-ink": "#0b2340",
    "--green-wash": "#e7eef6",
    "--green-line": "#b6c8dd",
    "--on-green": "#f1f5fa",
    "--on-green-muted": "#a8bdd6",
    "--lime": "#f5c400",
    "--lime-wash": "#fff7d1",
    "--lime-line": "#f2d66b",
    "--lime-ink": "#5e4a00",
    "--lime-ink-2": "#463700",
    "--score-on": wheel("tile", true),
    "--score-off": wheel("tile", false),
    "--score-pick-on": wheel("pick", true),
    "--score-pick-off": wheel("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#c8d1de", "#a8bdd6", "#f2d66b", "#94a3b8"],
  og: {
    background: "#12355b",
    accent: "#f5c400",
    muted: "#a8bdd6",
    text: "#f1f5fa",
    scoreOn: ogWheel("#f1f5fa", "#f5c400"),
    scoreOff: ogWheel("#2f5480", "#2f5480"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for bikes: power = speed & efficiency, control = handling,
  // comfort = comfort & fit, maneuverability = parts & spec, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Speed & efficiency", hint: "how fast it feels, climbing, power transfer, pedaling" },
    { column: "comfortRating", label: "Comfort & fit", hint: "long rides, rough surfaces, fit and position" },
    { column: "controlRating", label: "Handling", hint: "cornering, stability, descending, confidence" },
    { column: "maneuverabilityRating", label: "Parts & spec", hint: "groupset, wheels, brakes, suspension, tyres" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main riding", adminLabel: "Main riding", options: [
      { value: "Road", display: "rides mostly on the road" }, { value: "Gravel", display: "rides mostly gravel" }, { value: "Trail / enduro", display: "rides trail and enduro" },
      { value: "Cross-country", display: "rides cross-country" }, { value: "Commuting", display: "rides mostly to get around" }, { value: "Bikepacking / touring", display: "goes bikepacking and touring" }, { value: "A bit of everything", display: "rides a bit of everything" },
    ] },
    playingSide: { label: "Experience", adminLabel: "Experience", options: [
      { value: "New rider", display: "new to cycling" }, { value: "A few years", display: "riding for a few years" }, { value: "Experienced", display: "an experienced rider" }, { value: "Racer", display: "races" },
    ] },
    playingStyle: { label: "How much you ride", adminLabel: "How much you ride", options: [
      { value: "Casual", hint: "a ride or two a week" }, { value: "Regular", hint: "several rides a week" }, { value: "A lot", hint: "most days, long weekend rides" }, { value: "Training / racing", hint: "structured training or racing" },
    ] },
    timeWithRacket: { label: "Time riding it", adminLabel: "Time riding it", options: [
      { value: "Test ride", hint: "A demo or a test ride", display: "test rode it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type, weight = frame material, core = builds, surface = notes.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Gravel", options: ["Road", "Gravel", "Mountain"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Endurance, Trail, Cyclocross" },
    { column: "weight", label: "Frame", max: 120, placeholder: "e.g. Carbon" },
    { column: "core", label: "Builds", max: 200, placeholder: "e.g. Shimano 105 Di2, SRAM Rival AXS" },
    { column: "surface", label: "Notes", max: 200, placeholder: "e.g. 50 mm tyre clearance" },
  ],
  shapeFilter: ["Road", "Gravel", "Mountain"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Road", slug: "road-bikes", label: "Road bikes", intro: "Race, aero, endurance and triathlon road bikes" },
    { shape: "Gravel", slug: "gravel-bikes", label: "Gravel bikes", intro: "Gravel race, adventure and cyclocross bikes" },
    { shape: "Mountain", slug: "mountain-bikes", label: "Mountain bikes", intro: "Cross-country, trail, enduro and downhill bikes, full suspension and hardtail" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "fast", tone: "pos" },
    { label: "comfortable", tone: "pos" },
    { label: "lightweight", tone: "pos" },
    { label: "climbs well", tone: "pos" },
    { label: "great handling", tone: "pos" },
    { label: "confident descending", tone: "pos" },
    { label: "efficient pedaling", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "harsh ride", tone: "neg" },
    { label: "twitchy", tone: "neg" },
    { label: "heavy", tone: "neg" },
    { label: "creaks", tone: "neg" },
    { label: "quality control issues", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "aggressive fit", tone: "neutral" },
    { label: "relaxed fit", tone: "neutral" },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Bike shop", "Forum", "Other"],
  examples: { brand: "Canyon", model: "Grail CF SLX", year: 2026, search: "canyon" },
  form: {
    prompts: [["What did you ride before?", "Before this I rode "], ["Where do you ride it?", "I mostly ride "], ["Any issues?", "After a while I noticed "]],
    tips: ["Which build you have, and any upgrades", "Where you ride it and how far", "Your height and frame size, and how the fit feels", "What you rode before, and how this compares", "Creaks, defects and whether it was worth the price"],
  },
  seo: {
    homeTitle: "CyclingRecs – Real Rider Reviews of Road, Gravel and Mountain Bikes",
    homeDescription: "Browse real reviews of road, gravel and mountain bikes from riders, plus opinions collected from Reddit, YouTube, bike shops and forums. Compare Trek, Specialized, Canyon, Giant, Cannondale, Santa Cruz, Cervélo, BMC, Yeti, Pivot and more.",
    layoutDescription: "Real rider experiences with road, gravel and mountain bikes, plus opinions from Reddit, YouTube, bike shops and forums with the source linked.",
    titleTemplate: "%s | CyclingRecs",
    catalog: { title: "All Bikes – Rider Reviews and Ratings", description: "Every road, gravel and mountain bike on CyclingRecs with community ratings. Filter by brand and category, then read what riders say." },
    brands: { title: "Bike Brands", description: "Browse bikes by brand — Trek, Specialized, Canyon, Giant, Cannondale, Santa Cruz, Cervélo, BMC, Yeti, Pivot and more — and read real rider reviews of each model." },
    brand: brand => ({ title: `${brand} Bikes – Rider Reviews`, description: `Real rider reviews of ${brand} bikes: ratings, strengths and weaknesses for every ${brand} model on CyclingRecs.` }),
    product: name => ({ title: `${name} Reviews | CyclingRecs`, description: `Read real rider experiences with the ${name}. Ratings for speed, comfort, handling, parts and value, plus opinions from around the web.` }),
    productNotFound: "Bike not found | CyclingRecs",
    productCategory: "Bicycle",
    addReview: { title: "Add a Bike Review", description: "Own or rented a road, gravel or mountain bike? Share how it rides in about two minutes. No account needed." },
    about: { title: "About", description: "Why CyclingRecs exists: bike opinions are scattered across Reddit, YouTube, bike shops and forums. CyclingRecs collects them and lets riders add their own." },
    ogAlt: "CyclingRecs – real rider reviews of bikes",
    ogProductAlt: "Bike reviews on CyclingRecs",
    ogEyebrow: "Rider reviews of road, gravel and mountain bikes",
    ogTitle: "Bike reviews from people who ride them",
    ogDetail: "From riders, Reddit, YouTube, bike shops and forums",
    ogFallbackTitle: "Bike reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other riders how a bike actually rides for you. Takes about two minutes, no account needed.",
      howItWent: "how it rides",
      aboutYou: "About your riding",
      aboutYouHint: "optional · helps people find riders like them",
      howItPerforms: "How it rides",
      whoUsesIt: "Who's riding it",
      triedIt: "Ridden it?",
      triedOne: "Ridden one?",
      triedOneOfThese: "Ridden one of these?",
    },
    notFound: "We couldn’t find that bike or page. Maybe it moved, maybe it was discontinued, maybe it took a wrong turn at the gravel fork.",
    about: {
      heading: "Why CyclingRecs exists",
      paragraphs: [
        "Bike opinions are scattered across Reddit, YouTube, bike shops and forums. CyclingRecs puts those experiences in one place and lets riders add their own.",
        "A bike that suits one rider won’t suit everyone. Knowing where someone rides, how far, which build they have and what they rode before often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Riders, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from rider submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "CyclingRecs is new. Submissions are moderated before publication, web reviews link to their sources, and bike details come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about a bike you’ve actually ridden and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
