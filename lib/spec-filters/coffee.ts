import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// CoffeeRecs, approved by the owner (2026-11-14). Each type filter shows inside its own category. Espresso machines are
// sold by how they heat water (Clive Coffee, Whole Latte Love): single boiler, heat exchanger, dual boiler, thermoblock,
// plus manual machines. Grinders split hand vs electric, and electric ones flat vs conical burr. Brewers split drip
// machine, pour-over and immersion. Bracketed details and add-ons ("built-in grinder", "E61 group") don't change the type.
const espresso: SpecFilter = {
  id: "heating", label: "Espresso machine type", categories: ["Espresso machine"],
  groups: [{ key: "single", label: "Single boiler" }, { key: "hx", label: "Heat exchanger" }, { key: "dual", label: "Dual boiler" }, { key: "thermoblock", label: "Thermoblock / thermojet" }, { key: "manual", label: "Manual / lever" }],
  classify: p => {
    const s = text(p.balance);
    // "Electronic flow and pressure profiling" and "Flow-through heater + boiler" don't state a standard heating type.
    if (has(s, /^single boiler/i)) return ["single"];
    if (has(s, /^heat exchanger/i)) return ["hx"];
    if (has(s, /^dual boiler/i)) return ["dual"];
    if (has(s, /^thermo(block|jet|coil)/i)) return ["thermoblock"];
    if (has(s, /^manual/i)) return ["manual"];
    return [];
  },
};

// "Flat or conical burr electric" and a grind-by-weight grinder with no burr type stated stay out.
const grinder: SpecFilter = {
  id: "grinder", label: "Grinder type", categories: ["Grinder"],
  groups: [{ key: "hand", label: "Hand grinder" }, { key: "flat", label: "Electric flat burr" }, { key: "conical", label: "Electric conical burr" }],
  classify: p => {
    const s = text(p.balance);
    if (has(s, /^hand/i)) return ["hand"];
    if (has(s, /flat or conical/i)) return [];
    if (has(s, /^flat burr/i)) return ["flat"];
    if (has(s, /^conical burr/i)) return ["conical"];
    return [];
  },
};

// A switch-valve dripper does both pour-over and immersion, so it is in both; a French press is an immersion brewer.
const brewer: SpecFilter = {
  id: "brewer", label: "Brewer type", categories: ["Brewer"],
  groups: [{ key: "drip", label: "Drip machine" }, { key: "pourover", label: "Pour-over" }, { key: "immersion", label: "Immersion" }],
  classify: p => {
    const s = text(p.balance);
    if (has(s, /^drip coffee maker/i)) return ["drip"];
    const out: string[] = [];
    if (has(s, /pour-over/i)) out.push("pourover");
    if (has(s, /immersion|french press/i)) out.push("immersion");
    return out;
  },
};

export default [espresso, grinder, brewer];
