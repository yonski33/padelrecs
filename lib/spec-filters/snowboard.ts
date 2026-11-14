import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// SnowboardRecs, approved by the owner (2026-11-14). evo's three shapes; asymmetrical boards in the catalogue (GNU Asym,
// Nitro Optisym, Ride Zero) are twins with asymmetric sidecuts, so they go to Twin.
const shape: SpecFilter = {
  id: "shape", label: "Shape",
  groups: [{ key: "directional", label: "Directional" }, { key: "directional-twin", label: "Directional twin" }, { key: "twin", label: "Twin" }],
  classify: p => {
    const s = text(p.core);
    return has(s, /directional\s*twin/i) ? ["directional-twin"] : has(s, /twin|asym/i) ? ["twin"] : has(s, /directional/i) ? ["directional"] : [];
  },
};

// Makers write flex as words, x/10 or x/5 (doubled to the 10 scale). Bands follow Boardom (1–4 soft, 4.5–6 medium,
// 6.5+ stiff; makers who use words call boards like 6/10 "Medium"). A board whose flex changes by length goes under
// each band its lengths reach.
const flex: SpecFilter = {
  id: "flex", label: "Flex",
  groups: [{ key: "soft", label: "Soft" }, { key: "medium", label: "Medium" }, { key: "stiff", label: "Stiff" }],
  classify: p => {
    const s = text(p.weight); if (!s) return [];
    const band = (v: number) => v <= 4 ? "soft" : v <= 6 ? "medium" : "stiff";
    const rated = [...s.matchAll(/([\d.]+)\s*\/\s*(10|5)\b/g)].map(m => band(Number(m[1]) * (m[2] === "5" ? 2 : 1)));
    if (rated.length) return [...new Set(rated)];
    if (has(s, /stiff/i)) return ["stiff"];
    if (has(s, /medium/i)) return ["medium"];
    return has(s, /soft/i) ? ["soft"] : [];
  },
};

// Shops (evo, The Good Ride) group profiles as camber, hybrid camber (camber underfoot, rocker at nose/tail) and
// hybrid rocker (rocker or flat between the feet); rocker and flat boards are too few alone, so they join hybrid
// rocker. Brand tech names map one by one; a new name falls through to no group until it is added here.
const PROFILES: [RegExp, string][] = [
  // Rocker or flat between the feet: GNU/Lib Tech C2 family and Banana, Burton Flying V, Never Summer rocker-camber,
  // Arbor System Rocker, Nitro Flat-Out Rocker, Ride Zero (flat).
  [/\bC2|banana|flying\s*v|triple\s*camber|rocker\s*camber|shock\s*wave|system\s*rocker|flat[- ]out\s*rocker|zero\s*camber|surf\s*rocker$/i, "rocker"],
  // Camber with rocker at nose and tail: CamRock, Salomon Rock Out / Quad / Backseat / Cross Profile, CAPiTA V1–V3,
  // K2 Combination Camber, Nitro Cam-Out, Jones Directional Rocker and Camber/Rocker.
  [/camrock|rock\s*out|quad|backseat|powder|cross\s*profile|\bV[123]\b|combination|cam-?out|directional\s*rocker|camber\s*\/\s*rocker/i, "hybrid-camber"],
  // Camber without a named rocker zone: Burton, K2, Jones, Ride, Arbor, Bataleon, C3, Rome, Never Summer Recurve.
  [/camber/i, "camber"],
];
const profile: SpecFilter = {
  id: "profile", label: "Profile",
  groups: [{ key: "camber", label: "Camber" }, { key: "hybrid-camber", label: "Hybrid camber" }, { key: "rocker", label: "Hybrid rocker, rocker or flat" }],
  classify: p => { const s = text(p.surface); const hit = PROFILES.find(([re]) => re.test(s)); return hit ? [hit[1]] : []; },
};

export default [shape, flex, profile];
