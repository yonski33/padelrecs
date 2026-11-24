// LaptopRecs' model lines (owner 2026-11-24). Every laptop has a line, a generation order and a release year
// (db/catalogs/laptop-lines.json: slug -> [line, generation, year]; renamed successors such as XPS 14 -> Dell 14 Premium share
// their predecessor's line). Lists show current models only:
//   - a line's 2026 model (the newest generation of 2026, reviews or not);
//   - a 2025 model only when its line has no 2026 successor yet;
//   - nothing from 2024 or older, even when the line has nothing newer.
// Older models keep their pages as reference, with a "Newer version" link. Pure, so tests feed plain inputs.
import table from "../../db/catalogs/laptop-lines.json";

export type LineTable = Record<string, [string, number, number]>;
export const LAPTOP_LINES = table as unknown as LineTable;
/** The year lists show, and the one year before it that may stand in for a line with nothing newer. */
export const CURRENT_YEAR = 2026;

export type LineItem = { id: string; slug: string };
/** `current`: the id that stands for each line in every list; `newer`: an older model's slug -> its line's current slug;
 *  `standIns`: lines shown by a model from the year before (no CURRENT_YEAR successor yet). A laptop missing from the table
 *  is a line of its own with no known year, so it never lists until it is added. */
export function laptopLines(items: LineItem[], lines: LineTable = LAPTOP_LINES, year = CURRENT_YEAR) {
  const by = new Map<string, { x: LineItem; gen: number; year: number }[]>();
  for (const x of items) { const e = lines[x.slug]; if (!e) continue; const l = by.get(e[0]) ?? []; l.push({ x, gen: e[1], year: e[2] }); by.set(e[0], l); }
  const current = new Set<string>(), newer = new Map<string, string>(), standIns: { line: string; slug: string }[] = [];
  for (const [line, l] of by) {
    // Newest first: release year, then generation.
    const sorted = [...l].sort((a, b) => b.year - a.year || b.gen - a.gen), top = sorted[0];
    const pick = top.year >= year ? top : top.year === year - 1 ? top : null;
    if (pick) { current.add(pick.x.id); if (pick.year < year) standIns.push({ line, slug: pick.x.slug }); }
    for (const e of sorted) if (e !== top) newer.set(e.x.slug, top.x.slug);
  }
  return { current, newer, standIns };
}
