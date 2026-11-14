import type { SpecFilter } from "./types";
import { has, numbers, text } from "./parse";

// TennisRecs, approved by the owner (2026-11-14). Makers name frames by unstrung weight class (Pure Drive 300 g, Blade 98
// 305 g), so the groups follow those classes, with the strung range in the label because most of our values are strung
// weights ("323 g strung"). Strings add about 15–20 g: a 300 g frame is typically 318–320 g strung, a 305 g frame 323 g.
// A value that says "strung" uses the strung bounds; anything else ("305 g", "300 g (per model name)") is unstrung.
const weight: SpecFilter = {
  id: "weight", label: "Weight",
  groups: [{ key: "light", label: "Up to 285 g (≤ 303 g strung)" }, { key: "290-300", label: "290–300 g (304–320 g strung)" }, { key: "305", label: "305 g (321–327 g strung)" }, { key: "heavy", label: "310 g+ (328 g+ strung)" }],
  classify: p => {
    const s = text(p.weight); const g = numbers(s)[0]; if (!g) return [];
    const [a, b, c] = has(s, /strung/i) ? [303, 320, 327] : [285, 300, 307];
    return [g <= a ? "light" : g <= b ? "290-300" : g <= c ? "305" : "heavy"];
  },
};

// Tennis Warehouse's stiffness bands: flexible 63 RA and below, medium 64–67, stiff 68 and above.
const stiffness: SpecFilter = {
  id: "stiffness", label: "Stiffness",
  groups: [{ key: "flexible", label: "Flexible (63 RA and below)" }, { key: "medium", label: "Medium (64–67 RA)" }, { key: "stiff", label: "Stiff (68 RA and up)" }],
  classify: p => {
    const s = text(p.surface); if (!has(s, /RA/i)) return [];
    const ra = numbers(s)[0]; if (!ra) return [];
    return [ra <= 63.5 ? "flexible" : ra < 67.5 ? "medium" : "stiff"];
  },
};

// Head size (column `shape`, "100 sq in (645 cm²)"). Owner asked for it (2026-11-14). Tennis Warehouse calls 85–96 midsize,
// 96–106 midplus, 107+ oversize, but nearly all our frames are 97–100, so the groups split the midplus range where
// buyers actually choose (97 vs 98 vs 100) and put everything from 102 up together (too few to split further).
const headSize: SpecFilter = {
  id: "head", label: "Head size",
  groups: [{ key: "under-98", label: "Under 98 sq in" }, { key: "98-99", label: "98–99 sq in" }, { key: "100", label: "100 sq in" }, { key: "102", label: "102 sq in+" }],
  classify: p => {
    const s = text(p.shape); if (!has(s, /sq\s*in/i)) return [];
    const n = numbers(s)[0]; if (!n) return [];
    return [n < 97.5 ? "under-98" : n < 99.5 ? "98-99" : n < 101 ? "100" : "102"];
  },
};

export default [weight, stiffness, headSize];
