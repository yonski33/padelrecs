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
  };
  words: Words;
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
  /** Extra detail on product rows in the catalogue, after the shape. */
  rowDetail?: { column: SpecColumn; suffix: string };
  tags: Tag[];
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
    notFound: string;
    about: { heading: string; paragraphs: [string, ...string[]]; sections: { heading: string; body: string }[] };
  };
};
