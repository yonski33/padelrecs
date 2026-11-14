import type { SpecFilter } from "./types";
import { has, numbers, text } from "./parse";

// GamingRecs, approved by the owner (2026-11-14). The shape/layout filter was borderline and is not built.

// Wireless (any dongle or Bluetooth, incl. "+ wired") or wired only. Bluetooth is its own group too (it decides phone,
// Switch and TV use for headsets and controllers), so a Bluetooth product shows under both Wireless and Bluetooth.
// Bare "Wireless" goes in Wireless only: whether it has Bluetooth isn't stated.
const connection: SpecFilter = {
  id: "conn", label: "Connection",
  groups: [{ key: "wireless", label: "Wireless" }, { key: "wired", label: "Wired only" }, { key: "bt", label: "Bluetooth" }],
  classify: p => {
    const s = text(p.core); if (!s) return [];
    const bt = has(s, /bluetooth/i);
    if (bt || has(s, /wireless|2\.4\s*GHz|lightspeed|hyperspeed|slipstream|ultra wideband/i)) return bt ? ["wireless", "bt"] : ["wireless"];
    return has(s, /wired|usb|3\.5\s*mm/i) ? ["wired"] : [];
  },
};

/** A mouse's headline weight in grams: a range ("53–54 g") reads as its midpoint, and of several configurations
 *  ("68 g with POWERPLAY / 86 g with AA") the lighter one wins; pounds are converted. */
function grams(s: string): number | null {
  const ws = s.split(/\s\/\s|;|\bor\b/).flatMap(part => {
    const clean = part.replace(/\(?\s*±\s*\d+(?:\.\d+)?\s*g?\s*\)?/g, " ");
    const r = clean.match(/(\d+(?:\.\d+)?)\s*g?\s*[–—-]\s*(\d+(?:\.\d+)?)\s*g\b/i);
    if (r) return [(Number(r[1]) + Number(r[2])) / 2];
    const g = clean.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\b/i); if (g) return [numbers(g[1])[0]];
    const lb = clean.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)\b/i); if (lb) return [Number(lb[1]) * 453.6];
    return [];
  });
  return ws.length ? Math.min(...ws) : null;
}

// Mouse weight, on Mice only (headsets and controllers weigh in at 200–400 g and nobody filters them by it). Cuts sit
// on the common "lightweight" thresholds (RTINGS lightest list, Glorious' guides).
const weight: SpecFilter = {
  id: "weight", label: "Weight", categories: ["Mouse"],
  groups: [{ key: "49", label: "Under 50 g" }, { key: "50", label: "50–59 g" }, { key: "60", label: "60–79 g" }, { key: "80", label: "80 g and up" }],
  classify: p => {
    const g = grams(text(p.weight)); if (!g || g < 20 || g > 200) return [];
    return [g < 50 ? "49" : g < 60 ? "50" : g < 80 ? "60" : "80"];
  },
};

export default [connection, weight];
