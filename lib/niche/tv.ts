import type { Niche } from "./types";

// Rating icons: a flat-screen TV on a stand, near-black with an amber screen glow. Same tile sizes as the other niches
// (17×14 strip, 20×20 picker); the strip icon widens the 20×20 drawing's viewBox so the TV keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const tvShape = (body: string, screen: string, q: string) =>
  `<rect x=${q}1.5${q} y=${q}3${q} width=${q}17${q} height=${q}11${q} rx=${q}1.2${q} fill=${q}${body}${q}/><rect x=${q}3${q} y=${q}4.5${q} width=${q}14${q} height=${q}8${q} rx=${q}.4${q} fill=${q}${screen}${q}/><path d=${q}M9 14h2v2.2h3.5v1.3h-9v-1.3H9z${q} fill=${q}${body}${q}/>`;
const tvIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? tvShape("#111318", "#f59e0b", "'") : tvShape("#e2e4e9", "#f1f2f5", "'")}</svg>`);
};
const ogTv = (body: string, screen: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${tvShape(body, screen, '"')}</svg>`;

export const TV_CATEGORIES = ["OLED", "Mini-LED & QLED", "Budget & mid-range"];

export const tv: Niche = {
  id: "tv",
  schema: "tvrecs",
  site: {
    name: "TVRecs",
    domain: "tvrecs.com",
    wordmark: "tvrecs",
    descriptor: "owner reviews of OLED, Mini-LED, QLED and budget TVs",
    footer: "kept by people who turned motion smoothing off.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "TV", many: "TVs", One: "TV", Many: "TVs" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // Makers replace each line every year (LG C4 → C5, Samsung S90D → S90F), so a year-old review is about last year's set.
  recentMonths: 12,
  // Model names carry the year (LG C4, Samsung S90D, Sony A80L, Hisense U8N); a name the maker reused gets "(2024)".
  productYears: false,
  productPath: "tvs",
  amazon: { searchIndex: "Electronics", photos: true },
  scoreUnit: { one: "TV", many: "TVs" },
  // White page, near-black ink and primary, one warm amber accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f6f6f4",
    "--ink": "#111318",
    "--ink-2": "#3a3d45",
    "--ink-3": "#6b6e76",
    "--line": "#e6e6e3",
    "--line-2": "#d3d3cf",
    "--green": "#111318",
    "--green-ink": "#0b0d12",
    "--green-wash": "#f2f2f0",
    "--green-line": "#cfd0d3",
    "--on-green": "#fafaf9",
    "--on-green-muted": "#a9abb1",
    "--lime": "#f59e0b",
    "--lime-wash": "#fff7e8",
    "--lime-line": "#fcd9a0",
    "--lime-ink": "#b45309",
    "--lime-ink-2": "#92400e",
    "--score-on": tvIcon("tile", true),
    "--score-off": tvIcon("tile", false),
    "--score-pick-on": tvIcon("pick", true),
    "--score-pick-off": tvIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f59e0b", "#d3d3cf", "#a9abb1", "#fcd9a0", "#6b6e76"],
  og: {
    background: "#111318",
    accent: "#f59e0b",
    muted: "#a9abb1",
    text: "#fafaf9",
    scoreOn: ogTv("#fafaf9", "#f59e0b"),
    scoreOff: ogTv("#30333b", "#111318"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for TVs: power = picture, maneuverability = motion & gaming, control = brightness &
  // room, comfort = smart TV & software, forgiveness = value. Approved by the owner 2026-11-12.
  categories: [
    { column: "powerRating", label: "Picture quality", hint: "contrast, colour, HDR, upscaling" },
    { column: "maneuverabilityRating", label: "Motion & gaming", hint: "VRR, input lag, 120 Hz+, sports" },
    { column: "controlRating", label: "Brightness & room", hint: "brightness, glare, viewing angles" },
    { column: "comfortRating", label: "Smart TV & software", hint: "OS, apps, ads, remote, updates" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Movies & shows", display: "watches mostly movies and shows" }, { value: "Gaming", display: "uses it mostly for gaming" },
      { value: "Sports", display: "watches a lot of sports" }, { value: "Everyday TV", display: "uses it for everyday TV" }, { value: "A bit of everything", display: "uses it for a bit of everything" },
    ] },
    playingSide: { label: "Room", adminLabel: "Room", options: [
      { value: "Dark room", display: "in a dark room" }, { value: "Bright room", display: "in a bright room" }, { value: "Mixed", display: "in a room that's bright by day, dark at night" },
    ] },
    playingStyle: { label: "Screen size", adminLabel: "Screen size", options: [
      { value: "Under 50\"", hint: "42–49\"" }, { value: "50–59\"", hint: "50–59\"" }, { value: "60–69\"", hint: "usually 65\"" }, { value: "70–79\"", hint: "usually 75–77\"" }, { value: "80\" and up", hint: "83–100\"" },
    ] },
    timeWithRacket: { label: "Time owning it", adminLabel: "Time owning it", options: [
      { value: "Tried briefly", hint: "In a shop or returned it", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = panel, surface = sizes, core = refresh and HDMI, weight = smart TV OS.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. OLED", options: TV_CATEGORIES },
    { column: "balance", label: "Panel", max: 120, placeholder: "e.g. QD-OLED" },
    { column: "surface", label: "Sizes", max: 200, placeholder: "e.g. 42/48/55/65/77/83\"" },
    { column: "core", label: "Refresh & HDMI", max: 200, placeholder: "e.g. 144 Hz, 4× HDMI 2.1" },
    { column: "weight", label: "Smart TV", max: 120, placeholder: "e.g. webOS" },
  ],
  shapeFilter: TV_CATEGORIES,
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths. Approved by the owner 2026-11-12.
  categoryPaths: true,
  typePages: [
    { shape: "OLED", slug: "oled-tvs", label: "OLED", seoLabel: "OLED TVs", intro: "WOLED and QD-OLED TVs from LG, Samsung, Sony, Panasonic and Philips, one page per model and year", one: "OLED TV" },
    { shape: "Mini-LED & QLED", slug: "mini-led-tvs", label: "Mini-LED & QLED", seoLabel: "Mini-LED and QLED TVs", intro: "Bright Mini-LED and full-array local-dimming TVs: Samsung Neo QLED, Sony Bravia, TCL QM, Hisense U-series and more, 8K included", one: "Mini-LED TV" },
    { shape: "Budget & mid-range", slug: "budget-tvs", label: "Budget & mid-range", seoLabel: "Budget and Mid-Range TVs", intro: "Affordable 4K LED and QLED TVs from TCL, Hisense, Samsung, LG, Roku, Amazon, Vizio and Insignia", one: "Budget TV" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews. Approved by the owner 2026-11-12.
  tags: [
    { label: "great picture", tone: "pos" },
    { label: "deep blacks", tone: "pos" },
    { label: "bright", tone: "pos" },
    { label: "great HDR", tone: "pos" },
    { label: "great for gaming", tone: "pos" },
    { label: "low input lag", tone: "pos" },
    { label: "smooth motion", tone: "pos" },
    { label: "great upscaling", tone: "pos" },
    { label: "good viewing angles", tone: "pos" },
    { label: "handles glare well", tone: "pos" },
    { label: "good sound", tone: "pos" },
    { label: "great smart TV", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "burn-in", tone: "neg" },
    { label: "banding", tone: "neg" },
    { label: "dirty screen effect", tone: "neg" },
    { label: "blooming", tone: "neg" },
    { label: "raised blacks", tone: "neg" },
    { label: "dim", tone: "neg" },
    { label: "uniformity issues", tone: "neg" },
    { label: "reflections", tone: "neg" },
    { label: "ads in menus", tone: "neg" },
    { label: "laggy software", tone: "neg" },
    { label: "HDMI or connection issues", tone: "neg" },
    { label: "panel defect", tone: "neg" },
    { label: "failed early", tone: "neg" },
    { label: "poor support", tone: "neg" },
    { label: "bad speakers", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "8K", tone: "neutral" },
    { label: "matte screen", tone: "neutral" },
    { label: "glossy screen", tone: "neutral" },
    { label: "used as a monitor", tone: "neutral" },
    { label: "returned it", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough TVs in it have reviews.
  topLists: [
    { slug: "best-oled-tvs", label: "OLED", title: "Best OLED TVs", minReviews: 5,
      intro: "The OLED TVs owners are most consistently happy with.", filters: [{ column: "shape", include: ["OLED"] }] },
    { slug: "best-mini-led-tvs", label: "Mini-LED & QLED", title: "Best Mini-LED and QLED TVs", minReviews: 5,
      intro: "The Mini-LED and QLED TVs owners are most consistently happy with.", filters: [{ column: "shape", include: ["Mini-LED & QLED"] }] },
    { slug: "best-budget-tvs", label: "Budget", title: "Best Budget TVs", minReviews: 5,
      intro: "The budget and mid-range TVs owners are most consistently happy with.", filters: [{ column: "shape", include: ["Budget & mid-range"] }] },
    { slug: "best-gaming-tvs", label: "Gaming", title: "Best TVs for Gaming", minReviews: 5,
      intro: "The TVs owners most often praise for gaming.", trait: { tags: ["great for gaming", "low input lag"], minShare: 0.25, noun: "gaming" } },
    { slug: "best-tvs-for-bright-rooms", label: "Bright rooms", title: "Best TVs for Bright Rooms", minReviews: 5,
      intro: "The TVs owners most often praise for brightness and handling glare.", trait: { tags: ["bright", "handles glare well"], minShare: 0.25, against: ["dim", "reflections"], noun: "brightness or glare handling" } },
    { slug: "best-value-tvs", label: "Value", title: "Best Value TVs", minReviews: 5,
      intro: "The TVs owners most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Blog"],
  examples: { brand: "LG", model: "C4", year: 2026, search: "c4" },
  form: {
    prompts: [["What did you have before?", "Before this I had "], ["What do you watch on it?", "I mostly watch "], ["Any issues?", "After a while I noticed "]],
    tips: ["What TV you had before, and how this compares", "Which size you bought and what you mostly watch or play", "Picture, brightness and how it handles your room", "Smart TV software, remote, sound and any defects", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "TVRecs – Real Owner Reviews of OLED, Mini-LED and Budget TVs",
    homeDescription: "Browse real owner reviews of OLED, Mini-LED, QLED and budget TVs, plus experiences collected from Reddit, YouTube and forums. Compare LG, Samsung, Sony, TCL, Hisense, Panasonic, Philips, Vizio, Roku and more, one page per model and year.",
    layoutDescription: "Real owner experiences with TVs of every kind, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | TVRecs",
    catalog: { title: "All TVs – Owner Reviews and Ratings", description: "Every OLED, Mini-LED, QLED and budget TV on TVRecs with owner ratings. Filter by brand and category, then read what owners say." },
    brands: { title: "TV Brands", description: "Browse TVs by brand — LG, Samsung, Sony, TCL, Hisense, Panasonic, Philips, Vizio, Roku and more — and read real owner reviews of each model." },
    brand: brand => ({ title: `${brand} TVs – Owner Reviews`, description: `Real owner reviews of ${brand} TVs: ratings, strengths and weaknesses for every ${brand} TV on TVRecs.` }),
    product: name => ({ title: `${name} Reviews | TVRecs`, description: `Read real owner experiences with the ${name}. Ratings for picture, motion and gaming, brightness, smart TV software and value, plus opinions from around the web.` }),
    productNotFound: "TV not found | TVRecs",
    productCategory: "TVs",
    addReview: { title: "Add a TV Review", description: "Own a TV? Share how it actually looks in your room in about two minutes. No account needed." },
    about: { title: "About", description: "Why TVRecs exists: TV opinions are scattered across Reddit, YouTube and forums. TVRecs collects owners' first-hand experiences and lets owners add their own." },
    ogAlt: "TVRecs – real owner reviews of TVs",
    ogProductAlt: "TV reviews on TVRecs",
    ogEyebrow: "Owner reviews of TVs",
    ogTitle: "TV reviews from people who watch them every day",
    ogDetail: "From owners, Reddit, YouTube and forums",
    ogFallbackTitle: "TV reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other people how a TV actually looks and works in your home. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About how you use it",
      aboutYouHint: "optional · helps people find owners like them",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's watching it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that TV or page. Maybe it moved, maybe it was discontinued, maybe someone changed the input.",
    about: {
      heading: "Why TVRecs exists",
      paragraphs: [
        "TV opinions are scattered across Reddit, YouTube and forums, and lab reviews rarely say how a set holds up in a real living room after a year. TVRecs puts owners’ experiences in one place and lets owners add their own.",
        "A TV that suits one room won’t suit every room. Knowing whether someone watches in a bright or dark room, which size they bought and what they had before often tells you more than a measurement on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Rankings are counted from reviews: the ones owners write here and the ones collected and summarized from around the web. Each is read as positive, mixed or negative. TV pages link to Amazon, and TVRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "One page per model and year", body: "TVs are replaced every year under almost the same name. Each model year has its own page (LG C4 and C5, Samsung S90D and S90F, Sony Bravia 8 and Bravia 8 II), and all screen sizes of one model share a page." },
        { heading: "A work in progress", body: "TVRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about TVs you’ve actually owned and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
