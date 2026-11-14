import type { SpecFilter } from "./types";
import { has, numbers, text } from "./parse";

// TravelGearRecs, approved by the owner (2026-11-14).

// Capacity in litres (column `core`), in the bands Pack Hacker and Tortuga use: slings and pouches under 15 L, daypacks and
// personal items 15–29 L, hybrids 30–39 L, carry-on travel packs 40–45 L (the largest that fits most overhead bins), and
// over carry-on size. 39.9 L stays in 30–39 L (makers use it to say "under 40 L"). Two sizes or expandable ("30 or 38 L",
// "37–48 L", "22 L (expands to 35–40 L)") count in every band from the smaller to the larger figure; "body / total" values use the total.
const band = (l: number) => l < 15 ? "under-15" : l < 30 ? "15-29" : l < 40 ? "30-39" : l <= 45 ? "40-45" : "over-45";
const capacity: SpecFilter = {
  id: "capacity", label: "Capacity",
  groups: [{ key: "under-15", label: "Under 15 L" }, { key: "15-29", label: "15–29 L" }, { key: "30-39", label: "30–39 L" }, { key: "40-45", label: "40–45 L" }, { key: "over-45", label: "Over 45 L" }],
  classify: p => {
    const s = text(p.core); if (!has(s, /\d\s*(L|liters?|litres?)\b/i)) return [];
    const litres = numbers(s.replace(/\([^)]*\)/g, m => has(m, /\d\s*L\b/i) ? m : " ").replace(/\d+(?:[.,]\d+)?\s*(?:in|cm|"|lb|kg|g|oz)\b/gi, " ")).filter(x => x > 0);
    if (!litres.length) return [];
    const keys = capacity.groups.map(g => g.key), hi = keys.indexOf(band(Math.max(...litres)));
    const lo = has(s, /total/i) ? hi : keys.indexOf(band(Math.min(...litres)));
    return keys.slice(lo, hi + 1);
  },
};

// Luggage shell: hardside (polycarbonate incl. Makrolon, polypropylene, ABS, aluminum) or softside (fabric), the main
// split luggage makers and shops sell by. A fabric case with a hard back panel counts as softside. Luggage only;
// backpacks and cubes have no shell.
const shell: SpecFilter = {
  id: "shell", label: "Shell", categories: ["Rolling luggage"],
  groups: [{ key: "hard", label: "Hardside" }, { key: "soft", label: "Softside" }],
  classify: p => {
    const s = text(p.surface);
    return has(s, /nylon|cordura|polyester|ballistic|canvas|fabric|ripstop|\d+\s*D\b/i) ? ["soft"]
      : has(s, /polycarbonate|makrolon|polypropylene|\bABS\b|alumin/i) ? ["hard"] : [];
  },
};

export default [capacity, shell];
