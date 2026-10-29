import type { Niche } from "./types";

// Rating icons: a rack server unit (a rounded bar with a status light), deep teal with an orange light. Same tile sizes as the
// other niches (17×14 strip, 20×20 picker); the strip icon widens the 20×20 drawing's viewBox so the unit keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const unit = (fill: string, light: string, q: string) =>
  `<rect x=${q}2${q} y=${q}3.5${q} width=${q}16${q} height=${q}13${q} rx=${q}3.2${q} fill=${q}${fill}${q}/><circle cx=${q}6.6${q} cy=${q}10${q} r=${q}1.9${q} fill=${q}${light}${q}/><rect x=${q}10${q} y=${q}9${q} width=${q}5.2${q} height=${q}2${q} rx=${q}1${q} fill=${q}${light}${q} fill-opacity=${q}.55${q}/>`;
const unitIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? unit("#0b5563", "#f97316", "'") : unit("#e5e7eb", "#ffffff", "'")}</svg>`);
};
const ogUnit = (fill: string, light: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${unit(fill, light, '"')}</svg>`;

export const hosting: Niche = {
  id: "hosting",
  schema: "hostingrecs",
  site: {
    name: "HostingRecs",
    domain: "hostingrecs.com",
    wordmark: "hostingrecs",
    descriptor: "real reviews of web hosts, VPS and cloud providers, website builders, domain registrars and email hosting",
    footer: "kept by people who run their own sites and servers.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "service", many: "services", One: "Service", Many: "Services" },
  people: { one: "customer", many: "customers", One: "Customer", Many: "Customers" },
  // Hosts change owners, prices and hardware often, so the front page and rankings only count the last two years of reviews.
  recentMonths: 24,
  // Hosting is named by service, not by year; plans of one service are one entry.
  productYears: false,
  productPath: "services",
  // Service pages link to the provider's own website (website_url), not Amazon. Affiliate links come later, as data only.
  website: { label: "Visit site" },
  scoreUnit: { one: "server", many: "servers" },
  // White page, deep teal ink, one orange accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f5f9fa",
    "--ink": "#0f172a",
    "--ink-2": "#334155",
    "--ink-3": "#64748b",
    "--line": "#e6eef0",
    "--line-2": "#d2e0e3",
    "--green": "#0b5563",
    "--green-ink": "#06323b",
    "--green-wash": "#eaf4f6",
    "--green-line": "#c6e0e5",
    "--on-green": "#ffffff",
    "--on-green-muted": "#b9d9df",
    "--lime": "#f97316",
    "--lime-wash": "#fff3ea",
    "--lime-line": "#fed0ad",
    "--lime-ink": "#c2410c",
    "--lime-ink-2": "#9a3412",
    "--score-on": unitIcon("tile", true),
    "--score-off": unitIcon("tile", false),
    "--score-pick-on": unitIcon("pick", true),
    "--score-pick-off": unitIcon("pick", false),
  },
  chartColors: ["var(--green)", "#f97316", "#d2e0e3", "#e11d48", "#fed0ad", "#94a3b8"],
  og: {
    background: "#0b5563",
    accent: "#f97316",
    muted: "#b9d9df",
    text: "#ffffff",
    scoreOn: ogUnit("#ffffff", "#f97316"),
    scoreOff: ogUnit("#2a6f7c", "#0b5563"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — disappointed", "1": "1 — regret signing up" },
  // Fixed rating columns, relabelled for hosting: power = performance, comfort = ease of use, control = reliability,
  // maneuverability = support, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Performance", hint: "page speed, server resources, how it holds up under load" },
    { column: "comfortRating", label: "Ease of use", hint: "control panel, setup, DNS, deploys and migrations" },
    { column: "controlRating", label: "Reliability", hint: "uptime, outages, backups, email delivery" },
    { column: "maneuverabilityRating", label: "Support", hint: "how fast and how well support fixed things" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price, renewal prices, no surprise fees" },
  ],
  profile: {
    playerLevel: { label: "What you host", adminLabel: "Hosts", options: [
      { value: "Personal site", display: "personal site" }, { value: "Business site", display: "business site" },
      { value: "Online store", display: "online store" }, { value: "Client sites", display: "client sites", hint: "agency or freelancer" },
      { value: "Apps", display: "web apps", hint: "SaaS, APIs, side projects" },
    ] },
    playingSide: { label: "Plan", adminLabel: "Plan", options: [
      { value: "Free", display: "free plan" }, { value: "Entry", display: "entry plan" },
      { value: "Business", display: "business plan" }, { value: "Enterprise", display: "enterprise plan" },
    ] },
    playingStyle: { label: "Your experience", adminLabel: "Experience", options: [
      { value: "Beginner" }, { value: "Some experience" }, { value: "Developer" }, { value: "Sysadmin or DevOps" }, { value: "Other" },
    ] },
    timeWithRacket: { label: "Time with them", adminLabel: "Time with them", options: [
      { value: "Tried it", hint: "A trial or a few days", display: "tried it" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–12 months", hint: "1–12 months" }, { value: "1–3 years", hint: "1–3 years" }, { value: "More than 3 years", hint: "3 years +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, surface = whether the provider states a free plan or free tier. Prices are left out:
  // they change too often, and intro prices differ from renewal prices.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. VPS hosting", options: ["Shared hosting", "Managed WordPress", "VPS hosting", "Cloud platform", "Static & frontend hosting", "Managed cloud", "Dedicated server", "Website builder", "Domain registrar", "Email hosting"] },
    { column: "surface", label: "Free plan", max: 60, placeholder: "Yes or No", options: ["Yes", "No"] },
  ],
  shapeFilter: ["Shared hosting", "Managed WordPress", "VPS hosting", "Cloud platform", "Static & frontend hosting", "Managed cloud", "Dedicated server", "Website builder", "Domain registrar", "Email hosting"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Shared hosting", slug: "shared-hosting", label: "Shared", intro: "Shared web hosting with cPanel or the host's own panel" },
    { shape: "Managed WordPress", slug: "wordpress-hosting", label: "WordPress", intro: "Managed WordPress hosting", one: "WordPress host" },
    { shape: "VPS hosting", slug: "vps-hosting", label: "VPS", intro: "VPS and cloud server providers", one: "VPS" },
    { shape: "Cloud platform", slug: "cloud-hosting", label: "Cloud", intro: "Cloud platforms and app hosting (PaaS)", one: "Cloud" },
    { shape: "Static & frontend hosting", slug: "static-hosting", label: "Static", intro: "Static site and frontend hosting with Git deploys", one: "Static hosting" },
    { shape: "Managed cloud", slug: "managed-cloud", label: "Managed cloud", intro: "Managed cloud hosting and server control panels for your own servers" },
    { shape: "Dedicated server", slug: "dedicated-servers", label: "Dedicated", intro: "Dedicated and bare metal server providers" },
    { shape: "Website builder", slug: "website-builders", label: "Builders", intro: "Website builders and hosted site and store platforms", one: "Builder" },
    { shape: "Domain registrar", slug: "domain-registrars", label: "Domains", intro: "Domain name registrars", one: "Registrar" },
    { shape: "Email hosting", slug: "email-hosting", label: "Email", intro: "Email hosting for your own domain" },
  ],
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  tags: [
    { label: "fast", tone: "pos" },
    { label: "reliable", tone: "pos" },
    { label: "helpful support", tone: "pos" },
    { label: "easy to use", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "easy migration", tone: "pos" },
    { label: "good control panel", tone: "pos" },
    { label: "good free plan", tone: "pos" },
    { label: "scales well", tone: "pos" },
    { label: "transparent pricing", tone: "pos" },
    { label: "good deliverability", tone: "pos" },
    { label: "slow", tone: "neg" },
    { label: "outages", tone: "neg" },
    { label: "poor support", tone: "neg" },
    { label: "renewal price hike", tone: "neg" },
    { label: "upsells", tone: "neg" },
    { label: "hidden fees", tone: "neg" },
    { label: "account suspended", tone: "neg" },
    { label: "hard to cancel", tone: "neg" },
    { label: "resource limits", tone: "neg" },
    { label: "surprise bill", tone: "neg" },
    { label: "email delivery problems", tone: "neg" },
    { label: "best for beginners", tone: "neutral" },
    { label: "best for developers", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough services in it have reviews.
  topLists: [
    { slug: "best-shared-hosting", label: "Shared hosting", title: "Best Shared Hosting", minReviews: 5,
      intro: "The shared hosts customers are most consistently happy with.", filters: [{ column: "shape", include: ["Shared hosting"] }] },
    { slug: "best-wordpress-hosting", label: "WordPress hosting", title: "Best Managed WordPress Hosting", minReviews: 5,
      intro: "The managed WordPress hosts customers are most consistently happy with.", filters: [{ column: "shape", include: ["Managed WordPress"] }] },
    { slug: "best-vps-hosting", label: "VPS hosting", title: "Best VPS Hosting", minReviews: 5,
      intro: "The VPS providers customers are most consistently happy with.", filters: [{ column: "shape", include: ["VPS hosting"] }] },
    { slug: "best-cloud-hosting", label: "Cloud platforms", title: "Best Cloud Hosting Platforms", minReviews: 5,
      intro: "The cloud platforms and app hosts customers are most consistently happy with.", filters: [{ column: "shape", include: ["Cloud platform"] }] },
    { slug: "best-static-hosting", label: "Static hosting", title: "Best Static and Frontend Hosting", minReviews: 5,
      intro: "The static site and frontend hosts customers are most consistently happy with.", filters: [{ column: "shape", include: ["Static & frontend hosting"] }] },
    { slug: "best-managed-cloud-hosting", label: "Managed cloud", title: "Best Managed Cloud Hosting and Server Panels", minReviews: 5,
      intro: "The managed cloud hosts and server panels customers are most consistently happy with.", filters: [{ column: "shape", include: ["Managed cloud"] }] },
    { slug: "best-dedicated-servers", label: "Dedicated servers", title: "Best Dedicated Server Providers", minReviews: 5,
      intro: "The dedicated and bare metal providers customers are most consistently happy with.", filters: [{ column: "shape", include: ["Dedicated server"] }] },
    { slug: "best-website-builders", label: "Website builders", title: "Best Website Builders", minReviews: 5,
      intro: "The website builders customers are most consistently happy with.", filters: [{ column: "shape", include: ["Website builder"] }] },
    { slug: "best-domain-registrars", label: "Domain registrars", title: "Best Domain Registrars", minReviews: 5,
      intro: "The domain registrars customers are most consistently happy with.", filters: [{ column: "shape", include: ["Domain registrar"] }] },
    { slug: "best-email-hosting", label: "Email hosting", title: "Best Email Hosting", minReviews: 5,
      intro: "The email hosts customers are most consistently happy with.", filters: [{ column: "shape", include: ["Email hosting"] }] },
    { slug: "best-hosting-support", label: "Best support", title: "Hosting With the Best Support", minReviews: 5,
      intro: "The services customers most often say have helpful support.", trait: { tags: ["helpful support"], minShare: 0.2, against: ["poor support"], noun: "the support" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Forum", "Other"],
  examples: { brand: "Hetzner", model: "Hetzner Cloud", year: 2026, search: "hetzner" },
  form: {
    prompts: [["Where were you before?", "Before this I hosted with "], ["What do you run on it?", "I mostly use it for "], ["Anything that bugs you?", "The one thing I'd change is "]],
    tips: ["Where you hosted before and why you moved", "What you run on it, on which plan, and for how long", "Speed and uptime you actually saw", "Support tickets, outages or billing surprises", "What you pay now, including after renewal"],
  },
  seo: {
    homeTitle: "HostingRecs – Real Reviews of Web Hosting, VPS, Cloud, Website Builders, Domains and Email Hosting",
    homeDescription: "Browse real customer reviews of shared hosting, managed WordPress, VPS and cloud providers, static hosting, server panels, dedicated servers, website builders, domain registrars and email hosting, plus experiences collected from Reddit, YouTube and forums. Compare Hostinger, SiteGround, Hetzner, DigitalOcean, Vercel, Cloudflare and more.",
    layoutDescription: "Real experiences with web hosts, VPS and cloud providers, website builders, domain registrars and email hosting, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | HostingRecs",
    catalog: { title: "All Hosting Services – Reviews and Ratings", description: "Every web host, cloud provider, website builder, registrar and email host on HostingRecs with customer ratings. Filter by category and provider, then read what customers say." },
    brands: { title: "Hosting Providers", description: "Browse hosting by provider — Hostinger, SiteGround, Hetzner, DigitalOcean, Cloudflare, Google, Microsoft and more — and read real reviews of each service." },
    brand: brand => ({ title: `${brand} – Hosting Reviews`, description: `Real customer reviews of ${brand}: ratings, strengths and weaknesses for every ${brand} service on HostingRecs.` }),
    product: name => ({ title: `${name} Reviews | HostingRecs`, description: `Read real customer experiences with ${name}. Ratings for performance, ease of use, reliability, support and value, plus opinions from around the web.` }),
    productNotFound: "Service not found | HostingRecs",
    productCategory: "Web hosting",
    addReview: { title: "Add a Hosting Review", description: "Host a site, run a server, own a domain or use email hosting? Share how it works for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why HostingRecs exists: honest opinions about hosting are buried under affiliate lists. HostingRecs collects first-hand experiences and lets customers add their own." },
    ogAlt: "HostingRecs – real reviews of web hosting",
    ogProductAlt: "Hosting reviews on HostingRecs",
    ogEyebrow: "Real reviews of web hosting",
    ogTitle: "Hosting reviews from people who run their own sites",
    ogDetail: "From customers, Reddit, YouTube and forums",
    ogFallbackTitle: "Hosting reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell others how a web host, server, website builder, registrar or email host actually works for you. Takes about two minutes, no account needed.",
      howItWent: "how it works for you",
      aboutYou: "About what you host",
      aboutYouHint: "optional · helps people find customers like them",
      howItPerforms: "How it holds up",
      whoUsesIt: "Who's hosting with it",
      triedIt: "Hosted with them?",
      triedOne: "Used one?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "We couldn’t find that service or page. Maybe it was renamed, maybe it was bought, maybe it’s down for maintenance.",
    about: {
      heading: "Why HostingRecs exists",
      paragraphs: [
        "Search for the best web host and most of what you find is a ranked list that pays per signup — hosting has some of the biggest affiliate payouts on the web. HostingRecs collects first-hand experiences from Reddit, YouTube and forums instead, and lets customers add their own.",
        "A host that is perfect for a personal blog can be painful for a busy store, and an intro price says little about the renewal bill. Knowing what someone hosts, on which plan and for how long often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Customers, not promotions", body: "No sponsored rankings. No paid placements. Ratings come from customer submissions, and quotes from around the web stay separate from those ratings. We skip posts from hosting staff, resellers and affiliates, and anything carrying a referral link. Service pages link to each provider’s official website." },
        { heading: "A work in progress", body: "HostingRecs is new. Submissions are moderated before publication, web reviews link to their sources, and service details come from each provider’s own site." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about services you actually use or have used and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
