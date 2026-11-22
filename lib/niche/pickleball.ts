import type { Niche } from "./types";
import { pickleballGuide } from "./pickleball-guide";

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
  guide: pickleballGuide,
  // The PadelRecs v2 design (owner 2026-11-16, "Yes, start pickleball"): the same pages and components, with only these
  // per-site words, its own logo and colours, and the paddle profile (lib/fit-config.ts PICKLEBALL) on the match engine.
  design: "v2",
  v2copy: {
    homeH1: ["Find your", "pickleball paddle"],
    sport: "pickleball", emoji: "🏓", strip: "a free, ad-light side project · built by pickleball players",
    madeBy: "made by people who own too many paddles 🏓", forum: "pickleball forum", blog: "pickleball blog",
    aboutStory: ["pickleballrecs started on the sideline of a 3.5 open play. Every paddle claimed more power, more spin and more control at once, every review site sold the same picks, and nobody said which ones suit a game like ours.",
      "So we built the thing we wanted: one place that brings player reviews, YouTube reviewers and pickleball forums together, counts it honestly, and tells you if a paddle fits"],
    example: "Six Zero Ruby",
    logo: "icon",
    // The add-review page: the dot ratings' low / high words (spin is stored in comfort_rating) and the "+ prompt" chips.
    rate: { powerRating: ["no put-away", "cannon"], controlRating: ["all over the place", "on a string"], comfortRating: ["no bite", "grabs the ball"],
      forgivenessRating: ["tiny sweet spot", "huge sweet spot"], maneuverabilityRating: ["slow in hand battles", "lightning hands"] },
    prompts: ["what surprised you", "what you came from", "how the grit held up", "who should skip it"],
    footLine: "we read YouTube, forums & your reviews, count the reviews, write one honest line. no sponsored picks.", footBrands: true,
  },
  // The home in the owner's PickleballRecs mock (2026-11-16), on the shared v2 components.
  v2home: {
    // The hero is the shared "Less guessing. Better paddles." (owner 2026-11-16 screenshot).
    listSub: "ranked by player score and how many players reviewed it · pick above for your match %",
    matchRows: true, rankTiles: true, steps: true,
    faq: [
      { q: "Best paddle for beginners?", a: "A standard shape with a 16mm core, mid weight and a big sweet spot. The top beginner matches right now: {top:beginner}.", link: "See the beginner list →", href: "/?level=beginner#match" },
      { q: "Best for tennis elbow?", a: "Thicker 16mm cores and softer faces soak up vibration. Players with arm pain rank {top:arm} first.", link: "See arm-friendly paddles →", href: "/?arm=1#match" },
      { q: "Elongated or standard?", a: "Elongated gives reach and power on drives; standard gives a wider sweet spot and quicker hands. Most players start standard.", link: "Read the paddle guide →", href: "/guide#shape" },
      { q: "14mm or 16mm core?", a: "14mm is poppier and faster; 16mm is softer, more controlled and kinder to the arm.", link: "Core explained →", href: "/guide#core" },
      { q: "What does the match % mean?", a: "How well a paddle fits the style, level and arm you picked. It is not a quality score; the player score is separate.", link: "How we score →", href: "/how-we-make-these#match" },
    ],
  },
  schema: "pickleballrecs",
  site: {
    name: "PickleballRecs",
    domain: "pickleballrecs.com",
    wordmark: "pickleballrecs",
    descriptor: "player reviews of pickleball paddles",
    footer: "kept by people who own too many paddles.",
    analyticsId: "G-2W4S5QT9CZ",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "paddle", many: "paddles", One: "Paddle", Many: "Paddles" },
  people: { one: "player", many: "players", One: "Player", Many: "Players" },
  recentMonths: 24,
  // Makers update paddles by name (Vatic Pro Prism → Prism Flash, Prism V7), not by year, so names carry no model year.
  // The year column still holds the year the maker first listed the paddle.
  productYears: false,
  // Match audit 2026-11-16: every row was its own family, so versions sat side by side and "show older models" did nothing.
  familiesByName: true,
  productPath: "paddles",
  amazon: { searchIndex: "SportsAndOutdoors", photos: true },
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
    // The v2 pages (owner's PickleballRecs mock, 2026-11-16): navy ink, optic-yellow accent and match colours, blue offset
    // shadows on cards, Bricolage Grotesque for headings. Unset on padel, which keeps its own.
    "--site-ink": "#17203a",
    "--site-text": "#2a3150",
    "--site-mute": "#5a6078",
    "--site-soft": "#4a5068",
    "--site-display": "var(--font-display)",
    "--site-acc": "oklch(0.92 0.17 105)",
    "--site-marker": "oklch(0.92 0.17 105)",
    "--site-good": "oklch(0.92 0.17 105)",
    "--site-soso": "oklch(0.95 0.08 105)",
    "--site-wash": "oklch(0.985 0.035 105)",
    // Product page v11 (2026-11-17): the build cards' tint and How it plays' top band.
    "--site-tint": "oklch(0.96 0.07 105)",
    "--site-top": "oklch(0.975 0.05 105)",
    "--site-wash-line": "oklch(0.88 0.08 105)",
    "--site-shadow": "oklch(0.62 0.12 235)",
    "--site-scale": "linear-gradient(90deg, oklch(0.95 0.06 105), oklch(0.8 0.12 105) 50%, #17203a)",
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
  shapeFilter: ["Standard", "Widebody", "Elongated", "Hybrid"],
  rowDetail: { column: "core", suffix: " core" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "easy power", tone: "pos", says: "say it gives easy power" },
    { label: "great pop", tone: "pos", says: "say it has great pop" },
    { label: "good control", tone: "pos", says: "say it has good control" },
    { label: "great for dinks", tone: "pos", says: "say it is great for dinks" },
    { label: "lots of spin", tone: "pos", says: "say it gives lots of spin" },
    { label: "forgiving", tone: "pos", says: "say it is forgiving" },
    { label: "fast hands", tone: "pos", says: "say it is fast in hand battles" },
    { label: "arm-friendly", tone: "pos", says: "say it is kind to the arm" },
    { label: "small sweet spot", tone: "neg", says: "say it has a small sweet spot" },
    { label: "hard to control", tone: "neg", says: "say it is hard to control" },
    { label: "low spin", tone: "neg", says: "say it gives little spin" },
    { label: "dead spots", tone: "neg", says: "report dead spots" },
    { label: "delamination", tone: "neg", says: "report delamination" },
    { label: "durability issues", tone: "neg", says: "report durability issues" },
    { label: "firm", tone: "neutral", says: "say it feels firm" },
    { label: "soft", tone: "neutral", says: "say it feels soft" },
  ],
  // Same bar as padel (owner via the recs PM 2026-11-15: "fit bar = 6, same rules as padel"); under 15 the verdict and % say
  // they rest on fewer reports.
  fit: { minReports: 6, fewReports: 15,
    // One level source (Grok audit 2026-11-17, owner rule): the gate is the page's own "Generally best for" bar (lib/fit-verdict
    // SUITS_OK 62), so a level the page doesn't list is never Worth a look or better (it was 60 / 50 / 50).
    levelGate: { beginner: 62, intermediate: 62, advanced: 62 },
    // Match audit 2026-11-16: gate on 5+ players or an expert value only; an expert's level reaches the next level at 55, so
    // an "intermediate" paddle stays in advanced lists (it was 45, under the gate).
    gateMinPlayers: 5, expertAdjacentSuits: 55,
    // The match engine with padel's numbers (owner 2026-11-16: the shared engine), the paddle traits and the spin pick. Maker
    // label words as in the lower-cased name ("Double Black Diamond Control", "Vapor Power 2").
    engine: { m: 10, k: 6, ks: 12, E: 8, z: 2.0, wq: 0.30, wf: 0.60, wp: 0.10, minReports: 6, ax: 0.75,
      controlLabels: [" control", " ctrl"], powerLabels: [" power", " pwr"],
      labelBounds: [0.3, 0.72, 0.35, 0.65], cuts: { good: 75, maybe: 55 }, armShare: 0.5, fineShare: 0.2,
      // The match-audit tuning pass (Grok audit, owner OK 2026-11-16): level in the score, per-style anchors, a squared balance
      // term, quality for "any", a hard-reason cap, best member per family, ties by reports.
      levelShare: 0.2, balanceSquared: true, anyByQuality: true, anchorsPerStyle: true, hardCap: 54, familyBestWithin: 3, tieByReports: true,
      // PickleballRecs' own (audit 2026-11-16): fine-tune penalty only; the name only clamps the axis while players have said
      // little (owner 2026-11-16: "weakEvidence"); sore arm demotes 14 mm cores and firm feels a little; spin has its own %.
      finePenalty: 0.35, labelClamp: "weakEvidence", armSpecDemote: { core14: 0.04, firm: 0.03 }, styles: ["control", "balance", "power", "spin"],
      traits: ["power", "pop", "control", "spin", "forgiveness", "speed", "arm"], complaint: ["forgiveness", "arm"],
      // Grok audit 2026-11-17 (owner-approved plan): bars span the catalogue (108 of 178 read "Moderate power" at a floor of 3).
      // and a bar never reads the opposite of its own page's Why yes / Why not (#8 #9).
      lowShare: 0.2, pageBars: true,
      // and a power, control or spin pick needs that bar above 3 for a Strong fit (padel #438, audit #3 #4 #12).
      styleBarMax: 3,
      // A paddle's own style never scores under "balance", the opposite style never over it (#15).
      styleOrder: true,
      // Curated lists (db/curated/pickleball.json, owner 2026-11-19): as padel, curated #1–3 are at least Strong fits.
      curatedTop: [90, 86, 82] } },
  finder: {
    title: "Pickleball Paddle Finder Quiz",
    heading: "Which pickleball paddle is right for you?",
    description: "Answer five quick questions and get the pickleball paddles whose real player reviews best match how you play.",
    intro: "Answer 5 quick questions and see what real players recommend.",
    navLabel: "Find Your Paddle",
    invite: "Not sure which paddle to choose?",
    minReviews: 10,
    rankWeight: 0.3,
    maxAgeYears: 2,
    questions: [
      { id: "style", question: "What do you want most from a paddle?", options: [
        { label: "Power", hint: "Drives and put-aways", want: ["easy power", "great pop"], weight: 1.5, list: "best-power-pickleball-paddles" },
        { label: "Control", hint: "Placement and touch", want: ["good control", "great for dinks"], avoid: ["hard to control"], weight: 1.5, list: "best-control-pickleball-paddles" },
        { label: "Spin", hint: "Serves and topspin drives", want: ["lots of spin"], avoid: ["low spin"], weight: 1.5, list: "best-spin-pickleball-paddles" },
        { label: "A bit of everything", want: ["good control", "easy power"] },
      ] },
      { id: "level", question: "What's your level?", options: [
        { label: "Beginner", hint: "Still learning the game", want: ["forgiving"], avoid: ["hard to control", "small sweet spot"], weight: 2 },
        { label: "Intermediate", hint: "Regular games, solid basics", want: ["forgiving"], avoid: ["hard to control"], weight: 0.75 },
        { label: "Advanced", hint: "Tournaments or high-level rec play" },
      ] },
      { id: "game", question: "Where do you win most of your points?", options: [
        { label: "At the kitchen", hint: "Dinks and quick hands battles", want: ["great for dinks", "fast hands"], weight: 0.75 },
        { label: "From the baseline", hint: "Drives and deep returns", want: ["great pop", "easy power"], weight: 0.75 },
        { label: "A mix of both" },
      ] },
      { id: "feel", question: "How do you like the paddle to feel?", options: [
        { label: "Soft", want: ["soft"], avoid: ["firm"], weight: 0.75 },
        { label: "Firm", want: ["firm"], avoid: ["soft"], weight: 0.75 },
        { label: "No preference" },
      ] },
      { id: "lasting", question: "Is long-term durability a priority?", options: [
        { label: "Yes", hint: "I want it to last", avoid: ["durability issues", "delamination", "dead spots"], weight: 2 },
        { label: "Not really" },
      ] },
    ],
  },
  // /rankings pages (lib/top-lists.ts). No model-year cutoff: paddles are updated by name (Prism Flash, V7…), not by year,
  // and older models like the 2023 Prism are still current. Paddle shapes are too sparsely filled in to filter on, so lists go by review tags.
  // "Similar products" at the foot of product pages (owner 2026-11-16).
  similar: { mode: "single" },
  topLists: [
    { slug: "best-pickleball-paddles", label: "Best overall", title: "Best Pickleball Paddles", minReviews: 12,
      intro: "The paddles players are most consistently happy with." },
    // Grok audit 2026-11-17 (#3 #4 #12): a trait list takes only paddles whose own bar for it is 4+.
    { slug: "best-power-pickleball-paddles", label: "Best for power", title: "Best Pickleball Paddles for Power", minReviews: 10,
      intro: "Paddles players keep describing as powerful: easy power and pop.",
      trait: { tags: ["easy power", "great pop"], minShare: 0.2, noun: "power or pop", bar: { key: "power", min: 4 } } },
    { slug: "best-control-pickleball-paddles", label: "Best for control", title: "Best Pickleball Paddles for Control", minReviews: 10,
      intro: "Paddles players praise for control, dinks and resets.",
      trait: { tags: ["good control", "great for dinks"], minShare: 0.2, against: ["hard to control"], noun: "control or dinks", bar: { key: "control", min: 4 } } },
    { slug: "best-spin-pickleball-paddles", label: "Best for spin", title: "Best Pickleball Paddles for Spin", minReviews: 10,
      intro: "Paddles players say put lots of spin on the ball.",
      trait: { tags: ["lots of spin"], minShare: 0.2, against: ["low spin"], noun: "spin", bar: { key: "spin", min: 4 } } },
    // For a kind of player (owner's mock, via the recs PM 2026-11-16): the home quick match's order for the pick, with the
    // level gate for beginners. No "under $100" list: we hold no prices.
    { slug: "best-pickleball-paddles-for-tennis-elbow", label: "Best for tennis elbow", title: "Best Pickleball Paddles for Tennis Elbow", minReviews: 10,
      intro: "Paddles players with arm pain keep recommending: soft, stable and kind to the elbow.", picks: { arm: true },
      trait: { tags: ["arm-friendly", "soft"], minShare: 0.1, noun: "arm comfort or a soft feel" } },
    { slug: "best-pickleball-paddles-for-beginners", label: "Best for beginners", title: "Best Pickleball Paddles for Beginners", minReviews: 10,
      intro: "Big sweet spots that forgive mishits while you learn.", picks: { level: "beginner" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Pickleball shop", "Forum", "Blog"],
  examples: { brand: "Joola", model: "Perseus 16mm", year: 2025, search: "joola" },
  form: {
    prompts: [["What did you switch from?", "Before this I played with "], ["Weight as played?", "Mine weighs about "], ["Spin and pop?", "On spin and pop it "]],
    tips: ["What you played with before, and how this compares", "Your weight as played, if you added lead tape", "Where it shines and where it struggles", "Spin, pop and feel at the kitchen", "Durability, dead spots or delamination once you’ve had it a while"],
    quickVote: { question: "Have you played with this paddle?", placeholder: "What stood out? Power, control, spin, how it suits your game…", nicknames: ["Dink", "Drive", "Erne", "Lob", "Volley", "Reset", "Kitchen", "Rally", "Smash", "Spin", "Drop", "Thirdshot"] },
  },
  seo: {
    homeTitle: "PickleballRecs – Real Player Reviews of Pickleball Paddles",
    homeDescription: "Browse real pickleball paddle reviews from players and opinions collected from YouTube, shops and forums. Compare experiences across Joola, Selkirk, Six Zero, CRBN, and more.",
    layoutDescription: "Real player experiences with pickleball paddles, plus opinions from YouTube, shops and forums with the source linked.",
    titleTemplate: "%s | PickleballRecs",
    catalog: { title: "All Pickleball Paddles – Player Reviews and Ratings", description: "Every pickleball paddle on PickleballRecs with community ratings. Filter by brand and shape, then read what players say about each one." },
    brands: { title: "Pickleball Paddle Brands", description: "Browse pickleball paddles by brand — Joola, Selkirk, Six Zero, CRBN, Engage and more — and read real player reviews of each model." },
    brand: brand => ({ title: `${brand} Pickleball Paddles – Player Reviews`, description: `Real player reviews of ${brand} pickleball paddles: ratings, strengths and weaknesses for every ${brand} model on PickleballRecs.` }),
    product: name => ({ title: `${name} Player Reviews | PickleballRecs`, description: `Read real player experiences with the ${name}. Ratings, power, control, spin, and opinions from PickleballRecs and around the web.` }),
    productNotFound: "Paddle not found | PickleballRecs",
    productCategory: "Pickleball paddle",
    addReview: { title: "Add a Pickleball Paddle Review", description: "Played with a pickleball paddle? Share how it felt on court in about two minutes. No account needed." },
    about: { title: "About", description: "Why PickleballRecs exists: pickleball paddle opinions are scattered across YouTube, shops and forums. PickleballRecs collects them and lets players add their own." },
    ogAlt: "PickleballRecs – real player reviews of pickleball paddles",
    ogProductAlt: "Pickleball paddle player reviews on PickleballRecs",
    ogEyebrow: "Player reviews of pickleball paddles",
    ogTitle: "Real player reviews of pickleball paddles",
    ogDetail: "From players, YouTube, shops and forums",
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
        "Paddle reviews are scattered across YouTube, shops and forums. PickleballRecs puts those experiences in one place and lets players add their own.",
        "A paddle that works for one player won’t work for everyone. Knowing someone’s level, whether they play singles or doubles, and how long they’ve used a paddle often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Players, not promotions", body: "No sponsored rankings. No paid placements. Rankings are counted from reviews: the ones players write here and the ones collected and summarized from around the web. Each is read as positive, mixed or negative. Paddle pages link to Amazon, and PickleballRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "A work in progress", body: "PickleballRecs is new. Player submissions are moderated before publication, web reviews link to their sources, and paddle specifications come from the manufacturers’ published figures." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about paddles you’ve actually played with and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
