import type { Niche } from "./types";

// Rating icons: a filament spool seen from the side (flange, wound filament, hub), deep blue with orange filament. Same tile
// sizes as the other niches (17×14 strip, 20×20 picker); the strip icon widens the 20×20 drawing's viewBox so the spool stays round.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const spool = (flange: string, filament: string, hub: string, q: string) =>
  `<circle cx=${q}10${q} cy=${q}10${q} r=${q}8.6${q} fill=${q}${flange}${q}/><circle cx=${q}10${q} cy=${q}10${q} r=${q}6.4${q} fill=${q}${filament}${q}/><circle cx=${q}10${q} cy=${q}10${q} r=${q}2.6${q} fill=${q}${hub}${q}/>`;
const spoolIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? spool("#1f3a5a", "#f2792b", "#1f3a5a", "'") : spool("#e3e6eb", "#f1f3f6", "#e3e6eb", "'")}</svg>`);
};
const ogSpool = (flange: string, filament: string, hub: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${spool(flange, filament, hub, '"')}</svg>`;

export const print: Niche = {
  id: "print",
  schema: "printrecs",
  site: {
    name: "PrintRecs",
    domain: "printrecs.com",
    wordmark: "printrecs",
    descriptor: "real reviews of FDM and resin 3D printers, multi-material systems, enclosures, filament and resin",
    footer: "kept by people with more failed prints than they’d like to admit.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // Printers get firmware updates and stay in use for years, so two-year-old reviews still say a lot.
  recentMonths: 24,
  // Makers name each model and revision (P1S vs P2S, MK4 vs MK4S, Ender-3 V3 vs V3 SE vs V3 KE), so names carry it, not years.
  productYears: false,
  productPath: "products",
  amazon: { searchIndex: "Industrial", photos: true },
  scoreUnit: { one: "spool", many: "spools" },
  // White page, deep-blue ink and primary, one filament-orange accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f5f6f8",
    "--ink": "#16202c",
    "--ink-2": "#3b4656",
    "--ink-3": "#687384",
    "--line": "#e3e6eb",
    "--line-2": "#cfd4dc",
    "--green": "#1f3a5a",
    "--green-ink": "#142a43",
    "--green-wash": "#eef2f7",
    "--green-line": "#cdd8e6",
    "--on-green": "#ffffff",
    "--on-green-muted": "#bccadb",
    "--lime": "#f2792b",
    "--lime-wash": "#fef1e8",
    "--lime-line": "#f9cfb1",
    "--lime-ink": "#b4520f",
    "--lime-ink-2": "#8e400b",
    "--score-on": spoolIcon("tile", true),
    "--score-off": spoolIcon("tile", false),
    "--score-pick-on": spoolIcon("pick", true),
    "--score-pick-off": spoolIcon("pick", false),
  },
  chartColors: ["var(--green)", "var(--lime)", "#e3e6eb", "#f9cfb1", "#8796ab", "#bccadb"],
  og: {
    background: "#1f3a5a",
    accent: "#f2792b",
    muted: "#bccadb",
    text: "#ffffff",
    scoreOn: ogSpool("#ffffff", "#f2792b", "#ffffff"),
    scoreOff: ogSpool("#3a5675", "#2c4867", "#3a5675"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for me", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for 3D printing: power = print quality, comfort = reliability, control = build and hardware,
  // maneuverability = software and features, forgiveness = value. Approved by the owner 2026-11-12.
  categories: [
    { column: "powerRating", label: "Print quality", hint: "surface finish, detail, dimensional accuracy, layer adhesion" },
    { column: "comfortRating", label: "Ease of use & reliability", hint: "setup, first layers, failed prints, clogs, consistency" },
    { column: "controlRating", label: "Build & hardware", hint: "frame, motion, hotend or screen, spool and packaging" },
    { column: "maneuverabilityRating", label: "Software & features", hint: "slicer, firmware, app, camera, auto calibration, profiles" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Main use", adminLabel: "Main use", options: [
      { value: "Functional parts", display: "prints functional parts" }, { value: "Miniatures and models", display: "prints miniatures and models" },
      { value: "Cosplay and props", display: "prints cosplay and props" }, { value: "Toys, gifts and decor", display: "prints toys, gifts and decor" },
      { value: "Business or print farm", display: "prints for a business" },
    ] },
    playingSide: { label: "Slicer", adminLabel: "Slicer", options: [
      { value: "Bambu Studio", display: "slices in Bambu Studio" }, { value: "PrusaSlicer", display: "slices in PrusaSlicer" },
      { value: "OrcaSlicer", display: "slices in OrcaSlicer" }, { value: "Cura", display: "slices in Cura" },
      { value: "Creality Print", display: "slices in Creality Print" }, { value: "Lychee or Chitubox", display: "slices in Lychee or Chitubox" },
      { value: "Other", display: "uses another slicer" },
    ] },
    playingStyle: { label: "3D printing experience", adminLabel: "Experience", options: [
      { value: "First printer", hint: "this is my first" }, { value: "A few printers", hint: "owned two or three" },
      { value: "Long-time hobbyist", hint: "years of printing" }, { value: "Builds and mods printers", hint: "kits, mods, firmware" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "A few prints or a few days", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, core = type, weight = build volume, surface = material, balance = notable features.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. FDM printer", options: ["FDM printer", "Resin printer", "Multi-material & enclosure", "Filament", "Resin"] },
    { column: "core", label: "Type", max: 80, placeholder: "e.g. CoreXY, enclosed" },
    { column: "weight", label: "Build volume", max: 120, placeholder: "e.g. 256 × 256 × 256 mm" },
    { column: "surface", label: "Material", max: 120, placeholder: "e.g. PLA" },
    { column: "balance", label: "Notable features", max: 120, placeholder: "e.g. Lidar, camera, 4-colour AMS" },
  ],
  shapeFilter: ["FDM printer", "Resin printer", "Multi-material & enclosure", "Filament", "Resin"],
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths. Approved by the owner 2026-11-12.
  categoryPaths: true,
  typePages: [
    { shape: "FDM printer", slug: "fdm-printers", label: "FDM printers", seoLabel: "FDM 3D Printers", intro: "Filament 3D printers, from bed-slingers to enclosed CoreXY and tool changers", one: "FDM printer" },
    { shape: "Resin printer", slug: "resin-printers", label: "Resin printers", seoLabel: "Resin 3D Printers", intro: "MSLA and SLA resin printers, plus wash and cure stations", one: "Resin printer" },
    { shape: "Multi-material & enclosure", slug: "multi-material", label: "Multi-material", seoLabel: "Multi-Material Systems and Enclosures", intro: "AMS, CFS, MMU and other multi-filament units, and printer enclosures", one: "Multi-material unit or enclosure" },
    { shape: "Filament", slug: "filament", label: "Filament", seoLabel: "3D Printer Filament", intro: "PLA, PETG, ABS, ASA and TPU, one page per product line and material", one: "Filament" },
    { shape: "Resin", slug: "resin", label: "Resin", seoLabel: "3D Printing Resin", intro: "Standard, ABS-like, water-washable and tough resins", one: "Resin" },
  ],
  rowDetail: { column: "core", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews. Approved by the owner 2026-11-12.
  tags: [
    { label: "great print quality", tone: "pos" },
    { label: "reliable", tone: "pos" },
    { label: "easy setup", tone: "pos" },
    { label: "fast", tone: "pos" },
    { label: "quiet", tone: "pos" },
    { label: "good software", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "good support", tone: "pos" },
    { label: "good bed adhesion", tone: "pos" },
    { label: "consistent diameter", tone: "pos" },
    { label: "low stringing", tone: "pos" },
    { label: "strong parts", tone: "pos" },
    { label: "vibrant colors", tone: "pos" },
    { label: "clogs", tone: "neg" },
    { label: "bed leveling issues", tone: "neg" },
    { label: "layer shifts", tone: "neg" },
    { label: "quality control issues", tone: "neg" },
    { label: "warping", tone: "neg" },
    { label: "stringing", tone: "neg" },
    { label: "brittle", tone: "neg" },
    { label: "absorbs moisture", tone: "neg" },
    { label: "tangled spool", tone: "neg" },
    { label: "firmware issues", tone: "neg" },
    { label: "loud", tone: "neg" },
    { label: "poor support", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "resin fumes", tone: "neg" },
    { label: "enclosed", tone: "neutral" },
    { label: "open frame", tone: "neutral" },
    { label: "multi-color", tone: "neutral" },
    { label: "needs tinkering", tone: "neutral" },
    { label: "cloud-connected", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-fdm-3d-printers", label: "FDM printers", title: "Best FDM 3D Printers", minReviews: 5,
      intro: "The filament 3D printers owners are most consistently happy with, going by print quality, reliability and value.", filters: [{ column: "shape", include: ["FDM printer"] }] },
    { slug: "best-resin-3d-printers", label: "Resin printers", title: "Best Resin 3D Printers", minReviews: 5,
      intro: "The resin printers and wash and cure stations owners are most consistently happy with.", filters: [{ column: "shape", include: ["Resin printer"] }] },
    { slug: "best-multi-material-systems", label: "Multi-material", title: "Best Multi-Material Systems and Enclosures", minReviews: 5,
      intro: "The multi-filament units and enclosures owners are most consistently happy with.", filters: [{ column: "shape", include: ["Multi-material & enclosure"] }] },
    { slug: "best-3d-printer-filament", label: "Filament", title: "Best 3D Printer Filament", minReviews: 5,
      intro: "The filament lines owners are most consistently happy with.", filters: [{ column: "shape", include: ["Filament"] }] },
    { slug: "best-3d-printing-resin", label: "Resin", title: "Best 3D Printing Resin", minReviews: 5,
      intro: "The resins owners are most consistently happy with.", filters: [{ column: "shape", include: ["Resin"] }] },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Blog"],
  examples: { brand: "Bambu Lab", model: "P1S", year: 2026, search: "bambu" },
  form: {
    prompts: [["What did you print on before?", "Before this I printed on "], ["What do you print?", "I mostly print "], ["Any issues?", "After a while I noticed "]],
    tips: ["Which printer, filament or resin you used before, and how this compares", "What you print and which slicer you use", "How setup, first layers and long prints went", "Clogs, failures, defects or support contact", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "PrintRecs – Real Reviews of 3D Printers, Filament and Resin",
    homeDescription: "Browse real owner reviews of FDM and resin 3D printers, AMS and multi-material units, enclosures, filament and resin, plus experiences collected from Reddit, YouTube and forums. Compare Bambu Lab, Prusa, Creality, Elegoo, Anycubic, Qidi, Polymaker and more.",
    layoutDescription: "Real owner experiences with 3D printers, multi-material units, filament and resin, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | PrintRecs",
    catalog: { title: "All 3D Printers, Filament and Resin – Reviews and Ratings", description: "Every 3D printer, multi-material unit, enclosure, filament and resin on PrintRecs with owner ratings. Filter by category and brand, then read what owners say." },
    brands: { title: "3D Printer and Filament Brands", description: "Browse 3D printing products by brand — Bambu Lab, Prusa, Creality, Elegoo, Anycubic, Qidi, Polymaker and more — and read real reviews of each product." },
    brand: brand => ({ title: `${brand} – Reviews`, description: `Real owner reviews of ${brand} products: ratings, strengths and weaknesses for every ${brand} product on PrintRecs.` }),
    product: name => ({ title: `${name} Reviews | PrintRecs`, description: `Read real owner experiences with the ${name}. Ratings for print quality, reliability, hardware, software and value, plus opinions from around the web.` }),
    productNotFound: "Product not found | PrintRecs",
    productCategory: "3D printing",
    addReview: { title: "Add a 3D Printing Review", description: "Printed with a printer, filament or resin long enough to know? Share how it worked for you in about two minutes. No account needed." },
    about: { title: "About", description: "Why PrintRecs exists: 3D printer and filament opinions are scattered across Reddit, YouTube and forums. PrintRecs collects owners' first-hand experiences and lets owners add their own." },
    ogAlt: "PrintRecs – real reviews of 3D printers, filament and resin",
    ogProductAlt: "3D printing reviews on PrintRecs",
    ogEyebrow: "Real reviews of 3D printing gear",
    ogTitle: "3D printer and filament reviews from people who print with them",
    ogDetail: "From owners, Reddit, YouTube and forums",
    ogFallbackTitle: "3D printing reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell others how a 3D printer, filament or resin actually worked for you. Takes about two minutes, no account needed.",
      howItWent: "how it worked for you",
      aboutYou: "About how you print",
      aboutYouHint: "optional · helps people find owners who print like them",
      howItPerforms: "How it prints",
      whoUsesIt: "Who prints with it",
      triedIt: "Printed with it?",
      triedOne: "Used one?",
      triedOneOfThese: "Used one of these?",
    },
    notFound: "We couldn’t find that product or page. Maybe it moved, maybe it was discontinued, maybe it failed on the first layer.",
    about: {
      heading: "Why PrintRecs exists",
      paragraphs: [
        "3D printer reviews are hard to compare: many videos come from review units sent by the maker, forum threads mix five printer revisions with near-identical names, and filament opinions are scattered across hundreds of threads. PrintRecs puts owners’ first-hand experiences in one place and lets owners add their own.",
        "A printer that is perfect for someone printing PLA toys can be the wrong one for someone printing nylon parts, and a filament that prints beautifully on one printer can clog another. Knowing what someone prints, on which machine and for how long often tells you more than a score on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. We skip brand reps, store staff and review-site affiliates. Rankings are counted from reviews: the ones owners write here and the ones quoted from around the web. Each is read as positive, mixed or negative. Product pages link to Amazon, and PrintRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "Exact models only", body: "Makers reuse names across revisions (P1S and P2S, MK4 and MK4S, Ender-3 V3, V3 SE and V3 KE). A review is only filed under a product when it clearly names that exact model; otherwise it is left out." },
        { heading: "A work in progress", body: "PrintRecs is new. Submissions are moderated before publication, web reviews link to their sources, and product names come from the makers’ own pages." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about printers, filament or resin you’ve actually used, and be specific about what worked for you." },
        { heading: "Your privacy", body: "An alias is optional. If you leave an email address, it is stored privately with your submission and never included in public reviews. Leave it blank if you prefer." },
      ],
    },
  },
};
