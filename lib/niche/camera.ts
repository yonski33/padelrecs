import type { Niche } from "./types";

// Rating icons: a small camera, charcoal body and viewfinder hump around a rose lens. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const cameraIcon = (size: "tile" | "pick", on: boolean) => {
  const [box, body, hump, lens] = size === "tile"
    ? ["width='17' height='14' viewBox='0 0 17 14'", [1, 3.6, 15, 9.4, 1.6], [4, 1.6, 4.4, 2.6, 0.7], [8.5, 8.3, 2.9]]
    : ["viewBox='0 0 20 20'", [1.5, 5.2, 17, 11.8, 2], [5.2, 2.8, 5, 3, 0.8], [10, 11.1, 3.7]];
  const [bx, by, bw, bh, brx] = body as number[], [hx, hy, hw, hh, hrx] = hump as number[], [cx, cy, r] = lens as number[];
  const [shell, glass] = on ? ["#18181b", "#f43f5e"] : ["#e4e4e7", "#e4e4e7"];
  const rim = on ? "#f4f4f5" : "#ffffff";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}><rect x='${hx}' y='${hy}' width='${hw}' height='${hh}' rx='${hrx}' fill='${shell}'/><rect x='${bx}' y='${by}' width='${bw}' height='${bh}' rx='${brx}' fill='${shell}'/><circle cx='${cx}' cy='${cy}' r='${r}' fill='${glass}' stroke='${rim}' stroke-width='${size === "tile" ? 0.9 : 1.1}'/></svg>`);
};
const ogCamera = (shell: string, glass: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><rect x="5.2" y="2.8" width="5" height="3" rx=".8" fill="${shell}"/><rect x="1.5" y="5.2" width="17" height="11.8" rx="2" fill="${shell}"/><circle cx="10" cy="11.1" r="3.7" fill="${glass}"/></svg>`;

export const camera: Niche = {
  id: "camera",
  schema: "camerarecs",
  site: {
    name: "CameraRecs",
    domain: "camerarecs.com",
    wordmark: "camerarecs",
    descriptor: "photographer reviews of mirrorless, compact, vlogging and action cameras",
    footer: "kept by people with more camera bags than cameras.",
    analyticsId: "G-QKXR6JZF5L",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "camera", many: "cameras", One: "Camera", Many: "Cameras" },
  people: { one: "photographer", many: "photographers", One: "Photographer", Many: "Photographers" },
  recentMonths: 12,
  // Makers put the generation in the name (a7 IV, EOS R6 Mark III, X100VI, Z6III), so no years.
  productYears: false,
  productPath: "cameras",
  amazon: { searchIndex: "Electronics" },
  scoreUnit: { one: "camera", many: "cameras" },
  // White page, charcoal ink, one rose accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  // --lime is a lighter rose so it stays readable on the charcoal panels; the logo and rating icons use #f43f5e.
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f6f6f7",
    "--ink": "#18181b",
    "--ink-2": "#3f3f46",
    "--ink-3": "#71717a",
    "--line": "#e4e4e7",
    "--line-2": "#d4d4d8",
    "--green": "#18181b",
    "--green-ink": "#09090b",
    "--green-wash": "#f0f0f2",
    "--green-line": "#cfcfd5",
    "--on-green": "#f4f4f5",
    "--on-green-muted": "#a1a1aa",
    "--lime": "#fb7185",
    "--lime-wash": "#fff1f2",
    "--lime-line": "#fecdd3",
    "--lime-ink": "#be123c",
    "--lime-ink-2": "#9f1239",
    "--score-on": cameraIcon("tile", true),
    "--score-off": cameraIcon("tile", false),
    "--score-pick-on": cameraIcon("pick", true),
    "--score-pick-off": cameraIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f43f5e", "#d4d4d8", "#a1a1aa", "#fecdd3", "#94a3b8"],
  og: {
    background: "#18181b",
    accent: "#fb7185",
    muted: "#a1a1aa",
    text: "#f4f4f5",
    scoreOn: ogCamera("#f4f4f5", "#fb7185"),
    scoreOff: ogCamera("#3f3f46", "#3f3f46"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for cameras: power = image quality, maneuverability = autofocus & speed,
  // control = handling & build, comfort = video & features, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Image quality", hint: "sharpness, colour, dynamic range, low light" },
    { column: "maneuverabilityRating", label: "Autofocus & speed", hint: "focus tracking, burst, start-up, responsiveness" },
    { column: "controlRating", label: "Handling & build", hint: "grip, controls, menus, viewfinder, sealing" },
    { column: "comfortRating", label: "Video & features", hint: "video specs, stabilisation, battery, apps" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Travel", display: "shoots mostly while travelling" }, { value: "Street", display: "shoots mostly street" }, { value: "People / portraits", display: "shoots mostly people and portraits" },
      { value: "Landscape", display: "shoots mostly landscapes" }, { value: "Wildlife / sports", display: "shoots mostly wildlife and sports" }, { value: "Video / vlogging", display: "shoots mostly video" },
      { value: "Family / everyday", display: "shoots family and everyday life" }, { value: "A bit of everything", display: "shoots a bit of everything" },
    ] },
    playingSide: { label: "Experience", adminLabel: "Experience", options: [
      { value: "Beginner", display: "a beginner" }, { value: "Enthusiast", display: "an enthusiast" }, { value: "Semi-pro", display: "semi-pro" }, { value: "Professional", display: "a professional" },
    ] },
    playingStyle: { label: "Shoots", adminLabel: "Shoots", options: [
      { value: "Mostly photos" }, { value: "Mostly video" }, { value: "Both equally" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried it", hint: "In a shop or rented", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = sensor format, surface = resolution, core = lens mount (or the fixed lens), weight = weight.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Mirrorless", options: ["Mirrorless", "Compact", "Vlogging", "Action & 360"] },
    { column: "balance", label: "Sensor", max: 120, placeholder: "e.g. Full-frame" },
    { column: "surface", label: "Resolution", max: 120, placeholder: "e.g. 33 MP" },
    { column: "core", label: "Mount / lens", max: 200, placeholder: "e.g. Sony E mount" },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 658 g with battery and card" },
  ],
  shapeFilter: ["Mirrorless", "Compact", "Vlogging", "Action & 360"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Mirrorless", slug: "mirrorless-cameras", label: "Mirrorless", intro: "Interchangeable-lens mirrorless cameras, from APS-C and Micro Four Thirds to full-frame and medium format" },
    { shape: "Compact", slug: "compact-cameras", label: "Compact", intro: "Fixed-lens compacts: premium large-sensor cameras, travel zooms and tough cameras" },
    { shape: "Vlogging", slug: "vlogging-cameras", label: "Vlogging", intro: "Cameras made for vlogging and creators, including gimbal cameras like the Osmo Pocket" },
    { shape: "Action & 360", slug: "action-cameras", label: "Action & 360", intro: "Action cameras and 360° cameras from GoPro, DJI and Insta360" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "great image quality", tone: "pos" },
    { label: "great colours", tone: "pos" },
    { label: "fast autofocus", tone: "pos" },
    { label: "great low light", tone: "pos" },
    { label: "great video", tone: "pos" },
    { label: "great stabilisation", tone: "pos" },
    { label: "great handling", tone: "pos" },
    { label: "compact", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "autofocus issues", tone: "neg" },
    { label: "overheating", tone: "neg" },
    { label: "poor battery life", tone: "neg" },
    { label: "build quality issues", tone: "neg" },
    { label: "clunky menus", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "heavy", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough cameras in it have reviews.
  topLists: [
    { slug: "best-mirrorless-cameras", label: "Mirrorless", title: "Best Mirrorless Cameras", minReviews: 5,
      intro: "The interchangeable-lens mirrorless cameras photographers are most consistently happy with.", filters: [{ column: "shape", include: ["Mirrorless"] }] },
    { slug: "best-full-frame-cameras", label: "Full-frame", title: "Best Full-Frame Cameras", minReviews: 5,
      intro: "The full-frame cameras photographers are most consistently happy with.", filters: [{ column: "balance", include: ["Full-frame"] }] },
    { slug: "best-aps-c-cameras", label: "APS-C", title: "Best APS-C Cameras", minReviews: 5,
      intro: "The APS-C cameras photographers are most consistently happy with.", filters: [{ column: "balance", include: ["APS-C"] }] },
    { slug: "best-compact-cameras", label: "Compact", title: "Best Compact Cameras", minReviews: 5,
      intro: "The fixed-lens compact cameras photographers are most consistently happy with.", filters: [{ column: "shape", include: ["Compact"] }] },
    { slug: "best-vlogging-cameras", label: "Vlogging", title: "Best Vlogging Cameras", minReviews: 5,
      intro: "The vlogging and creator cameras owners are most consistently happy with.", filters: [{ column: "shape", include: ["Vlogging"] }] },
    { slug: "best-action-cameras", label: "Action & 360", title: "Best Action Cameras", minReviews: 5,
      intro: "The action and 360° cameras owners are most consistently happy with.", filters: [{ column: "shape", include: ["Action & 360"] }] },
    { slug: "best-cameras-for-low-light", label: "Low light", title: "Best Cameras for Low Light", minReviews: 5,
      intro: "The cameras photographers most often praise for low-light shooting.", trait: { tags: ["great low light"], minShare: 0.25, noun: "low-light performance" } },
    { slug: "best-budget-cameras", label: "Budget", title: "Best Budget Cameras", minReviews: 5,
      intro: "The cameras photographers most often call great value.", trait: { tags: ["great value"], minShare: 0.25, against: ["overpriced"], noun: "the value" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Camera shop", "Forum", "Other"],
  examples: { brand: "Fujifilm", model: "X-T5", year: 2026, search: "fujifilm" },
  form: {
    prompts: [["What did you shoot with before?", "Before this I used "], ["What do you shoot?", "I mostly shoot "], ["Any issues?", "After a while I noticed "]],
    tips: ["What you shot with before, and how this compares", "What you shoot (people, travel, wildlife, video) and with which lenses", "Image quality, colours and low-light performance", "Autofocus, handling, menus, battery and any defects", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "CameraRecs – Real Photographer Reviews of Mirrorless, Compact, Vlogging and Action Cameras",
    homeDescription: "Browse real reviews of mirrorless, compact, vlogging and action cameras from photographers, plus opinions collected from Reddit, YouTube, camera shops and forums. Compare Sony, Canon, Nikon, Fujifilm, Panasonic, OM System, Leica, Ricoh, DJI, GoPro and more.",
    layoutDescription: "Real photographer experiences with mirrorless, compact, vlogging and action cameras, plus opinions from Reddit, YouTube, camera shops and forums with the source linked.",
    titleTemplate: "%s | CameraRecs",
    catalog: { title: "All Cameras – Photographer Reviews and Ratings", description: "Every mirrorless, compact, vlogging and action camera on CameraRecs with community ratings. Filter by brand and category, then read what photographers say." },
    brands: { title: "Camera Brands", description: "Browse cameras by brand — Sony, Canon, Nikon, Fujifilm, Panasonic, OM System, Leica, Ricoh, DJI, GoPro and more — and read real photographer reviews of each model." },
    brand: brand => ({ title: `${brand} Cameras – Photographer Reviews`, description: `Real photographer reviews of ${brand} cameras: ratings, strengths and weaknesses for every ${brand} camera on CameraRecs.` }),
    product: name => ({ title: `${name} Reviews | CameraRecs`, description: `Read real photographer experiences with the ${name}. Ratings for image quality, autofocus, handling, video and value, plus opinions from around the web.` }),
    productNotFound: "Camera not found | CameraRecs",
    productCategory: "Cameras",
    addReview: { title: "Add a Camera Review", description: "Own a camera? Share how it shoots and handles in about two minutes. No account needed." },
    about: { title: "About", description: "Why CameraRecs exists: camera opinions are scattered across Reddit, YouTube, camera shops and forums. CameraRecs collects them and lets photographers add their own." },
    ogAlt: "CameraRecs – real photographer reviews of cameras",
    ogProductAlt: "Camera reviews on CameraRecs",
    ogEyebrow: "Photographer reviews of cameras",
    ogTitle: "Camera reviews from people who shoot with them",
    ogDetail: "From photographers, Reddit, YouTube, camera shops and forums",
    ogFallbackTitle: "Camera reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other photographers how a camera actually shoots and handles for you. Takes about two minutes, no account needed.",
      howItWent: "how it shoots for you",
      aboutYou: "About your photography",
      aboutYouHint: "optional · helps people find photographers like them",
      howItPerforms: "How it shoots",
      whoUsesIt: "Who's shooting with it",
      triedIt: "Shot with it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that camera or page. Maybe it moved, maybe it was discontinued, maybe it’s still in the bag with the lens cap on.",
    about: {
      heading: "Why CameraRecs exists",
      paragraphs: [
        "Camera opinions are scattered across Reddit, YouTube, camera shops and forums. CameraRecs puts those experiences in one place and lets photographers add their own.",
        "A camera that suits one photographer won’t suit everyone. Knowing what someone shoots, which lenses they use and what they had before often tells you more than a spec sheet or a score on its own.",
      ],
      sections: [
        { heading: "Photographers, not promotions", body: "No sponsored rankings. No paid placements. Ratings come from photographer submissions, and external comments stay separate from those ratings. Camera pages link to Amazon, and CameraRecs may earn a commission when you buy through those links; that never changes a rating or ranking." },
        { heading: "A work in progress", body: "CameraRecs is new. Submissions are moderated before publication, web reviews link to their sources, and specifications come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about cameras you’ve actually used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
