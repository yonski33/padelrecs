import type { Niche } from "./types";

// Rating icons: a paw print, warm orange with a teal edge. Same tile sizes as the other niches (17×14 strip, 20×20 picker);
// the strip icon widens the 20×20 drawing's viewBox so the paw keeps its shape.
const svg = (markup: string) => `url("data:image/svg+xml,${markup.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23")}")`;
const pawShape = (fill: string, edge: string, q: string) => {
  const paint = `fill=${q}${fill}${q} stroke=${q}${edge}${q} stroke-width=${q}0.9${q}`;
  return `<path d=${q}M10 9.6c-2.6 0-5.2 3.4-5.2 5.6 0 1.6 1.3 2.6 2.8 2.6 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.5 0 2.8-1 2.8-2.6 0-2.2-2.6-5.6-5.2-5.6z${q} ${paint}/>`
    + `<ellipse cx=${q}4${q} cy=${q}8.2${q} rx=${q}1.8${q} ry=${q}2.3${q} ${paint}/>`
    + `<ellipse cx=${q}7.6${q} cy=${q}4.4${q} rx=${q}1.9${q} ry=${q}2.5${q} ${paint}/>`
    + `<ellipse cx=${q}12.4${q} cy=${q}4.4${q} rx=${q}1.9${q} ry=${q}2.5${q} ${paint}/>`
    + `<ellipse cx=${q}16${q} cy=${q}8.2${q} rx=${q}1.8${q} ry=${q}2.3${q} ${paint}/>`;
};
const pawIcon = (size: "tile" | "pick", on: boolean) => {
  const box = size === "tile" ? "width='17' height='14' viewBox='-2.15 0 24.3 20'" : "viewBox='0 0 20 20'";
  return svg(`<svg xmlns='http://www.w3.org/2000/svg' ${box}>${on ? pawShape("#e8833a", "#1f4e4a", "'") : pawShape("#e7e3dc", "#d4cec4", "'")}</svg>`);
};
const ogPaw = (fill: string, edge: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${pawShape(fill, edge, '"')}</svg>`;

export const DOG_CATEGORIES = ["Beds", "Crates & carriers", "Harnesses, collars & leashes", "Toys & chews", "GPS trackers & cameras", "Grooming", "Bowls, feeders & fountains", "Dog food"];

export const dog: Niche = {
  id: "dog",
  schema: "dogrecs",
  site: {
    name: "DogRecs",
    domain: "dogrecs.com",
    wordmark: "dogrecs",
    descriptor: "owner reviews of dog gear and dog food",
    footer: "kept by people who get up for the 6am walk.",
    adminLoginHint: "Use the email and password for your Recs admin account.",
  },
  words: { one: "product", many: "products", One: "Product", Many: "Products" },
  people: { one: "owner", many: "owners", One: "Owner", Many: "Owners" },
  // Dog gear and food formulas stay on sale for years under one name, so a two-year-old review still describes the product.
  recentMonths: 24,
  // Names carry the maker's model or generation (Fi Series 3 vs Series 3+, Halo Collar 4 vs 5), never a model year.
  productYears: false,
  productPath: "products",
  amazon: { searchIndex: "PetSupplies", photos: true },
  scoreUnit: { one: "product", many: "products" },
  // Warm off-white page, deep teal primary, one warm-orange accent. Token names are shared with padel ("green" = primary, "lime" = accent).
  theme: {
    "--bg": "#ffffff",
    "--surface": "#ffffff",
    "--tint": "#f8f6f2",
    "--ink": "#1b2b2a",
    "--ink-2": "#3b4b49",
    "--ink-3": "#6a7775",
    "--line": "#e7e3dc",
    "--line-2": "#d4cec4",
    "--green": "#1f4e4a",
    "--green-ink": "#163a37",
    "--green-wash": "#eef4f3",
    "--green-line": "#c6d9d6",
    "--on-green": "#f7faf9",
    "--on-green-muted": "#a8c2be",
    "--lime": "#e8833a",
    "--lime-wash": "#fdf1e7",
    "--lime-line": "#f3c39c",
    "--lime-ink": "#a5531a",
    "--lime-ink-2": "#7f3f12",
    "--score-on": pawIcon("tile", true),
    "--score-off": pawIcon("tile", false),
    "--score-pick-on": pawIcon("pick", true),
    "--score-pick-off": pawIcon("pick", false),
  },
  chartColors: ["var(--green)", "#e8833a", "#d4cec4", "#a8c2be", "#f3c39c", "#6a7775"],
  og: {
    background: "#1f4e4a",
    accent: "#e8833a",
    muted: "#a8c2be",
    text: "#f7faf9",
    scoreOn: ogPaw("#e8833a", "#e8833a"),
    scoreOff: ogPaw("#3b6662", "#3b6662"),
  },
  ratingWords: { "5": "5 — love it", "4": "4 — really like it", "3": "3 — it’s fine", "2": "2 — not for us", "1": "1 — regret buying it" },
  // Fixed rating columns, relabelled for dog gear: power = durability, maneuverability = the dog's approval,
  // control = ease of use, comfort = fit & comfort, forgiveness = value.
  categories: [
    { column: "powerRating", label: "Durability", hint: "how it holds up to chewing, washing and daily use" },
    { column: "maneuverabilityRating", label: "Dog's approval", hint: "does your dog use it, like it, eat it" },
    { column: "controlRating", label: "Ease of use", hint: "setup, putting on, cleaning, the app" },
    { column: "comfortRating", label: "Fit & comfort", hint: "sizing and how it suits your dog" },
    { column: "forgivenessRating", label: "Value", hint: "worth the price" },
  ],
  profile: {
    playerLevel: { label: "Dog size", adminLabel: "Dog size", options: [
      { value: "Toy & small", display: "has a small dog" }, { value: "Medium", display: "has a medium-sized dog" },
      { value: "Large", display: "has a large dog" }, { value: "Giant", display: "has a giant-breed dog" },
    ] },
    playingSide: { label: "Dog's age", adminLabel: "Dog's age", options: [
      { value: "Puppy", display: "has a puppy" }, { value: "Adult", display: "has an adult dog" }, { value: "Senior", display: "has a senior dog" },
    ] },
    playingStyle: { label: "Chewer", adminLabel: "Chewing style", options: [
      { value: "Gentle", hint: "rarely chews things up" }, { value: "Average", hint: "chews now and then" }, { value: "Power chewer", hint: "destroys most toys" },
    ] },
    timeWithRacket: { label: "Time using it", adminLabel: "Time using it", options: [
      { value: "Tried briefly", hint: "A few days or returned it", display: "tried briefly" }, { value: "Less than 1 month", hint: "< 1 month" }, { value: "1–6 months", hint: "1–6 months" }, { value: "6–12 months", hint: "6–12 months" }, { value: "More than 1 year", hint: "1 year +" },
    ] },
    sideSuffix: "",
  },
  // Columns are shared: shape = category, surface = type, balance = sizes, core = material (first ingredient for food), weight = key spec.
  specs: [
    { column: "shape", label: "Category", max: 100, placeholder: "e.g. Harnesses, collars & leashes", options: DOG_CATEGORIES },
    { column: "surface", label: "Type", max: 200, placeholder: "e.g. No-pull harness" },
    { column: "balance", label: "Sizes", max: 120, placeholder: "e.g. XXS–XXL" },
    { column: "core", label: "Material", max: 200, placeholder: "e.g. nylon webbing" },
    { column: "weight", label: "Key spec", max: 120, placeholder: "e.g. two leash points" },
  ],
  shapeFilter: DOG_CATEGORIES,
  // Each is served at /<slug> and listed in the menu row, in this order. Slugs are public URLs: don't rename them.
  // Product pages live under their type page (/<type slug>/<slug>); see Niche.categoryPaths.
  categoryPaths: true,
  typePages: [
    { shape: "Beds", slug: "dog-beds", label: "Beds", seoLabel: "Dog Beds", intro: "Orthopedic, bolster, calming and elevated dog beds and crate pads", one: "bed" },
    { shape: "Crates & carriers", slug: "crates-and-carriers", label: "Crates & carriers", seoLabel: "Dog Crates and Carriers", intro: "Wire, plastic, heavy-duty and soft crates, airline carriers and playpens", one: "crate or carrier" },
    { shape: "Harnesses, collars & leashes", slug: "harnesses-and-leashes", label: "Harnesses & leashes", seoLabel: "Dog Harnesses, Collars and Leashes", intro: "No-pull and adventure harnesses, head halters, collars, leashes and car harnesses", one: "harness or leash" },
    { shape: "Toys & chews", slug: "toys-and-chews", label: "Toys & chews", seoLabel: "Dog Toys and Chew Toys", intro: "Treat toys, fetch toys, puzzles, tug toys and durable chew toys, from Kong to West Paw", one: "toy" },
    { shape: "GPS trackers & cameras", slug: "gps-trackers-and-cameras", label: "Trackers & cameras", seoLabel: "Dog GPS Trackers and Pet Cameras", intro: "GPS collars, trackers and fence collars, and pet cameras that toss treats", one: "tracker or camera" },
    { shape: "Grooming", slug: "grooming", label: "Grooming", seoLabel: "Dog Grooming Tools", intro: "Deshedding tools, brushes, clippers, nail grinders and dryers", one: "grooming tool" },
    { shape: "Bowls, feeders & fountains", slug: "bowls-and-feeders", label: "Bowls & feeders", seoLabel: "Dog Bowls, Feeders and Water Fountains", intro: "Slow feeders, elevated and travel bowls, automatic feeders and water fountains", one: "bowl or feeder" },
    { shape: "Dog food", slug: "dog-food", label: "Dog food", seoLabel: "Dog Food", intro: "Dry, wet and fresh dog food, one page per formula, reviewed by owners on what their own dogs eat. Not veterinary advice", one: "dog food" },
  ],
  rowDetail: { column: "surface", suffix: "" },
  // Add new terms at the end; renaming or removing one orphans it on existing reviews.
  // No health tags: DogRecs reviews never carry health or medical claims (food included).
  tags: [
    { label: "durable", tone: "pos" },
    { label: "dog loves it", tone: "pos" },
    { label: "power chewer proof", tone: "pos" },
    { label: "easy to clean", tone: "pos" },
    { label: "comfortable", tone: "pos" },
    { label: "great fit", tone: "pos" },
    { label: "reduces pulling", tone: "pos" },
    { label: "escape-proof", tone: "pos" },
    { label: "accurate tracking", tone: "pos" },
    { label: "long battery life", tone: "pos" },
    { label: "great app", tone: "pos" },
    { label: "easy to use", tone: "pos" },
    { label: "quiet", tone: "pos" },
    { label: "keeps dog busy", tone: "pos" },
    { label: "well made", tone: "pos" },
    { label: "great value", tone: "pos" },
    { label: "destroyed fast", tone: "neg" },
    { label: "dog ignores it", tone: "neg" },
    { label: "hard to clean", tone: "neg" },
    { label: "poor fit", tone: "neg" },
    { label: "rubs or chafes", tone: "neg" },
    { label: "dog escaped", tone: "neg" },
    { label: "inaccurate tracking", tone: "neg" },
    { label: "short battery life", tone: "neg" },
    { label: "buggy app", tone: "neg" },
    { label: "pricey subscription", tone: "neg" },
    { label: "loud", tone: "neg" },
    { label: "flimsy", tone: "neg" },
    { label: "picky eater refused", tone: "neg" },
    { label: "recipe changed", tone: "neg" },
    { label: "overpriced", tone: "neg" },
    { label: "puppy", tone: "neutral" },
    { label: "senior dog", tone: "neutral" },
    { label: "large breed", tone: "neutral" },
    { label: "small breed", tone: "neutral" },
  ],
  // /rankings pages (lib/top-lists.ts). Each appears once enough products in it have reviews.
  topLists: [
    { slug: "best-dog-beds", label: "Beds", title: "Best Dog Beds", minReviews: 5,
      intro: "The dog beds owners are most consistently happy with.", filters: [{ column: "shape", include: ["Beds"] }] },
    { slug: "best-dog-crates", label: "Crates", title: "Best Dog Crates and Carriers", minReviews: 5,
      intro: "The crates and carriers owners are most consistently happy with.", filters: [{ column: "shape", include: ["Crates & carriers"] }] },
    { slug: "best-dog-harnesses", label: "Harnesses", title: "Best Dog Harnesses, Collars and Leashes", minReviews: 5,
      intro: "The harnesses, collars and leashes owners are most consistently happy with.", filters: [{ column: "shape", include: ["Harnesses, collars & leashes"] }] },
    { slug: "best-dog-toys", label: "Toys", title: "Best Dog Toys", minReviews: 5,
      intro: "The toys and chews owners are most consistently happy with.", filters: [{ column: "shape", include: ["Toys & chews"] }] },
    { slug: "best-dog-gps-trackers", label: "Trackers", title: "Best Dog GPS Trackers and Pet Cameras", minReviews: 5,
      intro: "The GPS collars, trackers and pet cameras owners are most consistently happy with.", filters: [{ column: "shape", include: ["GPS trackers & cameras"] }] },
    { slug: "best-dog-grooming-tools", label: "Grooming", title: "Best Dog Grooming Tools", minReviews: 5,
      intro: "The brushes, clippers and nail grinders owners are most consistently happy with.", filters: [{ column: "shape", include: ["Grooming"] }] },
    { slug: "best-dog-food", label: "Food", title: "Best Dog Food According to Owners", minReviews: 5,
      intro: "The dog food formulas owners are most consistently happy with, going by what their own dogs eat. Not veterinary advice.", filters: [{ column: "shape", include: ["Dog food"] }] },
    { slug: "most-durable-dog-toys", label: "Durable", title: "Most Durable Dog Toys and Gear", minReviews: 5,
      intro: "The products owners most often call durable or power-chewer proof.", trait: { tags: ["durable", "power chewer proof"], minShare: 0.25, against: ["destroyed fast", "flimsy"], noun: "the durability" } },
  ],
  sourcePlatforms: ["Reddit", "YouTube", "Retailer", "Forum", "Blog"],
  examples: { brand: "Ruffwear", model: "Front Range Harness", year: 2026, search: "front range" },
  form: {
    prompts: [["What did you have before?", "Before this we had "], ["Tell us about your dog", "My dog is a "], ["Any issues?", "After a while I noticed "]],
    tips: ["Your dog's breed, size and age", "What you had before, and how this compares", "How your dog took to it", "How it held up: chewing, washing, daily use", "Whether it was worth the price"],
  },
  seo: {
    homeTitle: "DogRecs – Real Owner Reviews of Dog Gear and Dog Food",
    homeDescription: "Browse real dog-owner reviews of beds, crates, harnesses, leashes, toys, GPS trackers, grooming tools, bowls and dog food, plus experiences collected from Reddit, YouTube and forums. Compare Kong, Ruffwear, Fi, Furbo, Purina and more.",
    layoutDescription: "Real dog-owner experiences with dog gear and dog food, plus opinions from Reddit, YouTube and forums with the source linked.",
    titleTemplate: "%s | DogRecs",
    catalog: { title: "All Dog Products – Owner Reviews and Ratings", description: "Every dog product on DogRecs with owner ratings. Filter by brand and category, then read what owners say about their own dogs." },
    brands: { title: "Dog Product Brands", description: "Browse dog gear and dog food by brand — Kong, Ruffwear, West Paw, Fi, Furbo, Purina and more — and read real owner reviews of each product." },
    brand: brand => ({ title: `${brand} – Dog Owner Reviews`, description: `Real dog-owner reviews of ${brand} products: ratings, strengths and weaknesses for every ${brand} product on DogRecs.` }),
    product: name => ({ title: `${name} Reviews | DogRecs`, description: `Read real dog-owner experiences with the ${name}. Ratings for durability, how dogs take to it, ease of use, fit and value, plus opinions from around the web.` }),
    productNotFound: "Product not found | DogRecs",
    productCategory: "Dog products",
    addReview: { title: "Add a Dog Product Review", description: "Own a harness, crate, toy or tracker your dog uses every day? Share how it actually holds up in about two minutes. No account needed." },
    about: { title: "About", description: "Why DogRecs exists: dog gear opinions are scattered across Reddit, YouTube and forums. DogRecs collects owners' first-hand experiences and lets owners add their own." },
    ogAlt: "DogRecs – real owner reviews of dog gear",
    ogProductAlt: "Dog product reviews on DogRecs",
    ogEyebrow: "Owner reviews of dog gear",
    ogTitle: "Dog gear reviews from people who walk, feed and clean up after their dogs",
    ogDetail: "From owners, Reddit, YouTube and forums",
    ogFallbackTitle: "Dog product reviews",
  },
  copy: {
    ui: {
      formIntro: "Tell other owners how a bed, crate, harness, toy or tracker actually works for your dog. Takes about two minutes, no account needed.",
      howItWent: "how it worked for your dog",
      aboutYou: "About your dog",
      aboutYouHint: "optional · helps owners of similar dogs",
      howItPerforms: "How it holds up",
      whoUsesIt: "Whose dogs use it",
      triedIt: "Own it?",
      triedOne: "Own one?",
      triedOneOfThese: "Own one of these?",
    },
    notFound: "We couldn’t find that product or page. Maybe it moved, maybe it was discontinued, maybe the dog ate it.",
    about: {
      heading: "Why DogRecs exists",
      paragraphs: [
        "Dog gear opinions are scattered across Reddit, YouTube and forums, and a product page rarely says whether a “tough” toy survives a week with a power chewer or whether a harness still fits after a winter of pulling. DogRecs puts owners’ experiences in one place and lets owners add their own.",
        "What suits one dog won’t suit every dog. Knowing whether a review comes from the owner of a ten-pound terrier or a hundred-pound shepherd, a puppy or a senior, often tells you more than a star rating on its own.",
      ],
      sections: [
        { heading: "Owners, not promotions", body: "No sponsored rankings. No paid placements. Rankings are counted from reviews: the ones owners write here and the ones collected and summarized from around the web. Each is read as positive, mixed or negative. Product pages link to Amazon, and DogRecs may earn a commission when you buy through those links; that never changes a ranking." },
        { heading: "Not veterinary advice", body: "Reviews describe what owners saw with their own dogs, not veterinary advice. DogRecs does not publish health or medical claims about any product, dog food included, and lists no prescription diets, medications or supplements. Ask your vet about your dog’s diet, allergies or health." },
        { heading: "One page per model and formula", body: "Makers refresh products under almost the same name. Each generation has its own page (Fi Series 3 and Series 3+, Halo Collar 4 and 5), each dog food formula has its own page, and sizes and colours of one product share a page." },
        { heading: "Adding your experience", body: "You don’t need an account. Reviews are held for moderation before appearing publicly. Write about products your own dog has used and be specific about your dog and what you saw." },
        { heading: "Your privacy", body: "An alias is optional, and so are your dog’s size and age. If you leave an email address, it is stored privately with your submission and never included in public reviews." },
      ],
    },
  },
};
