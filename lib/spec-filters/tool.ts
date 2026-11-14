import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// ToolRecs, approved by the owner (2026-11-14).

// Battery voltage class from the platform (column `balance`). Brands label the same 18V cells "20V MAX" (US peak) or "18V"
// (nominal), so they go together; 12V is the compact class and outdoor tools run on 40–60V packs. FLEXVOLT 60V MAX goes in
// 40V and up, while "20V MAX (FLEXVOLT ADVANTAGE)" tools run on 20V packs. Brand is its own filter already.
const voltage: SpecFilter = {
  id: "voltage", label: "Battery voltage",
  groups: [{ key: "12v", label: "12V" }, { key: "18v", label: "18V / 20V MAX" }, { key: "40v", label: "40V and up" }, { key: "corded", label: "Corded" }],
  classify: p => {
    const s = text(p.balance);
    if (has(s, /corded/i)) return ["corded"];
    if (has(s, /\bM12\b|\b12\s*V\b/i)) return ["12v"];
    if (has(s, /\b(40|56|60|80|120)\s*V\b/i) && !has(s, /20V MAX \(FLEXVOLT ADVANTAGE\)/i)) return ["40v"];
    if (has(s, /\bM18\b|\b(18|20)\s*V\b/i)) return ["18v"];
    return [];
  },
};

// Tool type (column `surface`), the split Home Depot and Lowe's use under drills. It is shown inside Drills & drivers and
// Outdoor power, the categories that hold several tool types, as one filter each so neither shows the other's groups.
// Saws are left out (5 table saws and 1 miter saw: a 1-product group). "Impact driver/wrench" counts in both.
const driveType: SpecFilter = {
  id: "drill", label: "Tool type", categories: ["Drills & drivers"],
  groups: [{ key: "impact-driver", label: "Impact driver" }, { key: "hammer-drill", label: "Hammer drill" }, { key: "drill-driver", label: "Drill/driver" }, { key: "impact-wrench", label: "Impact wrench" }],
  classify: p => {
    const s = text(p.surface), keys: string[] = [];
    if (has(s, /impact driver/i)) keys.push("impact-driver");
    if (has(s, /impact (driver\/)?wrench/i)) keys.push("impact-wrench");
    if (has(s, /hammer drill/i)) keys.push("hammer-drill");
    if (has(s, /drill\/driver|drill driver/i)) keys.push("drill-driver");
    return keys;
  },
};

const outdoorType: SpecFilter = {
  id: "outdoor", label: "Tool type", categories: ["Outdoor power"],
  groups: [{ key: "trimmer", label: "String trimmer" }, { key: "blower", label: "Leaf blower" }, { key: "mower", label: "Lawn mower" }],
  classify: p => {
    const s = text(p.surface);
    return has(s, /trimmer/i) ? ["trimmer"] : has(s, /blower/i) ? ["blower"] : has(s, /mower/i) ? ["mower"] : [];
  },
};

export default [voltage, driveType, outdoorType];
