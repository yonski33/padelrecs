// A product's shape chip (owner 2026-11-22, PickleballRecs): some rows are one model sold in several shapes ("Hybrid, Widebody,
// or Elongated"). That list is not a shape, so the chip hides; the row still matches each of those shapes in a Shape filter.
// A single shape (including "Shifter / handbrake", spaced) is shown as it is. Pure, so tests feed plain strings.

/** Several shapes in one value: a comma, " or ", or an unspaced "A/B" ("Standard/Widebody"). */
export const manyShapes = (s: string | null | undefined) => !!s && /,|\bor\b|\w\/\w/i.test(s);
/** The shape to show as a chip, or null when the row lists several. */
export const oneShape = (s: string | null | undefined): string | null => !s || manyShapes(s) ? null : s;
/** Whether a row's shape matches a Shape filter value: the same value, or one of the shapes it lists. */
export const shapeHas = (s: string | null | undefined, v: string) => s === v || (manyShapes(s) && new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(s!));
