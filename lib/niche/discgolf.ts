import type { Niche } from "./types";

// Rating icons: a disc seen at an angle, disc orange with a pine rim line and a lighter flight plate. Same tile sizes as the other niches (17×14 strip, 20×20 picker).
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const rimTile = "M8.5 2.6c4.3 0 7.6 2 7.6 4.4s-3.3 4.4-7.6 4.4s-7.6-2-7.6-4.4s3.3-4.4 7.6-4.4z";
const plateTile = "M8.5 4.4c2.7 0 4.6 1.2 4.6 2.6s-1.9 2.6-4.6 2.6s-4.6-1.2-4.6-2.6s1.9-2.6 4.6-2.6z";
const rimPick = "M10 4.6c4.7 0 8.4 2.4 8.4 5.4s-3.7 5.4-8.4 5.4s-8.4-2.4-8.4-5.4s3.7-5.4 8.4-5.4z";
const platePick = "M10 6.8c3 0 5.2 1.4 5.2 3.2s-2.2 3.2-5.2 3.2s-5.2-1.4-5.2-3.2s2.2-3.2 5.2-3.2z";
const disc = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='0 0 17 14'" : "viewBox='0 0 20 20'";
  const [r, p] = size === "tile" ? [rimTile, plateTile] : [rimPick, platePick];
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${r}' fill='#f26b1d' stroke='#1e4d3a' stroke-width='1.1'/><path d='${p}' fill='#f89a5e'/></svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><path d='${r}' fill='#dbe5e0'/></svg>`);
};
const ogDisc = (rim: string, plate: string, stroke: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${rimPick}" fill="${rim}" stroke="${stroke}" stroke-width="1.2"/><path d="${platePick}" fill="${plate}"/></svg>`;

export const discgolf: Niche = {
  id: "discgolf",
  schema: "discgolfrecs",
  site: {
    name: "DiscGolfRecs",
    domain: "discgolfrecs.com",
    wordmark: "discgolfrecs",
    descriptor: "player reviews of disc golf discs",
    footer: "kept by people with one disc too many in the bag. No affiliate links.",
    analyticsId: "G-83JCDSFL6H",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "disc", many: "discs", One: "Disc", Many: "Discs" },
  people: { one: "player", many: "players", One: "Player", Many: "Players" },
  recentMonths: 36,
  // A disc is its mold (Destroyer, Buzzz, PA-3); makers don't use model years, and the plastic varies within a mold.
  productYears: false,
  productPath: "discs",
  scoreUnit: { one: "disc", many: "discs" },
  // White page, deep pine green, one disc-orange accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f2f6f4",
    "--ink": "#13201a",
    "--ink-2": "#36473f",
    "--ink-3": "#64766d",
    "--line": "#dbe5e0",
    "--line-2": "#c2d2ca",
    "--green": "#1e4d3a",
    "--green-ink": "#143628",
    "--green-wash": "#e4efe9",
    "--green-line": "#a9cdb9",
    "--on-green": "#e9f5ee",
    "--on-green-muted": "#a6c9b5",
    "--lime": "#f26b1d",
    "--lime-wash": "#fdeadf",
    "--lime-line": "#f6b48a",
    "--lime-ink": "#7a2e05",
    "--lime-ink-2": "#5c2203",
    "--score-on": disc("tile", true),
    "--score-off": disc("tile", false),
    "--score-pick-on": disc("pick", true),
    "--score-pick-off": disc("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#cde0d5", "#a6c9b5", "#f8cfb3", "#b9c9c0"],
  og: {
    background: "#1e4d3a",
    accent: "#f26b1d",
    muted: "#a6c9b5",
    text: "#e9f5ee",
    scoreOn: ogDisc("#f26b1d", "#f89a5e", "#0f2a1f"),
    scoreOff: ogDisc("#3d6e59", "#3d6e59", "#3d6e59"),
  },
  ratingWords: { "5": "5 — loved it", "4": "4 — really liked it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled: power = distance, control = accuracy, forgiveness = forgiveness, comfort = grip & feel, maneuverability = versatility.
  categories: [
    { column: "powerRating", label: "Distance", hint: "how far it flies for your arm" },
    { column: "controlRating", label: "Accuracy", hint: "hitting the line you picked" },
    { column: "forgivenessRating", label: "Forgiveness", hint: "still flies well on an off throw" },
    { column: "comfortRating", label: "Grip & feel", hint: "plastic grip, rim feel in the hand" },
    { column: "maneuverabilityRating", label: "Versatility", hint: "hyzers, flex lines, turnovers, forehands" },
  ],
  profile: {
    playerLevel: { label: "Level", adminLabel: "Player level", options: [
      { value: "Beginner", hint: "first year or so" }, { value: "Casual", hint: "regular rounds, no league" }, { value: "Intermediate", hint: "leagues or tournaments, rated under 900" }, { value: "Advanced", hint: "rated 900–950" }, { value: "Pro or elite", hint: "rated 950+" },
    ] },
    playingSide: { label: "Throw", adminLabel: "Hand and throw", options: [
      { value: "RHBH", hint: "right-hand backhand", display: "throws RHBH" }, { value: "RHFH", hint: "right-hand forehand", display: "throws RHFH" }, { value: "LHBH", hint: "left-hand backhand", display: "throws LHBH" }, { value: "LHFH", hint: "left-hand forehand", display: "throws LHFH" },
    ] },
    playingStyle: { label: "Max distance", adminLabel: "Max distance", options: [
      { value: "Under 250 ft", display: "drives under 250 ft" }, { value: "250–325 ft", display: "drives 250–325 ft" }, { value: "325–400 ft", display: "drives 325–400 ft" }, { value: "400 ft +", display: "drives 400 ft +" },
    ] },
    timeWithRacket: { label: "Time with the disc", adminLabel: "Time with the disc", options: [
      { value: "Fieldwork only", hint: "Fieldwork or a few throws", display: "fieldwork only" }, { value: "A few rounds", hint: "under 10 rounds" }, { value: "A season", hint: "a season in the bag" }, { value: "Years", hint: "years, beat in" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared with padel: shape holds the type, weight the flight numbers, balance the rim width, core the plastics, surface the PDGA max weight.
  specs: [
    { column: "shape", label: "Type", max: 100, placeholder: "e.g. Distance driver", options: ["Distance driver", "Fairway driver", "Midrange", "Putter"] },
    { column: "weight", label: "Flight numbers", max: 120, placeholder: "e.g. 12 / 5 / -1 / 3 (speed / glide / turn / fade)" },
    { column: "balance", label: "Rim width", max: 120, placeholder: "e.g. 2.2 cm" },
    { column: "core", label: "Plastics", max: 200, placeholder: "e.g. Star, Champion, DX" },
    { column: "surface", label: "Max weight", max: 200, placeholder: "e.g. 175.1 g" },
  ],
  shapeFilter: ["Distance driver", "Fairway driver", "Midrange", "Putter"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  typePages: [
    { shape: "Distance driver", slug: "distance-drivers", label: "Distance drivers", intro: "Wide-rimmed, fast drivers for maximum distance" },
    { shape: "Fairway driver", slug: "fairway-drivers", label: "Fairway drivers", intro: "Control drivers for accurate tee shots and shaping lines" },
    { shape: "Midrange", slug: "midranges", label: "Midranges", intro: "Mids for straight shots, upshots and holding a line" },
    { shape: "Putter", slug: "putters", label: "Putters", intro: "Putters and approach discs for the short game" },
  ],
  rowDetail: { column: "weight", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "long", tone: "pos" },
    { label: "accurate", tone: "pos" },
    { label: "lots of glide", tone: "pos" },
    { label: "reliable fade", tone: "pos" },
    { label: "holds lines", tone: "pos" },
    { label: "great grip", tone: "pos" },
    { label: "beginner-friendly", tone: "pos" },
    { label: "good in wind", tone: "pos" },
    { label: "good for forehands", tone: "pos" },
    { label: "too flippy", tone: "neg" },
    { label: "too overstable", tone: "neg" },
    { label: "slippery", tone: "neg" },
    { label: "beats in fast", tone: "neg" },
    { label: "inconsistent between runs", tone: "neg" },
    { label: "understable", tone: "neutral" },
    { label: "overstable", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts): one list per disc type. Few discs have many reviews yet, so the minimums are low.
  topLists: [
    { slug: "best-disc-golf-distance-drivers", formerSlugs: ["best-distance-drivers"], label: "Distance drivers", title: "Best Disc Golf Distance Drivers", minReviews: 6,
      intro: "The disc golf distance drivers players are most consistently happy with.", filters: [{ column: "shape", include: ["Distance driver"] }] },
    { slug: "best-disc-golf-fairway-drivers", formerSlugs: ["best-fairway-drivers"], label: "Fairway drivers", title: "Best Disc Golf Fairway Drivers", minReviews: 5,
      intro: "The disc golf fairway drivers players are most consistently happy with.", filters: [{ column: "shape", include: ["Fairway driver"] }] },
    { slug: "best-disc-golf-midrange-discs", formerSlugs: ["best-midrange-discs"], label: "Midranges", title: "Best Disc Golf Midrange Discs", minReviews: 6,
      intro: "The disc golf midranges players are most consistently happy with.", filters: [{ column: "shape", include: ["Midrange"] }] },
    { slug: "best-disc-golf-putters", formerSlugs: ["best-putters"], label: "Putters", title: "Best Disc Golf Putters", minReviews: 6,
      intro: "The disc golf putters and approach discs players are most consistently happy with.", filters: [{ column: "shape", include: ["Putter"] }] },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Disc golf shop", "Forum", "Other"],
  examples: { brand: "Innova", model: "Destroyer", year: 2026, search: "innova" },
  form: {
    prompts: [["Which plastic and weight?", "Mine is "], ["What do you throw it for?", "I throw this for "], ["What did it replace?", "Before this I threw a "]],
    tips: ["The plastic and weight of the one you throw", "Backhand or forehand, and roughly how far you throw", "How it flies for your arm: turn, glide and fade", "The lines it's good for: hyzer, flex, turnover, rollers", "How it changed as it beat in"],
  },
  seo: {
    homeTitle: "DiscGolfRecs – Real Player Reviews of Disc Golf Discs",
    homeDescription: "Browse real disc golf disc reviews from players and opinions collected from Reddit, YouTube, disc golf shops and forums. Compare drivers, midranges and putters from Innova, Discraft, MVP, Axiom, Latitude 64, Dynamic Discs, Westside, Kastaplast, Discmania and more.",
    layoutDescription: "Real player experiences with disc golf discs, plus opinions from Reddit, YouTube, disc golf shops and forums with the source linked.",
    titleTemplate: "%s | DiscGolfRecs",
    catalog: { title: "All Discs – Player Reviews and Ratings", description: "Every disc on DiscGolfRecs with community ratings. Filter by brand and type, then read what players say about each mold." },
    brands: { title: "Disc Golf Brands", description: "Browse discs by brand — Innova, Discraft, MVP, Axiom, Latitude 64, Dynamic Discs, Westside, Kastaplast, Discmania and more — and read real player reviews of each mold." },
    brand: brand => ({ title: `${brand} Discs – Player Reviews`, description: `Real player reviews of ${brand} discs: ratings, strengths and weaknesses for every ${brand} mold on DiscGolfRecs.` }),
    product: name => ({ title: `${name} Player Reviews | DiscGolfRecs`, description: `Read real player experiences with the ${name}. Ratings for distance, accuracy, forgiveness and grip, and opinions from DiscGolfRecs and around the web.` }),
    productNotFound: "Disc not found | DiscGolfRecs",
    productCategory: "Disc golf disc",
    addReview: { title: "Add a Disc Review", description: "Bagged one, or tried it in fieldwork? Share how it flies in about two minutes. No account needed." },
    about: { title: "About", description: "Why DiscGolfRecs exists: disc opinions are scattered across Reddit, YouTube, disc golf shops and forums. DiscGolfRecs collects them and lets players add their own." },
    ogAlt: "DiscGolfRecs – real player reviews of disc golf discs",
    ogProductAlt: "Disc reviews on DiscGolfRecs",
    ogEyebrow: "Player reviews of disc golf discs",
    ogTitle: "Real player reviews of disc golf discs",
    ogDetail: "From players, Reddit, YouTube, disc golf shops and forums",
    ogFallbackTitle: "Disc reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other players how a disc actually flies for you. Takes about two minutes, no account needed.",
      howItWent: "how it flies",
      aboutYou: "About your game",
      aboutYouHint: "optional · helps people find players like them",
      howItPerforms: "How it flies",
      whoUsesIt: "Who's throwing it",
      triedIt: "Thrown it?",
      triedOne: "Thrown one?",
      triedOneOfThese: "Thrown one of these?",
    },
    notFound: "We couldn’t find that disc or page. Maybe it moved, maybe it never existed, maybe it skipped off a tree and into the pond.",
    about: {
      heading: "Why DiscGolfRecs exists",
      paragraphs: [
        "Disc reviews are scattered across Reddit, YouTube, disc golf shops and forums. DiscGolfRecs puts those experiences in one place and lets players add their own.",
        "A disc that flies one way for one player can fly very differently for another. Knowing someone’s arm speed, throwing hand, the plastic they threw and how beat in it is often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Players, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from player submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "DiscGolfRecs is new. Player submissions are moderated before publication, web reviews link to their sources, and disc details come from the makers’ published flight numbers and PDGA specifications." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about discs you’ve actually thrown, and say which plastic and weight you threw." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
