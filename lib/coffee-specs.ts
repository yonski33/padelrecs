// CoffeeRecs' structured specs (owner via PM 2026-11-18: "add the structured spec fields the engine needs"). The catalogue keeps
// four free-text columns (Type, Key specs, Material, Weight); the match needs fixed values, so they live here, one entry per
// product slug, built from Grok's maker spec check (scripts/grok-coffee/build_specs.py → db/specs/coffee.json). Each entry
// keeps the maker page it came from. Grok's "unknown" stays null: a filter never drops a product on an unknown.
// Price tiers (approximate USD street price, Nov 2026): $ under 150, $$ 150–500, $$$ 500–1,500, $$$$ over 1,500.
import data from "../db/specs/coffee.json";
import { steamRank } from "./claim-guard";
export { steamRank };

export type CoffeeCat = "espresso" | "grinder" | "brewer" | "kettle" | "scale";
export type CoffeeLevel = "beginner" | "middle" | "enthusiast";
export type CoffeeSpec = {
  name: string; cat: CoffeeCat; type: string | null; tier: "$" | "$$" | "$$$" | "$$$$" | null; tierEst?: boolean; level: CoffeeLevel; source: string;
  /** "replaced by …": the maker no longer makes it; out of the match and lists. */ gone?: string;
  /** The year it first went on sale, from a dated maker page, press release or launch news (checked 2026-11-28,
   *  grok-share/jobs/coffee-catalog-years). Absent = unknown: the pages show no year (the catalogue's 2026 is a placeholder). */
  released?: number;
  /** Announced, not shipping yet (Decent Bengle): out of the match, and its page labels the impressions as pre-release. */ preRelease?: string;
  // Espresso machines
  heat?: string | null; pid?: boolean | null; profiling?: boolean; flowControl?: boolean; preinfusion?: boolean | null;
  steam?: "none" | "wand" | "auto"; builtInGrinder?: boolean; group?: number | null; e61?: boolean; portable?: boolean;
  // Grinders
  power?: "hand" | "electric" | string; burr?: "flat" | "conical" | null; burrMm?: number | null; burrMaterial?: "steel" | "ceramic" | null;
  adjust?: "stepless" | "stepped"; singleDose?: boolean; espresso?: boolean | "limited" | null; gbw?: boolean; variableSpeed?: boolean;
  // Brewers
  method?: "pour-over" | "immersion" | "hybrid" | "french press" | "drip"; cups?: ("one" | "few" | "pot")[]; filter?: "paper" | "metal"; sca?: boolean | null;
  // Kettles
  gooseneck?: boolean | null; temp?: boolean; hold?: boolean;
  // Scales
  res?: number; maxG?: number | null; timer?: boolean; autoStart?: boolean; flow?: boolean; espressoFit?: boolean | null; water?: boolean | null; app?: boolean;
};
export const COFFEE_SPECS = data as unknown as Record<string, CoffeeSpec>;
/** The real release year, or null where unknown (never the catalogue's placeholder). */
export const coffeeYear = (slug: string) => COFFEE_SPECS[slug]?.released ?? null;
const BY_NAME = new Map(Object.values(COFFEE_SPECS).map(s => [s.name, s]));
/** A product's specs by slug, or by name where only the name is at hand (the match's fact rows). */
export const coffeeSpec = (p: { slug?: string | null; name?: string | null }): CoffeeSpec | undefined =>
  (p.slug ? COFFEE_SPECS[p.slug] : undefined) ?? (p.name ? BY_NAME.get(p.name) : undefined);

export const CAT_OF_SHAPE: Record<string, CoffeeCat> = { "Espresso machine": "espresso", Grinder: "grinder", Brewer: "brewer", Kettle: "kettle", Scale: "scale" };
export const TIER_WORDS: Record<string, string> = { $: "under $150", $$: "$150–500", $$$: "$500–1,500", $$$$: "over $1,500" };

/** Brews and steams back to back without a long wait: a heat exchanger or a dual boiler (profile E3). */
export const backToBack = (s: CoffeeSpec) => s.cat === "espresso" && (steamRank(s.type) ?? 0) >= 2 && s.steam !== "none";
