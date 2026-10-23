import type { Niche } from "./types";

// Rating icons: a small monitor, slate bezel and stand around a cyan screen. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const screen = (size: "tile" | "pick", on: boolean) => {
  const [box, frame, glass, stand, w] = size === "tile"
    ? ["width='17' height='14' viewBox='0 0 17 14'", [1.6, 1.2, 13.8, 8.8, 1.3], [3, 2.6, 11, 6], "M8.5 10v2.2M5.6 12.6h5.8", 1.4]
    : ["viewBox='0 0 20 20'", [1.5, 2.5, 17, 11, 1.6], [3.2, 4.2, 13.6, 7.6], "M10 13.5v2.8M6.5 17h7", 1.7];
  const [fx, fy, fw, fh, rx] = frame as number[], [gx, gy, gw, gh] = glass as number[];
  const [bezel, fill] = on ? ["#0f172a", "#06b6d4"] : ["#e2e8f0", "#e2e8f0"];
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}><rect x='${fx}' y='${fy}' width='${fw}' height='${fh}' rx='${rx}' fill='${bezel}'/><rect x='${gx}' y='${gy}' width='${gw}' height='${gh}' rx='.5' fill='${fill}'/><path d='${stand}' stroke='${bezel}' stroke-width='${w}' stroke-linecap='round'/></svg>`);
};
const ogScreen = (bezel: string, glass: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="1.5" y="2.5" width="17" height="11" rx="1.6" fill="${bezel}"/><rect x="3.2" y="4.2" width="13.6" height="7.6" rx=".5" fill="${glass}"/><path d="M10 13.5v2.8M6.5 17h7" stroke="${bezel}" stroke-width="1.7" stroke-linecap="round"/></svg>`;

export const monitor: Niche = {
  id: "monitor",
  schema: "monitorrecs",
  site: {
    name: "MonitorRecs",
    domain: "monitorrecs.com",
    wordmark: "monitorrecs",
    descriptor: "owner reviews of gaming, ultrawide, office and Mac monitors",
    footer: "kept by people who have opinions about pixel density. No affiliate links.",
    analyticsId: "G-ZSXHEFL9BE",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "monitor", many: "monitors", One: "Monitor", Many: "Monitors" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // Makers name each model by its model number (AW3225QF, PG32UCDM3, U2725QE), so no years.
  productYears: false,
  productPath: "monitors",
  scoreUnit: { one: "screen", many: "screens" },
  // White page, deep slate, one cyan accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f4f7fa",
    "--ink": "#0f172a",
    "--ink-2": "#334155",
    "--ink-3": "#64748b",
    "--line": "#e2e8f0",
    "--line-2": "#cbd5e1",
    "--green": "#0f172a",
    "--green-ink": "#020617",
    "--green-wash": "#eef2f7",
    "--green-line": "#c7d0dd",
    "--on-green": "#f1f5f9",
    "--on-green-muted": "#a5b4c8",
    "--lime": "#22d3ee",
    "--lime-wash": "#ecfeff",
    "--lime-line": "#a5f3fc",
    "--lime-ink": "#0e7490",
    "--lime-ink-2": "#155e75",
    "--score-on": screen("tile", true),
    "--score-off": screen("tile", false),
    "--score-pick-on": screen("pick", true),
    "--score-pick-off": screen("pick", false),
  },
  chartColors: ["var(--green)", "#06b6d4", "#cbd5e1", "#a5b4c8", "#a5f3fc", "#94a3b8"],
  og: {
    background: "#0f172a",
    accent: "#22d3ee",
    muted: "#a5b4c8",
    text: "#f1f5f9",
    scoreOn: ogScreen("#f1f5f9", "#22d3ee"),
    scoreOff: ogScreen("#334155", "#334155"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for monitors: power = picture, maneuverability = motion, control = build & stand,
  // comfort = features & ports, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Picture quality", hint: "sharpness, colour, contrast, HDR" },
    { column: "maneuverabilityRating", label: "Motion", hint: "refresh rate, response time, smoothness" },
    { column: "controlRating", label: "Build & stand", hint: "materials, stand, uniformity, no defects" },
    { column: "comfortRating", label: "Features & ports", hint: "inputs, USB-C, KVM, menus and software" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Gaming", display: "uses it mostly for gaming" }, { value: "Office work", display: "uses it for office work" }, { value: "Programming", display: "uses it for programming" },
      { value: "Photo / video editing", display: "uses it for photo and video editing" }, { value: "Movies / media", display: "uses it for movies and media" }, { value: "A bit of everything", display: "uses it for a bit of everything" },
    ] },
    playingSide: { label: "Connected to", adminLabel: "Connected to", options: [
      { value: "Windows PC", display: "on a Windows PC" }, { value: "Mac", display: "on a Mac" }, { value: "Laptop", display: "on a laptop" }, { value: "Console", display: "on a console" }, { value: "Several devices", display: "on several devices" },
    ] },
    playingStyle: { label: "Hours a day", adminLabel: "Hours a day", options: [
      { value: "A few hours", hint: "evenings, weekends" }, { value: "Half the day", hint: "4–6 hours" }, { value: "All day", hint: "8 hours or more" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "In a shop or returned it", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = panel, surface = screen (size, resolution, refresh rate, curve), core = inputs, weight = weight.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Gaming", options: ["Gaming", "Ultrawide", "Productivity", "Mac & creator", "Portable"] },
    { column: "balance", label: "Panel", max: 120, placeholder: "e.g. QD-OLED" },
    { column: "surface", label: "Screen", max: 200, placeholder: "e.g. 27\" 2560×1440, 240 Hz" },
    { column: "core", label: "Inputs", max: 200, placeholder: "e.g. DisplayPort 1.4, 2× HDMI 2.1, USB-C" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 6.5 kg with stand" },
  ],
  shapeFilter: ["Gaming", "Ultrawide", "Productivity", "Mac & creator", "Portable"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Gaming", slug: "gaming-monitors", label: "Gaming", intro: "High-refresh OLED, IPS, VA and TN gaming monitors, from 24\" esports panels to 32\" 4K" },
    { shape: "Ultrawide", slug: "ultrawide-monitors", label: "Ultrawide", intro: "21:9 and 32:9 ultrawide and super ultrawide monitors, for gaming and for work" },
    { shape: "Productivity", slug: "productivity-monitors", label: "Productivity", intro: "Office and work monitors: sharp text, USB-C docking, good stands" },
    { shape: "Mac & creator", slug: "mac-monitors", label: "Mac & creator", intro: "4K, 5K and 6K monitors for Macs, photo and video work, with accurate colour" },
    { shape: "Portable", slug: "portable-monitors", label: "Portable", intro: "Portable USB-C monitors for laptops, travel and a second screen anywhere" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews. The first five, quality control,
  // durability, connection and bad software came over with the monitor reviews from GamingRecs.
  tags: [
    { label: "great picture", tone: "pos" },
    { label: "sharp text", tone: "pos" },
    { label: "great HDR", tone: "pos" },
    { label: "smooth motion", tone: "pos" },
    { label: "solid build", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "quality control issues", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "connection issues", tone: "neg" },
    { label: "bad software", tone: "neg" },
    { label: "text fringing", tone: "neg" },
    { label: "backlight bleed", tone: "neg" },
    { label: "burn-in", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "glossy", tone: "neutral" },
    { label: "matte", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough monitors in it have reviews.
  topLists: [
    { slug: "best-gaming-monitors", label: "Gaming", title: "Best Gaming Monitors", minReviews: 5,
      intro: "The gaming monitors owners are most consistently happy with.", filters: [{ column: "shape", include: ["Gaming"] }] },
    { slug: "best-oled-monitors", label: "OLED", title: "Best OLED Monitors", minReviews: 5,
      intro: "The OLED and QD-OLED monitors owners are most consistently happy with.", filters: [{ column: "balance", include: ["OLED", "QD-OLED", "WOLED"] }] },
    { slug: "best-ultrawide-monitors", label: "Ultrawide", title: "Best Ultrawide Monitors", minReviews: 5,
      intro: "The ultrawide and super ultrawide monitors owners are most consistently happy with.", filters: [{ column: "shape", include: ["Ultrawide"] }] },
    { slug: "best-monitors-for-mac", label: "Mac & creator", title: "Best Monitors for Mac", minReviews: 5,
      intro: "The 4K, 5K and 6K monitors Mac users and creators are most consistently happy with.", filters: [{ column: "shape", include: ["Mac & creator"] }] },
    { slug: "best-productivity-monitors", label: "Productivity", title: "Best Productivity Monitors", minReviews: 5,
      intro: "The office and work monitors owners are most consistently happy with.", filters: [{ column: "shape", include: ["Productivity"] }] },
    { slug: "best-budget-monitors", label: "Budget", title: "Best Budget Monitors", minReviews: 5,
      intro: "The monitors owners most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
    { slug: "best-portable-monitors", label: "Portable", title: "Best Portable Monitors", minReviews: 5,
      intro: "The portable monitors owners are most consistently happy with.", filters: [{ column: "shape", include: ["Portable"] }] },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Other"],
  examples: { brand: "Dell", model: "UltraSharp U2725QE", year: 2026, search: "dell" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["What do you use it for?", "I mostly use it for "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you used before, and how this compares", "What you use it for, and what it's connected to (PC, Mac, console, laptop)", "Picture: text clarity, colour, brightness, HDR and motion", "Build, stand, ports and any defects (dead pixels, bleed, burn-in, flicker)", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "MonitorRecs – Real Owner Reviews of Gaming, Ultrawide, Office and Mac Monitors",
    homeDescription: "Browse real reviews of gaming, ultrawide, productivity, Mac and portable monitors from owners, plus opinions collected from Reddit, YouTube, retailers and forums. Compare Dell, Alienware, LG, ASUS, Samsung, MSI, BenQ, Apple and more.",
    layoutDescription: "Real owner experiences with gaming, ultrawide, office, Mac and portable monitors, plus opinions from Reddit, YouTube, retailers and forums with the source linked.",
    titleTemplate: "%s | MonitorRecs",
    catalog: { title: "All Monitors – Owner Reviews and Ratings", description: "Every gaming, ultrawide, productivity, Mac and portable monitor on MonitorRecs with community ratings. Filter by brand and category, then read what owners say." },
    brands: { title: "Monitor Brands", description: "Browse monitors by brand — Dell, Alienware, LG, ASUS, Samsung, MSI, BenQ, Apple and more — and read real owner reviews of each model." },
    brand: brand => ({ title: `${brand} Monitors – Owner Reviews`, description: `Real owner reviews of ${brand} monitors: ratings, strengths and weaknesses for every ${brand} monitor on MonitorRecs.` }),
    product: name => ({ title: `${name} Reviews | MonitorRecs`, description: `Read real owner experiences with the ${name}. Ratings for picture quality, motion, build, features and value, plus opinions from around the web.` }),
    productNotFound: "Monitor not found | MonitorRecs",
    productCategory: "Monitors",
    addReview: { title: "Add a Monitor Review", description: "Own a monitor? Share how it looks and holds up in about two minutes. No account needed." },
    about: { title: "About", description: "Why MonitorRecs exists: monitor opinions are scattered across Reddit, YouTube, retailers and forums. MonitorRecs collects them and lets owners add their own." },
    ogAlt: "MonitorRecs – real owner reviews of monitors",
    ogProductAlt: "Monitor reviews on MonitorRecs",
    ogEyebrow: "Owner reviews of monitors",
    ogTitle: "Monitor reviews from people who stare at them all day",
    ogDetail: "From owners, Reddit, YouTube, retailers and forums",
    ogFallbackTitle: "Monitor reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other people how a monitor actually looks and holds up for you. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About your setup",
      aboutYouHint: "optional · helps people find owners like them",
      howItPerforms: "How it looks",
      whoUsesIt: "Who's using it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that monitor or page. Maybe it moved, maybe it was discontinued, maybe it’s on the wrong input.",
    about: {
      heading: "Why MonitorRecs exists",
      paragraphs: [
        "Monitor opinions are scattered across Reddit, YouTube, retailers and forums. MonitorRecs puts those experiences in one place and lets owners add their own.",
        "A monitor that suits one person won’t suit everyone. Knowing what someone uses it for, what it’s connected to and what they had before often tells you more than a spec sheet or a score on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from owner submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "MonitorRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about monitors you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
