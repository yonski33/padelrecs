import type { Niche } from "./types";

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

export const stackrecs: Niche = {
  id: "stackrecs",
  schema: "stackrecs",
  // The public name lives here only (owner 2026-11-19: StackRecs, stackrecs.com), so a rename is a one-file change.
  site: {
    name: "StackRecs",
    domain: "stackrecs.com",
    wordmark: "stackrecs",
    descriptor: "community votes and reviews of AI coding agents, app builders and SEO tools",
    footer: "votes and reviews from people who build and grow sites.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "tool", many: "tools", One: "Tool", Many: "Tools" },
  people: { one: "user", many: "users", One: "User", Many: "Users" },
  // Tools change every few months (plan PR #517 section 6): scores count 18 months, newer opinions weigh more
  // (lib/stack/score.ts).
  recentMonths: 18,
  // Tools are named by product, not by year; plans and versions of one product are one entry.
  productYears: false,
  productPath: "tools",
  // Tool pages link to the vendor's own website (website_url), not Amazon. "Try it" links only where a programme exists (lib/stack/catalog.ts).
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
  ratingWords: { "5": "5: love it", "4": "4: really like it", "3": "3: it's fine", "2": "2: disappointed", "1": "1: regret paying for it" },
  // Fixed rating columns, relabelled: power = output quality, comfort = ease of use, control = reliability,
  // maneuverability = speed, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Output quality", hint: "the code, pages or content it produces" },
    { column: "comfortRating", label: "Ease of use", hint: "setup, learning curve, how clear it is" },
    { column: "controlRating", label: "Reliability", hint: "bugs, outages, how much you can trust it" },
    { column: "maneuverabilityRating", label: "Speed", hint: "how fast it works" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price, fair limits, free tier" },
  ],
  profile: {
    playerLevel: { label: "You are", adminLabel: "Skill", options: [
      { value: "Non-coder", display: "non-coder" }, { value: "Some code", display: "some code" }, { value: "Developer", display: "developer" },
      { value: "Solo", display: "solo" }, { value: "Agency", display: "agency" }, { value: "In-house team", display: "in-house team" },
    ] },
    playingSide: { label: "Plan", adminLabel: "Plan", options: [
      { value: "Free", display: "free plan" }, { value: "Paid", display: "paid plan" },
      { value: "Team or business", display: "team plan" }, { value: "Enterprise", display: "enterprise plan" },
    ] },
    playingStyle: { label: "What you use it for", adminLabel: "Use", options: [
      { value: "Building an app" }, { value: "Building a site" }, { value: "SEO" }, { value: "Content" }, { value: "Other" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried it", hint: "A trial or a few days", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" },
      { value: "1 to 6 months", hint: "1 to 6 months" }, { value: "6 to 12 months", hint: "6 to 12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category (it also says the side, lib/stack/catalog.ts), core = the version tags reviews
  // may carry (comma-separated, lib/variants.ts), balance = pricing model, surface = free plan or trial.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Coding agent",
      options: ["Coding agent", "App builder", "SEO suite", "Content tool", "AI writer", "Technical SEO", "AI visibility"] },
    { column: "core", label: "Versions", max: 200, placeholder: "e.g. Cursor 2.x, Cursor 3.x" },
    { column: "balance", label: "Pricing", max: 120, placeholder: "e.g. Subscription", options: ["Free", "Freemium", "Subscription", "Pay as you go", "By quote"] },
    { column: "surface", label: "Free plan", max: 60, placeholder: "Yes, Trial or No", options: ["Yes", "Trial", "No"] },
  ],
  shapeFilter: ["Coding agent", "App builder", "SEO suite", "Content tool", "AI writer", "Technical SEO", "AI visibility"],
  // Version tags on reviews ("Cursor 3.x", "Semrush 2026"): one page per tool, reviews filter by version.
  variants: { label: "Version", plural: "Versions" },
  rowDetail: { column: "balance", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "easy to use", tone: "pos" },
    { label: "great output", tone: "pos" },
    { label: "reliable", tone: "pos" },
    { label: "fast", tone: "pos" },
    { label: "accurate data", tone: "pos" },
    { label: "great integrations", tone: "pos" },
    { label: "good free plan", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "helpful support", tone: "pos" },
    { label: "buggy", tone: "neg" },
    { label: "slow", tone: "neg" },
    { label: "makes things up", tone: "neg" },
    { label: "steep learning curve", tone: "neg" },
    { label: "missing features", tone: "neg" },
    { label: "poor support", tone: "neg" },
    { label: "expensive", tone: "neg" },
    { label: "price hikes", tone: "neg" },
    { label: "usage limits", tone: "neg" },
    { label: "lock-in", tone: "neg" },
    { label: "best for teams", tone: "neutral" },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Forum", "Blog"],
  examples: { brand: "Anysphere", model: "Cursor", year: 2026, search: "cursor" },
  form: {
    prompts: [["What did you use before?", "Before this I used "], ["What do you use it for?", "I mostly use it for "], ["Anything that bugs you?", "The one thing I'd change is "]],
    tips: ["Which version or plan you used, and when", "What you built or grew with it", "What it does well and where it falls short", "Limits, bills or bugs you ran into", "Whether it's worth the price for you"],
  },
  seo: {
    homeTitle: "StackRecs: Community Votes on AI Coding Agents, App Builders and SEO Tools",
    homeDescription: "Find the right tool to build or grow a site. Community votes and reviews of Claude Code, Cursor, Codex, Lovable, Semrush, Ahrefs, SE Ranking and more, plus Reddit, YouTube and blog summaries.",
    layoutDescription: "Community votes and reviews of AI coding agents, app builders and SEO tools, with the sources linked.",
    titleTemplate: "%s | StackRecs",
    catalog: { title: "All Tools: AI Coding Agents, App Builders and SEO Tools", description: "Every tool on StackRecs, Build and Grow, with community scores. Read what people say, then vote." },
    brands: { title: "Tool Makers", description: "Browse tools by maker and read what people say about each one." },
    brand: brand => ({ title: `${brand} Tools: Reviews`, description: `Community votes and reviews of ${brand} tools on StackRecs.` }),
    product: name => ({ title: `${name} Reviews and Votes | StackRecs`, description: `What people say about ${name}: community votes, reviews and Reddit, YouTube and blog summaries, newest weighted most.` }),
    productNotFound: "Tool not found | StackRecs",
    productCategory: "Software",
    addReview: { title: "Add a Tool Review", description: "Use an AI coding agent, an app builder or an SEO tool? Share how it works for you. No account needed." },
    about: { title: "About", description: "Why StackRecs exists: tool reviews are buried under affiliate lists. StackRecs counts votes and first-hand reviews only." },
    ogAlt: "StackRecs: community votes on tools to build and grow",
    ogProductAlt: "Tool reviews on StackRecs",
    ogEyebrow: "Tools to build and grow",
    ogTitle: "Votes and reviews from people who build and grow sites",
    ogDetail: "From users, Reddit, YouTube and blogs",
    ogFallbackTitle: "Tool reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell others how a tool actually works for you. Takes about two minutes, no account needed.",
      howItWent: "how it works for you",
      aboutYou: "About how you use it",
      aboutYouHint: "optional · helps people find users like them",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's using it",
      triedIt: "Used it?",
      triedOne: "Used one?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "That tool or page isn't here. Maybe it was renamed, maybe it shut down, maybe it pivoted again.",
    about: {
      heading: "Why StackRecs exists",
      paragraphs: [
        "Search for the best coding agent or SEO tool and most of what you find is a ranked list that pays per signup. StackRecs counts community votes and first-hand reviews instead.",
        "Tools change every few months, so newer opinions weigh more and every review carries the version it was about.",
      ],
      sections: [
        { heading: "Commission-blind scores", body: "Scores come only from votes and outside reviews. Some tools pay a commission through a Try it link and most don't; that never changes a score or an order. Claude Code is treated like any other tool, although the site is built with AI agents, Claude Code among them." },
        { heading: "Adding your experience", body: "You don't need an account. Reviews are held for moderation before appearing publicly. Say which version you used." },
        { heading: "Your privacy", body: "A name is optional for a vote. If you leave an email address, it is stored privately and never shown." },
      ],
    },
  },
};
