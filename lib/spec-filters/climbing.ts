import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// ClimbingRecs, approved by the owner (2026-11-14). The Type column (`balance`) holds a different split in each category,
// the way climbing shops sell them (REI: shoe closure strap / lace-up, ropes single / half / twin, belay devices tube /
// assisted braking), so each category gets its own filter. Owner cap: 3 filters, so harness use and crash pad size are
// left out, and the optional shoe upper filter is skipped (owner).

// Shoes by closure: Velcro / strap, lace or slipper.
const closure: SpecFilter = {
  id: "closure", label: "Closure", categories: ["Climbing shoe"],
  groups: [{ key: "strap", label: "Velcro / strap" }, { key: "lace", label: "Lace" }, { key: "slipper", label: "Slipper" }],
  classify: p => {
    const s = text(p.balance);
    return has(s, /strap|velcro/i) ? ["strap"] : has(s, /lace/i) ? ["lace"] : has(s, /slipper/i) ? ["slipper"] : [];
  },
};

// Ropes by rating. Half and twin are merged (only 3 ropes are rated for just one of them); triple-rated ropes
// ("Single / half / twin") are certified for every use, so they count in both groups.
const rope: SpecFilter = {
  id: "rope", label: "Rope type", categories: ["Rope"],
  groups: [{ key: "single", label: "Single" }, { key: "half-twin", label: "Half or twin" }],
  classify: p => {
    const s = text(p.balance), keys: string[] = [];
    if (has(s, /single/i)) keys.push("single");
    if (has(s, /half|twin/i)) keys.push("half-twin");
    return keys;
  },
};

// Belay devices: assisted braking (incl. cam and "belay assist") or a plain tube / figure 8.
const belay: SpecFilter = {
  id: "belay", label: "Device type", categories: ["Belay device"],
  groups: [{ key: "assisted", label: "Assisted braking" }, { key: "tube", label: "Tube & figure 8" }],
  classify: p => {
    const s = text(p.balance);
    return has(s, /assist/i) ? ["assisted"] : has(s, /tube|figure/i) ? ["tube"] : [];
  },
};

export default [closure, rope, belay];
