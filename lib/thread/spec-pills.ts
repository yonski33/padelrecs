// The product header's spec line (owner 2026-11-24, PadelRecs and PickleballRecs): under the style, feel and level tags, the
// catalogue's own specs as one grey line, joined by middle dots. Catalogue fields only: an empty field, a field that lists several options
// ("Hybrid, Widebody, or Elongated") or one too long for a pill is skipped, never guessed. A note in brackets is dropped
// ("MLD Black EVA (multilayer)" → "MLD Black EVA"). Pure, so tests feed plain rows.
//   - Padel: shape, core, surface, weight, model year.
//   - Pickleball: shape, core thickness, surface. No year: its catalogue years are not model years (niche productYears).
//   - Coffee (2026-11-28): type (its first part: "Dual boiler, E61 group" → "Dual boiler"), weight, and "Released 2022" only
//     where the year was checked (db/specs/coffee.json `released`); the catalogue's year column is a placeholder there.
import { oneShape } from "./shape";
import { coffeeYear } from "../coffee-specs";

export type SpecRow = { shape?: string | null; core?: string | null; surface?: string | null; weight?: string | null; year?: number | null;
  /** Coffee: its type column and its slug (for the checked release year). */ balance?: string | null; slug?: string };
const MAX = 28;
const clean = (v: string | null | undefined) => { const t = (v ?? "").replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  return t && t.length <= MAX && !/,|;|·|\bor\b/i.test(t) ? t : null; };

export function specPills(site: string, r: SpecRow): string[] {
  const shape = clean(oneShape(r.shape ?? null));
  if (site === "padel") return [shape, clean(r.core), clean(r.surface), clean(r.weight), r.year ? String(r.year) : null].filter((x): x is string => !!x);
  if (site === "pickleball") { const core = clean(r.core);
    return [shape, core ? (/\bmm\b/.test(core) ? `${core} core` : core) : null, clean(r.surface)].filter((x): x is string => !!x); }
  if (site === "coffee") { const y = r.slug ? coffeeYear(r.slug) : null;
    return [clean(r.balance?.split(",")[0]), clean(r.weight), y ? `Released ${y}` : null].filter((x): x is string => !!x); }
  return [];
}
