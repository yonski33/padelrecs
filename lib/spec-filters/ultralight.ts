import type { SpecFilter } from "./types";
import { has, numbers, text } from "./parse";

// UltralightRecs, approved by the owner (2026-11-14). Owner cap: 3 filters, so the Type split is kept for shelters only
// (backpack frame and quilt vs sleeping bag are left out); the other two are shelter capacity and season rating.

// Shelters by pitch (column `balance`), as REI splits tents (freestanding / semi-freestanding / non-freestanding) with the
// ultralight makers' own trekking-pole and pyramid types. Arch-pole tents stay their own group: Durston and Tarptent sell
// them under that name, and calling them semi-freestanding would be a guess.
const pitch: SpecFilter = {
  id: "pitch", label: "Tent type", categories: ["Shelter"],
  groups: [{ key: "trekking-pole", label: "Trekking-pole tent" }, { key: "freestanding", label: "Freestanding" }, { key: "semi", label: "Semi-freestanding" }, { key: "arch", label: "Arch-pole tent" }, { key: "pyramid-tarp", label: "Pyramid & tarp" }],
  classify: p => {
    const s = text(p.balance);
    return has(s, /trekking/i) ? ["trekking-pole"] : has(s, /semi/i) ? ["semi"] : has(s, /freestanding/i) ? ["freestanding"]
      : has(s, /arch/i) ? ["arch"] : has(s, /pyramid|tarp|mid\b/i) ? ["pyramid-tarp"] : [];
  },
};

// Shelter capacity (column `surface`), REI's tent filter. "1+" / "2+" count as 1 / 2; a range ("1–2 person") or a model
// sold in several sizes ("1 / 2 / 3 person") counts in every size it covers. Tarps with no capacity stated stay out.
const sleeps: SpecFilter = {
  id: "sleeps", label: "Sleeps", categories: ["Shelter"],
  groups: [{ key: "1", label: "1 person" }, { key: "2", label: "2 person" }, { key: "3", label: "3+ person" }],
  classify: p => {
    const s = text(p.surface); if (!has(s, /person|people|p\b/i)) return [];
    const head = s.replace(/\(.*?\)/g, " ").split(/person|people/i)[0];
    let n = numbers(head).filter(x => x > 0 && x < 10 && Number.isInteger(x));
    if (!n.length) return [];
    if (/\d\s*[–—-]\s*\d/.test(head) && n.length === 2) n = Array.from({ length: n[1] - n[0] + 1 }, (_, i) => n[0] + i);
    return [...new Set(n.map(x => x >= 3 ? "3" : String(x)))];
  },
};

// Season rating (column `surface`): quilts and bags by their °F rating (lower / limit rating as the maker states it),
// pads by ASTM F3340 R-value. Bands as Switchback Travel uses them: bags above 32°F summer, 20–32°F 3-season, below 20°F
// winter; pads under R 3 summer, R 3–4.9 3-season, R 5+ winter. Multi-rating listings ("30°F / 20°F / 10°F") count in
// every band they reach; "25°F lower / 45°F upper" reads the lower figure.
function fahrenheit(s: string): number[] {
  const t = s.replace(/\([^)]*°?C[^)]*\)/gi, " ").replace(/[-−]?\d+(?:\.\d+)?\s*°?\s*C\b/g, " ").replace(/\/\s*[-−]?\d+\s*°?F?\s*upper/i, " ");
  if (!has(t, /°\s*F|\bF\b/)) return [];
  return numbers(t).filter(x => x > -60 && x < 80);
}
const season: SpecFilter = {
  id: "season", label: "Season", categories: ["Quilt & bag", "Sleeping pad"],
  groups: [{ key: "summer", label: "Summer" }, { key: "3-season", label: "3-season" }, { key: "winter", label: "Winter" }],
  classify: p => {
    const s = text(p.surface), keys = new Set<string>();
    const r = s.match(/\bR[-\s]?(?:value\s*)?(\d+(?:[.,]\d+)?)/i);
    if (r && !has(s, /°/)) { const v = Number(r[1].replace(",", ".")); keys.add(v < 3 ? "summer" : v < 5 ? "3-season" : "winter"); }
    else for (const f of fahrenheit(s)) keys.add(f > 32 ? "summer" : f >= 20 ? "3-season" : "winter");
    return season.groups.map(g => g.key).filter(k => keys.has(k));
  },
};

export default [pitch, sleeps, season];
