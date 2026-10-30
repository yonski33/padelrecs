import type { Niche } from "./types";
import { movedHostPages } from "./software-moved";

// Rating icons: a rounded app tile with a smaller tile inside it, indigo with a mint centre. Same tile sizes as the other
// niches (17×14 strip, 20×20 picker); the strip tile widens the 20×20 drawing's viewBox so the tile stays square.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const tile = (fill: string, inner: string, q: string) =>
  `<rect x=${q}2${q} y=${q}2${q} width=${q}16${q} height=${q}16${q} rx=${q}4.4${q} fill=${q}${fill}${q}/><rect x=${q}6.6${q} y=${q}6.6${q} width=${q}6.8${q} height=${q}6.8${q} rx=${q}1.8${q} fill=${q}${inner}${q}/>`;
const tileIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? tile("#3730a3", "#34d399", "'") : tile("#e5e7eb", "#ffffff", "'")}</svg>`);
};
const ogTile = (fill: string, inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${tile(fill, inner, '"')}</svg>`;

export const software: Niche = {
  id: "software",
  schema: "softwarerecs",
  site: {
    name: "SoftwareRecs",
    domain: "softwarerecs.com",
    wordmark: "softwarerecs",
    descriptor: "real reviews of AI assistants, coding tools, password managers, VPNs and the apps people work in",
    footer: "kept by people who use these tools every day.",
    analyticsId: "G-B98RNX7JE8",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "tool", many: "tools", One: "Tool", Many: "Tools" },
  people: { one: "user", many: "users", One: "User", Many: "Users" },
  // Software changes every few months, so the front page and rankings only count the last year of reviews.
  recentMonths: 12,
  // Software is named by product, not by year; plans and versions of one product are one entry.
  productYears: false,
  productPath: "tools",
  // Tool pages link to the vendor's own website (website_url), not Amazon. Affiliate links come later, as data only.
  website: { label: "Visit site" },
  scoreUnit: { one: "tile", many: "tiles" },
  // White page, indigo ink, one mint accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f7f7fb",
    "--ink": "#111827",
    "--ink-2": "#374151",
    "--ink-3": "#6b7280",
    "--line": "#ebebf2",
    "--line-2": "#d9d9e6",
    "--green": "#3730a3",
    "--green-ink": "#1e1b4b",
    "--green-wash": "#eef0fb",
    "--green-line": "#d3d6f3",
    "--on-green": "#ffffff",
    "--on-green-muted": "#c7c9f0",
    "--lime": "#34d399",
    "--lime-wash": "#e7faf2",
    "--lime-line": "#a7f0d0",
    "--lime-ink": "#047857",
    "--lime-ink-2": "#065f46",
    "--score-on": tileIcon("tile", true),
    "--score-off": tileIcon("tile", false),
    "--score-pick-on": tileIcon("pick", true),
    "--score-pick-off": tileIcon("pick", false),
  },
  chartColors: ["var(--green)", "#34d399", "#d9d9e6", "#f43f5e", "#a7f0d0", "#94a3b8"],
  og: {
    background: "#3730a3",
    accent: "#34d399",
    muted: "#c7c9f0",
    text: "#ffffff",
    scoreOn: ogTile("#34d399", "#3730a3"),
    scoreOff: ogTile("#4f46b5", "#3730a3"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — disappointed", "1": "1 — regret paying for it" },
  // Fixed rating columns, relabelled for software: power = features, comfort = ease of use, control = reliability,
  // maneuverability = speed, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Features", hint: "does what you need, quality of the results, integrations" },
    { column: "comfortRating", label: "Ease of use", hint: "setup, learning curve, how clear the app is" },
    { column: "controlRating", label: "Reliability", hint: "bugs, outages, sync, how much you can trust it" },
    { column: "maneuverabilityRating", label: "Speed", hint: "how fast it runs, loads or connects" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price, fair plans, free tier" },
  ],
  profile: {
    playerLevel: { label: "How you use it", adminLabel: "Use", options: [
      { value: "Personal", display: "personal use" }, { value: "Freelance", display: "freelancer" },
      { value: "Small team", display: "small team", hint: "under 50 people" }, { value: "Company", display: "company", hint: "50+ people" },
    ] },
    playingSide: { label: "Plan", adminLabel: "Plan", options: [
      { value: "Free", display: "free plan" }, { value: "Paid", display: "paid plan" },
      { value: "Team or business", display: "team plan" }, { value: "Enterprise", display: "enterprise plan" },
    ] },
    playingStyle: { label: "What you do", adminLabel: "Role", options: [
      { value: "Developer" }, { value: "Designer" }, { value: "Writer or creator" }, { value: "Marketing or sales" },
      { value: "Founder or small business" }, { value: "Student" }, { value: "Other" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried it", hint: "A trial or a few days", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, balance = pricing model, surface = whether there is a free plan, core = platforms,
  // weight = the AI model family the vendor says it runs on. Prices themselves change too often to keep, so they are left out.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Password manager", options: ["AI assistant", "AI coding tool", "AI image & video", "AI writing & notes", "Notes app", "Project management", "Password manager", "Website builder", "Design & video", "Email marketing", "CRM", "Accounting", "VPN"] },
    { column: "balance", label: "Pricing", max: 120, placeholder: "e.g. Subscription, Freemium, One-time purchase or Pay as you go", options: ["Free", "Freemium", "Subscription", "One-time purchase", "Pay as you go"] },
    { column: "surface", label: "Free plan", max: 60, placeholder: "Yes or No", options: ["Yes", "No"] },
    { column: "core", label: "Platforms", max: 120, placeholder: "e.g. Web, Windows, Mac, iOS, Android, Linux" },
    { column: "weight", label: "AI model", max: 80, placeholder: "e.g. OpenAI GPT models" },
  ],
  // Web hosting moved to HostingRecs (2026-10-30): its old pages 301 there.
  movedAway: movedHostPages,
  shapeFilter: ["AI assistant", "AI coding tool", "AI image & video", "AI writing & notes", "Notes app", "Project management", "Password manager", "Website builder", "Design & video", "Email marketing", "CRM", "Accounting", "VPN"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "AI assistant", slug: "ai-assistants", label: "AI assistants", seoLabel: "AI Assistants", intro: "AI chat assistants and AI search" },
    { shape: "AI coding tool", slug: "ai-coding-tools", label: "AI coding", seoLabel: "AI Coding Tools", intro: "AI code editors, coding agents and code assistants" },
    { shape: "AI image & video", slug: "ai-image-video", label: "AI image & video", seoLabel: "AI Image & Video Generators", intro: "AI image, video and voice generators" },
    { shape: "AI writing & notes", slug: "ai-writing-tools", label: "AI writing & notes", seoLabel: "AI Writing & Note-Taking Tools", intro: "AI writing assistants and AI meeting note takers" },
    { shape: "Notes app", slug: "notes-apps", label: "Notes", seoLabel: "Note-Taking Apps", intro: "Note-taking apps, wikis and personal knowledge bases" },
    { shape: "Project management", slug: "project-management", label: "Projects", seoLabel: "Project Management Tools", intro: "Project management, task and issue tracking tools" },
    { shape: "Password manager", slug: "password-managers", label: "Passwords", seoLabel: "Password Managers", intro: "Password managers for people, families and teams" },
    { shape: "Website builder", slug: "website-builders", label: "Websites", seoLabel: "Website Builders", intro: "Website builders and e-commerce platforms" },
    { shape: "Design & video", slug: "design-video-editing", label: "Design & video", seoLabel: "Design & Video Editing Tools", intro: "Design, photo and video editing apps" },
    { shape: "Email marketing", slug: "email-marketing", label: "Email", seoLabel: "Email Marketing Tools", intro: "Email marketing and newsletter platforms" },
    { shape: "CRM", slug: "crm", label: "CRM", seoLabel: "CRM Software", intro: "CRMs and sales tools" },
    { shape: "Accounting", slug: "accounting", label: "Accounting", seoLabel: "Accounting Software", intro: "Accounting, bookkeeping and invoicing software" },
    { shape: "VPN", slug: "vpns", label: "VPNs", seoLabel: "VPNs", intro: "Consumer VPN services" },
  ],
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "easy to use", tone: "pos" },
    { label: "powerful", tone: "pos" },
    { label: "reliable", tone: "pos" },
    { label: "fast", tone: "pos" },
    { label: "accurate results", tone: "pos" },
    { label: "great integrations", tone: "pos" },
    { label: "good free plan", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "helpful support", tone: "pos" },
    { label: "privacy-friendly", tone: "pos" },
    { label: "clean design", tone: "pos" },
    { label: "buggy", tone: "neg" },
    { label: "slow", tone: "neg" },
    { label: "outages", tone: "neg" },
    { label: "makes things up", tone: "neg" },
    { label: "steep learning curve", tone: "neg" },
    { label: "missing features", tone: "neg" },
    { label: "poor support", tone: "neg" },
    { label: "expensive", tone: "neg" },
    { label: "price hikes", tone: "neg" },
    { label: "hard to cancel", tone: "neg" },
    { label: "usage limits", tone: "neutral" },
    { label: "best for teams", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough tools in it have reviews. Filters compare the first word of
  // a value, so every AI category matches "AI"; the AI list therefore covers all four AI categories together.
  topLists: [
    { slug: "best-ai-tools", label: "AI tools", title: "Best AI Tools", minReviews: 5,
      intro: "The AI assistants, coding tools, image and video generators and writing tools users are most consistently happy with.", filters: [{ column: "shape", include: ["AI"] }] },
    { slug: "best-note-taking-apps", label: "Notes apps", title: "Best Note-Taking Apps", minReviews: 5,
      intro: "The note-taking and knowledge apps users are most consistently happy with.", filters: [{ column: "shape", include: ["Notes app"] }] },
    { slug: "best-project-management-software", label: "Project management", title: "Best Project Management Software", minReviews: 5,
      intro: "The project and task management tools users are most consistently happy with.", filters: [{ column: "shape", include: ["Project management"] }] },
    { slug: "best-password-managers", label: "Password managers", title: "Best Password Managers", minReviews: 5,
      intro: "The password managers users are most consistently happy with.", filters: [{ column: "shape", include: ["Password manager"] }] },
    { slug: "best-website-builders", label: "Website builders", title: "Best Website Builders", minReviews: 5,
      intro: "The website builders and e-commerce platforms users are most consistently happy with.", filters: [{ column: "shape", include: ["Website builder"] }] },
    { slug: "best-email-marketing-software", label: "Email marketing", title: "Best Email Marketing and Newsletter Software", minReviews: 5,
      intro: "The email marketing and newsletter platforms users are most consistently happy with.", filters: [{ column: "shape", include: ["Email marketing"] }] },
    { slug: "best-accounting-software", label: "Accounting", title: "Best Accounting Software", minReviews: 5,
      intro: "The accounting and invoicing tools users are most consistently happy with.", filters: [{ column: "shape", include: ["Accounting"] }] },
    { slug: "best-vpn-services", label: "VPNs", title: "Best VPN Services", minReviews: 5,
      intro: "The VPNs users are most consistently happy with.", filters: [{ column: "shape", include: ["VPN"] }] },
    { slug: "best-free-software-tools", label: "Best free plans", title: "Software Tools With the Best Free Plans", minReviews: 5,
      intro: "The tools users most often say have a good free plan.", trait: { tags: ["good free plan"], minShare: 0.2, against: ["usage limits"], noun: "the free plan" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Forum", "Other"],
  examples: { brand: "Notion", model: "Notion", year: 2026, search: "notion" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["What do you use it for?", "I mostly use it for "], ["Anything that bugs you?", "The one thing I'd change is "]],
    tips: ["What you used before and why you switched", "What you use it for, how often, and on which plan", "What it does well and where it falls short", "Bugs, outages, limits or support you ran into", "Whether it's worth the price for you"],
  },
  seo: {
    homeTitle: "SoftwareRecs – Real Reviews of AI Tools, Password Managers, VPNs and Work Apps",
    homeDescription: "Browse real user reviews of AI assistants, AI coding tools, note-taking apps, project management tools, password managers, website builders, email marketing, CRM, accounting software and VPNs, plus opinions collected from Reddit, YouTube and forums. Compare ChatGPT, Claude, Cursor, Notion, 1Password, Shopify and more.",
    layoutDescription: "Real experiences with software and AI tools — assistants, coding tools, notes, project management, password managers, website builders and VPNs — plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | SoftwareRecs",
    catalog: { title: "All Software and AI Tools – Reviews and Ratings", description: "Every AI tool, app and online service on SoftwareRecs with user ratings. Filter by category and brand, then read what users say." },
    brands: { title: "Software Companies", description: "Browse software by company — OpenAI, Anthropic, Google, Notion, 1Password, Shopify, Proton and more — and read real reviews of each tool." },
    brand: brand => ({ title: `${brand} Software – Reviews`, description: `Real user reviews of ${brand} software and services: ratings, strengths and weaknesses for every ${brand} tool on SoftwareRecs.` }),
    product: name => ({ title: `${name} Reviews | SoftwareRecs`, description: `Read real user experiences with ${name}. Ratings for features, ease of use, reliability, speed and value, plus opinions from around the web.` }),
    productNotFound: "Tool not found | SoftwareRecs",
    productCategory: "Software",
    addReview: { title: "Add a Software Review", description: "Use an AI assistant, a notes app, a password manager or a VPN? Share how it works for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why SoftwareRecs exists: honest opinions about software are buried under affiliate lists. SoftwareRecs collects first-hand experiences and lets users add their own." },
    ogAlt: "SoftwareRecs – real reviews of software and AI tools",
    ogProductAlt: "Software reviews on SoftwareRecs",
    ogEyebrow: "Real reviews of software and AI tools",
    ogTitle: "Software reviews from people who use it every day",
    ogDetail: "From users, Reddit, YouTube and forums",
    ogFallbackTitle: "Software reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell others how an AI tool, app or online service actually works for you day to day. Takes about two minutes, no account needed.",
      howItWent: "how it works for you",
      aboutYou: "About how you use it",
      aboutYouHint: "optional · helps people find users like them",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's using it",
      triedIt: "Used it?",
      triedOne: "Used one?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "We couldn’t find that tool or page. Maybe it was renamed, maybe it shut down, maybe it pivoted to AI.",
    about: {
      heading: "Why SoftwareRecs exists",
      paragraphs: [
        "Search for the best VPN, password manager or AI tool and most of what you find is a ranked list that pays per signup. SoftwareRecs collects first-hand experiences from Reddit, YouTube and forums instead, and lets users add their own.",
        "A tool that is perfect for a solo freelancer can be painful for a 200-person company, and a free plan that is fine for notes may not survive a team. Knowing how someone uses a tool, on which plan and for how long often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Users, not promotions", body: "No sponsored rankings. No paid placements. Ratings come from user submissions, and quotes from around the web stay separate from those ratings. We skip posts from company staff, resellers and affiliates. Tool pages link to each product’s official website." },
        { heading: "A work in progress", body: "SoftwareRecs is new. Submissions are moderated before publication, web reviews link to their sources, and product details come from each company’s own site." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about software you actually use or have used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
