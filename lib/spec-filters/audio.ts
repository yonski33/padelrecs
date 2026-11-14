import type { SpecFilter } from "./types";
import { has, text } from "./parse";

// AudioRecs, approved by the owner (2026-11-14).

// Wired or wireless, as RTINGS and every retailer split headphones.
const connection: SpecFilter = {
  id: "conn", label: "Connection",
  groups: [{ key: "wired", label: "Wired" }, { key: "wireless", label: "Wireless" }],
  classify: p => { const s = text(p.weight); return has(s, /wireless|bluetooth/i) ? ["wireless"] : has(s, /wired/i) ? ["wired"] : []; },
};

// Open or closed back, only on Headphones: in-ear form repeats the IEMs/Earbuds categories. Semi-open goes with open-back
// (it leaks and isolates little, like open-back). When the form doesn't say ("Over-ear"), a back type stated in the notes
// counts ("Closed-back; LDAC, …"); otherwise the headphone is left out.
const back: SpecFilter = {
  id: "back", label: "Back", categories: ["Headphones"],
  groups: [{ key: "open", label: "Open-back (incl. semi-open)" }, { key: "closed", label: "Closed-back" }],
  classify: p => {
    const form = text(p.balance), s = has(form, /open|closed/i) ? form : (text(p.surface).match(/\b(?:semi-open|open|closed)[\s-]*back\b/i)?.[0] ?? "");
    return has(s, /open/i) && !has(s, /open-ear/i) ? ["open"] : has(s, /closed/i) ? ["closed"] : [];
  },
};

// Driver type, as Headphones.com files it. Hybrids first (any balanced armature with another driver type, or named
// hybrid/tribrid), then the single types; a bare size ("53 mm") is a dynamic driver. Values that name no type
// ("Custom high-excursion Apple driver") stay out. Audeze's "Rinaro Isodynamic Hybrid Array" is a planar driver, not a
// hybrid. Electrostatic has no group: only 2 live headphones are pure electrostatic, so they stay out.
const driver: SpecFilter = {
  id: "driver", label: "Driver",
  groups: [{ key: "dynamic", label: "Dynamic" }, { key: "planar", label: "Planar magnetic" }, { key: "ba", label: "Balanced armature" }, { key: "hybrid", label: "Hybrid / multi-driver" }],
  classify: p => {
    const s = text(p.core).replace(/hybrid array/i, "array"); if (!s) return [];
    const ba = has(s, /balanced[\s-]*armature|\bBAs?\b|\d\s*BA/i);
    const dyn = has(s, /\bdynamic|\bDD\b|\d\s*DD|moving[\s-]*coil/i);
    const planar = has(s, /planar|orthodynamic|isodynamic/i);
    const estat = has(s, /electrostatic|\bEST\b/i);
    const bone = has(s, /bone[\s-]*conduction|piezo|\bPZT\b/i);
    if (has(s, /hybrid|tribrid|quadbrid/i) || [ba, dyn, planar, estat, bone].filter(Boolean).length > 1) return ["hybrid"];
    if (estat) return [];
    if (planar) return ["planar"];
    if (ba) return ["ba"];
    if (dyn || has(s, /^\s*\d+(?:\.\d+)?\s*mm\b/i)) return ["dynamic"];
    return [];
  },
};

export default [connection, back, driver];
