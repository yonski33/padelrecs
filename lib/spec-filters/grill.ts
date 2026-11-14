import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// GrillRecs, approved by the owner (2026-11-14). Home Depot filters grills by fuel type, with propane and natural gas
// together under gas. A multi-fuel grill or oven goes in every fuel it takes ("Wood, charcoal or gas" is in all three);
// "Wood pellets" is Pellet only.
const fuel: SpecFilter = {
  id: "fuel", label: "Fuel",
  groups: [{ key: "gas", label: "Gas (propane / natural gas)" }, { key: "charcoal", label: "Charcoal" }, { key: "pellet", label: "Pellet" }, { key: "wood", label: "Wood" }, { key: "electric", label: "Electric" }],
  classify: p => {
    const s = text(p.balance); const out: string[] = [];
    if (has(s, /propane|\bgas\b/i)) out.push("gas");
    if (has(s, /charcoal/i)) out.push("charcoal");
    if (has(s, /pellet/i)) out.push("pellet");
    if (has(s, /\bwood\b(?! pellet)/i)) out.push("wood");
    if (has(s, /electric/i)) out.push("electric");
    return out;
  },
};

// Home Depot has both a Wi-Fi and a Bluetooth Enabled filter; Wi-Fi works from anywhere, Bluetooth only nearby. A grill
// with both goes in both.
const smart: SpecFilter = {
  id: "app", label: "Smart control",
  groups: [{ key: "wifi", label: "Wi-Fi" }, { key: "bluetooth", label: "Bluetooth" }, { key: "none", label: "No app control" }],
  classify: p => {
    const s = text(p.weight); if (!s) return [];
    if (has(s, /^none$/i)) return ["none"];
    const out: string[] = [];
    if (has(s, /wi-?fi/i)) out.push("wifi");
    if (has(s, /bluetooth/i)) out.push("bluetooth");
    return out;
  },
};

export default [fuel, smart];
