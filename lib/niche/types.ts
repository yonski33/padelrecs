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
  };
  filters?: SpecFilter[];
  /** Only list models from the last this many model years (2 in 2026 → 2024–2026). Only for niches whose products carry
   *  real years (productYears): elsewhere every product has the same placeholder year. */
  maxAgeYears?: number;
  /** Only reviews from the last this many years count (default: the niche's recentMonths, else REVIEW_YEARS in lib/top-lists.ts). */
  reviewYears?: number;
  /** Same as reviewYears, in months; set from the niche's recentMonths when a list sets neither. */
  reviewMonths?: number;
  /** Published reviews with a verdict a product needs before it can be listed (never below 5). */
  minReviews?: number;
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
  /** Who writes reviews: "player" / "players" on sports sites, "user" / "users" on SkinRecs. */
  people: Words;
  /** Products have model years (rackets, paddles). When false, years are not asked, shown, filtered or put in names. */
  productYears?: boolean;
  /** Home feed, popular strip and sidebar only show reviews of models from the last this many model years (1 in 2026 →
   *  2025–2026), so the front page doesn't look outdated; older models keep their own pages. Needs productYears. */
  feedMaxAgeYears?: number;
  /** Owner decision 2026-10-25, so old Reddit threads don't make a site look outdated: the home feed, its counts, the
   *  popular strip and the sidebar only show reviews from the last this many months, and ranking lists only count those
   *  (unless a list sets reviewYears). Web reviews are dated by their source, not by when we quoted them; older reviews
   *  stay on product and brand pages and in search. 12 for fast-moving tech, 24 for sports gear, 36 for slow-moving lines. */
  recentMonths?: number;
  /** URL segment for the catalogue and product pages: "rackets" serves /rackets and /rackets/<slug>. */
  productPath: string;
  /** Name of one rating icon, used in "Tap a ball". */
  scoreUnit: { one: string; many: string };
  /** CSS custom properties set on <html>: colours plus the rating-icon images (see .balls/.ballpick in globals.css). */
  theme: Record<`--${string}`, string>;
  /** Chart segment colours in the "Who's playing it" panel. */
  chartColors: string[];
  /** Share-card (Open Graph) colours and rating icons as standalone SVG markup. */
  og: { background: string; accent: string; muted: string; text: string; scoreOn: string; scoreOff: string };
  /** Overall-rating hover words, keyed "1".."5". */
  ratingWords: Record<string, string>;
  categories: { column: CategoryColumn; label: string; hint: string; adminLabel?: string }[];
  profile: Record<ProfileField, Profile> & { sideSuffix: string };
  specs: { column: SpecColumn; label: string; max: number; placeholder: string; options?: string[] }[];
  /** Shapes always offered in the catalogue filter, even before any product uses them. */
  shapeFilter: string[];
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
  topLists?: TopList[];
  /** Amazon affiliate links on product pages (lib/amazon.ts), searched in this Amazon category ("Beauty"). They appear
   *  once the deployment also has the Amazon variables (lib/amazon-offer.ts amazonLinksOn; scripts/set-amazon-env.mjs). */
  amazon?: { searchIndex: string; marketplace?: string };
  /** Product pages link to the product's own website ("Visit site") instead of Amazon (SoftwareRecs, MoneyRecs). Each product's
   *  website_url, or its affiliate_url when it has one, is the link (lib/product-links.ts); products without either show
   *  "Add your review" there as usual. Pick this or `amazon`, not both. */
  website?: { label?: string };
  /** A short note under the spec strip on every product page, e.g. "Rates, fees and terms change; check the issuer's site.
   *  Checked {checked}." {checked} becomes the date the product's details were read (its catalog `checked` date). */
  specsNote?: string;
  sourcePlatforms: string[];
  /** Example names for placeholders: brand, model, year, search hint. */
  examples: { brand: string; model: string; year: number; search: string };
  form: {
    prompts: [string, string][];
    tips: string[];
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
