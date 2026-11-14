import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// CyclingRecs, approved by the owner (2026-11-14). Frame material is the first filter at Trek, Specialized and Canyon.
// Steel or titanium would get their own groups once such bikes are listed.
const frame: SpecFilter = {
  id: "frame", label: "Frame",
  groups: [{ key: "carbon", label: "Carbon" }, { key: "aluminium", label: "Aluminium" }],
  classify: p => { const s = text(p.weight); return has(s, /carbon/i) ? ["carbon"] : has(s, /alumin/i) ? ["aluminium"] : []; },
};

// The makers' own sub-discipline names (Trek and Specialized: road race / endurance / aero, MTB XC / trail / enduro /
// downhill), one filter per category so each shows only its own types (Race is both a road and a gravel type).
const TYPES: Record<string, [string, string, RegExp][]> = {
  Road: [["race", "Race", /^race$/i], ["endurance", "Endurance", /^endurance$/i], ["aero", "Aero", /^aero$/i], ["triathlon", "Triathlon", /^tri(athlon)?$/i]],
  Gravel: [["race", "Race", /^race$/i], ["adventure", "Adventure", /^adventure$/i], ["cyclocross", "Cyclocross", /^cyclo-?cross$/i]],
  Mountain: [["xc", "Cross-country", /^(cross-?country|xc)$/i], ["trail", "Trail", /^trail$/i], ["enduro", "Enduro", /^enduro$/i], ["downhill", "Downhill", /^downhill$/i]],
};
const types: SpecFilter[] = Object.entries(TYPES).map(([cat, list]) => ({
  id: `type-${cat.toLowerCase()}`, label: "Type", categories: [cat],
  groups: list.map(([key, label]) => ({ key, label })),
  classify: p => { const s = text(p.balance); const t = list.find(([, , re]) => re.test(s)); return t ? [t[0]] : []; },
}));

export default [frame, ...types];
