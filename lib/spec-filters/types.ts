/** Catalogue filters built from the product specs we store as free text (owner, 2026-11-14). Each site lists the few
 *  filters buyers actually use, with groups fact-checked against how makers and specialist retailers state them
 *  (spec-filter-proposals.md). `classify` reads a product and returns the group keys it belongs to: usually one (the best
 *  fit, padel weights), several when the product is sold in several versions (TV sizes, mattress firmness), none when
 *  the spec is missing or unclear, which leaves the product out of that filter's groups rather than guessing. */
export type SpecFilterGroup = { key: string; label: string };
export type SpecFilter = {
  /** Short and stable: it goes in the address as sf=<id>:<group key>. */
  id: string;
  label: string;
  groups: SpecFilterGroup[];
  classify: (product: Record<string, unknown>) => string[];
  /** Only shown inside these categories (product `shape` values, any case), e.g. mouse weight on Mice. */
  categories?: string[];
};
