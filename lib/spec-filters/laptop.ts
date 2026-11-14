import type { SpecFilter } from "./types";
import { has, numbers, text } from "./parse";

// LaptopRecs, approved by the owner (2026-11-14). Graphics is skipped: the multi-GPU lists make tiers unreliable and
// the Gaming category already covers "has a dedicated GPU".

// The main screen's diagonal ("14.2\" 3024×1964 …"). A model sold in two sizes ("14\" or 16\"") goes under both (owner
// decision); a second screen ("+ 14\" second screen") doesn't count. Apple's 14.2"/16.2" are its 14- and 16-inch, the
// 15.3" Air goes in 15".
const size: SpecFilter = {
  id: "size", label: "Screen size",
  groups: [{ key: "13", label: "13.9\" and under" }, { key: "14", label: "14\"" }, { key: "15", label: "15\"" }, { key: "16", label: "16\"" }, { key: "17", label: "17–18\"" }],
  classify: p => {
    const s = text(p.surface), keys = new Set<string>();
    for (const m of s.matchAll(/(\d{2}(?:[.,]\d)?)\s*(?:"|”|''|-?\s*inch)(?![^/;,]*second)/gi)) {
      const d = numbers(m[1])[0];
      if (d >= 10 && d <= 19) keys.add(d < 13.95 ? "13" : d < 14.95 ? "14" : d < 15.95 ? "15" : d < 16.95 ? "16" : "17");
    }
    return [...keys];
  },
};

// Weight in pounds: the lb figure when given, otherwise kg converted. Groups are labelled in both units; 3 lb is the
// ultraportable cut-off (Best Buy, LaptopMag). Variant weights ("1.23 kg (14\") / 1.56 kg (16\")") go in each group.
const weight: SpecFilter = {
  id: "weight", label: "Weight",
  groups: [{ key: "3", label: "Under 3 lb (1.36 kg)" }, { key: "4", label: "3–4 lb (1.36–1.8 kg)" }, { key: "5", label: "4–5 lb (1.8–2.3 kg)" }, { key: "heavy", label: "5 lb (2.3 kg) and up" }],
  classify: p => {
    const keys = new Set<string>();
    for (const part of text(p.weight).split(/\s\/\s|;/)) {
      const lb = part.match(/(\d+(?:[.,]\d+)?)\s*(?:lbs?|pounds?)\b/i), kg = part.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
      const w = lb ? numbers(lb[1])[0] : kg ? numbers(kg[1])[0] / 0.4536 : null;
      if (w && w > 1 && w < 15) keys.add(w < 3 ? "3" : w < 4 ? "4" : w < 5 ? "5" : "heavy");
    }
    return [...keys];
  },
};

// Processor maker, as John Lewis files them. "Snapdragon X …; Intel Core Ultra …" is sold with both and goes in both.
const cpu: SpecFilter = {
  id: "cpu", label: "Processor",
  groups: [{ key: "intel", label: "Intel" }, { key: "amd", label: "AMD" }, { key: "apple", label: "Apple silicon" }, { key: "snapdragon", label: "Snapdragon (Arm)" }],
  classify: p => {
    const s = text(p.balance), keys: string[] = [];
    if (has(s, /intel|core\s*(?:i\d|ultra)/i)) keys.push("intel");
    if (has(s, /\bamd\b|ryzen/i)) keys.push("amd");
    if (has(s, /apple|\bM\d\b/)) keys.push("apple");
    if (has(s, /snapdragon|qualcomm/i)) keys.push("snapdragon");
    return keys;
  },
};

export default [size, weight, cpu];
