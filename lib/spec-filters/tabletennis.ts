import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// TableTennisRecs, approved by the owner (2026-11-14). Both filters are blade specs, so they show on Blades only.

// The makers' own speed classes (Butterfly, Donic, Tibhar, Yasaka). DEF, ALL and ALL+ are too few to stand alone, so
// they join OFF−.
const speed: SpecFilter = {
  id: "speed", label: "Speed class", categories: ["Blade"],
  groups: [{ key: "off-minus", label: "Up to OFF− (DEF, ALL, ALL+, OFF−)" }, { key: "off", label: "OFF" }, { key: "off-plus", label: "OFF+" }],
  classify: p => {
    const s = text(p.balance).toUpperCase().replace(/\s+/g, "").replace("−", "-");
    return /^(DEF|ALL\+?|OFF-)$/.test(s) ? ["off-minus"] : s === "OFF" ? ["off"] : s === "OFF+" ? ["off-plus"] : [];
  },
};

// Ply notation: any fibre layer (C, ALC, ZLC, T5000, ZLF, CAF, Arylate, a/c, "+2", "+4 carbon"…) makes a composite
// blade; only wood plies ("5W", "7-ply", "5 All Wood", "Five Ply Hard Wood", "1-ply" hinoki) is all wood.
const composition: SpecFilter = {
  id: "ply", label: "Composition", categories: ["Blade"],
  groups: [{ key: "wood", label: "All wood" }, { key: "composite", label: "Carbon / composite" }],
  classify: p => {
    const s = text(p.core); if (!s || has(s, /pips|inverted/i)) return [];
    if (has(s, /\+|carbon|arylate|axylium|t5000|\d\s*[a-z]?\s*(c|alc|zlc|zlf|caf|ac|a\/c|z\/c|c\/f)\b|\bc\b/i)) return ["composite"];
    if (has(s, /^\s*\d+\s*w\s*$|ply|wood/i)) return ["wood"];
    return [];
  },
};

export default [speed, composition];
