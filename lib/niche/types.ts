/**
 * Everything that makes one "Recs" site different from another. One codebase serves every niche;
 * the NICHE environment variable picks the config (see lib/niche/index.ts). Data module only, no React,
 * so database code, scripts and tests can import it too. Icons that need JSX live in app/art/<niche>.tsx.
 */

/** Database columns a review rating category can be stored in. Niches choose labels; columns stay fixed. */
export type CategoryColumn = "powerRating" | "controlRating" | "maneuverabilityRating" | "comfortRating" | "forgivenessRating";
/** Racket/product spec columns shown on product pages and edited in admin. */
export type SpecColumn = "shape" | "weight" | "balance" | "core" | "surface";
export type ProfileField = "playerLevel" | "playingSide" | "playingStyle" | "timeWithRacket";

export type Words = {
  /** Lowercase product noun, e.g. "racket" / "rackets". */
  one: string; many: string;
  /** Capitalised, e.g. "Racket" / "Rackets". */
  One: string; Many: string;
};

/** value is stored in the database; hint is shown under it on the form; display replaces value inside a review byline. */
export type ProfileOption = { value: string; hint?: string; display?: string };
export type Profile = {
  /** Label on the review form and the "Who's playing it" panel. */
  label: string;
  /** Label in the admin editor. */
  adminLabel: string;
  options: ProfileOption[];
};

export type Tag = { label: string; tone: "pos" | "neg" | "neutral" };

export type Seo = { title: string; description: string };

/** Keeps a product only when a catalogue spec matches. Values compare by their first word, ignoring case, so
 *  "High (~26 cm)" counts as "high". With `include`, products whose spec is blank are left out; `exclude` keeps them. */
export type SpecFilter = { column: SpecColumn; include?: string[]; exclude?: string[] };

/** A data-driven "best of" page at /rankings/<slug>, ranked by lib/top-lists.ts. */
export type TopList = {
  slug: string;
  /** Earlier slugs of this list. Each one 301-redirects to the current slug (next.config.ts), so links and rankings carry over. */
  formerSlugs?: string[];
  /** Menu and index label, e.g. "Best for power". */
  label: string;
  /** Start of the page title; the year and review count follow: "Best Padel Rackets for Power" → "Best Padel Rackets for Power 2026, Ranked by …". */
  title: string;
  /** One sentence under the title and on the index. */
  intro: string;
  /** Trait lists ("for power") only take products that reviewers describe that way, and are ordered mainly by how often
   *  reviewers mention the trait, with how liked the product is counting less (TRAIT_LIST_LIKED_WEIGHT). */
  trait?: {
    /** Tag bank labels that mean the trait. A review counts once if it carries any of them. */
    tags: string[];
    /** Share of a product's reviews, 0–1, that must carry one of `tags`. */
    minShare: number;
    /** Tags that contradict the trait: a product is left out when as many reviews carry these as carry `tags`. */
    against?: string[];
    /** Shown on each entry: "8 of 12 reviews mention {noun}". */
    noun: string;
    /** The product's own bar for the trait must be at least `min` (PickleballRecs Grok audit 2026-11-17: a "best for power"
     *  list never shows a paddle whose page reads Power 3/5). Read from the match facts (app/rankings/lists.ts). */
    bar?: { key: "power" | "control" | "spin"; min: number };
  };
  filters?: SpecFilter[];
  /** Only list models from the last this many model years (2 in 2026 → 2024–2026). Only for niches whose products carry
   *  real years (productYears): elsewhere every product has the same placeholder year. */
  maxAgeYears?: number;
  /** Only list models from exactly one model year, counted back from the current one (1 in 2026 → only 2025 models): a
   *  "last season" list. `{year}` in slug, label, title or intro becomes that model year (withModelYears in lib/top-lists.ts),
   *  and the page's year is that model year, not the current one. Only for niches with real product years. */
  modelYearsBack?: number;
  /** Only reviews from the last this many years count (default: the niche's recentMonths, else REVIEW_YEARS in lib/top-lists.ts). */
  reviewYears?: number;
  /** Same as reviewYears, in months; set from the niche's recentMonths when a list sets neither. */
  reviewMonths?: number;
  /** Published reviews with a verdict a product needs before it can be listed (never below 5). */
  minReviews?: number;
  /** A list for a kind of player ("best for beginners", "for tennis elbow"): ordered by the match engine for these picks, the
   *  home quick match's own order (lib/home-rank.ts rankHome), so a level pick keeps the niche's level gate. */
  picks?: { level?: "beginner" | "intermediate" | "advanced"; arm?: boolean };
};

/** One answer on the finder (/finder). `want` tags count for a product and `avoid` tags against it; an option with neither,
 *  like "No preference", changes nothing. `must` narrows the pool to products with those mentions when enough have them. */
export type FinderOption = { label: string; hint?: string; want?: string[]; avoid?: string[]; weight?: number; must?: boolean;
  /** Only products whose shape column starts with one of these, when enough of them qualify. */
  shapes?: string[];
  /** A ranking (top list slug) this answer stands for: only products on it, higher on it first, when enough of them qualify. */
  list?: string;
  /** The level this answer stands for (DiscGolfRecs, match audit 2026-11-16): the quiz then uses the match's level gate and
   *  its hard rules for that level (lib/finder.ts matchFinder). */ level?: "beginner" | "intermediate" | "advanced" };
export type FinderQuestion = { id: string; question: string; options: FinderOption[];
  /** Only asked after one of these answers to an earlier question, for questions that fit one category. */
  onlyIf?: { question: string; labels: string[] } };
export type Finder = {
  title: string; description: string; intro: string; navLabel: string;
  /** The page heading, a question to the visitor. `title` stays the name used in search results. */
  heading: string;
  /** Opens the link to the quiz on the home, catalogue and rankings pages. */
  invite: string;
  /** Lines added to "How the matching works", for rules of thumb that don't come from reviews. */
  notes?: string[];
  minReviews?: number;
  /** Positive share (mixed = half) a product needs, when stricter than the rankings' bar. */
  minPositive?: number;
  /** How much a product's rankings score counts next to the answers (default in lib/finder.ts). */
  rankWeight?: number;
  /** Only models from the last this many years, on niches with model years. */
  maxAgeYears?: number;
  questions: FinderQuestion[];
};

export type Niche = {
  id: string;
  /** Postgres schema holding this niche's tables, inside the shared Supabase project. */
  schema: string;
  site: {
    name: string;        // "PadelRecs"
    domain: string;      // "padelrecs.com"
    wordmark: string;    // "padelrecs" (shown before ".com")
    descriptor: string;  // under the logo
    footer: string;      // after "<domain> — "
    analyticsId?: string;
    adminLoginHint: string;
    /** A line shown in the footer of every page, e.g. MoneyRecs' "not financial advice" notice. */
    notice?: string;
  };
  words: Words;
  /** Name of the catalogue in the menu, breadcrumbs and its page heading when it should differ from words.Many: HomeGymRecs
   *  says "Equipment" there (its /equipment path) and "products" in counts and sentences. Defaults to words.Many. */
  navLabel?: string;
  /** What the home list calls the products in "Most talked-about …" when the catalogue's keyword reads badly there
   *  (AudioRecs: "headphones and earbuds"). Defaults to the catalogue keyword, lowercased. */
  talkLabel?: string;
  /** Who writes reviews: "player" / "players" on sports sites, "user" / "users" on SkinRecs. */
  people: Words;
  /** Products have model years (rackets, paddles). When false, years are not asked, shown, filtered or put in names. */
  productYears?: boolean;
  /** Without real years: versions of one model line still share a row ("Jelly Bean" and "Jelly Bean 2", the higher name
   *  being the newer), so quick match shows one per model and "show older models" works (PickleballRecs, audit 2026-11-16). */
  familiesByName?: boolean;
  /** "v2": the 2026-11 design (quick-match home, fit pages, tight lists, the v2 brand / catalogue / reviews / about pages).
   *  Off by default, so a site switches when its data is ready (audit 2026-11-15: no more niche.id === "padel" checks). */
  design?: "v2";
  /** Extra CSS laid over the shared v2 pages' tokens (a site's own palette and display font, Google Fonts family names in
   *  v2fonts). Printed by the layout only when set. */
  v2style?: string; v2fonts?: string[];
  /** Words the v2 pages use that are about the sport, not the product (audit 2026-11-15: no hard-coded padel copy in shared
   *  components). Optional: lib/niche/index.ts v2copy fills plain defaults from words / people / site. */
  v2copy?: {
    /** "padel": "Padel rackets ranked for you…", "padel forums". */ sport: string;
    /** The small sign-off emoji ("🎾"), or "". */ emoji: string;
    /** The black strip over the header. */ strip: string;
    /** The page-foot line on racket pages. */ madeBy: string;
    /** What a forum / blog report is called on a racket page ("padel forum"). */ forum: string; blog: string;
    /** The About page's two story paragraphs (the second's last words, "your game", are set in italics). */ aboutStory: [string, string];
    /** A product name for form placeholders ("Metalbone CTRL 3.5 2026"). */ example: string;
    /** The header logo: "dot" (padel's ball dot, the default) or "icon" (the site's own /niches/<id>/icon.svg). */ logo?: "dot" | "icon";
    /** How a product is used, as a verb: "plays" (default) / "works". */ use?: string;
    /** What the reviewers' test is called on About ("real court time"). */ tested?: string;
    /** The rankings page's call to the quick match ("Tell us how you play"). */ tellUs?: string;
    /** The italic last words of About's second story paragraph ("game"). */ aboutLast?: string;
    /** The add-review page: the dot ratings' low / high words per rating column, and the "+ prompt" chips. */
    rate?: Record<string, [string, string]>; prompts?: string[];
    /** The community score's name ("thrower score"); default "player score". */ score?: string;
    /** The home's "N reviews · N new this week" pill sits inline after the subtitle (owner, DiscGolfRecs mock review). */ pillInline?: boolean;
    /** Where the sport is played, for "Fresh off the court" ("course"); default "court". */ venue?: string;
    /** The quick match's summary label on a type-picker site ("Your rig"); default "Your throw". */ yourPicks?: string;
    /** The home headline's last word ("Less guessing. Better rigs."); default the product word. */ better?: string;
    /** The v2 header's catalogue link ("gear"); default the product word. */ catalogNav?: string;
    /** The footer's line (default "we read forums, YouTube & your reviews, …"); and a "brands" link in the footer. */ footLine?: string; footBrands?: boolean;
  };
  /** The v2 home in a site's own mock (PickleballRecs, owner 2026-11-16), on the shared components; unset = padel's home. */
  v2home?: {
    /** The H1: plain words, then the highlighted ones (none: the shared "Less guessing. Better …" hero). No subline under it when `sub` is null. */ h1?: [string, string]; sub?: string | null;
    /** The list's subline with no picks. */ listSub: string;
    /** Every row shows the match box ("—" until a pick) instead of the Player score; "check price" is a button in its own column;
     *  no verdict word or reason on the row. */ matchRows: true;
    /** "Explore the rankings": tiles for the site's ranking lists. */ rankTiles: true;
    /** The "how we score" strip under the tiles. */ steps: true;
    /** "Questions": `{top:beginner}` / `{top:arm}` in an answer name the two top paddles for that pick, from the live list. */
    faq: HomeFaq[];
  };
  /** The home's sections below the list on a site that keeps its own look (padel, disc golf; owner 2026-11-17): "Explore the
   *  rankings" tiles, the "how we score" strip and "Questions". The same parts as v2home, without its mock look. */
  homeMore?: { faq: HomeFaq[] };
  /** Home feed, popular strip and sidebar only show reviews of models from the last this many model years (1 in 2026 →
   *  2025–2026), so the front page doesn't look outdated; older models keep their own pages. Needs productYears. */
  feedMaxAgeYears?: number;
  /** Owner decision 2026-10-25, so old Reddit threads don't make a site look outdated: the home feed, its counts, the
   *  popular strip and the sidebar only show reviews from the last this many months, and ranking lists only count those
   *  (unless a list sets reviewYears). Web reviews are dated by their source, not by when we quoted them; older reviews
   *  stay on product and brand pages and in search. 12 for fast-moving tech, 24 for sports gear, 36 for slow-moving lines. */
  recentMonths?: number;
  /** The fit check and match %: the fewest reports a racket needs for a verdict, and below how many the page notes it rests on
   *  fewer reports (owner 2026-11-15: padel 6 and 15). Defaults 20 / 20. */
  fit?: { minReports: number; fewReports: number;
    /** Pro / competition lines (regex sources, matched on the product name, case-insensitive): with a brand "advanced" label they
     *  are kept out of the intermediate lists, and out of the beginner lists whatever the brand says, unless players at that
     *  level vouch for them or the expert level says otherwise (lib/level-suits.ts). */
    proLines?: string[];
    /** Shapes kept out of the beginner lists (lowercase spec values, e.g. "diamond"), unless beginners vouch for the racket,
     *  the expert level includes beginner, or it is one of beginnerLines. */
    beginnerShapesOut?: string[];
    /** Lines the owner names as beginner-friendly (regex sources on the name): they always show for beginners. */
    beginnerLines?: string[];
    /** Quick match's level gate (owner 2026-11-15): a product shows for a picked level only when its suits score for that
     *  level (lib/level-suits.ts) reaches this. Without it, level only weighs in the ranking. */
    levelGate?: { beginner: number; intermediate: number; advanced: number };
    /** Gate on the level only with this many players or an expert value; with fewer, the specs' level (when there is one)
     *  stands in, else no gate (PickleballRecs, audit 2026-11-16: 1–3 players let paddles in or kept them out). */ gateMinPlayers?: number;
    /** The suits score an expert's level gives the level next to their band (lib/levelToSuits; default 45). */ expertAdjacentSuits?: number;
    /** The match engine (lib/engine, ENGINE-ALGO.md §5): when set, it ranks quick match and gives the % and the verdict word. */
    engine?: import("../engine").EngineProfile };
  /** URL segment for the catalogue and product pages: "rackets" serves /rackets and /rackets/<slug>. */
  productPath: string;
  /** Name of one rating icon, used in "Tap a ball". */
  scoreUnit: { one: string; many: string };
  /** CSS custom properties set on <html>: colours plus the rating-icon images (see .balls/.ballpick in globals.css). */
  theme: Record<`--${string}`, string>;
  /** Chart segment colours in the "Who's playing it" panel. */
  chartColors: string[];
  /** Share-card (Open Graph) colours and rating icons as standalone SVG markup. */
  og: { background: string; accent: string; muted: string; text: string; scoreOn: string; scoreOff: string;
    /** How many product photos the home / guide share card shows (default 3; TennisRecs 2: its photos show each racket twice). */ photos?: number };
  /** Overall-rating hover words, keyed "1".."5". */
  ratingWords: Record<string, string>;
  categories: { column: CategoryColumn; label: string; hint: string; adminLabel?: string }[];
  profile: Record<ProfileField, Profile> & { sideSuffix: string };
  specs: { column: SpecColumn; label: string; max: number; placeholder: string; options?: string[] }[];
  /** Shapes always offered in the catalogue filter, even before any product uses them. */
  shapeFilter: string[];
  /** Catalogue tabs that group shapes (PadelRecs: Diamond, Hybrid / Teardrop, Round), linked as ?shape=<key>. Without it
   *  every shape is its own tab. Shapes in no group show under "All" only. */
  shapeTabs?: { key: string; label: string; shapes: string[] }[];
  /** Optional top-level browse pages per shape (SkinRecs: /cleansers, /sunscreens…) with a menu row under the header. */
  typePages?: {
    shape: string; slug: string; label: string; intro: string;
    /** Short singular label for the category pill on review cards ("IEM"). Defaults to `shape`. */
    one?: string;
    /** Plural keyword phrase for search: the hub's title ("Best Mirrorless Cameras – …"), H1, description and share image,
     *  where `label` is short menu text ("Mirrorless"). Defaults to `label`. */
    seoLabel?: string;
  }[];
  /** Product pages live under their type page, /<type slug>/<product slug> (SoftwareRecs /vpns/mullvad-vpn), instead of
   *  /<productPath>/<slug>. Needs typePages. Old /<productPath>/<slug> and /rackets/<slug> addresses 301 there (proxy.ts);
   *  a product whose shape has no type page keeps the generic address. */
  categoryPaths?: boolean;
  /** Extra detail on product rows in the catalogue, after the shape. */
  rowDetail?: { column: SpecColumn; suffix: string };
  tags: Tag[];
  /** Pages that moved to another Recs site (GamingRecs monitors → MonitorRecs). Each answers with a 301 to the absolute
   *  destination (next.config.ts); `query` limits one to addresses carrying that query value, e.g. a catalogue filter. */
  movedAway?: { source: string; destination: string; query?: { key: string; value: string } }[];
  /** Rankings pages under /rankings, in menu order. Niches without them get no menu item, pages or sitemap entries. */
  /** "Similar products" at the foot of every product page (app/similar-section.tsx, owner 2026-11-16): one list ("single"),
   *  or tabs with a second list: "routine" (SkinRecs, "Pairs well with"), "bag" (DiscGolfRecs, "Complete your bag"),
   *  "works" (SimRacingRecs, "Works with"). `look`: the mockups' softer (SkinRecs) or disc (DiscGolfRecs) cards. */
  /** A short note above the match list for a pick that needs one (padel, owner 2026-11-17: power for beginners), with a one-tap
   *  switch to a better-suited pick. Lines ≤ 105 characters, expert voice. */
  pickNotes?: { style: string; level: string; text: string; link: { label: string; style: string; level: string } }[];
  similar?: { mode: "single" | "tabs"; pairs?: "routine" | "bag" | "works"; pairLabel?: string; look?: "soft" | "disc" };
  topLists?: TopList[];
  /** The product finder at /finder (lib/finder.ts). Niches without one have no such page. */
  finder?: Finder;
  /** The racket guide (/guide, lib/guide.ts): sections, copy and the catalogue filter behind each section's counts. */
  guide?: import("../guide").GuideConfig;
  /** Amazon affiliate links on product pages (lib/amazon.ts), searched in this Amazon category ("Beauty"). They appear
   *  once the deployment also has the Amazon variables (lib/amazon-offer.ts amazonLinksOn; scripts/set-amazon-env.mjs). */
  amazon?: { searchIndex: string; marketplace?: string; /** Show Amazon's product photo on product pages, where Amazon matches the product. */ photos?: boolean };
  /** Product pages link to the product's own website ("Visit site") instead of Amazon (SoftwareRecs, MoneyRecs). Each product's
   *  website_url, or its affiliate_url when it has one, is the link (lib/product-links.ts); products without either show
   *  "Add your review" there as usual. Pick this or `amazon`, not both. */
  website?: { label?: string };
  /** A short note under the spec strip on every product page, e.g. "Rates, fees and terms change; check the issuer's site.
   *  Checked {checked}." {checked} becomes the date the product's details were read (its catalog `checked` date). */
  specsNote?: string;
  /** Web reviews can name the variant of the product the source used (DiscGolfRecs: the plastic a disc was thrown in), so
   *  one product page per model still lets readers filter and compare variants. A product's allowed variants are its `core`
   *  spec, comma-separated ("Star, GStar, Champion, DX"); lib/variants.ts. Niches without it never store or show variants. */
  variants?: { label: string; plural: string };
  sourcePlatforms: string[];
  /** Example names for placeholders: brand, model, year, search hint. */
  examples: { brand: string; model: string; year: number; search: string };
  form: {
    prompts: [string, string][];
    tips: string[];
    /** The one-tap card on product pages (app/quick-vote.tsx): its question, the "few words" hint, and the second half of
     *  the generated nicknames (e.g. "Volley" in SteadyVolley482). Generic racket-sport wording when left out. */
    quickVote?: { question: string; placeholder: string; nicknames: string[] };
  };
  seo: {
    homeTitle: string;
    homeDescription: string;
    /** Default description for pages without their own. */
    layoutDescription: string;
    titleTemplate: string;
    catalog: Seo;
    brands: Seo;
    brand: (brand: string) => Seo;
    product: (name: string) => Seo;
    productNotFound: string;
    productCategory: string;
    addReview: Seo;
    about: Seo;
    ogAlt: string;
    ogProductAlt: string;
    ogEyebrow: string;
    ogTitle: string;
    ogDetail: string;
    ogFallbackTitle: string;
  };
  copy: {
    /** Sentence-level wording that differs between sports and other niches. */
    ui: {
      formIntro: string;        // under "Add a review"
      howItWent: string;        // "how it played" in "…at least 20 characters about how it played."
      aboutYou: string;         // form step "About your game"
      aboutYouHint: string;     // its hint: "optional · helps people find players like them"
      howItPerforms: string;    // "How it plays": form step and racket-page panel
      whoUsesIt: string;        // "Who's playing it" panel
      triedIt: string;          // "Played it?"
      triedOne: string;         // "Played one?"
      triedOneOfThese: string;  // "Played one of these?"
    };
    notFound: string;
    about: { heading: string; paragraphs: [string, ...string[]]; sections: { heading: string; body: string }[] };
  };
};

/** A home "Questions" entry: `{top:beginner}` / `{top:arm}` in the answer name the two first products of that live list. */
export type HomeFaq = { q: string; a: string; link: string; href: string };
