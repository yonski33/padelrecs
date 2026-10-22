import type { Niche } from "./types";

// Rating icons: a steering wheel from the front, a signal-red rim with three asphalt spokes and hub. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const wheel = (size: "tile" | "pick", on: boolean) => {
  const [box, cx, cy, r, w] = size === "tile" ? ["width='17' height='14' viewBox='0 0 17 14'", 8.5, 7, 5.4, 1.9] : ["viewBox='0 0 20 20'", 10, 10, 7.4, 2.4];
  const spokes = `M${cx - r} ${cy}H${cx + r}M${cx} ${cy}V${cy + r}`;
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><circle cx='${cx}' cy='${cy}' r='${r}' fill='none' stroke='#e10600' stroke-width='${w}'/><path d='${spokes}' stroke='#1e293b' stroke-width='${w * 0.75}'/><circle cx='${cx}' cy='${cy}' r='${r * 0.32}' fill='#1e293b'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><circle cx='${cx}' cy='${cy}' r='${r}' fill='none' stroke='#e2e6ec' stroke-width='${w}'/></svg>`);
};
const ogWheel = (rim: string, hub: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.4" fill="none" stroke="${rim}" stroke-width="2.4"/><path d="M2.6 10H17.4M10 10V17.4" stroke="${hub}" stroke-width="1.8"/><circle cx="10" cy="10" r="2.4" fill="${hub}"/></svg>`;

export const simracing: Niche = {
  id: "simracing",
  schema: "simracingrecs",
  site: {
    name: "SimRacingRecs",
    domain: "simracingrecs.com",
    wordmark: "simracingrecs",
    descriptor: "driver reviews of sim racing gear",
    footer: "kept by people whose rig takes up most of the spare room. No affiliate links.",
    // analyticsId: add the GA4 measurement id ("G-…") once the owner creates the property.
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "driver", many: "drivers", One: "Driver", Many: "Drivers" },
  // Makers name each generation (R9 V3, CSL DD, Simucube 3), so names carry the generation instead of a year.
  productYears: false,
  productPath: "gear",
  scoreUnit: { one: "wheel", many: "wheels" },
  // White page, deep asphalt slate, one signal-red accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f3f5f8",
    "--ink": "#111827",
    "--ink-2": "#374151",
    "--ink-3": "#6b7280",
    "--line": "#e2e6ec",
    "--line-2": "#cbd2db",
    "--green": "#1e293b",
    "--green-ink": "#0f172a",
    "--green-wash": "#e8ecf2",
    "--green-line": "#b9c4d4",
    "--on-green": "#eef2f7",
    "--on-green-muted": "#a9b6c8",
    "--lime": "#e10600",
    "--lime-wash": "#fde8e7",
    "--lime-line": "#f5a3a0",
    "--lime-ink": "#8a0f0a",
    "--lime-ink-2": "#650b07",
    "--score-on": wheel("tile", true),
    "--score-off": wheel("tile", false),
    "--score-pick-on": wheel("pick", true),
    "--score-pick-off": wheel("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#cbd2db", "#a9b6c8", "#f5a3a0", "#94a3b8"],
  og: {
    background: "#1e293b",
    accent: "#e10600",
    muted: "#a9b6c8",
    text: "#eef2f7",
    scoreOn: ogWheel("#e10600", "#eef2f7"),
    scoreOff: ogWheel("#475569", "#475569"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled so they fit every part of a rig: power = performance, control = build quality,
  // comfort = feel & ergonomics, maneuverability = software & compatibility, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Performance", hint: "force feedback, pedal feel, shift feel, rigidity" },
    { column: "comfortRating", label: "Feel & ergonomics", hint: "grip, button reach, seating and pedal position" },
    { column: "controlRating", label: "Build quality", hint: "materials, flex, durability, no defects" },
    { column: "maneuverabilityRating", label: "Software & compatibility", hint: "drivers, app, platforms, other brands' gear" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main sims", adminLabel: "Main sims", options: [
      { value: "iRacing", display: "races on iRacing" }, { value: "Assetto Corsa / ACC / ACE", display: "races in Assetto Corsa" }, { value: "Le Mans Ultimate / rFactor 2", display: "races in Le Mans Ultimate and rFactor 2" }, { value: "Gran Turismo / Forza / F1", display: "plays Gran Turismo, Forza and F1" }, { value: "Rally / drift", display: "drives rally and drift" }, { value: "Trucks / farming", display: "drives trucks and farming sims" }, { value: "A bit of everything", display: "drives a bit of everything" },
    ] },
    playingSide: { label: "Platform", adminLabel: "Platform", options: [
      { value: "PC", display: "on PC" }, { value: "PlayStation", display: "on PlayStation" }, { value: "Xbox", display: "on Xbox" }, { value: "Several", display: "on several platforms" },
    ] },
    playingStyle: { label: "How you race", adminLabel: "How you race", options: [
      { value: "Casual", hint: "a few hours a week" }, { value: "Regular", hint: "most days" }, { value: "Leagues", hint: "league or online ranked racing" }, { value: "Competitive", hint: "esports or real-world racing practice" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "At a friend's rig or a few sessions", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = type, weight = peak torque or brake force, core = platforms, surface = notes.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Wheelbase", options: ["Wheelbase", "Wheel", "Pedals", "Cockpit", "Shifter / handbrake"] },
    { column: "balance", label: "Type", max: 120, placeholder: "e.g. Direct drive" },
    { column: "weight", label: "Torque / brake force", max: 120, placeholder: "e.g. 12 Nm, or 100 kg load cell" },
    { column: "core", label: "Platforms", max: 200, placeholder: "e.g. PC, PlayStation, Xbox" },
    { column: "surface", label: "Notes", max: 200, placeholder: "e.g. Sold as a bundle" },
  ],
  shapeFilter: ["Wheelbase", "Wheel", "Pedals", "Cockpit", "Shifter / handbrake"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Wheelbase", slug: "wheelbases", label: "Wheelbases", intro: "Direct drive, belt and gear wheelbases, and complete wheel sets" },
    { shape: "Wheel", slug: "wheels", label: "Wheels", intro: "Formula, GT, round and rally steering wheels and rims" },
    { shape: "Pedals", slug: "pedals", label: "Pedals", intro: "Load cell, hydraulic and active pedal sets" },
    { shape: "Cockpit", slug: "cockpits", label: "Cockpits", intro: "Aluminium profile rigs, tube cockpits and wheel stands" },
    { shape: "Shifter / handbrake", slug: "shifters-handbrakes", label: "Shifters & handbrakes", intro: "H-pattern and sequential shifters and handbrakes" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "detailed force feedback", tone: "pos" },
    { label: "strong force feedback", tone: "pos" },
    { label: "great brake feel", tone: "pos" },
    { label: "rigid", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "great ergonomics", tone: "pos" },
    { label: "good software", tone: "pos" },
    { label: "easy setup", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "flex", tone: "neg" },
    { label: "noisy", tone: "neg" },
    { label: "bad software", tone: "neg" },
    { label: "quality control issues", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "console compatible", tone: "neutral" },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Sim racing shop", "Forum", "Other"],
  examples: { brand: "Fanatec", model: "CSL DD 8 Nm", year: 2026, search: "fanatec" },
  form: {
    prompts: [["What did you upgrade from?", "Before this I used "], ["What do you race?", "I mostly race "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you upgraded from, and how this compares", "Which sims you race and on which platform", "What it's mounted to, and any flex", "Software, firmware and compatibility with your other gear", "Build quality, defects and whether it was worth the price"],
  },
  seo: {
    homeTitle: "SimRacingRecs – Real Driver Reviews of Sim Racing Gear",
    homeDescription: "Browse real reviews of sim racing wheelbases, steering wheels, pedals, cockpits and shifters from sim racers, plus opinions collected from Reddit, YouTube, sim racing shops and forums. Compare Fanatec, MOZA, Simucube, Simagic, Thrustmaster, Logitech, Asetek, Heusinkveld and more.",
    layoutDescription: "Real sim racer experiences with wheelbases, wheels, pedals, cockpits and shifters, plus opinions from Reddit, YouTube, sim racing shops and forums with the source linked.",
    titleTemplate: "%s | SimRacingRecs",
    catalog: { title: "All Sim Racing Gear – Driver Reviews and Ratings", description: "Every wheelbase, wheel, pedal set, cockpit and shifter on SimRacingRecs with community ratings. Filter by brand and category, then read what sim racers say." },
    brands: { title: "Sim Racing Brands", description: "Browse sim racing gear by brand — Fanatec, MOZA, Simucube, Simagic, Thrustmaster, Logitech, Asetek, Heusinkveld, Sim-Lab, Trak Racer, Next Level Racing and more — and read real driver reviews of each product." },
    brand: brand => ({ title: `${brand} Sim Racing Gear – Driver Reviews`, description: `Real sim racer reviews of ${brand} gear: ratings, strengths and weaknesses for every ${brand} product on SimRacingRecs.` }),
    product: name => ({ title: `${name} Reviews | SimRacingRecs`, description: `Read real sim racer experiences with the ${name}. Ratings for performance, feel, build quality, software and value, plus opinions from around the web.` }),
    productNotFound: "Product not found | SimRacingRecs",
    productCategory: "Sim racing gear",
    addReview: { title: "Add a Sim Racing Gear Review", description: "Raced on a wheelbase, wheel, pedal set, cockpit or shifter? Share how it held up in about two minutes. No account needed." },
    about: { title: "About", description: "Why SimRacingRecs exists: sim racing gear opinions are scattered across Reddit, YouTube, sim racing shops and forums. SimRacingRecs collects them and lets sim racers add their own." },
    ogAlt: "SimRacingRecs – real driver reviews of sim racing gear",
    ogProductAlt: "Sim racing gear reviews on SimRacingRecs",
    ogEyebrow: "Driver reviews of sim racing gear",
    ogTitle: "Sim racing gear reviews from people who race on it",
    ogDetail: "From sim racers, Reddit, YouTube, sim racing shops and forums",
    ogFallbackTitle: "Sim racing gear reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other sim racers how a piece of gear actually held up for you. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About your racing",
      aboutYouHint: "optional · helps people find drivers like them",
      howItPerforms: "How it performs",
      whoUsesIt: "Who's racing on it",
      triedIt: "Raced on it?",
      triedOne: "Raced on one?",
      triedOneOfThese: "Raced on one of these?",
    },
    notFound: "We couldn’t find that product or page. Maybe it moved, maybe it was discontinued, maybe it went off at turn one.",
    about: {
      heading: "Why SimRacingRecs exists",
      paragraphs: [
        "Sim racing gear opinions are scattered across Reddit, YouTube, sim racing shops and forums. SimRacingRecs puts those experiences in one place and lets sim racers add their own.",
        "A wheelbase or pedal set that suits one driver won’t suit everyone. Knowing which sims someone races, on which platform, what it’s mounted to and what they upgraded from often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Drivers, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from driver submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "SimRacingRecs is new. Submissions are moderated before publication, web reviews link to their sources, and product details come from the makers’ own published specifications." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about gear you’ve actually raced on and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
