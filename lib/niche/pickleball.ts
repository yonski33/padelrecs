import type { Niche } from "./types";

// Pickleball rating icons: an optic-yellow ball with holes. Same tile sizes as padel (17×14 strip, 20×20 picker).
const holes17 = [[5, 4.4], [9, 4.4], [3.6, 7.6], [7, 7.2], [10.4, 7.6], [5.4, 10.4], [8.8, 10.4]];
const holes20 = [[7.2, 5.4], [12.8, 5.4], [5, 10], [10, 9.6], [15, 10], [7.6, 14.4], [12.4, 14.4]];
// Same escaping as the padel data URIs: only <, > and # need it inside a quoted url().
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const ball = (size: "tile" | "pick", on: boolean) => {
  const [w, h, cx, cy, r, holes, hr] = size === "tile" ? [17, 14, 7, 7, 6.1, holes17, 0.85] as const : [20, 20, 10, 10, 8.6, holes20, 1.15] as const;
  const box = size === "tile" ? `width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'` : `viewBox='0 0 ${w} ${h}'`;
  return svg(on
    ? `<svg xmlns='http://www.w3.org/2000/svg' ${box}><circle cx='${cx}' cy='${cy}' r='${r}' fill='#e9e23f' stroke='#12305a' stroke-width='${size === "tile" ? 1.3 : 1.4}'/>${holes.map(([x, y]) => `<circle cx='${x}' cy='${y}' r='${hr}' fill='#12305a'/>`).join("")}</svg>`
    : `<svg xmlns='http://www.w3.org/2000/svg' ${box}><circle cx='${cx}' cy='${cy}' r='${size === "tile" ? 6 : r}' fill='#ddd9cc'/></svg>`);
};
const ogBall = (on: boolean) => on
  ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6" fill="#e9e23f" stroke="#0d2648" stroke-width="1.4"/>${holes20.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.15" fill="#0d2648"/>`).join("")}</svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.6" fill="#3d6aa6"/></svg>`;

export const pickleball: Niche = {
  id: "pickleball",
  schema: "pickleballrecs",
  site: {
    name: "PickleballRecs",
    domain: "pickleballrecs.com",
    wordmark: "pickleballrecs",
    descriptor: "player reviews of pickleball paddles",
    footer: "kept by people who own too many paddles. No affiliate links.",
    analyticsId: "G-2W4S5QT9CZ",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "paddle", many: "paddles", One: "Paddle", Many: "Paddles" },
  people: { one: "player", many: "players", One: "Player", Many: "Players" },
  productPath: "paddles",
  scoreUnit: { one: "ball", many: "balls" },
  // White page, hard-court blue, one optic-yellow accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f2f3ef",
    "--ink": "#141c27",
    "--ink-2": "#3a4452",
    "--ink-3": "#6c7480",
    "--line": "#e1e3dc",
    "--line-2": "#cbcfc4",
    "--green": "#1f4e8c",
    "--green-ink": "#143866",
    "--green-wash": "#e3ebf5",
    "--green-line": "#bccbe0",
    "--on-green": "#e8eef7",
    "--on-green-muted": "#a9bcd6",
    "--lime": "#e9e23f",
    "--lime-wash": "#f6f3cf",
    "--lime-line": "#d6cd4f",
    "--lime-ink": "#4a4512",
    "--lime-ink-2": "#38340c",
    "--score-on": ball("tile", true),
    "--score-off": ball("tile", false),
    "--score-pick-on": ball("pick", true),
    "--score-pick-off": ball("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#e0d9c2", "#b9c6d6"],
  og: { background: "#1f4e8c", accent: "#e9e23f", muted: "#a9bcd6", text: "#d9e3f0", scoreOn: ogBall(true), scoreOff: ogBall(false) },
  ratingWords: { "5": "5 — loved it", "4": "4 — really liked it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Spin is stored in the comfort_rating column (pickleball has no comfort category).
  categories: [
    { column: "powerRating", label: "Power", hint: "drives, put-aways" },
    { column: "controlRating", label: "Control", hint: "dinks, resets, placement" },
    { column: "comfortRating", label: "Spin", hint: "serves, rolls, topspin" },
    { column: "forgivenessRating", label: "Forgiveness", hint: "sweet spot, mishits" },
    { column: "maneuverabilityRating", label: "Maneuverability", hint: "hand speed at the kitchen" },
  ],
  profile: {
    playerLevel: { label: "Level", adminLabel: "Player level", options: [
      { value: "Beginner", hint: "DUPR under 3.0" }, { value: "Intermediate", hint: "DUPR 3.0–3.5" }, { value: "Advanced", hint: "DUPR 3.5–4.5" }, { value: "Competitive", hint: "DUPR 4.5+" },
    ] },
    playingSide: { label: "Mostly plays", adminLabel: "Mostly plays", options: [
      { value: "Singles", display: "mostly singles" }, { value: "Doubles", display: "mostly doubles" }, { value: "Both", display: "singles and doubles" },
    ] },
    playingStyle: { label: "Style", adminLabel: "Playing style", options: [
      { value: "Power", hint: "drives, speed-ups" }, { value: "All-court", hint: "a bit of everything" }, { value: "Soft game", hint: "dinks, resets, drops" },
    ] },
    timeWithRacket: { label: "Time with paddle", adminLabel: "Time with paddle", options: [
      { value: "Tried briefly", hint: "A few sessions", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared with padel: core holds core thickness, balance holds swing weight.
  specs: [
    { column: "shape", label: "Shape", max: 100, placeholder: "e.g. Elongated", options: ["Standard", "Elongated", "Hybrid", "Widebody"] },
    { column: "weight", label: "Weight", max: 120, placeholder: "e.g. 8.0 oz (227 g)" },
    { column: "core", label: "Core thickness", max: 200, placeholder: "e.g. 16 mm", options: ["13 mm", "14 mm", "16 mm"] },
    { column: "surface", label: "Surface", max: 200, placeholder: "e.g. Raw T700 carbon" },
    { column: "balance", label: "Swing weight", max: 120, placeholder: "e.g. 115" },
  ],
  shapeFilter: ["Standard", "Elongated", "Hybrid"],
  rowDetail: { column: "core", suffix: " core" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "easy power", tone: "pos" },
    { label: "great pop", tone: "pos" },
    { label: "good control", tone: "pos" },
    { label: "great for dinks", tone: "pos" },
    { label: "lots of spin", tone: "pos" },
    { label: "forgiving", tone: "pos" },
    { label: "fast hands", tone: "pos" },
    { label: "arm-friendly", tone: "pos" },
    { label: "small sweet spot", tone: "neg" },
    { label: "hard to control", tone: "neg" },
    { label: "low spin", tone: "neg" },
    { label: "dead spots", tone: "neg" },
    { label: "delamination", tone: "neg" },
    { label: "durability issues", tone: "neg" },
    { label: "firm", tone: "neutral" },
    { label: "soft", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Paddle shapes are too sparsely filled in to filter on, so lists go by review tags.
  topLists: [
    { slug: "best-pickleball-paddles", label: "Best overall", title: "Best Pickleball Paddles", minReviews: 12,
      intro: "The paddles players are most consistently happy with, among paddles enough players have reviewed." },
    { slug: "best-power-pickleball-paddles", label: "Best for power", title: "Best Pickleball Paddles for Power", minReviews: 10,
      intro: "Paddles players keep describing as powerful: easy power and pop.",
      trait: { tags: ["easy power", "great pop"], minShare: 0.2, noun: "power or pop" } },
    { slug: "best-control-pickleball-paddles", label: "Best for control", title: "Best Pickleball Paddles for Control", minReviews: 10,
      intro: "Paddles players praise for control, dinks and resets.",
      trait: { tags: ["good control", "great for dinks"], minShare: 0.2, against: ["hard to control"], noun: "control or dinks" } },
    { slug: "best-spin-pickleball-paddles", label: "Best for spin", title: "Best Pickleball Paddles for Spin", minReviews: 10,
      intro: "Paddles players say put lots of spin on the ball.",
      trait: { tags: ["lots of spin"], minShare: 0.2, against: ["low spin"], noun: "spin" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Pickleball shop", "Forum", "Other"],
  examples: { brand: "Joola", model: "Perseus 16mm", year: 2025, search: "joola" },
  form: {
    prompts: [["What did you switch from?", "Before this I played with "], ["Weight as played?", "Mine weighs about "], ["Spin and pop?", "On spin and pop it "]],
    tips: ["What you played with before, and how this compares", "Your weight as played, if you added lead tape", "Where it shines and where it struggles", "Spin, pop and feel at the kitchen", "Durability, dead spots or delamination once you’ve had it a while"],
  },
  seo: {
    homeTitle: "PickleballRecs – Real Player Reviews of Pickleball Paddles",
    homeDescription: "Browse real pickleball paddle reviews from players and opinions collected from Reddit, YouTube, shops, and forums. Compare experiences across Joola, Selkirk, Six Zero, CRBN, and more.",
    layoutDescription: "Real player experiences with pickleball paddles, plus opinions from Reddit, YouTube, shops and forums with the source linked.",
    titleTemplate: "%s | PickleballRecs",
    catalog: { title: "All Pickleball Paddles – Player Reviews and Ratings", description: "Every pickleball paddle on PickleballRecs with community ratings. Filter by brand, year and shape, then read what players say about each one." },
    brands: { title: "Pickleball Paddle Brands", description: "Browse pickleball paddles by brand — Joola, Selkirk, Six Zero, CRBN, Engage and more — and read real player reviews of each model." },
    brand: brand => ({ title: `${brand} Pickleball Paddles – Player Reviews`, description: `Real player reviews of ${brand} pickleball paddles: ratings, strengths and weaknesses for every ${brand} model on PickleballRecs.` }),
    product: name => ({ title: `${name} Player Reviews | PickleballRecs`, description: `Read real player experiences with the ${name}. Ratings, power, control, spin, and opinions from PickleballRecs and around the web.` }),
    productNotFound: "Paddle not found | PickleballRecs",
    productCategory: "Pickleball paddle",
    addReview: { title: "Add a Pickleball Paddle Review", description: "Played with a pickleball paddle? Share how it felt on court in about two minutes. No account needed." },
    about: { title: "About", description: "Why PickleballRecs exists: pickleball paddle opinions are scattered across Reddit, YouTube, shops and forums. PickleballRecs collects them and lets players add their own." },
    ogAlt: "PickleballRecs – real player reviews of pickleball paddles",
    ogProductAlt: "Pickleball paddle player reviews on PickleballRecs",
    ogEyebrow: "Player reviews of pickleball paddles",
    ogTitle: "Real player reviews of pickleball paddles",
    ogDetail: "From players, Reddit, YouTube, shops and forums",
    ogFallbackTitle: "Pickleball paddle reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other players how a paddle actually played for you. Takes about two minutes, no account needed.",
      howItWent: "how it played",
      aboutYou: "About your game",
      aboutYouHint: "optional · helps people find players like them",
      howItPerforms: "How it plays",
      whoUsesIt: "Who's playing it",
      triedIt: "Played it?",
      triedOne: "Played one?",
      triedOneOfThese: "Played one of these?",
    },
    notFound: "We couldn’t find that paddle or page. Maybe it moved, maybe it never existed, maybe the link just landed in the kitchen.",
    about: {
      heading: "Why PickleballRecs exists",
      paragraphs: [
        "Paddle reviews are scattered across Reddit, YouTube, shops and forums. PickleballRecs puts those experiences in one place and lets players add their own.",
        "A paddle that works for one player won’t work for everyone. Knowing someone’s level, whether they play singles or doubles, and how long they’ve used a paddle often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Players, not promotions", body: "No sponsored rankings. No paid placements. No ads, affiliate links or sales. Ratings come from player submissions, and external comments stay separate from those ratings." },
        { heading: "A work in progress", body: "PickleballRecs is new. Player submissions are moderated before publication, web reviews link to their sources, and paddle specifications come from the manufacturers’ published figures." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about paddles you’ve actually played with and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
