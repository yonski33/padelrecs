// Primary shape for products the catalog lists in several shapes (owner 2026-11-23, PickleballRecs: "I'd give each one a
// primary shape"). The catalog's shape text ("Hybrid, Widebody, or Elongated") stays as it is, so the page can still say which
// shapes a paddle comes in; only the shape lists (Best elongated, Best hybrid) read the primary shape, so a paddle sits in one.
// Chosen from the maker's page: the shape its name gives, else the one the maker leads with, else its most common version.
// Pure, so tests feed plain inputs.

export const PRIMARY_SHAPE: Record<string, Record<string, string>> = {
  // From each maker's own product data (the first shape option it lists), 2026-11-23. Six Zero Double Black Diamond Control is
  // left out on purpose: its page offers thicknesses (14mm / 15mm Elongated / 16mm) and never says "Hybrid", so it stays in
  // every shape its text names until the owner picks one.
  pickleball: {
    "vatic-pro-saga-2024": "Hybrid", // Flash (Vatic's hybrid) is the first option
    "pickleball-apes-pulse-2024": "Widebody", // V (Widebody) first; sold out at the time, X (Elongated) in stock
    "holbrook-fuze-vantagrit-2026": "Elongated",
    "six-zero-coral-pro-16mm-2026": "Hybrid",
    "vatic-pro-v-sol-pro-2025": "Hybrid", // Flash first
    "vatic-pro-v-sol-tour-2026": "Hybrid", // Flash first
    "enhance-mpp-turbo-2026": "Elongated",
    "selkirk-slk-era-power-2026": "Widebody",
    "selkirk-labs-project-007-2025": "Standard", // Epic first; sold out at the time, Invikta (Elongated) in stock
    "enhance-duo-2025": "Elongated",
    "enhance-epp-turbo-2026": "Elongated", // first option; sold out at the time, the page preselects Hybrid LH
    "six-zero-coral-16mm-2025": "Hybrid",
    "pickleball-apes-charm-2025": "Hybrid", // S (Hybrid) first
    "six-zero-coral-16mm-lightweight-2026": "Hybrid",
  },
};

/** The shapes a product counts as for the shape lists: its primary shape when one is set, else every shape its text names. */
export function shapesOf(site: string, id: string, shape: string | null | undefined): string[] {
  const primary = PRIMARY_SHAPE[site]?.[id];
  if (primary) return [primary.toLowerCase()];
  return shape ? (shape.toLowerCase().match(/[a-z-]+/g) ?? []).filter(w => w !== "or") : [];
}
/** Whether a product belongs on the `shape` list ("elongated", "hybrid"). */
export const inShape = (site: string, id: string, shape: string | null | undefined, k: string) => shapesOf(site, id, shape).includes(k.toLowerCase());
